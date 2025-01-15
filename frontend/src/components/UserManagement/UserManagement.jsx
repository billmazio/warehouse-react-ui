import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    fetchUsers,
    fetchUserDetails,
    createUser,
    deleteUser,
    fetchStores,
} from "../../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./UserManagement.css";

const UserManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [stores, setStores] = useState([]);
    const [loggedInUserRole, setLoggedInUserRole] = useState("");
    const [error, setError] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [newUser, setNewUser] = useState({
        username: "",
        password: "",
        role: "",
        enable: 1,
        storeId: "",
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [userData, loggedInUser, storeData] = await Promise.all([
                    fetchUsers(),
                    fetchUserDetails(),
                    fetchStores(),
                ]);

                setUsers(userData);
                setStores(storeData);
                const roles = loggedInUser.roles.map((role) => role.name);
                if (roles.includes("SUPER_ADMIN")) {
                    setLoggedInUserRole("SUPER_ADMIN");
                }
            } catch (err) {
                setError("Failed to fetch data.");
                console.error("Error:", err);
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
        if (!userToDelete) return;

        try {
            // Proceed with deletion
            await deleteUser(userToDelete.id);
            setUsers(users.filter((user) => user.id !== userToDelete.id));
            toast.success(`Ο χρήστης "${userToDelete.username}" διαγράφηκε επιτυχώς.`);
        } catch (err) {
            console.error("Error deleting user:", err);
            toast.error("Αποτυχία διαγραφής χρήστη.");
        }

        closeConfirmationDialog();
    };




    const handleCreate = async () => {
        if (loggedInUserRole !== "SUPER_ADMIN") {
            toast.warning("You are not authorized to create users.");
            return;
        }

        if (!newUser.username.trim() || !newUser.password.trim() || !newUser.storeId) {
            toast.warning("Το Όνομα Χρήστη, ο Κωδικός Πρόσβασης και η επιλογή Αποθήκης είναι απαραίτητα.");
            return;
        }

        try {
            const createdUser = await createUser(newUser);
            setUsers([...users, createdUser]);
            setNewUser({ username: "", password: "", role: "LOCAL_ADMIN", enable: 1, storeId: "" });
            toast.success("Ο χρήστης δημιουργήθηκε επιτυχώς.");
        } catch (err) {
            console.error("Error creating user:", err);
            toast.error("Το όνομα χρήστη υπάρχει ήδη. Παρακαλώ επιλέξτε διαφορετικό όνομα χρήστη.");
        }
    };

    return (
        <div className="user-management-container">
            <ToastContainer/>
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
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    />
                    <input
                        type="password"
                        placeholder="Εισάγετε κωδικό"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    />
                    <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({...newUser, role: e.target.value})}
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
                                setNewUser({...newUser, enable: e.target.checked ? 1 : 0})
                            }
                        />
                    </label>
                    <select
                        value={newUser.storeId}
                        onChange={(e) => setNewUser({...newUser, storeId: e.target.value})}
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
                        <td>
                            {(user.roles || []).map((role) => role.name).join(", ")} {/* Display roles */}
                        </td>
                        <td>{user.enable === 1 ? "Active" : "Inactive"}</td>
                        {/* Convert Integer to readable status */}
                        <td>{user.store?.title || "N/A"}</td>
                        <td>
                            {loggedInUserRole === "SUPER_ADMIN" &&
                                !user.roles.some((role) => role.name === "SUPER_ADMIN") && ( // Hide delete for SUPER_ADMIN
                                    <button
                                        className="delete-button"
                                        onClick={() => openConfirmationDialog(user)}
                                    >
                                        Διαγραφή
                                    </button>
                                )}
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
