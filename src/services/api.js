import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle errors and token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Call refresh token endpoint with the refresh token in the request body
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                    refreshToken: refreshToken
                });
                
                const { accessToken } = response.data;

                // Store the new access token
                localStorage.setItem('accessToken', accessToken);

                // Update the original request with the new token
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                // Clear tokens and redirect to login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userId');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        console.error('API Error:', error);
        if (error.response?.status === 403) {
            console.error('Authorization failed. Please check if you are logged in and your token is valid.');
        }
        return Promise.reject(error);
    }
);

export const postService = {
    createPost: async (title, content, userId, file) => {
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('userId', userId);
            if (file) {
                formData.append('file', file);
            }
            const response = await api.post('/posts/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    },

    getPost: async (postId) => {
        try {
            const response = await api.get(`/posts/${postId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting post:', error);
            throw error;
        }
    },

    deletePost: async (postId) => {
        try {
            const response = await api.delete(`/posts/${postId}/delete`);
            return response.data;
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    },

    likePost: async (postId, userId) => {
        try {
            const response = await api.post(`/posts/${postId}/like`, null, {
                params: { userId },
            });
            return response.data;
        } catch (error) {
            console.error('Error liking post:', error);
            throw error;
        }
    },

    addComment: async (postId, userId, content) => {
        try {
            const response = await api.post(`/posts/${postId}/comments`, null, {
                params: { userId, content },
            });
            return response.data;
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    },

    getComments: async (postId) => {
        try {
            const response = await api.get(`/posts/${postId}/comments`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error getting comments:', error);
            return [];
        }
    },

    getUserFeed: async (userId) => {
        try {
            const response = await api.get('/posts/feed', {
                params: { userId },
            });
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error getting user feed:', error);
            return [];
        }
    },

    getUserPosts: async (userId) => {
        try {
            const response = await api.get(`/posts/${userId}/all-posts`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error getting user posts:', error);
            return [];
        }
    },

    checkIfLiked: async (postId, userId) => {
        try {
            const response = await api.get(`/posts/${postId}/check-like`, {
                params: { userId }
            });
            return response.data;
        } catch (error) {
            console.error('Error checking if post is liked:', error);
            return { isLiked: false };
        }
    },
};

export const userService = {
    getUser: async (userId) => {
        try {
            const response = await api.get(`/users/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting user:', error);
            throw error;
        }
    },

    followUser: async (followerId, username) => {
        try {
            const response = await api.post('/users/follow', null, {
                params: { followerId, username },
            });
            return response.data;
        } catch (error) {
            console.error('Error following user:', error);
            throw error;
        }
    },

    unfollowUser: async (followerId, username) => {
        try {
            const response = await api.post('/users/unfollow', null, {
                params: { followerId, username },
            });
            return response.data;
        } catch (error) {
            console.error('Error unfollowing user:', error);
            throw error;
        }
    },

    getFollowers: async (userId) => {
        try {
            const response = await api.get(`/users/${userId}/followers`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error getting followers:', error);
            return [];
        }
    },

    getFollowing: async (userId) => {
        try {
            const response = await api.get(`/users/${userId}/following`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error getting following:', error);
            return [];
        }
    },
};

export const authService = {
    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { accessToken, refreshToken, userId } = response.data;
            
            // Store tokens and userId
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('userId', userId);
            
            // Fetch user data after successful login
            const userResponse = await api.get(`/users/${userId}`);
            const userData = userResponse.data;
            
            return {
                ...userData,
                accessToken,
                refreshToken,
                userId
            };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    register: async (email, password) => {
        try {
            const response = await api.post('/auth/register', { email, password });
            const { accessToken, refreshToken, userId } = response.data;
            
            // Store tokens and userId
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('userId', userId);
            
            return {
                accessToken,
                refreshToken,
                userId
            };
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
    }
};

export const profileService = {
    createOrUpdateProfile: async (userId, profileData) => {
        try {
            console.log('Creating/updating profile for user:', userId);
            const formData = new FormData();
            
            // Add all text fields
            formData.append('username', profileData.username);
            formData.append('fullName', profileData.fullName);
            formData.append('bio', profileData.bio);
            
            // Add interests as JSON string
            if (profileData.interests && profileData.interests.length > 0) {
                formData.append('interests', JSON.stringify(profileData.interests));
            }
            
            // Add profile picture if it exists
            if (profileData.profilePicture) {
                formData.append('profilePicture', profileData.profilePicture);
            }

            console.log('FormData contents:', {
                username: profileData.username,
                fullName: profileData.fullName,
                bio: profileData.bio,
                hasInterests: !!profileData.interests,
                hasProfilePicture: !!profileData.profilePicture
            });

            const response = await api.post(`/profile/${userId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error creating/updating profile:', error);
            throw error;
        }
    },

    getProfile: async (userId) => {
        console.log('Fetching profile for userId:', userId);
        const response = await api.get(`/profile/${userId}`);
        const profile = response.data;
        
        console.log('Raw profile data:', {
            hasProfilePicture: !!profile.profilePicture,
            profilePictureType: profile.profilePicture ? typeof profile.profilePicture : 'none',
            isArray: profile.profilePicture ? Array.isArray(profile.profilePicture) : false,
            length: profile.profilePicture ? profile.profilePicture.length : 0
        });
        
        // Convert byte array to base64 if profile picture exists
        if (profile.profilePictureBase64) {
            profile.profilePicture = `data:image/jpeg;base64,${profile.profilePictureBase64}`;
        }
        
        return profile;
    }
}; 