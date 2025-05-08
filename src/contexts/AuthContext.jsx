import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(() => localStorage.getItem('accessToken'));

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                setToken(token);
                const userId = localStorage.getItem('userId');
                
                if (token && userId) {
                    console.log('Initializing auth with token and userId:', { token: !!token, userId });
                    // Set the token in axios headers
                    const response = await fetch(`/api/users/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const userData = await response.json();
                        console.log('User data loaded:', userData);
                        // Format profile picture if it exists
                        if (userData.profilePictureBase64) {
                            userData.profilePicture = `data:image/jpeg;base64,${userData.profilePictureBase64}`;
                        }
                        setUser(userData);
                    } else {
                        console.log('Token invalid, clearing auth data');
                        // If token is invalid, clear everything
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('userId');
                        setUser(null);
                    }
                } else {
                    console.log('No token or userId found');
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                // Clear everything on error
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userId');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (email, password) => {
        try {
            console.log('Attempting login for:', email);
            const response = await authService.login(email, password);
            console.log('Login response:', response);
            
            // Store tokens and user ID in localStorage
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);
            localStorage.setItem('userId', response.id);
            setToken(response.accessToken);
            setUser(response);
            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (email, password) => {
        try {
            console.log('Attempting registration for:', email);
            const response = await authService.register(email, password);
            console.log('Registration response:', response);
            setUser(response);
            return response;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const logout = () => {
        console.log('Logging out user');
        authService.logout();
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        setUser,
        loading,
        login,
        register,
        logout,
        token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 