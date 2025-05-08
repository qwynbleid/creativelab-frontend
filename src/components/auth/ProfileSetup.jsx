import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/api';

const ProfileSetup = () => {
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        bio: '',
        interests: '',
        profilePicture: null
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const navigate = useNavigate();
    const { userId: paramUserId } = useParams();
    const { user, setUser } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                profilePicture: file
            }));
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Get user ID from localStorage
            const storedUserId = localStorage.getItem('userId');
            if (!storedUserId) {
                throw new Error('User ID not found in localStorage');
            }

            // Convert interests string to array
            const interestsArray = formData.interests
                .split(',')
                .map(interest => interest.trim())
                .filter(interest => interest.length > 0);

            const profileData = {
                ...formData,
                interests: interestsArray
            };

            console.log('Submitting profile data:', {
                userId: storedUserId,
                hasProfilePicture: !!profileData.profilePicture,
                interests: interestsArray
            });

            const updatedProfile = await profileService.createOrUpdateProfile(storedUserId, profileData);
            
            // Update the user state with the new profile data
            if (setUser) {
                setUser(prevUser => ({
                    ...prevUser,
                    ...updatedProfile
                }));
            }

            // Ensure we have the latest user data
            const userResponse = await fetch(`/api/users/${storedUserId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            
            if (userResponse.ok) {
                const userData = await userResponse.json();
                setUser(userData);
            }

            // Use replace: true to prevent going back to the profile setup page
            navigate('/', { replace: true });
        } catch (err) {
            console.error('Profile setup error:', err);
            setError(err.response?.data?.message || 'Failed to set up profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Complete Your Profile
                    </h2>
                    <p className="mt-2 text-gray-600">Tell us a bit about yourself</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Profile preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                        <i data-feather="user" className="h-12 w-12 text-gray-400"></i>
                                    </div>
                                )}
                            </div>
                            <label
                                htmlFor="profilePicture"
                                className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1 rounded-full cursor-pointer hover:bg-indigo-700 transition duration-150 ease-in-out"
                            >
                                <i data-feather="camera" className="h-4 w-4"></i>
                            </label>
                            <input
                                id="profilePicture"
                                name="profilePicture"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            Click the camera icon to add a profile picture
                        </p>
                    </div>

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                                type="text"
                                name="username"
                                id="username"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                                placeholder="Choose a unique username"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                            Full Name
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                                type="text"
                                name="fullName"
                                id="fullName"
                                required
                                value={formData.fullName}
                                onChange={handleChange}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                                placeholder="Enter your full name"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                            Bio
                        </label>
                        <div className="mt-1">
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
                    </div>

                    <div>
                        <label htmlFor="interests" className="block text-sm font-medium text-gray-700">
                            Interests
                        </label>
                        <div className="mt-1">
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
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <i data-feather="alert-circle" className="h-5 w-5 text-red-400"></i>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <i data-feather="loader" className="animate-spin -ml-1 mr-3 h-5 w-5"></i>
                                Setting up profile...
                            </div>
                        ) : (
                            'Complete Profile'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetup; 