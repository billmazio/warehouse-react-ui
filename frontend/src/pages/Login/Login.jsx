import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Frontend validation
    const validateForm = () => {
        const errors = {};

        // Check username
        if (!username.trim()) {
            errors.username = 'Το πεδίο είναι υποχρεωτικό';
        } else if (username.trim().length < 3 || username.trim().length > 50) {
            errors.username = 'Το όνομα χρήστη πρέπει να είναι από 3 έως 50 χαρακτήρες.';
        }

        // Check password
        if (!password) {
            errors.password = 'Το πεδίο είναι υποχρεωτικό';
        } else if (password.length < 6) {
            errors.password = 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.';
        }

        return errors;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        // Frontend validation first
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

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
                setFieldErrors(body.errors);
            } else if (status === 401) {
                setError('Invalid username or password');
            } else if (!status) {
                setError('Cannot reach server. Check connection/CORS.');
            } else {
                setError(body?.message || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" data-test="login-container">
            <div className="login-form" data-test="login-form">
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
                            data-test="username-input"
                        />
                        {fieldErrors.username && (
                            <p
                                className="error-message"
                                role="alert"
                                data-field="username"
                                data-test="username-error"
                            >
                                {fieldErrors.username}
                            </p>
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
                            data-test="password-input"
                        />
                        {fieldErrors.password && (
                            <p
                                className="error-message"
                                role="alert"
                                data-field="password"
                                data-test="password-error"
                            >
                                {fieldErrors.password}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn"
                        disabled={loading}
                        data-test="signInButton"
                    >
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                {error && (
                    <p
                        className="error-message"
                        role="alert"
                        data-test="login-error"
                    >
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
};

export default Login;