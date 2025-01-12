import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute";
import UserManagement from "./components/UserManagement/UserManagement";
import StoreManagement from "./components/StoreManagement/StoreManagement";
import CentralMaterialsList from "./components/MaterialsList/CentralMaterialsList";
import StoreMaterialsList from "./components/MaterialsList/StoreMaterialsList";
import OrderManagement from "./components/OrderManagement/OrderManagement";  // Import the new component

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                >
                    <Route path="manage-users" element={<UserManagement />} />
                    <Route path="manage-stores" element={<StoreManagement />} />
                    <Route path="manage-materials" element={<CentralMaterialsList />} />
                    <Route path="manage-stores/:storeId/materials" element={<StoreMaterialsList />} />
                    <Route path="manage-orders" element={<OrderManagement />} />  {/* Add this route */}
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
};

export default App;
