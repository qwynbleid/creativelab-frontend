import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { profileService, postService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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
    const userId = paramUserId || user?.id;

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

    useEffect(() => {
        if (userId) {
            fetchProfile();
            fetchPosts();
        }
    }, [userId]);

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
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-10 relative">
            {/* Static Edit Profile Button (top right) */}
            {!editMode && (
                <button
                    className="absolute top-4 right-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-full p-2 shadow transition"
                    onClick={() => setEditMode(true)}
                    title="Edit Profile"
                >
                    {/* Pencil icon (Heroicons outline) */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.789l-4 1 1-4 14.362-14.302z" />
                    </svg>
                </button>
            )}
            {/* Profile Header and Info (always visible) */}
            <div className="flex flex-col items-center mb-10">
                <div className="relative group">
                    <img
                        src={getProfilePictureUrl(profile, previewUrl)}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200 shadow-lg"
                    />
                </div>
                <div className="mt-4 text-center">
                    <div className="text-2xl font-bold">{profile.username}</div>
                    <div className="text-lg text-gray-700">{profile.fullName}</div>
                    <div className="text-gray-500 mt-2">{profile.bio}</div>
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                        {Array.isArray(profile.interests) && profile.interests.map((interest, idx) => (
                            <span key={idx} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">{interest}</span>
                        ))}
                    </div>
                </div>
            </div>
            {/* Edit Profile Modal/Overlay */}
            {editMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-fadeIn">
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
                            onClick={() => setEditMode(false)}
                            title="Close"
                        >
                            &times;
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-center">Edit Profile</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex flex-col items-center">
                                <div className="relative">
                                    <img
                                        src={getProfilePictureUrl(profile, previewUrl)}
                                        alt="Profile preview"
                                        className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500"
                                    />
                                    <label
                                        htmlFor="profilePicture"
                                        className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2 rounded-full cursor-pointer shadow-lg flex items-center justify-center hover:scale-110 transition"
                                        title="Change profile picture"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m2-2l-6 6" /></svg>
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
                                <p className="mt-2 text-sm text-gray-500">
                                    Click the camera icon to change your profile picture
                                </p>
                            </div>
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    id="username"
                                    required
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                                    placeholder="Username"
                                />
                            </div>
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    id="fullName"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                                    placeholder="Full Name"
                                />
                            </div>
                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                                    Bio
                                </label>
                                <textarea
                                    name="bio"
                                    id="bio"
                                    rows="3"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                                    placeholder="Tell us about yourself"
                                />
                            </div>
                            <div>
                                <label htmlFor="interests" className="block text-sm font-medium text-gray-700">
                                    Interests
                                </label>
                                <input
                                    type="text"
                                    name="interests"
                                    id="interests"
                                    value={formData.interests}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                                    placeholder="Enter interests separated by commas"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition"
                                    onClick={() => setEditMode(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Posts Section */}
            <h3 className="text-2xl font-bold mt-10 mb-4">My Posts</h3>
            <div className="flex flex-col gap-6">
                {posts.length === 0 ? (
                    <div className="text-center text-gray-400">No posts yet.</div>
                ) : (
                    posts.map(post => (
                        <div key={post.id} className="relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Delete button with confirmation */}
                            <button
                                className="absolute top-3 right-3 bg-gray-100 hover:bg-red-100 text-red-500 rounded-full p-2 shadow-md z-10 border border-gray-200"
                                onClick={() => setShowDeleteConfirm(post.id)}
                                title="Delete post"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            {showDeleteConfirm === post.id && (
                                <div className="absolute top-10 right-3 bg-white border border-gray-300 rounded shadow-lg p-4 z-20 flex flex-col items-center">
                                    <span className="mb-2 text-gray-700">Delete this post?</span>
                                    <div className="flex gap-2">
                                        <button
                                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                            onClick={async () => { await handleDeletePost(post.id); setShowDeleteConfirm(null); }}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                            onClick={() => setShowDeleteConfirm(null)}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>
                            )}
                            {post.postImage && (
                                <img src={post.postImage} alt="Post" className="w-full max-h-96 object-cover" />
                            )}
                            <div className="p-4">
                                <h4 className="font-semibold text-lg mb-2">{post.title}</h4>
                                <p className="text-gray-700 mb-2">{post.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Profile; 