"use client"

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  message, 
  Spin, 
  Typography, 
  Avatar, 
  Upload, 
  Select, 
  Divider
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  SaveOutlined, 
  UploadOutlined, 
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import type { RcFile, UploadProps } from 'antd/es/upload/interface';
import { useApi } from '@/hooks/useApi';

const { Title, Text } = Typography;
const { Option } = Select;

interface ProfileData {
  userId: string;
  username: string;
  email: string;
  mmr: number;
  points: number;
  cosmetics: string[];
}

// Match the user response format from the profile page
interface UserMe {
  userId?: string;    // camelCase version
  userid?: string;    // lowercase version 
  id?: string;        // alternative field
  username?: string;
  email?: string;
  token?: string;
}

interface FormValues {
  username: string;
  email: string;
  equippedItems: string[];
}

export default function UpdateProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [form] = Form.useForm();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [ownedCosmetics, setOwnedCosmetics] = useState<string[]>([]);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [debugMode, setDebugMode] = useState<boolean>(true); // Start with debug mode on
  const [debugMessages, setDebugMessages] = useState<string[]>([]); // Track debug messages
  const router = useRouter();
  const apiService = useApi();

  // Debug logging function with useCallback to avoid dependency warning
  const logDebug = useCallback((message: string) => {
    console.log(`[Update Profile Debug] ${message}`);
    if (debugMode) {
      setDebugMessages(prev => [...prev, message]);
    }
  }, [debugMode]);

  // Function to extract user ID from the /me response - using the same approach as profile page
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
        logDebug(`Starting profile fetch for update - user ID: ${id}`);
        
        // Check for token in sessionStorage at component mount (same as profile page)
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
        setOwnedCosmetics(profileData.cosmetics || []);
        
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
              logDebug('✅ IDs match - user is authorized to edit profile');
              setIsAuthorized(true);
              
                  // Set form values with original profile data 
              form.setFieldsValue({
                username: profileData.username,
                email: profileData.email,
                equippedItems: profileData.cosmetics || []
              });
              
              logDebug(`Form initialized with original values: username=${profileData.username}, email=${profileData.email}, cosmetics=[${profileData.cosmetics?.join(', ') || 'none'}]`);
            } else {
              logDebug('❌ IDs do not match - user is NOT authorized to edit profile');
              setIsAuthorized(false);
              message.error('You can only edit your own profile');
              router.push(`/users/${id}`);
            }
          } else {
            logDebug('⚠️ Could not extract user ID from /me response');
            logDebug(`Full /me response: ${JSON.stringify(currentUser)}`);
            setIsAuthorized(false);
            message.error('Authentication error. Please log in again.');
            router.push(`/users/${id}`);
          }
        } catch (authError) {
          // If /me endpoint fails, user is not authenticated or token is invalid
          console.error('Failed to verify current user:', authError);
          logDebug('Authentication check failed - possibly not logged in');
          logDebug(`Error: ${authError instanceof Error ? authError.message : String(authError)}`);
          setIsAuthorized(false);
          message.error('Authentication error. Please log in again.');
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        logDebug(`Error fetching profile: ${error instanceof Error ? error.message : String(error)}`);
        message.error('Failed to load profile. Please try again later.');
        router.push(`/users/${id}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [form, id, router, apiService, logDebug, extractUserId]);

  const handleBack = () => {
    router.push(`/users/${id}`);
  };

  const toggleDebugMode = () => {
    setDebugMode(prev => !prev);
  };

  const checkToken = async () => {
    logDebug('Manual token check requested');
    
    // Check token in sessionStorage (same as profile page)
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
        
        // Update isAuthorized if needed
        if (userId === String(id)) {
          setIsAuthorized(true);
          logDebug('✅ IDs match - user is authorized');
        } else {
          logDebug(`❌ IDs do not match - Current: ${userId}, Profile: ${id}`);
          setIsAuthorized(false);
        }
      } else {
        logDebug('⚠️ Could not extract user ID from /me response');
      }
    } catch (error) {
      console.error('Token test failed:', error);
      logDebug(`Token validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
    }
    
    return isJpgOrPng && isLt2M;
  };

  const handleAvatarChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  interface ApiError {
    response?: {
      status: number;
      data: unknown;
    };
    message?: string;
  }

  const handleSubmit = async (values: FormValues) => {
    if (!profile || !isAuthorized) {
      message.error('You are not authorized to edit this profile');
      router.push(`/users/${id}`);
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Check if any values have changed
      const hasChanges = 
        values.username !== profile.username || 
        values.email !== profile.email || 
        JSON.stringify(values.equippedItems || []) !== JSON.stringify(profile.cosmetics || []);
      
      // If nothing changed, just return to profile
      if (!hasChanges) {
        logDebug('No changes detected, redirecting to profile');
        message.info('No changes made to profile');
        router.push(`/users/${id}`);
        return;
      }
      
      // Update profile information using /api/users/me endpoint from UserController
      await apiService.put('/api/users/me', {
        username: values.username,
        email: values.email,
        statsPublic: true, // assuming this is needed based on UserUpdateRequestDTO
        // Include cosmetics update if that endpoint supports it
        cosmetics: values.equippedItems
      });
      
      message.success('Profile updated successfully!');
      // Always redirect to profile page after save
      router.push(`/users/${id}`);
    } catch (error: unknown) {
      console.error('Failed to update profile:', error);
      
      const err = error as ApiError;
      
      if (err.response) {
        if (err.response.status === 409) {
          message.error('Username or email already in use. Please choose another one.');
        } else if (err.response.status === 400) {
          message.error('Invalid username or email format.');
        } else if (err.response.status === 401) {
          message.error('Authentication failed. Please log in again.');
          router.push('/login');
        } else {
          message.error('Failed to update profile. Please try again later.');
        }
      } else if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Failed to update profile. Please try again later.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading profile..." />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack} 
          style={{ marginBottom: '16px' }}
        >
          Back to Profile
        </Button>
        <Card>
          <Title level={3}>Unauthorized</Title>
          <Text>You do not have permission to edit this profile.</Text>
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
        Back to Profile
      </Button>
      
      <Card>
        <Title level={3}>Edit Profile</Title>
        <Text type="secondary" style={{ marginBottom: '24px', display: 'block' }}>
          Update your profile information and appearance
        </Text>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            username: profile?.username,
            email: profile?.email,
            equippedItems: profile?.cosmetics || []
          }}
          // Preserve values after failed validation
          preserve={true}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <Avatar size={80} icon={<UserOutlined />} />
            <Upload
              name="avatar"
              listType="text"
              className="avatar-uploader"
              showUploadList={false}
              beforeUpload={beforeUpload}
              onChange={handleAvatarChange}
              style={{ marginLeft: '16px' }}
            >
              <Button icon={<UploadOutlined />}>Change Avatar</Button>
            </Upload>
          </div>
          
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Please enter a username' },
              { min: 3, message: 'Username must be at least 3 characters' },
              { max: 20, message: 'Username cannot exceed 20 characters' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: 'Username can only contain letters, numbers, and underscores' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Username" 
            />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter an email' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Email" 
            />
          </Form.Item>
          
          <Divider />
          
          <Title level={4}>Cosmetics</Title>
          <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
            Select which cosmetic items to equip
          </Text>

          <Form.Item
            name="equippedItems"
            label="Equipped Items"
          >
            <Select
              mode="multiple"
              placeholder="Select cosmetic items to equip"
              style={{ width: '100%' }}
            >
              {ownedCosmetics.map((item) => (
                <Option key={item} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
                style={{ marginTop: '16px' }}
              >
                Save Changes
              </Button>
              <Button
                htmlType="button"
                onClick={handleBack}
                style={{ marginTop: '16px' }}
              >
                Cancel
              </Button>
            </div>
          </Form.Item>
        </Form>

        {/* Debug section - added to match profile page */}
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
              <Button onClick={checkToken} type="primary">
                Check Token Status
              </Button>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text>Profile ID: {id}</Text><br/>
              <Text>Is Authorized: {isAuthorized ? 'Yes' : 'No'}</Text><br/>
              <Text>Username: {profile?.username}</Text>
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
