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
import RecommendedPosts from './components/RecommendedPosts';

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
                                <div className="min-h-screen flex flex-col app-dark-bg">
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

                                    <footer className="bg-gray-1000/10 backdrop-blur-sm text-gray-300 py-6 relative z-10 mt-auto border-t border-gray-800">
                                        <div className="container mx-auto px-4 text-center">
                                            <p className="mb-4">CreativeHub &copy; 2025</p>
                                            <div className="flex justify-center space-x-4">
                                                <a href="#" className="hover:text-pink-400 transition-colors">About</a>
                                                <a href="#" className="hover:text-pink-400 transition-colors">Rules</a>
                                                <a href="#" className="hover:text-pink-400 transition-colors">Contact</a>
                                            </div>
                                        </div>
                                    </footer>

                                    <button className="fixed bottom-10 right-6 bg-pink-600 text-white w-14 h-14 flex items-center justify-center rounded-full shadow-lg hover:bg-pink-700 transition-colors duration-200 z-50">
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
                    <Route
                        path="/recommended"
                        element={
                            <ProtectedRoute>
                                <div className="min-h-screen flex flex-col app-dark-bg">
                                    <Navbar />
                                    <div className="container mx-auto pt-24 pb-12 px-4 flex flex-col md:flex-row space-x-0 md:space-x-6 flex-1">
                                        <aside className="w-full md:w-1/4 mb-6 md:mb-0">
                                            <TrendingTags />
                                        </aside>
                                        <main className="w-full md:w-1/2 flex-grow">
                                            <RecommendedPosts />
                                        </main>
                                        <aside className="w-full md:w-1/4">
                                            <SuggestedUsers />
                                        </aside>
                                    </div>
                                    <footer className="bg-gray-1000/10 backdrop-blur-sm text-gray-300 py-6 relative z-10 mt-auto border-t border-gray-800">
                                        <div className="container mx-auto px-4 text-center">
                                            <p className="mb-4">CreativeHub &copy; 2025</p>
                                            <div className="flex justify-center space-x-4">
                                                <a href="#" className="hover:text-pink-400 transition-colors">About</a>
                                                <a href="#" className="hover:text-pink-400 transition-colors">Rules</a>
                                                <a href="#" className="hover:text-pink-400 transition-colors">Contact</a>
                                            </div>
                                        </div>
                                    </footer>
                                    <button className="fixed bottom-10 right-6 bg-pink-600 text-white w-14 h-14 flex items-center justify-center rounded-full shadow-lg hover:bg-pink-700 transition-colors duration-200 z-50">
                                        <i data-feather="plus" className="w-6 h-6"></i>
                                    </button>
                                </div>
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
