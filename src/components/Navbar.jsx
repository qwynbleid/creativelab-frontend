import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import reactLogo from '../assets/react.svg';
import { initializeIcons, updateIcons } from '../utils/icons';

const Navbar = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Initialize icons when component mounts
    useEffect(() => {
        initializeIcons();
    }, []);

    // Update icons whenever the component updates
    useEffect(() => {
        updateIcons();
    });

    useEffect(() => {
        console.log('Navbar user data:', {
            hasUser: !!user,
            userId: user?.id,
            username: user?.username,
            hasProfilePicture: !!user?.profilePicture,
            profilePictureType: user?.profilePicture ? typeof user.profilePicture : 'none',
            profilePictureLength: user?.profilePicture ? user.profilePicture.length : 0
        });
    }, [user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleImageError = (e) => {
        console.error('Profile picture failed to load:', {
            src: e.target.src,
            error: e
        });
        e.target.onerror = null;
        e.target.src = reactLogo;
    };

    return (
        <nav className="navbar fixed top-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="text-2xl font-bold">
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Creative</span>Lab
                    </Link>

                    <div className="flex items-center space-x-4">
                        <Link 
                            to="/" 
                            className="px-4 py-2 text-gray-700 hover:text-indigo-600 rounded-md flex items-center space-x-2 transition duration-150 ease-in-out"
                        >
                            <i data-feather="home" className="w-5 h-5" data-feather-replace></i>
                            <span>Home</span>
                        </Link>
                        <Link 
                            to="/messages" 
                            className="px-4 py-2 text-gray-700 hover:text-indigo-600 rounded-md flex items-center space-x-2 transition duration-150 ease-in-out"
                        >
                            <i data-feather="message-circle" className="w-5 h-5" data-feather-replace></i>
                            <span>Chat</span>
                        </Link>

                        {user && (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center space-x-2 focus:outline-none"
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-500">
                                        {user.profilePicture || user.profilePictureBase64 ? (
                                            <img 
                                                src={user.profilePicture || `data:image/jpeg;base64,${user.profilePictureBase64}`}
                                                alt="Profile" 
                                                className="w-full h-full object-cover"
                                                onError={handleImageError}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <i data-feather="user" className="w-6 h-6 text-gray-400" data-feather-replace></i>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-gray-700">{user.username || 'User'}</span>
                                    <i data-feather={isDropdownOpen ? "chevron-up" : "chevron-down"} className="w-5 h-5 text-gray-400" data-feather-replace></i>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <div className="py-1" role="menu" aria-orientation="vertical">
                                            <Link
                                                to={`/profile/${user.id}`}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-indigo-600 flex items-center space-x-2"
                                                role="menuitem"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <i data-feather="user" className="w-4 h-4" data-feather-replace></i>
                                                <span>My Profile</span>
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-600 flex items-center space-x-2"
                                                role="menuitem"
                                            >
                                                <i data-feather="log-out" className="w-4 h-4" data-feather-replace></i>
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 