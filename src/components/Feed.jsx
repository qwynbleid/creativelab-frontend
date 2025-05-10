import React, { useState, useEffect } from 'react';
import { postService } from '../services/api';
import Post from './Post';
import { useAuth } from '../contexts/AuthContext';

const Feed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user?.id) {
            loadFeed();
        }
    }, [user?.id]);

    const loadFeed = async () => {
        try {
            setLoading(true);
            const feedData = await postService.getUserFeed(user.id);
            // Ensure feedData is an array
            setPosts(Array.isArray(feedData) ? feedData : []);
            setError(null);
        } catch (error) {
            console.error('Error loading feed:', error);
            setError('Failed to load feed. Please try again later.');
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePostUpdate = () => {
        loadFeed();
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
        <div className="space-y-6">
            <h1 className="text-4xl font-bold text-center text-gray-800 mb-12">
                Welcome to the Creative Community
            </h1>
            {!posts || posts.length === 0 ? (
                <div className="text-center text-gray-500 p-4">
                    No posts yet. Follow some creators to see their content here!
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

export default Feed; 