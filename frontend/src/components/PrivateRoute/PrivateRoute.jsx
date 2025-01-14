import { jwtDecode } from "jwt-decode"; // Named import
import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" />;
    }

    try {
        const decodedToken = jwtDecode(token); // Decode the JWT
        const currentTime = Date.now() / 1000; // Get current time in seconds

        if (decodedToken.exp < currentTime) {
            // Token expired
            localStorage.removeItem("token");
            return <Navigate to="/login" />;
        }
    } catch (error) {
        console.error("Invalid Token:", error);
        localStorage.removeItem("token");
        return <Navigate to="/login" />;
    }

    return children;
};

export default PrivateRoute;
