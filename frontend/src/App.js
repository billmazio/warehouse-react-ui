import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { TokenManager } from "./services/api"; // Import TokenManager
import Login from "./pages/Login/Login";
import Setup from "./pages/Setup/Setup";
import Dashboard from "./components/Dashboard/Dashboard";
import ChangePassword from "./pages/ChangePassword/ChangePassword";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute";
import UserManagement from "./components/UserManagement/UserManagement";
import StoreManagement from "./components/StoreManagement/StoreManagement";
import CentralMaterialsList from "./components/MaterialsList/CentralMaterialsList";
import StoreMaterialsList from "./components/MaterialsList/StoreMaterialsList";
import OrderManagement from "./components/OrderManagement/OrderManagement";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const App = () => {
    const [isSetupRequired, setIsSetupRequired] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // First check if user is already logged in
                const token = TokenManager.getToken();
                const isTokenValid = token && !TokenManager.isTokenExpired();

                console.log("App initialization:", {
                    hasToken: !!token,
                    isTokenValid,
                    timeUntilExpiry: token ? TokenManager.getTimeUntilExpiry() : 0
                });

                setIsAuthenticated(isTokenValid);

                // Then check setup status
                const response = await axios.get(`${API_BASE_URL}/api/setup/status`);
                setIsSetupRequired(response.data.setupRequired);

            } catch (err) {
                console.error('Failed to check setup status:', err);

                // Check if the error response indicates setup is required
                if (err.response?.status === 403 && err.response?.data?.setupRequired) {
                    setIsSetupRequired(true);
                } else {
                    setIsSetupRequired(false);
                }
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();
    }, []);

    // Function to update authentication state (can be passed to Login component)
    const handleLoginSuccess = () => {
        console.log("🎉 Login successful, updating app state");
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        console.log("🔐 Logging out, clearing app state");
        TokenManager.removeToken();
        setIsAuthenticated(false);
    };

    if (isLoading) {
        return <div className="loading">Loading application...</div>;
    }

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={
                        isSetupRequired ?
                            <Navigate to="/setup" replace /> :
                            isAuthenticated ?
                                <Navigate to="/dashboard" replace /> :
                                <Navigate to="/login" replace />
                    }
                />

                <Route
                    path="/setup"
                    element={
                        isSetupRequired ?
                            <Setup onSetupComplete={() => {
                                setIsSetupRequired(false);
                                // Optionally redirect to login after setup
                            }} /> :
                            <Navigate to="/login" replace />
                    }
                />

                <Route
                    path="/login"
                    element={
                        isAuthenticated ?
                            <Navigate to="/dashboard" replace /> :
                            <Login onLoginSuccess={handleLoginSuccess} />
                    }
                />

                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute onLogout={handleLogout}>
                            <Dashboard />
                        </PrivateRoute>
                    }
                >
                    <Route
                        path="change-password"
                        element={<ChangePassword />}
                    />
                    <Route path="manage-users" element={<UserManagement />} />
                    <Route path="manage-stores" element={<StoreManagement />} />
                    <Route path="manage-materials" element={<CentralMaterialsList />} />
                    <Route path="manage-stores/:storeId/materials" element={<StoreMaterialsList />} />
                    <Route path="manage-orders" element={<OrderManagement />} />
                </Route>

                <Route path="*" element={
                    isSetupRequired ?
                        <Navigate to="/setup" replace /> :
                        isAuthenticated ?
                            <Navigate to="/dashboard" replace /> :
                            <Navigate to="/login" replace />
                } />
            </Routes>
        </Router>
    );
};

export default App;