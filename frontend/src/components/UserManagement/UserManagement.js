import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    fetchUsers,
    createUser,
    deleteUser,
    fetchStores,
    fetchUserDetails,
    toggleUserStatus as apiToggleUserStatus,
} from "../../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./UserManagement.css";
import { userErrorToGreek } from "../../utils/userErrors";
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

// Define UserStatus for better code consistency
const UserStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",

    // Get display text for status
    toGreekText: (status) => {
        switch (status) {
            case "ACTIVE": return "ΕΝΕΡΓΟΣ";
            case "INACTIVE": return "ΑΝΕΝΕΡΓΟΣ";
            default: return "Άγνωστη Κατάσταση";
        }
    },

    // Get class name for styling
    getClassName: (status) => {
        switch (status) {
            case "ACTIVE": return "status-active";
            case "INACTIVE": return "status-inactive";
            default: return "";
        }
    },

    // Helper function to convert from old enable values
    fromEnable: (enable) => {
        return enable === 1 ? "ACTIVE" : "INACTIVE";
    }
};

// Enhanced status styles - full cell background like Order and Store Management
const statusStyles = `
.status-active {
    background-color: #4caf50 !important;
    color: black !important;
    font-weight: bold !important;
}
.status-inactive {
    background-color: #f44336 !important;
    color: black !important;
    font-weight: bold !important;
}
`;

const UserManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loggedInUserRole, setLoggedInUserRole] = useState("");
    const [stores, setStores] = useState([]);
    const [error, setError] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [newUser, setNewUser] = useState({
        username: "",
        password: "",
        role: "LOCAL_ADMIN",
        status: "ACTIVE", // Using status enum instead of enable
        storeId: "",
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [userData, userDetails, storeData] = await Promise.all([
                    fetchUsers(),
                    fetchUserDetails(),
                    fetchStores(),
                ]);

                console.log("Loaded users:", userData);
                setUsers(userData);
                setStores(storeData);

                const roles = (userDetails.roles || []).map((r) => r.name);
                if (roles.includes("SUPER_ADMIN")) setLoggedInUserRole("SUPER_ADMIN");
                else if (roles.includes("LOCAL_ADMIN")) setLoggedInUserRole("LOCAL_ADMIN");
                else setLoggedInUserRole("");
            } catch (err) {
                setError("Αποτυχία φόρτωσης δεδομένων.");
                console.error("Error:", err);
                toast.error(userErrorToGreek(err));
            }
        };

        loadData();
    }, []);

    const openConfirmationDialog = (user) => {
        setUserToDelete(user);
        setShowConfirmation(true);
    };

    const closeConfirmationDialog = () => {
        setShowConfirmation(false);
        setUserToDelete(null);
    };

    const confirmDelete = async () => {
        try {
            await deleteUser(userToDelete.id);
            setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
            toast.success(`Ο χρήστης "${userToDelete.username}" διαγράφηκε επιτυχώς.`);
        } catch (err) {
            console.error("Error deleting user:", err);
            toast.error(userErrorToGreek(err));
        } finally {
            closeConfirmationDialog();
        }
    };

    const handleToggleUserStatus = async (user) => {
        // Get current status, handling both new status enum and legacy enable
        const currentStatus = user.status || UserStatus.fromEnable(user.enable);
        const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        const isActive = newStatus === "ACTIVE";

        console.log(`Current status: ${currentStatus}, New status: ${newStatus}`);

        // Optimistic update
        setUsers(list => list.map(u =>
            u.id === user.id ? {...u, status: newStatus } : u
        ));

        try {
            console.log(`Toggling user ${user.id} status to ${newStatus}`);

            const response = await apiToggleUserStatus(user.id, isActive);
            console.log("Toggle response:", response);

            // Update with response data if available
            if (response && response.status) {
                setUsers(list => list.map(u =>
                    u.id === user.id ? { ...u, status: response.status } : u
                ));
            }

            toast.success(
                `Ο χρήστης "${user.username}" ${isActive ? "ενεργοποιήθηκε" : "απενεργοποιήθηκε"} επιτυχώς.`
            );
        } catch (err) {
            // Rollback on error
            setUsers(list => list.map(u =>
                u.id === user.id ? { ...u, status: currentStatus } : u
            ));
            console.error("User toggle error:", err);
            if (err.response) {
                console.error("Error response:", err.response.data);
            }
            toast.error(userErrorToGreek(err));
        }
    };

    const handleCreate = async () => {
        if (!newUser.username.trim() || !newUser.password.trim() || !newUser.storeId) {
            toast.warning("Το Όνομα Χρήστη, ο Κωδικός Πρόσβασης και η επιλογή Αποθήκης είναι απαραίτητα.");
            return;
        }

        if (newUser.password.length < 6) {
            toast.warning("Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.");
            return;
        }

        if (!PASSWORD_RULE.test(newUser.password)) {
            toast.warning(
                "Ο κωδικός πρέπει να έχει τουλάχιστον ένα κεφαλαίο, ένα μικρό, ένα ψηφίο και ένα ειδικό σύμβολο."
            );
            return;
        }

        try {
            console.log("Creating user with data:", {
                username: newUser.username,
                role: newUser.role,
                status: newUser.status,
                storeId: newUser.storeId
            });

            const createdUser = await createUser({
                username: newUser.username,
                password: newUser.password,
                role: (newUser.role || "LOCAL_ADMIN").toUpperCase(),
                status: newUser.status, // Use status enum instead of enable
                storeId: newUser.storeId,
            });

            setUsers((prev) => [...prev, createdUser]);

            setNewUser({
                username: "",
                password: "",
                role: "LOCAL_ADMIN",
                status: "ACTIVE", // Reset with status enum
                storeId: "",
            });

            toast.success("Ο χρήστης δημιουργήθηκε επιτυχώς.");
        } catch (err) {
            console.error("Error creating user:", err);
            toast.error(userErrorToGreek(err));
        }
    };

    // Helper function to get user status (handles both status enum and legacy enable)
    const getUserStatus = (user) => {
        if (user.status) {
            return user.status;
        }
        return user.enable === 1 ? "ACTIVE" : "INACTIVE";
    };

    // Helper function to check if user is active
    const isUserActive = (user) => {
        return getUserStatus(user) === "ACTIVE";
    };

    return (
        <div className="user-management-container">
            <style>{statusStyles}</style>
            <ToastContainer />
            <button onClick={() => navigate("/dashboard")} className="back-button">
                Πίσω στην Κεντρική Διαχείριση
            </button>

            <h2>Διαχείριση Χρηστών</h2>
            {error && <p className="error-message">{error}</p>}

            {loggedInUserRole === "SUPER_ADMIN" && (
                <div className="user-create-form">
                    <input
                        type="text"
                        placeholder="Εισάγετε όνομα χρήστη"
                        value={newUser.username}
                        onChange={(e) =>
                            setNewUser({ ...newUser, username: e.target.value })
                        }
                        required
                    />

                    <input
                        type="password"
                        placeholder="Εισάγετε κωδικό"
                        value={newUser.password}
                        minLength={6}
                        onChange={(e) =>
                            setNewUser({ ...newUser, password: e.target.value })
                        }
                        required
                    />

                    <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="LOCAL_ADMIN">Local Admin</option>
                    </select>

                    {/* Status selector dropdown instead of enable checkbox */}
                    <select
                        value={newUser.status}
                        onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                    >
                        <option value="ACTIVE">Ενεργός</option>
                        <option value="INACTIVE">Ανενεργός</option>
                    </select>

                    <select
                        value={newUser.storeId}
                        onChange={(e) => setNewUser({ ...newUser, storeId: e.target.value })}
                        required
                    >
                        <option value="" disabled>
                            Επιλογή Αποθήκης
                        </option>
                        {stores.map((store) => (
                            <option key={store.id} value={store.id}>
                                {store.title}
                            </option>
                        ))}
                    </select>

                    <button className="create-button" onClick={handleCreate}>
                        Δημιουργία χρήστη
                    </button>

                    <div>
                        <button
                            className="cancel-button"
                            onClick={() =>
                                setNewUser({
                                    username: "",
                                    password: "",
                                    role: "LOCAL_ADMIN",
                                    status: "ACTIVE", // Reset with status enum
                                    storeId: "",
                                })
                            }
                        >
                            Ακύρωση
                        </button>
                    </div>
                </div>
            )}

            <table className="user-table">
                <thead>
                <tr>
                    <th>ΟΝΟΜΑ ΧΡΗΣΤΗ</th>
                    <th>ΡΟΛΟΣ</th>
                    <th>ΚΑΤΑΣΤΑΣΗ</th>
                    <th>ΑΠΟΘΗΚΗ</th>
                    <th>ΕΝΕΡΓΕΙΕΣ</th>
                </tr>
                </thead>
                <tbody>
                {users.map((user) => (
                    <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{(user.roles || []).map((r) => r.name).join(", ")}</td>
                        <td className={UserStatus.getClassName(getUserStatus(user))}>
                            {UserStatus.toGreekText(getUserStatus(user))}
                        </td>
                        <td>{user.store?.title || "N/A"}</td>
                        <td>
                            <div className="action-buttons">
                                <button
                                    className={`toggle-button ${isUserActive(user) ? "deactivate" : "activate"}`}
                                    onClick={() => handleToggleUserStatus(user)}
                                    disabled={loggedInUserRole !== "SUPER_ADMIN"}
                                    title={
                                        loggedInUserRole !== "SUPER_ADMIN"
                                            ? "Μόνο ο Super Admin μπορεί να αλλάξει την κατάσταση"
                                            : isUserActive(user)
                                                ? "Απενεργοποίηση χρήστη"
                                                : "Ενεργοποίηση χρήστη"
                                    }
                                >
                                    {isUserActive(user) ? (
                                        <>
                                            <i className="fa fa-toggle-on" /> Απενεργοποίηση
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa fa-toggle-off" /> Ενεργοποίηση
                                        </>
                                    )}
                                </button>

                                <button
                                    className="delete-button"
                                    disabled={loggedInUserRole !== "SUPER_ADMIN" || user.isSystemEntity}
                                    title={
                                        user.isSystemEntity
                                            ? "Αυτός ο χρήστης είναι προστατευμένος από το σύστημα"
                                            : loggedInUserRole !== "SUPER_ADMIN"
                                                ? "Μόνο ο Super Admin μπορεί να διαγράψει χρήστες"
                                                : "Διαγραφή"
                                    }
                                    onClick={() => {
                                        if (loggedInUserRole !== "SUPER_ADMIN" || user.isSystemEntity) return;
                                        openConfirmationDialog(user);
                                    }}
                                >
                                    <i className="fa fa-trash"></i> Διαγραφή
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {showConfirmation && (
                <div className="confirmation-dialog">
                    <div className="confirmation-content">
                        <p>
                            Είστε σίγουροι ότι θέλετε να διαγράψετε τον χρήστη{" "}
                            <strong>{userToDelete?.username}</strong>;
                        </p>
                        <div className="user-button-group">
                            <button className="user-cancel-button" onClick={closeConfirmationDialog}>
                                Ακύρωση
                            </button>
                            <button className="user-confirm-button" onClick={confirmDelete}>
                                Επιβεβαίωση
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;