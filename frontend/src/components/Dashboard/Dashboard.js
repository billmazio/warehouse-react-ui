import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { fetchDashboardData, fetchUserDetails, fetchStores } from "../../services/api";
import "./Dashboard.css";

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState({
        user: 0,
        materials: 0,
        sizes: 0,
        orders: 0,
        stores: 0,
    });
    const [userDetails, setUserDetails] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    const fetchData = useCallback(async () => {
        try {
            const [dashboardResponse, userResponse] = await Promise.all([
                fetchDashboardData(),
                fetchUserDetails(),
            ]);

            const storesData = await fetchStores();

            const activeStores = Array.isArray(storesData)
                ? storesData.filter(store =>
                    // Check for both status enum and legacy enable field
                    store.status === "ACTIVE" || store.enable === 1
                ).length
                : 0;

            console.log("Active stores count:", activeStores);
            console.log("Stores data:", storesData);

            setDashboardData({
                user: dashboardResponse.user || 0,
                materials: dashboardResponse.materials || 0,
                sizes: dashboardResponse.sizes || 0,
                orders: dashboardResponse.orders || 0,
                stores: activeStores, // Use active stores count
            });

            setUserDetails(userResponse);
            setError("");
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data. Please try again later.");
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (location.pathname === "/dashboard") {
            fetchData();
        }
    }, [location.pathname, fetchData]);

    useEffect(() => {
        const onRefresh = () => fetchData();
        window.addEventListener("dashboard:refresh", onRefresh);
        return () => window.removeEventListener("dashboard:refresh", onRefresh);
    }, [fetchData]);

    useEffect(() => {
        const onFocus = () => {
            if (location.pathname === "/dashboard") fetchData();
        };
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [location.pathname, fetchData]);

    const handleNavigation = (path) => navigate(path);

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="user-avatar">
                        <span>{userDetails?.username?.charAt(0).toUpperCase() || "U"}</span>
                    </div>
                    <div className="user-info">
                        <h4 className="username">{userDetails?.username || "User"}</h4>
                    </div>
                </div>
                <ul className="menu">
                    <li
                        className={location.pathname === "/dashboard" ? "active" : ""}
                        onClick={() => handleNavigation("/dashboard")}
                    >
                        <i className="fa fa-palette"></i> Αρχική
                    </li>
                    <li
                        className={
                            location.pathname === "/dashboard/manage-users" ? "active" : ""
                        }
                        onClick={() => handleNavigation("/dashboard/manage-users")}
                    >
                        <i className="fa fa-users"></i> Διαχείριση Χρηστών
                    </li>
                    <li
                        className={
                            location.pathname === "/dashboard/manage-stores" ? "active" : ""
                        }
                        onClick={() => handleNavigation("/dashboard/manage-stores")}
                    >
                        <i className="fa fa-warehouse"></i> Αποθήκες
                    </li>
                    <li
                        className={
                            location.pathname === "/dashboard/manage-materials" ? "active" : ""
                        }
                        onClick={() => handleNavigation("/dashboard/manage-materials")}
                    >
                        <i className="fa fa-tshirt"></i> Ενδύματα
                    </li>
                    <li
                        className={
                            location.pathname === "/dashboard/manage-orders" ? "active" : ""
                        }
                        onClick={() => handleNavigation("/dashboard/manage-orders")}
                    >
                        <i className="fa fa-shopping-cart"></i> Παραγγελίες
                    </li>
                    <li
                        className={
                            location.pathname === "/dashboard/change-password" ? "active" : ""
                        }
                        onClick={() => handleNavigation("/dashboard/change-password")}
                    >
                        <i className="fa fa-lock"></i> Αλλαγή Κωδικού
                    </li>
                </ul>
            </aside>

            <main className="main-content">
                <header className="header"><button
                    className="logout-btn"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    Αποσύνδεση
                </button>
                </header>

                {error && <p className="error-message">{error}</p>}

                {location.pathname === "/dashboard" && (
                    <section className="dashboard-cards">
                        <div
                            className="card"
                            data-test="card-users"
                            onClick={() => handleNavigation("/dashboard/manage-users")}
                        >
                            <i className="fa fa-users card-icon"></i>
                            <h3>Διαχείριση Χρηστών</h3>
                            <p>Ενεργοί Χρήστες: {dashboardData.user}</p>
                        </div>
                        <div
                            className="card"
                            data-test="card-materials"
                            onClick={() => handleNavigation("/dashboard/manage-materials")}
                        >
                            <i className="fa fa-tshirt card-icon"></i>
                            <h3>Διαχείριση Ενδυμάτων</h3>
                            <p>Καταχωρημένα: {dashboardData.materials}</p>
                        </div>
                        <div
                            className="card"
                            data-test="card-orders"
                            onClick={() => handleNavigation("/dashboard/manage-orders")}
                        >
                            <i className="fa fa-shopping-cart card-icon"></i>
                            <h3>Παραγγελίες</h3>
                            <p>Συνολικές Παραγγελίες: {dashboardData.orders}</p>
                        </div>
                        <div
                            className="card"
                            data-test="card-stores"
                            onClick={() => handleNavigation("/dashboard/manage-stores")}
                        >
                            <i className="fa fa-warehouse card-icon"></i>
                            <h3>Διαχείριση Αποθηκών</h3>
                            <p>Ενεργές Αποθήκες: {dashboardData.stores}</p>
                        </div>
                    </section>
                )}

                <div className="content">
                    <Outlet />
                </div>

                <footer className="footer">
                    <p>&copy; 2024 Storage Management. All Rights Reserved.</p>
                </footer>
            </main>
        </div>
    );
};

export default Dashboard;