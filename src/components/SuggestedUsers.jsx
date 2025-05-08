import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SuggestedUsers = () => {
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 p-4">
                {error}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Suggested Creatives</h2>
            <div className="space-y-4">
                {!suggestedUsers || suggestedUsers.length === 0 ? (
                    <div className="text-center text-gray-500">
                        No suggested users at the moment
                    </div>
                ) : (
                    suggestedUsers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-4">
                            <img 
                                src={user.profilePicture 
                                    ? `data:image/jpeg;base64,${user.profilePicture}`
                                    : 'https://via.placeholder.com/40'} 
                                alt={`${user.username}'s avatar`} 
                                className="w-10 h-10 rounded-full"
                            />
                            <div>
                                <h3 className="font-semibold text-gray-800">{user.fullName}</h3>
                                <p className="text-sm text-gray-500">{user.username}</p>
                                <button 
                                    onClick={() => handleFollow(user.username)}
                                    className="mt-2 text-blue-500 hover:underline"
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