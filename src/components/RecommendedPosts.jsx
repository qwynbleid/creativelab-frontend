import React, { useState, useEffect } from 'react';
import { postService } from '../services/api';
import Post from './Post';
import { useAuth } from '../contexts/AuthContext';

const RecommendedPosts = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user?.id) {
            loadRecommendations();
        }
    }, [user?.id]);

    const loadRecommendations = async () => {
        try {
            setLoading(true);
            const recData = await postService.getRecommendedPosts(user.id);
            setPosts(Array.isArray(recData) ? recData : []);
            setError(null);
        } catch (error) {
            console.error('Error loading recommendations:', error);
            setError('Failed to load recommendations. Please try again later.');
            setPosts([]);
        } finally {
            setLoading(false);
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
        <div className="space-y-6">
            <h1 className="text-4xl font-bold text-center text-gray-200 mb-12">
                Recommended for You
            </h1>
            {!posts || posts.length === 0 ? (
                <div className="text-center text-gray-400 p-4">
                    No recommendations yet. Interact more to get personalized suggestions!
                </div>
            ) : (
                posts.map((post) => (
                    <Post
                        key={post.id}
                        post={post}
                        currentUserId={user?.id}
                    />
                ))
            )}
        </div>
    );
};

export default RecommendedPosts; 