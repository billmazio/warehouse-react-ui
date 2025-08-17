import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');                // generic errors (401, network)
    const [fieldErrors, setFieldErrors] = useState({});    // { username: '...', password: '...' }
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setLoading(true);

        try {
            const res = await axios.post('http://localhost:8080/api/auth/login', {
                username: username.trim(),
                password,
            });

            localStorage.setItem('token', res.data.token);
            navigate('/dashboard');
        } catch (err) {
            const status = err.response?.status;
            const body = err.response?.data;

            if (status === 400 && body?.errors) {
                // Bean validation errors from backend
                setFieldErrors(body.errors);
            } else if (status === 401) {
                // Bad credentials
                setError('Invalid username or password');
            } else if (!status) {
                // Network / CORS
                setError('Cannot reach server. Check connection/CORS.');
            } else {
                setError(body?.message || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <form onSubmit={handleLogin} noValidate>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            aria-invalid={!!fieldErrors.username}
                            required
                        />
                        {fieldErrors.username && (
                            <p className="error-message" role="alert">{fieldErrors.username}</p>
                        )}
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            aria-invalid={!!fieldErrors.password}
                            required
                        />
                        {fieldErrors.password && (
                            <p className="error-message" role="alert">{fieldErrors.password}</p>
                        )}
                    </div>

                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                {error && <p className="error-message" role="alert">{error}</p>}
            </div>
        </div>
    );
};

export default Login;
