import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SuggestedUsers = () => {
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    const getProfilePictureUrl = (user) => {
        if (!user) return 'https://ui-avatars.com/api/?name=User&background=random';
        
        try {
            if (user.profilePicture) {
                // Check if the profile picture is already a data URL
                if (user.profilePicture.startsWith('data:image')) {
                    return user.profilePicture;
                }
                // If it's a base64 string without the prefix, add it
                if (typeof user.profilePicture === 'string' && user.profilePicture.length > 0) {
                    return `data:image/jpeg;base64,${user.profilePicture}`;
                }
            }
            if (user.profilePictureBase64) {
                // Check if the profile picture is already a data URL
                if (user.profilePictureBase64.startsWith('data:image')) {
                    return user.profilePictureBase64;
                }
                // If it's a base64 string without the prefix, add it
                if (typeof user.profilePictureBase64 === 'string' && user.profilePictureBase64.length > 0) {
                    return `data:image/jpeg;base64,${user.profilePictureBase64}`;
                }
            }
        } catch (error) {
            console.error('Error processing profile picture:', error);
        }
        
        // Fallback to a generated avatar based on the user's name
        const name = user.fullName || user.username || 'User';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
    };

    useEffect(() => {
        if (user?.id) {
            loadSuggestedUsers();
        }
    }, [user?.id]);

    const loadSuggestedUsers = async () => {
        try {
            setLoading(true);
            const following = await userService.getFollowing(user.id);
            // Ensure following is an array
            setSuggestedUsers(Array.isArray(following) ? following : []);
            setError(null);
        } catch (error) {
            console.error('Error loading suggested users:', error);
            setError('Failed to load suggested users');
            setSuggestedUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (username) => {
        try {
            await userService.followUser(user.id, username);
            loadSuggestedUsers(); // Refresh the list
        } catch (error) {
            console.error('Error following user:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-400 p-4">
                {error}
            </div>
        );
    }

    return (
        <div className="bg-card-dark rounded-2xl p-6 shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Suggested Creatives</h2>
            <div className="space-y-4">
                {!suggestedUsers || suggestedUsers.length === 0 ? (
                    <div className="text-center text-gray-400">
                        No suggested users at the moment
                    </div>
                ) : (
                    suggestedUsers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-4">
                            <img 
                                src={getProfilePictureUrl(user)}
                                alt={`${user.username}'s avatar`} 
                                className="w-10 h-10 rounded-full border border-gray-700"
                                onError={(e) => {
                                    console.error('Profile picture failed to load:', {
                                        src: e.target.src,
                                        user: user
                                    });
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username || 'User')}&background=random&color=fff`;
                                }}
                            />
                            <div>
                                <h3 className="font-semibold text-gray-200">{user.fullName}</h3>
                                <p className="text-sm text-gray-400">{user.username}</p>
                                <button 
                                    onClick={() => handleFollow(user.username)}
                                    className="mt-2 text-pink-400 hover:text-pink-300 transition-colors"
                                >
                                    Follow
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SuggestedUsers; 