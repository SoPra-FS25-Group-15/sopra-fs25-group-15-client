import React, { useEffect, useState } from 'react';
import { 
  Table, Spin, Alert, Empty, Typography, Card, Tag, Tabs, Tooltip, Badge, 
  DatePicker, Space, Select, Button, Input, Dropdown, Menu, message
} from 'antd';
import { 
  HistoryOutlined, TrophyOutlined, FilterOutlined, SortAscendingOutlined,
  ReloadOutlined, SearchOutlined, CloseCircleOutlined, LoadingOutlined
} from '@ant-design/icons';
import { useApi } from '@/hooks/useApi'; // Using the useApi hook
import useLocalStorage from "@/hooks/useLocalStorage";
import { useRouter } from "next/navigation";
import * as _ from 'lodash'; // Import full lodash
import dayjs from 'dayjs'; // Import dayjs instead of moment
import type { Dayjs } from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { FilterValue, SorterResult, ColumnType } from 'antd/es/table/interface';
import type { Key } from 'react'; // Import React.Key type

// Types based on backend structure
interface GameRecord {
  id?: string; // Optional as backend doesn't always provide it
  winner: string;
  players: string[];
  roundsPlayed: number;
  roundCardStartAmount: number;
  startedAt: Date | string;
  completedAt: Date | string;
  gameType?: string; // Optional as backend doesn't always provide it
}

// Define the expected API response type
interface ApiResponse<T> {
  data?: T;
  [key: string]: any;
}

interface FilterState {
  dateRange: [Date | null, Date | null] | null;
  winner: string | null;
  playerSearch: string | null;
  gameType: string | null;
}

// User type definition
interface User {
  id?: string | number; // Making id optional for initial state
  username?: string;
  email: string;
  token: string;
  // Add other user properties as needed
}

// User profile from /me endpoint
interface UserProfile {
  userid: number;
  email: string;
  token: string;
  status: 'ONLINE' | 'OFFLINE' | 'IN_GAME' | 'READY' | 'LOADING';
  createdAt: string;
  profile?: {
    userid: number;
    username: string;
    displayName?: string;
  };
}

// Login props type definition
interface LoginProps {
  email: string;
  password: string;
}

// Notification props type definition
interface NotificationProps {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const GameHistoryPage: React.FC = () => {
  // Use the imported useApi hook
  const apiService = useApi();
  const router = useRouter();
  
  // Use localStorage hook for user data
  const { value: user, set: setUser } = useLocalStorage<User | null>("user", null);
  
