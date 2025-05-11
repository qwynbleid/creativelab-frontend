import axios from 'axios';

// Use relative path and let Vite's proxy handle the CORS
const API_URL = 'http://localhost:8080/api/messages';

// Get token from localStorage
const getAuthToken = () => {
    const token = localStorage.getItem('accessToken');
    console.log('Current token:', token); // Debug token
    return token ? `Bearer ${token}` : null;
};

// Create axios instance with default config
const axiosInstance = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // Enable sending cookies with requests
});

// Add request interceptor to add auth token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = token;
            console.log('Request headers:', config.headers); // Debug headers
        } else {
            console.warn('No auth token found!'); // Debug missing token
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers
        });
        return Promise.reject(error);
    }
);

// Helper function to compress image before sending
const compressImage = async (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions while maintaining aspect ratio
                const MAX_WIDTH = 600;  // Reduced from 800
                const MAX_HEIGHT = 600; // Reduced from 800
                
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to base64 with reduced quality
                const base64 = canvas.toDataURL('image/jpeg', 0.5); // Reduced quality from 0.7
                
                // Check if the base64 string is too large (more than 1MB)
                const base64Data = base64.split(',')[1];
                if (base64Data.length > 1024 * 1024) { // 1MB limit
                    console.warn('Image still too large after compression');
                    resolve(null);
                    return;
                }
                
                resolve(base64Data);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
};

export const messageService = {
    // Send a new message
    sendMessage: async (senderId, receiverId, content, imageFile = null) => {
        try {
            let imageBase64 = null;
            if (imageFile) {
                // Compress image before sending
                imageBase64 = await compressImage(imageFile);
                if (!imageBase64) {
                    throw new Error('Failed to process image');
                }
            }

            console.log('Sending message with data:', { 
                senderId, 
                receiverId, 
                content,
                hasImage: !!imageBase64,
                imageSize: imageBase64 ? imageBase64.length : 0
            });

            const response = await axiosInstance.post(`${API_URL}/send`, {
                senderId,
                receiverId,
                content,
                imageBase64
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            if (error.response?.status === 431) {
                throw new Error('Image size too large. Please try a smaller image.');
            }
            throw error;
        }
    },

    // Get messages between two users
    getMessagesBetweenUsers: async (userId1, userId2) => {
        try {
            console.log('Fetching messages between users:', { userId1, userId2 });
            
            // Fetch messages in both directions
            const [messages1, messages2] = await Promise.all([
                axiosInstance.get(`${API_URL}/between/${userId1}/${userId2}`),
                axiosInstance.get(`${API_URL}/between/${userId2}/${userId1}`)
            ]);
            
            // Combine and process messages from both directions
            const allMessages = [
                ...(messages1.data || []),
                ...(messages2.data || [])
            ];
            
            if (allMessages.length === 0) {
                console.log('No messages found between users');
                return [];
            }
            
            // Process the messages to ensure proper base64 formatting
            const processedMessages = allMessages.map(msg => ({
                ...msg,
                imageBase64: msg.imageBase64 ? msg.imageBase64.replace(/^data:image\/\w+;base64,/, '') : null
            }));
            
            console.log('Fetched messages:', processedMessages);
            return processedMessages;
        } catch (error) {
            console.error('Error fetching messages:', error);
            if (error.response?.status === 403) {
                console.log('No messages found between users');
                return [];
            }
            throw error;
        }
    },

    // Get all messages for a user
    getMessagesForUser: async (userId) => {
        try {
            console.log('Fetching messages for user:', userId);
            const response = await axiosInstance.get(`${API_URL}/for/${userId}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            // Process the messages to ensure proper base64 formatting
            const messages = response.data.map(msg => ({
                ...msg,
                imageBase64: msg.imageBase64 ? msg.imageBase64.replace(/^data:image\/\w+;base64,/, '') : null
            }));
            
            return messages;
        } catch (error) {
            if (error.response?.status === 403) {
                console.log('No messages found for user');
                return []; // Return empty array if no messages found
            }
            console.error('Error fetching user messages:', error);
            throw error;
        }
    }
}; 