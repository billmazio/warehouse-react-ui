import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { TokenManager } from '../../services/api'; // Use your configured API
import './Login.css';

const Login = ({ onLoginSuccess }) => { // Accept the callback prop
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Add loading state
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log('Attempting login...');

            const response = await api.post('/api/auth/login', {
                username,
                password,
            });

            console.log('Login Successful:', response.data);

            // The token should already be stored by your response interceptor
            // But let's verify it was stored correctly
            const storedToken = TokenManager.getToken();

            if (storedToken && !TokenManager.isTokenExpired()) {
                console.log('Token verified and stored successfully');

                if (onLoginSuccess) {
                    onLoginSuccess();
                }

                console.log('Navigating to dashboard...');
                navigate('/dashboard', { replace: true });

            } else {
                throw new Error('Token was not properly stored or is invalid');
            }

        } catch (err) {
            console.error('Login Failed:', err.response?.data || err.message);

            // Handle different types of errors
            if (err.response?.status === 401) {
                setError('Invalid username or password');
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.message) {
                setError(err.message);
            } else {
                setError('Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn"
                        disabled={loading}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default Login;