import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Feed from './components/Feed';
import TrendingTags from './components/TrendingTags';
import SuggestedUsers from './components/SuggestedUsers';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProfileSetup from './components/auth/ProfileSetup';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { initializeIcons, updateIcons } from './utils/icons';
import Profile from './components/Profile';

function App() {
    // Initialize Feather Icons
    React.useEffect(() => {
        initializeIcons();
    }, []);

    // Update icons whenever the component re-renders
    React.useEffect(() => {
        updateIcons();
    });

    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile-setup/:userId" element={<ProfileSetup />} />

                    {/* Protected routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <div className="flex flex-col h-screen relative">
                                    <Navbar />
                                    <div className="container mx-auto pt-24 pb-12 px-4 flex flex-col md:flex-row space-x-0 md:space-x-6 flex-1">
                                        <aside className="w-full md:w-1/4 mb-6 md:mb-0">
                                            <TrendingTags />
                                        </aside>

                                        <main className="w-full md:w-1/2 flex-grow">
                                            <Feed />
                                        </main>

                                        <aside className="w-full md:w-1/4">
                                            <SuggestedUsers />
                                        </aside>
                                    </div>

                                    <footer className="bg-gray-800 text-white py-6 relative z-10">
                                        <div className="container mx-auto px-4 text-center">
                                            <p className="mb-4">CreativeHub &copy; 2025</p>
                                            <div className="flex justify-center space-x-4">
                                                <a href="#" className="hover:text-blue-400">About</a>
                                                <a href="#" className="hover:text-blue-400">Rules</a>
                                                <a href="#" className="hover:text-blue-400">Contact</a>
                                            </div>
                                        </div>
                                    </footer>

                                    <button className="fixed bottom-20 right-6 bg-blue-500 text-white w-14 h-14 flex items-center justify-center rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-200 z-50">
                                        <i data-feather="plus" className="w-6 h-6"></i>
                                    </button>
                                </div>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile/:userId"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />

                    {/* Redirect to home if no route matches */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
