"use client"

import React, { useEffect, useState, useCallback } from 'react';
import { Card, Avatar, Typography, Spin, Button, Tag, Divider, Statistic, Row, Col } from 'antd';
import { UserOutlined, ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { useApi } from '@/hooks/useApi';

const { Title, Text } = Typography;

interface ProfileData {
  userId: string;
  username: string;
  email: string;
  mmr: number;
  points: number;
  cosmetics: string[];
}

// Updated to match the actual response structure with lowercase userid
interface UserMe {
  userId?: string;    // camelCase version
  userid?: string;    // lowercase version - THIS IS THE ONE THE SERVER RETURNS
  id?: string;        // alternative field
  username?: string;
  email?: string;
  token?: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCurrentUser, setIsCurrentUser] = useState<boolean>(false);
  const [debugMode, setDebugMode] = useState<boolean>(true); // Start with debug mode on
  const [debugMessages, setDebugMessages] = useState<string[]>([]); // Track debug messages
  const router = useRouter();
  const apiService = useApi();

  // Debug logging function with useCallback to avoid dependency warning
  const logDebug = useCallback((message: string) => {
    console.log(`[Profile Debug] ${message}`);
    if (debugMode) {
      setDebugMessages(prev => [...prev, message]);
    }
  }, [debugMode]);

  // Function to extract user ID from the /me response - now checking for lowercase 'userid'
  const extractUserId = useCallback((user: UserMe): string | undefined => {
    // Check all possible ID fields, including lowercase 'userid' which is the one the server returns
    const possibleId = user.userId || user.userid || user.id;
    logDebug(`Extracted ID from user object: ${possibleId}`);
    return possibleId !== undefined ? String(possibleId) : undefined;
  }, [logDebug]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        logDebug(`Starting profile fetch for user ID: ${id}`);
        
        // Check for token in sessionStorage at component mount
        try {
          const storedToken = sessionStorage.getItem('auth_token');
          if (storedToken) {
            logDebug(`Found token in sessionStorage: ${storedToken.substring(0, 10)}...`);
            if (!apiService.hasAuthToken || !apiService.hasAuthToken()) {
              logDebug('ApiService has no token, setting from sessionStorage');
              apiService.setAuthToken(storedToken);
            }
          } else {
            logDebug('No token found in sessionStorage');
          }
        } catch (storageError) {
          console.error('Failed to check sessionStorage:', storageError);
        }
        
        // First, get the public profile data which doesn't require authentication
        logDebug(`Fetching public profile from /api/users/${id}`);
        const profileData = await apiService.get<ProfileData>(`/api/users/${id}`);
        setProfile(profileData);
        logDebug(`Profile fetched successfully: ${JSON.stringify({
          userId: profileData.userId,
          username: profileData.username
        })}`);
        
        // Then try to get current user info to check if viewing own profile
        try {
          logDebug("Attempting to fetch /api/auth/me to verify current user");
          const currentUser = await apiService.get<UserMe>('/api/auth/me');
          
          // Log the entire response for debugging
          logDebug(`Current user response: ${JSON.stringify(currentUser)}`);
          
          // Try to extract user ID from the response
          const currentUserId = extractUserId(currentUser);
          
          if (currentUserId) {
            // Compare user IDs to determine if this is the current user's profile
            const profileId = String(id);
            
            logDebug(`Comparing IDs - Current: ${currentUserId}, Profile: ${profileId}`);
            
            if (currentUserId === profileId) {
              logDebug('✅ IDs match - this is the current user profile');
              setIsCurrentUser(true);
            } else {
              logDebug('❌ IDs do not match - this is NOT the current user profile');
              setIsCurrentUser(false);
            }
          } else {
            logDebug('⚠️ Could not extract user ID from /me response');
            logDebug(`Full /me response: ${JSON.stringify(currentUser)}`);
            setIsCurrentUser(false);
          }
        } catch (authError) {
          // If /me endpoint fails, user is not authenticated or token is invalid
          console.error('Failed to verify current user:', authError);
          logDebug('Authentication check failed - possibly not logged in');
          logDebug(`Error: ${authError instanceof Error ? authError.message : String(authError)}`);
          setIsCurrentUser(false);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        logDebug(`Error fetching profile: ${error instanceof Error ? error.message : String(error)}`);
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id, apiService, logDebug, extractUserId]);

  const handleBack = () => {
    router.push('/users');
  };

  const handleEditProfile = () => {
    // Directly navigate to the update page
    router.push(`/users/${id}/update`);
  };

  const toggleDebugMode = () => {
    setDebugMode(prev => !prev);
  };

  const forceEditButtonDisplay = () => {
    setIsCurrentUser(true);
    logDebug('Manually forcing edit button display');
  };
  
  const checkToken = async () => {
    logDebug('Manual token check requested');
    
    // Check token in sessionStorage
    try {
      const storedToken = sessionStorage.getItem('auth_token');
      logDebug(`Token in sessionStorage: ${storedToken ? `${storedToken.substring(0, 10)}...` : "None"}`);
      
      if (storedToken && (!apiService.hasAuthToken || !apiService.hasAuthToken())) {
        logDebug('Setting token from sessionStorage to ApiService');
        apiService.setAuthToken(storedToken);
      }
    } catch (storageError) {
      console.error('Failed to check sessionStorage:', storageError);
    }
    
    // Test the token with an API call
    try {
      logDebug('Testing token with /api/auth/me request');
      const meResponse = await apiService.get<UserMe>('/api/auth/me');
      logDebug(`Full /me response: ${JSON.stringify(meResponse)}`);
      
      // Extract user ID using all possible fields
      const userId = extractUserId(meResponse);
      
      if (userId) {
        logDebug(`Test successful! User ID: ${userId}`);
        
        // Update isCurrentUser if needed
        if (userId === String(id)) {
          setIsCurrentUser(true);
          logDebug('✅ IDs match - enabling edit buttons');
        } else {
          logDebug(`❌ IDs do not match - Current: ${userId}, Profile: ${id}`);
        }
      } else {
        logDebug('⚠️ Could not extract user ID from /me response');
      }
    } catch (error) {
      console.error('Token test failed:', error);
      logDebug(`Token validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading profile..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack} 
          style={{ marginBottom: '16px' }}
        >
          Back to Users
        </Button>
        <Card>
          <Title level={3}>User Not Found</Title>
          <Text>The requested user profile could not be found.</Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <Button 
        type="link" 
        icon={<ArrowLeftOutlined />} 
        onClick={handleBack} 
        style={{ marginBottom: '16px' }}
      >
        Back to Users
      </Button>
      
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar size={64} icon={<UserOutlined />} style={{ marginRight: '16px' }} />
            <div>
              <Title level={2} style={{ margin: 0 }}>{profile.username}</Title>
              <Text type="secondary">{profile.email}</Text>
            </div>
          </div>
        }
        extra={
          isCurrentUser && (
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={handleEditProfile}
            >
              Edit Profile
            </Button>
          )
        }
      >
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={12}>
            <Statistic title="MMR Rating" value={profile.mmr} />
          </Col>
          <Col span={12}>
            <Statistic title="Points" value={profile.points} />
          </Col>
        </Row>

        <Divider />
        
        <div>
          <Title level={4}>Equipped Cosmetics</Title>
          <div style={{ marginTop: '16px' }}>
            {profile.cosmetics && profile.cosmetics.length > 0 ? (
              profile.cosmetics.map((item) => (
                <Tag color="blue" key={item} style={{ margin: '0 8px 8px 0', padding: '4px 8px' }}>
                  {item}
                </Tag>
              ))
            ) : (
              <Text type="secondary">No cosmetics equipped</Text>
            )}
          </div>
        </div>
        
        {/* Debug section - visible in debug mode */}
        <Divider />
        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <Button onClick={toggleDebugMode}>
            {debugMode ? 'Hide Debug Tools' : 'Show Debug Tools'}
          </Button>
        </div>
        
        {debugMode && (
          <div style={{ marginTop: '16px' }}>
            <Title level={4}>Debug Tools</Title>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <Button onClick={forceEditButtonDisplay}>
                Force Show Edit Button
              </Button>
              <Button onClick={checkToken} type="primary">
                Check Token Status
              </Button>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text>Profile ID: {id}</Text><br/>
              <Text>Is Current User: {isCurrentUser ? 'Yes' : 'No'}</Text><br/>
              <Text>Username: {profile.username}</Text>
            </div>
            <div>
              <Text strong>Session Storage Check:</Text>
              <div style={{ marginTop: '8px' }}>
                <Text>Token: {(() => {
                  try {
                    const token = sessionStorage.getItem('auth_token');
                    return token ? `${token.substring(0, 10)}... (${token.length} chars)` : 'None';
                  } catch {
                    return 'Error accessing sessionStorage';
                  }
                })()}</Text>
              </div>
            </div>
            
            {/* Debug log display */}
            <div style={{ marginTop: '16px' }}>
              <Text strong>Debug Log:</Text>
              <div 
                style={{ 
                  marginTop: '8px', 
                  background: '#f0f0f0', 
                  padding: '12px', 
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}
              >
                {debugMessages.map((msg, idx) => (
                  <div key={idx}>{msg}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
