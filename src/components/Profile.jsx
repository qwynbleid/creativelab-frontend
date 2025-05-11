import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { profileService, postService, userService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';
import Post from './Post';

const getProfilePictureUrl = (profile, previewUrl) => {
    if (previewUrl) return previewUrl;
    if (profile.profilePicture) {
        if (profile.profilePicture.startsWith('data:image')) {
            return profile.profilePicture;
        }
    }
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.fullName || profile.username || 'User') + '&background=random&color=fff';
};

const Profile = () => {
    const { userId: paramUserId } = useParams();
    const { user } = useAuth();
    const location = useLocation();
    const userId = paramUserId;

    const [profile, setProfile] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        bio: '',
        interests: '',
        profilePicture: null
    });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [posts, setPosts] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });
    const [isFollowing, setIsFollowing] = useState(false);

    const isOwnProfile = user && profile && (String(user.id) === String(profile.id) || String(user.id) === String(profile.userId));

    useEffect(() => {
        if (userId) {
            // If we have user data in location state, use it for instant display
            if (location.state?.userData) {
                setProfile(location.state.userData);
                setFormData({
                    username: location.state.userData.username || '',
                    fullName: location.state.userData.fullName || '',
                    bio: location.state.userData.bio || '',
                    interests: Array.isArray(location.state.userData.interests) ? location.state.userData.interests.join(', ') : '',
                    profilePicture: null
                });
                setPreviewUrl(
                    location.state.userData.profilePicture
                        ? location.state.userData.profilePicture.startsWith('data:image')
                            ? location.state.userData.profilePicture
                            : `data:image/jpeg;base64,${location.state.userData.profilePicture}`
                        : null
                );
            }
            // Always fetch the full profile from the backend for up-to-date and complete data
            fetchProfile();
            fetchPosts();
            fetchFollowStats();
        }
    }, [userId, location.state]);

    const fetchProfile = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await profileService.getProfile(userId);
            setProfile(data);
            setFormData({
                username: data.username || '',
                fullName: data.fullName || '',
                bio: data.bio || '',
                interests: Array.isArray(data.interests) ? data.interests.join(', ') : '',
                profilePicture: null
            });
            setPreviewUrl(
                data.profilePicture
                    ? data.profilePicture.startsWith('data:image')
                        ? data.profilePicture
                        : `data:image/jpeg;base64,${data.profilePicture}`
                    : null
            );
        } catch (err) {
            setError('Failed to load profile.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPosts = async () => {
        try {
            const data = await postService.getUserPosts(userId);
            setPosts(data);
        } catch (err) {
            // handle error
        }
    };

    const fetchFollowStats = async () => {
        try {
            const stats = await profileService.getFollowStats(userId);
            setFollowStats(stats);
        } catch (err) {
            console.error('Error fetching follow stats:', err);
        }
    };

    useEffect(() => {
        const checkFollowingStatus = async () => {
            if (user && profile && !isOwnProfile) {
                try {
                    const followingList = await userService.getFollowing(user.id);
                    const isFollowingUser = followingList.some(
                        u => String(u.id) === String(profile.id) || String(u.id) === String(profile.userId)
                    );
                    setIsFollowing(isFollowingUser);
                } catch (err) {
                    console.error('Error checking following status:', err);
                    setIsFollowing(false);
                }
            }
        };

        checkFollowingStatus();
    }, [user, profile, isOwnProfile]);

    const handleFollow = async () => {
        // Optimistically update UI
        setIsFollowing(true);
        const previousStats = { ...followStats };
        setFollowStats(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));

        try {
            await userService.followUser(user.id, profile.username);
            // Refresh stats in background
            fetchFollowStats();
        } catch (err) {
            console.error('Error following user:', err);
            // Revert on error
            setIsFollowing(false);
            setFollowStats(previousStats);
        }
    };

    const handleUnfollow = async () => {
        // Optimistically update UI
        setIsFollowing(false);
        const previousStats = { ...followStats };
        setFollowStats(prev => ({ ...prev, followersCount: prev.followersCount - 1 }));

        try {
            await userService.unfollowUser(user.id, profile.username);
            // Refresh stats in background
            fetchFollowStats();
        } catch (err) {
            console.error('Error unfollowing user:', err);
            // Revert on error
            setIsFollowing(true);
            setFollowStats(previousStats);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData((prev) => ({ ...prev, profilePicture: file }));
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const interestsArray = formData.interests
                .split(',')
                .map((i) => i.trim())
                .filter((i) => i.length > 0);
            
            const profileData = {
                username: formData.username,
                fullName: formData.fullName,
                bio: formData.bio,
                profilePicture: formData.profilePicture,
                interests: interestsArray
            };

            const updated = await profileService.createOrUpdateProfile(userId, profileData);
            setProfile(updated);
            setEditMode(false);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            await postService.deletePost(postId);
            setPosts(posts.filter(post => post.id !== postId));
        } catch (err) {
            // handle error
        }
    };

    if (loading) {
        return <div className="text-center p-8">Loading...</div>;
    }
    if (error) {
        return <div className="text-center text-red-500 p-8">{error}</div>;
    }
    if (!profile) {
        return <div className="text-center p-8">No profile found.</div>;
    }

    return (
        <div className="min-h-screen flex flex-col app-dark-bg">
            <Navbar />
            <div className="flex-grow pt-16 mb-16">
                {/* Profile Header Section */}
                <div className="max-w-6xl mx-auto px-4 mt-8">
                    <div className="bg-card-dark rounded-2xl shadow-lg p-8 relative">
                        {/* Static Edit Profile Button (top right) */}
                        {isOwnProfile && !editMode && (
                            <button
                                className="absolute top-4 right-4 bg-pink-100 hover:bg-pink-200 text-pink-600 rounded-full p-2 shadow transition"
                                onClick={() => setEditMode(true)}
                                title="Edit Profile"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.789l-4 1 1-4 14.362-14.302z" />
                                </svg>
                            </button>
                        )}
                        {/* Follow/Unfollow Button (top right for other users) */}
                        {!isOwnProfile && user && (
                            <div className="absolute top-4 right-4">
                                {isFollowing ? (
                                    <button
                                        onClick={handleUnfollow}
                                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-all duration-200 ease-in-out transform hover:scale-105"
                                    >
                                        Unfollow
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleFollow}
                                        className="px-6 py-2 bg-pink-600 text-white rounded-full font-semibold hover:bg-pink-700 transition-all duration-200 ease-in-out transform hover:scale-105"
                                    >
                                        Follow
                                    </button>
                                )}
                            </div>
                        )}
                        {/* Profile Header and Info */}
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                            <div className="flex-shrink-0">
                                <div className="relative group">
                                    <img
                                        src={getProfilePictureUrl(profile, previewUrl)}
                                        alt="Profile"
                                        className="w-40 h-40 rounded-full object-cover border-4 border-pink-200 shadow-lg"
                                    />
                                </div>
                            </div>
                            <div className="flex-grow text-center md:text-left">
                                <div className="text-3xl font-bold text-gray-200">{profile.username}</div>
                                <div className="text-xl text-gray-400 mt-1">{profile.fullName}</div>
                                <div className="text-gray-300 mt-4 max-w-2xl">{profile.bio}</div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                                    {Array.isArray(profile.interests) && profile.interests.map((interest, idx) => (
                                        <span key={idx} className="bg-pink-100 text-pink-700 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-pink-200 transition-colors">{interest}</span>
                                    ))}
                                </div>
                                {/* Follow Stats */}
                                <div className="flex gap-6 mt-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-gray-200">{followStats.followersCount}</span>
                                        <span className="text-sm text-gray-400">Followers</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-gray-200">{followStats.followingCount}</span>
                                        <span className="text-sm text-gray-400">Following</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Posts Section */}
                <div className="max-w-6xl mx-auto px-4 mt-8">
                    <h3 className="text-2xl font-bold mb-6 text-gray-200">
                        {isOwnProfile
                            ? 'My Posts'
                            : `${profile.username ? profile.username + "'s" : 'User'} Posts`}
                    </h3>
                    <div className="flex flex-col gap-6">
                        {posts.length === 0 ? (
                            <div className="text-center text-gray-400 bg-card-dark rounded-xl p-8 shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                </svg>
                                <p className="text-lg">No posts yet.</p>
                                <p className="text-sm text-gray-500 mt-2">Start sharing your creative work with the community!</p>
                            </div>
                        ) : (
                            [...posts]
                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                .map(post => (
                                    <Post
                                        key={post.id}
                                        post={post}
                                        currentUserId={user?.id}
                                        onPostUpdate={() => fetchPosts()}
                                        canDelete={isOwnProfile}
                                    />
                                ))
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal/Overlay */}
            {editMode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-card-dark p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <h3 className="text-xl font-semibold text-gray-200 mb-4">Edit Profile</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col items-center mb-4">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-pink-500">
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="Profile preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                                <i data-feather="user" className="h-12 w-12 text-gray-400"></i>
                                            </div>
                                        )}
                                    </div>
                                    <label
                                        htmlFor="profilePicture"
                                        className="absolute bottom-0 right-0 bg-pink-600 text-white p-1 rounded-full cursor-pointer hover:bg-pink-700 transition duration-150 ease-in-out"
                                        title="Change profile picture"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <input
                                            id="profilePicture"
                                            name="profilePicture"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                                <p className="mt-2 text-sm text-gray-400">
                                    Click the camera icon to change your profile picture
                                </p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-300 mb-2">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-card-dark border border-gray-700 rounded-md text-gray-100"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-300 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-card-dark border border-gray-700 rounded-md text-gray-100"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-300 mb-2">Bio</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-card-dark border border-gray-700 rounded-md text-gray-100"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-300 mb-2">Interests (comma-separated)</label>
                                <input
                                    type="text"
                                    name="interests"
                                    value={formData.interests}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-card-dark border border-gray-700 rounded-md text-gray-100"
                                />
                            </div>
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setEditMode(false)}
                                    className="px-4 py-2 text-gray-300 hover:text-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
                        <h3 className="text-xl font-semibold text-gray-200 mb-4">Delete Post</h3>
                        <p className="text-gray-400 mb-6">Are you sure you want to delete this post? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 text-gray-700 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleDeletePost(showDeleteConfirm);
                                    setShowDeleteConfirm(null);
                                }}
                                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="bg-gray-1000/10 backdrop-blur-sm text-white py-6 relative z-10 mt-auto border-t border-gray-800">
                <div className="container mx-auto px-4 text-center">
                    <p className="mb-4">CreativeHub &copy; 2025</p>
                    <div className="flex justify-center space-x-4">
                        <a href="#" className="hover:text-pink-400">About</a>
                        <a href="#" className="hover:text-pink-400">Rules</a>
                        <a href="#" className="hover:text-pink-400">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Profile; 