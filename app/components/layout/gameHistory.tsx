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
import * as _ from 'lodash'; // Import full lodash
import dayjs from 'dayjs'; // Import dayjs instead of moment
import type { Dayjs } from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { FilterValue, SorterResult, ColumnType } from 'antd/es/table/interface';

// Test data for development without backend
// You can uncomment this when backend is unavailable
const TEST_DATA = {
  gameHistory: [
    {
      id: '1',
      winner: 'You',
      players: ['You', 'John', 'Sarah'],
      roundsPlayed: 12,
      roundCardStartAmount: 7,
      startedAt: new Date(2025, 4, 1, 14, 30),
      completedAt: new Date(2025, 4, 1, 15, 15),
      gameType: 'Standard'
    },
    {
      id: '2',
      winner: 'Mike',
      players: ['You', 'Mike', 'Emma'],
      roundsPlayed: 8,
      roundCardStartAmount: 5,
      startedAt: new Date(2025, 4, 3, 20, 0),
      completedAt: new Date(2025, 4, 3, 20, 25),
      gameType: 'Quick'
    },
    {
      id: '3',
      winner: 'You',
      players: ['You', 'Alex'],
      roundsPlayed: 15,
      roundCardStartAmount: 10,
      startedAt: new Date(2025, 4, 5, 10, 0),
      completedAt: new Date(2025, 4, 5, 11, 0),
      gameType: 'Extended'
    },
    {
      id: '4',
      winner: 'Lisa',
      players: ['You', 'Lisa', 'Tim', 'Rachel'],
      roundsPlayed: 6,
      roundCardStartAmount: 7,
      startedAt: new Date(2025, 4, 6, 19, 30),
      completedAt: new Date(2025, 4, 6, 20, 0),
      gameType: 'Standard'
    }
  ],
};

// Types based on provided models
interface GameRecord {
  id: string;
  winner: string;
  players: string[];
  roundsPlayed: number;
  roundCardStartAmount: number;
  startedAt: Date | string;
  completedAt: Date | string;
  gameType?: string;
}

interface UserData {
  gameHistory: GameRecord[];
}

interface FilterState {
  dateRange: [Date | null, Date | null] | null;
  winner: string | null;
  playerSearch: string | null;
  gameType: string | null;
}

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const GameHistoryPage: React.FC = () => {
  const { get } = useApi(); // Using the useApi hook
  const [userData, setUserData] = useState<UserData>({
    gameHistory: [],
  });
  const [filteredHistory, setFilteredHistory] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("history");
  const [token, setToken] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: null,
    winner: null,
    playerSearch: null,
    gameType: null
  });

  // Load authentication token from localStorage
  useEffect(() => {
    const storedUserStr = localStorage.getItem("user");
    if (storedUserStr) {
      try {
        const parsedToken = JSON.parse(storedUserStr).token;
        setToken(parsedToken);
      } catch (err) {
        console.error("Error parsing user token:", err);
        setError("Authentication error. Please log in again.");
      }
    } else {
      setError("You must be logged in to view game history.");
      setLoading(false);
    }
  }, []);

  // Handle API data fetching
  const fetchUserData = async () => {
    setLoading(true);
    setError(null);

    try {
      // DEVELOPMENT MODE: Using test data instead of API calls
      setTimeout(() => {
        setUserData(TEST_DATA);
        setFilteredHistory(TEST_DATA.gameHistory);
        setLoading(false);
      }, 700); // Simulate network delay
      return;

      // PRODUCTION CODE: Uncomment this when ready for production
      /*
      const response = await get('/users/me/games');
      if (response.data) {
        setUserData({
          gameHistory: response.data.gameHistory || [],
        });
        setFilteredHistory(response.data.gameHistory || []);
      } else {
        throw new Error('Failed to load game history');
      }
      */
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load your game history. Please try again later.");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    // Don't fetch data if we don't have a token
    if (!token) return;
    fetchUserData();
  }, [get, token]);

  // Apply filters to game history
  useEffect(() => {
    if (!userData.gameHistory.length) return;

    let filtered = [...userData.gameHistory];

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
  }, [filters, userData.gameHistory]);

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

  // Get current username from localStorage
  const getCurrentUsername = (): string => {
    const storedUserStr = localStorage.getItem("user");
    if (storedUserStr) {
      try {
        return JSON.parse(storedUserStr).username || 'You';
      } catch {
        return 'You';
      }
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
    fetchUserData();
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
      filters: userData.gameHistory
        .map(game => game.winner)
        .filter((value, index, self) => self.indexOf(value) === index)
        .map(winner => ({ text: winner, value: winner })),
      onFilter: (value: any, record: GameRecord) => record.winner === value,
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
      onFilter: (value: any, record: GameRecord) => 
        record.gameType === value || (!record.gameType && value === 'Standard'),
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
    const winners = Array.from(new Set(userData.gameHistory.map(game => game.winner)));
    
    // Get unique game types for dropdown
    const gameTypes = Array.from(new Set(
      userData.gameHistory
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
        <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} tip="Loading user data..." />
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
            <Button 
              type="primary" 
              onClick={handleRetry} 
              loading={retrying}
              icon={<ReloadOutlined />}
              className="mt-4"
            >
              Retry
            </Button>
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
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                }}
                onChange={handleTableChange}
                className="shadow-md rounded-md overflow-hidden"
                loading={loading}
              />
              {filteredHistory.length === 0 && userData.gameHistory.length > 0 && (
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