  // User profile state (from /me endpoint)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Debug message to check if the component renders
  console.log('GameHistoryPage rendering');
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("history");
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: null,
    winner: null,
    playerSearch: null,
    gameType: null
  });

  // Fetch current user profile
  const fetchUserProfile = async () => {
    if (!user || !user.token) {
      setError("Authentication required. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      // Set headers for authorization
      const headers = {
        Authorization: `Bearer ${user.token}`
      };
      
      console.log('Fetching user profile from /me endpoint');
      
      // Make the API request to get current user profile
      const response = await apiService.get<UserProfile>('/auth/me', { headers });
      
      console.log('User profile API Response:', response);
      
      if (response && response.userid) {
        setUserProfile(response);
        
        // Update user in localStorage with the id
        setUser({
          ...user,
          id: response.userid,
          username: user.username || response.profile?.displayName || user.email
        });
        
        return response;
      } else {
        throw new Error('Failed to load user profile - invalid response data');
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError(`Failed to load your profile: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      setNotification({
        type: 'error',
        message: `Error: ${err instanceof Error ? err.message : 'Failed to fetch user profile'}`
      });
      return null;
    }
  };

  // Handle login functionality
  const handleLogin = async (values: LoginProps) => {
    try {
      setLoading(true);
      const response = await apiService.post<User>("/auth/login", values);
      if (response.token) {
        setUser(response);
        setNotification({
          type: 'success',
          message: 'Login successful'
        });
        
        // After login fetch the user profile and then game history
        const profile = await fetchUserProfile();
        if (profile) {
          fetchGameHistory(profile.userid);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(`Failed to login: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setNotification({
        type: 'error',
        message: `Login error: ${error instanceof Error ? error.message : 'Authentication failed'}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Check authentication status and load user profile
  useEffect(() => {
    if (!user || !user.token) {
      setError("You must be logged in to view game history.");
      setNotification({
        type: 'warning',
        message: 'You must be logged in to view game history.'
      });
      setLoading(false);
    } else {
      console.log('User authenticated, token available');
      
      // First fetch user profile, then fetch game history
      const loadData = async () => {
        const profile = await fetchUserProfile();
        if (profile) {
          fetchGameHistory(profile.userid);
        }
      };
      
      loadData();
    }
  }, [user?.token]); // Only re-run when token changes

  // Handle API data fetching with userId parameter
  const fetchGameHistory = async (userId?: string | number) => {
    if (!user || !user.token) {
      setError("Authentication required. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use token for authentication in the API request
      // Using the userId parameter or from userProfile
      const id = userId || userProfile?.userid || user.id;
      
      if (!id) {
        throw new Error('User ID not found. Please try logging in again.');
      }
      
      // Now use the ID for the endpoint
      const endpoint = `/users/${id}/stats/games`;
      
      console.log('Fetching game history from endpoint:', endpoint);
      
      // Set headers for authorization
      const headers = {
        Authorization: `Bearer ${user.token}`
      };
      
      // Make the API request using the apiService from useApi hook
      const response = await apiService.get(endpoint, { headers });
      
      console.log('Game history API Response:', response);
      
      if (response) {
        // Backend returns an array directly as per the controller code
        let records: GameRecord[] = Array.isArray(response) ? response : [];
        
        // Add missing properties for compatibility
        const processedRecords = records.map((record: GameRecord, index: number) => ({
          ...record,
          id: record.id || `game-${index}`, // Generate an ID if not provided
          gameType: record.gameType || 'Standard' // Default to Standard if not provided
        }));
        
        console.log('Processed game records:', processedRecords);
        setGameHistory(processedRecords);
        setFilteredHistory(processedRecords);
        
        if (processedRecords.length > 0) {
          setNotification({
            type: 'success',
            message: `Successfully loaded ${processedRecords.length} game records.`
          });
          
          // Auto-clear success notification after 3 seconds
          setTimeout(() => setNotification(null), 3000);
        } else {
          setNotification({
            type: 'info',
            message: 'No game records found.'
          });
        }
      } else {
        throw new Error('Failed to load game history - no response data');
      }
      
    } catch (err) {
      console.error("Error fetching game history:", err);
      setError(`Failed to load your game history: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      setNotification({
        type: 'error',
        message: `Error: ${err instanceof Error ? err.message : 'Failed to fetch game history'}`
      });
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  // Apply filters to game history
  useEffect(() => {
    if (!gameHistory.length) return;

    let filtered = [...gameHistory];

    // Apply date range filter
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      const startDate = new Date(filters.dateRange[0]).getTime();
      const endDate = new Date(filters.dateRange[1]).getTime();
      filtered = filtered.filter(game => {
        const gameDate = new Date(game.startedAt).getTime();
        return gameDate >= startDate && gameDate <= endDate;
      });
    }

    // Apply winner filter
    if (filters.winner) {
      filtered = filtered.filter(game => game.winner === filters.winner);
    }

    // Apply player search filter
    if (filters.playerSearch) {
      const search = filters.playerSearch.toLowerCase();
      filtered = filtered.filter(game => 
        game.players.some(player => player.toLowerCase().includes(search))
      );
    }

    // Apply game type filter
    if (filters.gameType) {
      filtered = filtered.filter(game => game.gameType === filters.gameType);
    }

    setFilteredHistory(filtered);
  }, [filters, gameHistory]);

  // Calculate game duration in minutes
  const calculateDuration = (start: Date | string, end: Date | string): number => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return Math.round((endTime - startTime) / (1000 * 60)); // Duration in minutes
  };

  // Format date
  const formatDate = (dateString: Date | string): string => {
    return new Date(dateString).toLocaleString();
  };

  // Get current username from userProfile or localStorage
  const getCurrentUsername = (): string => {
    if (user?.username) {
      return user.username;
    }
    if (userProfile?.profile?.displayName) {
      return userProfile.profile.displayName;
    }
    if (user?.username) {
      return user.username;
    }
    return 'You';
  };

  // Handle date range change
  const handleDateRangeChange = (dates: RangePickerProps['value']) => {
    if (dates && dates[0] && dates[1]) {
      setFilters({
        ...filters,
        dateRange: [dates[0].toDate(), dates[1].toDate()]
      });
    } else {
      setFilters({ ...filters, dateRange: null });
    }
  };

  // Handle winner filter change
  const handleWinnerChange = (value: string | null) => {
    setFilters({ ...filters, winner: value });
  };

  // Handle game type filter change
  const handleGameTypeChange = (value: string | null) => {
    setFilters({ ...filters, gameType: value });
  };

  // Handle player search (debounced)
  const debouncedPlayerSearch = _.debounce((value: string) => {
    setFilters({ ...filters, playerSearch: value || null });
  }, 300);

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      dateRange: null,
      winner: null,
      playerSearch: null,
      gameType: null
    });
  };

  // Handle retry on error
  const handleRetry = () => {
    setRetrying(true);
    setNotification({
      type: 'info',
      message: 'Retrying to fetch game history...'
    });
    console.log('Retrying to fetch game history...');
    
    // Check if user is authenticated, if not redirect to login
    if (!user || !user.token) {
      router.push('/login');
      return;
    }
    
    // Short timeout to ensure state updates before retrying
    setTimeout(async () => {
      const profile = await fetchUserProfile();
      if (profile) {
        fetchGameHistory(profile.userid);
      }
    }, 100);
  };

  // Game history columns
  const gameColumns: ColumnType<GameRecord>[] = [
    {
      title: 'Date',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: (date: Date | string) => formatDate(date),
      sorter: (a: GameRecord, b: GameRecord) => 
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Winner',
      dataIndex: 'winner',
      key: 'winner',
      render: (winner: string, record: GameRecord) => {
        const username = getCurrentUsername();
        const isUserWinner = winner === username || winner === 'You';
        return (
          <Tag color={isUserWinner ? 'success' : 'default'}>
            {winner}
          </Tag>
        );
      },
      filters: gameHistory
        .map(game => game.winner)
        .filter((value, index, self) => self.indexOf(value) === index)
        .map(winner => ({ text: winner, value: winner })),
      onFilter: (value: React.Key | boolean, record: GameRecord) => {
        if (typeof value === 'string') {
          return record.winner === value;
        }
        return false;
      },
    },
    {
      title: 'Players',
      dataIndex: 'players',
      key: 'players',
      render: (players: string[]) => players.join(', '),
    },
    {
      title: 'Game Type',
      dataIndex: 'gameType',
      key: 'gameType',
      render: (type: string) => <Tag>{type || 'Standard'}</Tag>,
      filters: [
        { text: 'Standard', value: 'Standard' },
        { text: 'Quick', value: 'Quick' },
        { text: 'Extended', value: 'Extended' }
      ],
      onFilter: (value: React.Key | boolean, record: GameRecord) => {
        if (typeof value === 'string') {
          return record.gameType === value || (!record.gameType && value === 'Standard');
        }
        return false;
      },
    },
    {
      title: 'Rounds',
      dataIndex: 'roundsPlayed',
      key: 'roundsPlayed',
      sorter: (a: GameRecord, b: GameRecord) => a.roundsPlayed - b.roundsPlayed,
    },
    {
      title: 'Starting Cards',
      dataIndex: 'roundCardStartAmount',
      key: 'roundCardStartAmount',
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_: unknown, record: GameRecord) => {
        const durationMinutes = calculateDuration(record.startedAt, record.completedAt);
        return `${durationMinutes} min`;
      },
      sorter: (a: GameRecord, b: GameRecord) => 
        calculateDuration(a.startedAt, a.completedAt) - calculateDuration(b.startedAt, b.completedAt),
    },
  ];

  // Handle table change for server-side filtering and sorting
  const handleTableChange = (
    pagination: any,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<GameRecord> | SorterResult<GameRecord>[]
  ) => {
    // In a real application, you might want to send these parameters to the backend
    // For now, we'll just log them
    console.log('Table params:', pagination, filters, sorter);
  };

  // Game statistics
  const renderGameStats = () => {
    const games = filteredHistory;
    if (!games.length) return null;
    
    const totalGames = games.length;
    const username = getCurrentUsername();
    const wins = games.filter(game => game.winner === username || game.winner === 'You').length;
    const winRate = totalGames ? Math.round((wins / totalGames) * 100) : 0;
    const avgRounds = games.reduce((sum, game) => sum + game.roundsPlayed, 0) / totalGames;
    const totalDuration = games.reduce((sum, game) => 
      sum + calculateDuration(game.startedAt, game.completedAt), 0);
    const avgDuration = totalDuration / totalGames;
    
    return (
      <Card className="mb-4 stats-card">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="stat-item">
            <Typography.Text type="secondary">Total Games</Typography.Text>
            <Typography.Title level={4}>{totalGames}</Typography.Title>
          </div>
          <div className="stat-item">
            <Typography.Text type="secondary">Wins</Typography.Text>
            <Typography.Title level={4}>{wins}</Typography.Title>
          </div>
          <div className="stat-item">
            <Typography.Text type="secondary">Win Rate</Typography.Text>
            <Typography.Title level={4}>{winRate}%</Typography.Title>
          </div>
          <div className="stat-item">
            <Typography.Text type="secondary">Avg. Rounds</Typography.Text>
            <Typography.Title level={4}>{avgRounds.toFixed(1)}</Typography.Title>
          </div>
          <div className="stat-item">
            <Typography.Text type="secondary">Avg. Duration</Typography.Text>
            <Typography.Title level={4}>{avgDuration.toFixed(1)} min</Typography.Title>
          </div>
        </div>
      </Card>
    );
  };

  // Render filter controls
  const renderFilterControls = () => {
    // Get unique winners for dropdown
    const winners = Array.from(new Set(gameHistory.map(game => game.winner)));
    
    // Get unique game types for dropdown
    const gameTypes = Array.from(new Set(
      gameHistory
        .map(game => game.gameType || 'Standard')
        .filter(Boolean)
    ));

    return (
      <Card className="mb-4 filter-card">
        <div className="flex flex-col lg:flex-row gap-4 flex-wrap justify-between items-end">
          <div className="filter-group">
            <Typography.Text strong>Date Range</Typography.Text>
            <RangePicker 
              onChange={handleDateRangeChange}
              value={filters.dateRange ? [
                filters.dateRange[0] ? dayjs(filters.dateRange[0]) : null,
                filters.dateRange[1] ? dayjs(filters.dateRange[1]) : null,
              ] : null}
              className="w-full"
              allowClear
            />
          </div>
          
          <div className="filter-group">
            <Typography.Text strong>Winner</Typography.Text>
            <Select
              placeholder="Filter by winner"
              onChange={handleWinnerChange}
              value={filters.winner}
              allowClear
              className="w-full min-w-40"
              options={winners.map(winner => ({ value: winner, label: winner }))}
            />
          </div>
          
          <div className="filter-group">
            <Typography.Text strong>Game Type</Typography.Text>
            <Select
              placeholder="Filter by game type"
              onChange={handleGameTypeChange}
              value={filters.gameType}
              allowClear
              className="w-full min-w-40"
              options={gameTypes.map(type => ({ value: type, label: type }))}
            />
          </div>
          
          <div className="filter-group">
            <Typography.Text strong>Player Search</Typography.Text>
            <Input
              placeholder="Search by player name"
              prefix={<SearchOutlined />}
              onChange={(e) => debouncedPlayerSearch(e.target.value)}
              defaultValue={filters.playerSearch || ''}
              className="w-full min-w-60"
              allowClear
            />
          </div>

          <div className="filter-actions">
            <Button 
              onClick={resetFilters}
              icon={<CloseCircleOutlined />}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin 
          size="large" 
          indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
          tip="Loading game history..."
        >
          <div className="h-8"></div>
        </Spin>
      </div>
    );
  }

  // Render error state with retry button
  if (error) {
    return (
      <Alert
        message="Error Loading Game History"
        description={
          <div>
            <p>{error}</p>
            {!user || !user.token ? (
              <Button 
                type="primary" 
                onClick={() => router.push('/login')}
                className="mt-4 mr-2"
              >
                Go to Login
              </Button>
            ) : (
              <Button 
                type="primary" 
                onClick={handleRetry} 
                loading={retrying}
                icon={<ReloadOutlined />}
                className="mt-4"
              >
                Retry
              </Button>
            )}
          </div>
        }
        type="error"
        showIcon
        className="my-8"
      />
    );
  }

  return (
    <div className="user-data-container">
      {notification && (
        <Alert
          message={notification.message}
          type={notification.type}
          showIcon
          closable
          onClose={() => setNotification(null)}
          className="mb-4"
        />
      )}
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="mb-4"
      >
        <TabPane 
          tab={
            <span className="flex items-center">
              <HistoryOutlined className="mr-2" />
              Game History
            </span>
          } 
          key="history"
        >
          <div className="mb-6">
            <Typography.Title level={3}>Your Game History</Typography.Title>
            <Typography.Paragraph type="secondary">
              View your past games, statistics and performance over time.
            </Typography.Paragraph>
          </div>
          
          {renderFilterControls()}
          {renderGameStats()}
          
          {filteredHistory.length > 0 ? (
            <div className="relative">
              <Table 
                dataSource={filteredHistory}
                columns={gameColumns}
                rowKey={record => record.id || `game-${Math.random()}`} // Fallback for missing ID
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                }}
                onChange={handleTableChange}
                className="shadow-md rounded-md overflow-hidden"
                loading={loading}
              />
              {filteredHistory.length === 0 && gameHistory.length > 0 && (
                <Empty 
                  description="No games match your filter criteria" 
                  className="py-8"
                />
              )}
            </div>
          ) : (
            <Empty
              description="No game history found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default GameHistoryPage;
