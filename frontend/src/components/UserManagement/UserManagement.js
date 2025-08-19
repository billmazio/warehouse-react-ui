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
        role: "LOCAL_ADMIN", // default so it's never empty
        enable: 1,
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
        const prev = user.enable;            // 0 ή 1
        const next = prev === 1 ? 0 : 1;     // flip

        // optimistic update
        setUsers(list => list.map(u => u.id === user.id ? { ...u, enable: next } : u));

        try {
            const updated = await apiToggleUserStatus(user.id, next === 1);

            // sync with server truth
            setUsers(list => list.map(u =>
                u.id === user.id ? { ...u, enable: updated.enable } : u
            ));

            toast.success(
                `Ο χρήστης "${user.username}" ${updated.enable === 1 ? "ενεργοποιήθηκε" : "απενεργοποιήθηκε"} επιτυχώς.`
            );
        } catch (err) {
            // rollback
            setUsers(list => list.map(u => u.id === user.id ? { ...u, enable: prev } : u));
            console.error("toggle error:", err?.response?.status, err?.response?.data);
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
            const createdUser = await createUser({
                username: newUser.username,
                password: newUser.password,
                role: (newUser.role || "LOCAL_ADMIN").toUpperCase(),
                enable: newUser.enable,
                storeId: newUser.storeId,
            });

            setUsers((prev) => [...prev, createdUser]);

            setNewUser({
                username: "",
                password: "",
                role: "LOCAL_ADMIN",
                enable: 1,
                storeId: "",
            });

            toast.success("Ο χρήστης δημιουργήθηκε επιτυχώς.");
        } catch (err) {
            console.error("Error creating user:", err);
            toast.error(userErrorToGreek(err));
        }
    };

    return (
        <div className="user-management-container">
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

                    <label>
                        Enable:
                        <input
                            type="checkbox"
                            checked={newUser.enable === 1}
                            onChange={(e) =>
                                setNewUser({ ...newUser, enable: e.target.checked ? 1 : 0 })
                            }
                        />
                    </label>

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
                                    enable: 1,
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
                        <td>
    <span className={`status-badge ${user.enable === 1 ? "active" : "inactive"}`}>
      {user.enable === 1 ? "Ενεργός" : "Ανενεργός"}
    </span>
                        </td>
                        <td>{user.store?.title || "N/A"}</td>
                        <td>
                            <div className="action-buttons">
                                <button
                                    className={`toggle-button ${user.enable === 1 ? "deactivate" : "activate"}`}
                                    onClick={() => handleToggleUserStatus(user)}
                                    disabled={loggedInUserRole !== "SUPER_ADMIN"}
                                    title={
                                        loggedInUserRole !== "SUPER_ADMIN"
                                            ? "Μόνο ο Super Admin μπορεί να αλλάξει την κατάσταση"
                                            : user.enable === 1
                                                ? "Απενεργοποίηση χρήστη"
                                                : "Ενεργοποίηση χρήστη"
                                    }
                                >
                                    {user.enable === 1 ? (
                                        <>
                                            <i className="fa fa-toggle-on" /> Απενεργοποίηση
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa fa-toggle-off" /> Ενεργοποίηση
                                        </>
                                    )}
                                </button>

                                <button className="delete-button"
                                        disabled={loggedInUserRole !== "SUPER_ADMIN"}
                                        title={
                                            loggedInUserRole !== "SUPER_ADMIN"
                                                ? "Μόνο ο Super Admin μπορεί να διαγράψει χρήστες"
                                                : "Διαγραφή"
                                        }
                                        onClick={() => openConfirmationDialog(user)}>
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
