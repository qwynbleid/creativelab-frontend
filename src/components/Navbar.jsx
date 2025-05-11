import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import reactLogo from '../assets/react.svg';
import { initializeIcons, updateIcons } from '../utils/icons';
import { userService } from '../services/api';

// Debounce hook for instant search
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

const Navbar = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchRef = useRef(null);
    const [showSearchInput, setShowSearchInput] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

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

    // Close search dropdown and input when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchDropdown(false);
                setShowSearchInput(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Instant search as user types
    useEffect(() => {
        const doSearch = async () => {
            if (debouncedSearchTerm.trim()) {
                const results = await userService.searchUsers(debouncedSearchTerm.trim());
                setSearchResults(results);
                setShowSearchDropdown(true);
            } else {
                setSearchResults([]);
                setShowSearchDropdown(false);
            }
        };
        if (showSearchInput) doSearch();
    }, [debouncedSearchTerm, showSearchInput]);

    // Hide input/results on Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setShowSearchInput(false);
                setShowSearchDropdown(false);
                setSearchTerm('');
            }
        };
        if (showSearchInput) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showSearchInput]);

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

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        const results = await userService.searchUsers(searchTerm.trim());
        setSearchResults(results);
        setShowSearchDropdown(true);
    };

    const handleResultClick = async (userId) => {
        try {
            // Get the full user data before navigation
            const userData = await userService.getUser(userId);
            setShowSearchDropdown(false);
            setSearchTerm('');
            setSearchResults([]);
            // Navigate to profile with the user data
            navigate(`/profile/${userId}`, { state: { userData } });
        } catch (error) {
            console.error('Error loading user data:', error);
            // Fallback to simple navigation if user data fetch fails
            navigate(`/profile/${userId}`);
        }
    };

    // Filter out the logged-in user from search results
    const filteredSearchResults = user
        ? searchResults.filter(u => String(u.id) !== String(user.id))
        : searchResults;

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

                        {/* Search Icon Button with label */}
                        <button
                            className="px-4 py-2 text-gray-700 hover:text-indigo-600 rounded-md flex items-center space-x-2 transition duration-150 ease-in-out"
                            onClick={() => {
                                setShowSearchInput((v) => !v);
                                setTimeout(() => {
                                    if (!showSearchInput && searchRef.current) {
                                        const input = searchRef.current.querySelector('input');
                                        if (input) input.focus();
                                    }
                                }, 100);
                            }}
                            title="Search users"
                        >
                            <i data-feather="search" className="w-5 h-5" data-feather-replace></i>
                            <span>Search Users</span>
                        </button>

                        {/* User Search Input and Results */}
                        {showSearchInput && (
                            <div className="relative" ref={searchRef}>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Search users..."
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm min-w-[220px]"
                                    autoFocus
                                />
                                {showSearchDropdown && (
                                    <div className="absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                                        {filteredSearchResults.length > 0 ? filteredSearchResults.map(user => (
                                            <div
                                                key={user.id}
                                                className="flex items-center gap-3 px-4 py-2 hover:bg-indigo-50 cursor-pointer"
                                                onClick={() => handleResultClick(user.id)}
                                            >
                                                <img
                                                    src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=random&color=fff`}
                                                    alt={user.username}
                                                    className="w-8 h-8 rounded-full object-cover border"
                                                />
                                                <div>
                                                    <div className="font-semibold text-gray-800">{user.fullName}</div>
                                                    <div className="text-xs text-gray-500">@{user.username}</div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="px-4 py-2 text-gray-500">No users found.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

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