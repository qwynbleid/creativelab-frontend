import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login, user } = useAuth();

    // Get the redirect path from location state or default to home
    const from = location.state?.from?.pathname || '/';

    useEffect(() => {
        // Если пользователь уже аутентифицирован, перенаправляем на главную
        if (user) {
            navigate(from, { replace: true });
        }
    }, [user, navigate, from]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('Attempting login with:', { email: formData.email });
            await login(formData.email, formData.password);
            // Перенаправление произойдет автоматически через useEffect
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Failed to log in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center app-dark-bg py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-card-dark backdrop-blur-sm p-10 rounded-2xl shadow-2xl border border-gray-700">
                <h2 className="mt-2 text-center text-4xl font-extrabold text-transparent bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text">
                    Welcome Back
                </h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    Sign in to your account
                </p>

                {error && (
                    <div className="bg-red-900/50 border-l-4 border-red-400 p-4 rounded-md shadow-sm" role="alert">
                        <p className="text-sm text-red-300">{error}</p>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="appearance-none block w-full px-4 py-3 bg-card-dark border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-100 placeholder-gray-500 transition-colors"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="appearance-none block w-full px-4 py-3 bg-card-dark border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-100 placeholder-gray-500 transition-colors"
                                placeholder="Enter your password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-md focus:outline-none hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>

                    <div className="text-center mt-4">
                        <Link to="/forgot-password" className="text-pink-400 hover:text-pink-300 transition-colors">Forgot your password?</Link>
                    </div>
                    <div className="text-center mt-4">
                        <p className="text-gray-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-pink-400 hover:text-pink-300 transition-colors">Sign up</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;