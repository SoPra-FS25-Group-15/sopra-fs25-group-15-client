"use client";

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi'; 

// Define TypeScript interfaces
interface LeaderboardEntryDTO {
  username: string;
  mmr: number;
}

interface LeaderboardDTO {
  entries: LeaderboardEntryDTO[];
}

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntryDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Create an instance of ApiService
  const apiService = useApi();
  // Determine if we're in development environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Set the appropriate endpoint based on environment
  const developmentEndpoint = 'http://localhost:8080/users/leaderboard';
  const productionEndpoint = '/users/leaderboard'; // Path for ApiService

  // Fetch leaderboard data
  const fetchLeaderboard = async (): Promise<void> => {
    try {
      setRefreshing(true);
      
      let data: LeaderboardDTO;
      
      if (isDevelopment) {
        // For development - use direct fetch to localhost
        console.log(`Connecting to development endpoint: ${developmentEndpoint}`);
        const response = await fetch(developmentEndpoint, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch leaderboard data: ${response.status} ${response.statusText}`);
        }
        
        data = await response.json() as LeaderboardDTO;
      } else {
        // For production - use ApiService
        console.log('Fetching leaderboard data via ApiService');
        data = await apiService.get<LeaderboardDTO>(productionEndpoint);
      }
      
      setLeaderboardData(data.entries || []);
      setError(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Leaderboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Icons as SVG components
  const TrophyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 14.66V17c0 .55-.47 1-1 1H7"></path>
      <path d="M14 14.66V17c0 .55.47 1 1 1h2"></path>
      <path d="M12 2v8"></path>
      <path d="M12 10v12"></path>
    </svg>
  );

  const SilverMedalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12"></path>
      <circle cx="12" cy="8" r="7"></circle>
    </svg>
  );

  const BronzeMedalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
      <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12"></path>
      <circle cx="12" cy="8" r="7"></circle>
    </svg>
  );

  const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? "animate-spin" : ""}>
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
    </svg>
  );

  // Get the appropriate badge for top 3 players
  const getRankBadge = (index: number) => {
    if (index === 0) return <TrophyIcon />;
    if (index === 1) return <SilverMedalIcon />;
    if (index === 2) return <BronzeMedalIcon />;
    return <span className="text-gray-500 font-bold text-lg w-6 text-center">{index + 1}</span>;
  };

  // Determine background color based on rank
  const getRowBackground = (index: number): string => {
    if (index === 0) return "bg-yellow-50";
    if (index === 1) return "bg-gray-50";
    if (index === 2) return "bg-amber-50";
    return index % 2 === 0 ? "bg-white" : "bg-gray-50";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-4 bg-blue-700 text-white flex justify-between items-center rounded-t-xl shadow-md">
        <h2 className="text-2xl font-bold">Player Leaderboard</h2>
        <button 
          onClick={fetchLeaderboard}
          disabled={loading}
          className="flex items-center gap-1 p-2 rounded hover:bg-blue-600 transition-colors"
        >
          <RefreshIcon />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Leaderboard Table */}  
      {loading && !refreshing ? (
        <div className="p-8 text-center bg-white shadow-md">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading leaderboard data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-b-xl shadow-md overflow-hidden">
          {error ? (
            <div className="p-8 text-center text-red-500">
              <p className="mb-2 font-bold">Error loading leaderboard</p>
              <p>{error}</p>
              <button 
                onClick={fetchLeaderboard}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No players on the leaderboard yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">MMR</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboardData.map((player, index) => (
                    <tr key={player.username} className={getRowBackground(index)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          {getRankBadge(index)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{player.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="font-semibold text-blue-600">{player.mmr}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {leaderboardData.length > 10 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Showing <span className="font-medium">{leaderboardData.length}</span> players
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
