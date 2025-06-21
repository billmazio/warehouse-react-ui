import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Login from "./pages/Login/Login";
import Setup from "./pages/Setup/Setup"; // Import the new Setup component
import Dashboard from "./components/Dashboard/Dashboard";
import ChangePassword from "./pages/ChangePassword/ChangePassword";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute";
import UserManagement from "./components/UserManagement/UserManagement";
import StoreManagement from "./components/StoreManagement/StoreManagement";
import CentralMaterialsList from "./components/MaterialsList/CentralMaterialsList";
import StoreMaterialsList from "./components/MaterialsList/StoreMaterialsList";
import OrderManagement from "./components/OrderManagement/OrderManagement";

// Base URL from environment or default to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const App = () => {
    const [isSetupRequired, setIsSetupRequired] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSetupStatus = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/setup/status`);
                setIsSetupRequired(response.data.setupRequired);
                setIsLoading(false);
            } catch (err) {
                console.error('Failed to check setup status:', err);

                // Check if the error response indicates setup is required
                if (err.response &&
                    err.response.status === 403 &&
                    err.response.data &&
                    err.response.data.setupRequired) {
                    setIsSetupRequired(true);
                } else {
                    // Otherwise, assume setup is not required
                    setIsSetupRequired(false);
                }

                setIsLoading(false);
            }
        };

        checkSetupStatus();
    }, []);

    if (isLoading) {
        return <div className="loading">Loading application...</div>;
    }

    return (
        <Router>
            <Routes>
                {/* Root path redirects based on setup status */}
                <Route
                    path="/"
                    element={
                        isSetupRequired ?
                            <Navigate to="/setup" replace /> :
                            <Navigate to="/login" replace />
                    }
                />

                {/* Setup route */}
                <Route
                    path="/setup"
                    element={
                        isSetupRequired ?
                            <Setup /> :
                            <Navigate to="/login" replace />
                    }
                />

                <Route path="/login" element={<Login />} />
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                >
                    <Route
                        path="/dashboard/change-password"
                        element={
                            <PrivateRoute>
                                <ChangePassword />
                            </PrivateRoute>
                        }
                    />

                    <Route path="manage-users" element={<UserManagement />} />
                    <Route path="manage-stores" element={<StoreManagement />} />
                    <Route path="manage-materials" element={<CentralMaterialsList />} />
                    <Route path="manage-stores/:storeId/materials" element={<StoreMaterialsList />} />
                    <Route path="manage-orders" element={<OrderManagement />} />
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
};

export default App;