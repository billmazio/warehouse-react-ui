import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Setup.css';

const Setup = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [storeName, setStoreName] = useState('ΚΕΝΤΡΙΚΑ');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [setupRequired, setSetupRequired] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkSetupStatus = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/setup/status');
                setSetupRequired(response.data.setupRequired);

                if (!response.data.setupRequired) {
                    navigate('/login');
                }
            } catch (error) {
                console.error('Error checking setup status:', error);
            }
        };

        checkSetupStatus();
    }, [navigate]);

    const validateForm = () => {
        const newErrors = {};

        if (!username || username.length < 4) {
            newErrors.username = 'Username must be at least 4 characters';
        }

        if (!password || password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!storeName || storeName.trim() === '') {
            newErrors.storeName = 'Store name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSetup = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Include the status field for the store
            const setupData = {
                username,
                password,
                storeTitle: storeName,
                storeAddress: 'Αθήνα Σόλωνος 5',
                status: 'ACTIVE' // Add the status field
            };

            console.log('Sending setup data:', setupData);

            const setupResponse = await axios.post('http://localhost:8080/api/setup', setupData);

            console.log('Setup Successful:', setupResponse.data);
            alert('Administrator account and default store created successfully! Please log in.');
            navigate('/login');
        } catch (err) {
            console.error('Setup Failed:', err);

            // Detailed error logging
            if (err.response) {
                console.error('Response status:', err.response.status);
                console.error('Response data:', err.response.data);

                setErrors({
                    general: err.response.data.message || `Server error: ${err.response.status}`
                });
            } else if (err.request) {
                console.error('No response received');
                setErrors({
                    general: 'No response from server. Please check your network connection.'
                });
            } else {
                console.error('Error message:', err.message);
                setErrors({
                    general: `Error: ${err.message}`
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!setupRequired) {
        return null;
    }

    return (
        <div className="setup-page">
            <div className="setup-container">
                <div className="setup-card">
                    <div className="setup-logo">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
                            <path d="M12 6.44v6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M7.5 12.94v-6.5h9v6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M7 19.44v-2.5c0-.55.45-1 1-1h8c.55 0 1 .45 1 1v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M5 19.44h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h1 className="setup-title">Clothes Manager Setup</h1>
                    <p className="setup-description">Create your administrator account and default store</p>

                    <form onSubmit={handleSetup} className="setup-form">
                        <div className="form-section">
                            <h2 className="section-title">Administrator Account</h2>

                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter username"
                                    required
                                />
                                {errors.username && <div className="error-message">{errors.username}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    required
                                />
                                {errors.password && <div className="error-message">{errors.password}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm password"
                                    required
                                />
                                {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
                            </div>
                        </div>

                        <div className="form-section">
                            <h2 className="section-title">Default Store</h2>

                            <div className="form-group">
                                <label htmlFor="storeName">Store Name</label>
                                <input
                                    id="storeName"
                                    type="text"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    placeholder="Enter store name"
                                    required
                                />
                                {errors.storeName && <div className="error-message">{errors.storeName}</div>}
                            </div>

                            {/* Hidden status field - always active for default store */}
                            <input
                                type="hidden"
                                id="storeStatus"
                                name="storeStatus"
                                value="ACTIVE"
                            />
                        </div>

                        {errors.general && <div className="general-error">{errors.general}</div>}

                        <button
                            type="submit"
                            className="setup-button"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="button-content">
                                    <span className="spinner"></span>
                                    Setting up...
                                </span>
                            ) : (
                                'Complete Setup'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Setup;