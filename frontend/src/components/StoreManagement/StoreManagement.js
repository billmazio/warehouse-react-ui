import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    fetchStores,
    fetchUserDetails,
    createStore,
    deleteStore,
    editStore,
    distributeMaterial,
    fetchMaterials,
    toggleStoreStatus as apiToggleStoreStatus,
} from "../../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./StoreManagement.css";
import { storeErrorToGreek } from "../../utils/storeErrors";

// For debugging API calls
const logStoreData = (store, operation) => {
    console.log(`${operation} Store Data:`, JSON.stringify(store, null, 2));
};

// Store Status enum to match backend
const StoreStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",

    // Convert from old enable value to enum value
    fromLegacyEnable: (enable) => {
        return Number(enable) === 1 ? "ACTIVE" : "INACTIVE";
    },

    // Convert from enum status to display text
    toGreekText: (status) => {
        switch (status) {
            case "ACTIVE": return "Ενεργή";
            case "INACTIVE": return "Ανενεργή";
            default: return "Άγνωστη Κατάσταση";
        }
    },

    // Check if store is active
    isActive: (status) => {
        return status === "ACTIVE";
    }
};

// CSS for status colors
const statusStyles = `
.status-active {
    background-color: #4caf50;
    color: white;
}
.status-inactive {
    background-color: #f44336;
    color: white;
}
`;

const StoreManagement = () => {
    const [stores, setStores] = useState([]);
    const [loggedInUserRole, setLoggedInUserRole] = useState("");
    const [error, setError] = useState("");
    const [editingStore, setEditingStore] = useState(null);
    const [editFormData, setEditFormData] = useState({
        title: "",
        address: "",
        status: "ACTIVE",
    });
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [storeToDelete, setStoreToDelete] = useState(null);
    const [newStore, setNewStore] = useState({
        title: "",
        address: "",
        status: "ACTIVE",
    });

    const [showDistributionForm, setShowDistributionForm] = useState(false);
    const [distributionData, setDistributionData] = useState({
        storeId: "",
        materialId: "",
        receiverStoreId: "",
        quantity: 0,
    });

    const [materials, setMaterials] = useState([]);
    const navigate = useNavigate();

    // Get CSS class name for status styling
    const getStatusClassName = (status) => {
        // If we have a defined status, use it
        if (status) {
            switch (status) {
                case "ACTIVE": return "status-active";
                case "INACTIVE": return "status-inactive";
                default: return "";
            }
        }

        // Otherwise, we need to determine the status class from the legacy enable property
        // This code should only run during the transition period
        return ""; // Fallback empty class if no valid status found
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [storeData, loggedInUser, materialsData] = await Promise.all([
                    fetchStores(),
                    fetchUserDetails(),
                    fetchMaterials(),
                ]);

                console.log("Fetched stores:", storeData);
                setStores(storeData);
                setMaterials(materialsData);

                const roles = (loggedInUser.roles || []).map((role) => role.name);
                if (roles.includes("SUPER_ADMIN")) setLoggedInUserRole("SUPER_ADMIN");
                else if (roles.includes("LOCAL_ADMIN")) setLoggedInUserRole("LOCAL_ADMIN");
            } catch (err) {
                setError("Αποτυχία φόρτωσης δεδομένων.");
                console.error("Error:", err);
                toast.error(storeErrorToGreek(err, { op: "loadStores" }));
            }
        };

        loadData();
    }, []);

    const openConfirmationDialog = (store) => {
        setStoreToDelete(store);
        setShowConfirmation(true);
    };

    const closeConfirmationDialog = () => {
        setShowConfirmation(false);
        setStoreToDelete(null);
    };

    const confirmDelete = async () => {
        try {
            await deleteStore(storeToDelete.id);
            setStores(stores.filter((s) => s.id !== storeToDelete.id));
            toast.success(`Η αποθήκη "${storeToDelete.title}" διαγράφηκε επιτυχώς.`);
        } catch (err) {
            console.error("Error deleting store:", err);
            toast.error(storeErrorToGreek(err, { op: "deleteStore" }));
        } finally {
            closeConfirmationDialog();
        }
    };

    const handleUpdateStore = async () => {
        if (!editingStore) return;

        try {
            // Log data for debugging
            logStoreData(editFormData, "Update");

            await editStore(editingStore.id, editFormData);
            setStores(stores.map((s) => (s.id === editingStore.id ? { ...s, ...editFormData } : s)));
            toast.success("Η αποθήκη ενημερώθηκε επιτυχώς!");
            setEditingStore(null);
        } catch (err) {
            console.error("edit store error:", err);
            toast.error(storeErrorToGreek(err, { op: "editStore" }));
        }
    };

    const handleToggleStoreStatus = async (store) => {
        // Get current status
        const currentStatus = store.status;
        const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

        // Convert to boolean for API function
        const isActive = newStatus === "ACTIVE";

        console.log(`Current status: ${currentStatus}, New status: ${newStatus}`);

        // Optimistic update
        setStores(list => list.map(s =>
            s.id === store.id ? { ...s, status: newStatus } : s
        ));

        try {
            console.log(`Toggling store ${store.id} status to ${newStatus}`);

            // Call the API function to toggle status
            const response = await apiToggleStoreStatus(store.id, isActive);
            console.log("Toggle response:", response);

            // Update store with response data if available
            if (response && response.status) {
                setStores(list => list.map(s =>
                    s.id === store.id ? { ...s, status: response.status } : s
                ));
            }

            toast.success(
                `Η αποθήκη "${store.title}" ${isActive ? "ενεργοποιήθηκε" : "απενεργοποιήθηκε"} επιτυχώς.`
            );
        } catch (err) {
            // Rollback on error
            setStores(list => list.map(s =>
                s.id === store.id ? { ...s, status: currentStatus } : s
            ));
            console.error("Store toggle error:", err);
            if (err.response) {
                console.error("Error response:", err.response.data);
            }
            toast.error(storeErrorToGreek(err));
        }
    };

    const handleCreate = async () => {
        if (!newStore.title.trim() || !newStore.address.trim()) {
            toast.warning("Ο Τίτλος και η Διεύθυνση είναι απαραίτητα.");
            return;
        }

        try {
            // Log data for debugging
            logStoreData(newStore, "Create");

            const createdStore = await createStore(newStore);
            setStores([...stores, createdStore]);
            setNewStore({ title: "", address: "", status: "ACTIVE" });
            toast.success("Η αποθήκη δημιουργήθηκε επιτυχώς.");
        } catch (err) {
            console.error("create store error:", err);
            toast.error(storeErrorToGreek(err, { op: "createStore" }));
        }
    };

    const handleDistributeMaterial = async () => {
        try {
            if (
                !distributionData.storeId ||
                !distributionData.materialId ||
                !distributionData.receiverStoreId ||
                !distributionData.quantity
            ) {
                toast.error("Παρακαλώ συμπληρώστε όλα τα απαιτούμενα πεδία.");
                return;
            }

            const payload = {
                materialId: Number(distributionData.materialId),
                receiverStoreId: Number(distributionData.receiverStoreId),
                quantity: Number(distributionData.quantity),
            };

            await distributeMaterial(payload);
            toast.success("Το υλικό μεταφέρθηκε επιτυχώς!");
            setShowDistributionForm(false);
            setDistributionData({ storeId: "", materialId: "", receiverStoreId: "", quantity: 0 });
        } catch (err) {
            console.error("distribute material error:", err);
            // δεν είναι καθαρά "store" λάθη, αλλά δείξε ένα γενικό μήνυμα
            toast.error("Αποτυχία μεταφοράς υλικού.");
        }
    };

    // Helper function to check if a store is active
    const isStoreActive = (store) => {
        // Handle both new status enum and legacy enable property
        if (store.status) {
            return store.status === "ACTIVE";
        }
        return store.enable === 1;
    };

    return (
        <div className="store-management-container">
            <style>{statusStyles}</style>
            <ToastContainer />
            <button onClick={() => navigate("/dashboard")} className="back-button">
                Πίσω στην Κεντρική Διαχείριση
            </button>

            <h2>Διαχείριση Αποθηκών</h2>
            {error && <p className="error-message">{error}</p>}

            {loggedInUserRole === "SUPER_ADMIN" && (
                <div className="store-create-form">
                    <input
                        type="text"
                        placeholder="Εισάγετε τίτλο αποθήκης"
                        value={newStore.title}
                        onChange={(e) => setNewStore({ ...newStore, title: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Εισάγετε διεύθυνση αποθήκης"
                        value={newStore.address}
                        onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                    />
                    <label>
                        Κατάσταση:
                        <select
                            value={newStore.status}
                            onChange={(e) => setNewStore({ ...newStore, status: e.target.value })}
                        >
                            <option value="ACTIVE">Ενεργή</option>
                            <option value="INACTIVE">Ανενεργή</option>
                        </select>
                    </label>
                    <button className="create-button" onClick={handleCreate}>
                        Δημιουργία Αποθήκης
                    </button>
                    <div>
                        <button
                            className="cancel-button"
                            onClick={() =>
                                setNewStore({
                                    title: "",
                                    address: "",
                                    status: "ACTIVE",
                                })
                            }
                        >
                            Ακύρωση
                        </button>
                    </div>
                    <button className="distribution-button" onClick={() => setShowDistributionForm(true)}>
                        Μεταφορά Υλικών
                    </button>
                </div>
            )}

            <table className="stores-table">
                <thead>
                <tr>
                    <th>ΤΙΤΛΟΣ</th>
                    <th>ΔΙΕΥΘΥΝΣΗ</th>
                    <th>ΚΑΤΑΣΤΑΣΗ</th>
                    <th>ΕΝΕΡΓΕΙΕΣ</th>
                </tr>
                </thead>
                <tbody>
                {stores.map((store) => (
                    <tr key={store.id}>
                        <td>{store.title}</td>
                        <td>{store.address}</td>
                        <td>
                            <span className={`status-badge ${store.status ? getStatusClassName(store.status) : (store.enable === 1 ? "status-active" : "status-inactive")}`}>
                                {store.status ? StoreStatus.toGreekText(store.status) :
                                    (store.enable === 1 ? "Ενεργή" : "Ανενεργή")}
                            </span>
                        </td>
                        <td>
                            <div className="action-buttons">
                                {/* Toggle Status Button */}
                                <button
                                    className={`toggle-button ${isStoreActive(store) ? "deactivate" : "activate"}`}
                                    onClick={() => handleToggleStoreStatus(store)}
                                    disabled={loggedInUserRole !== "SUPER_ADMIN"}
                                    title={
                                        loggedInUserRole !== "SUPER_ADMIN"
                                            ? "Μόνο ο Super Admin μπορεί να αλλάξει την κατάσταση"
                                            : isStoreActive(store)
                                                ? "Απενεργοποίηση αποθήκης"
                                                : "Ενεργοποίηση αποθήκης"
                                    }
                                >
                                    {isStoreActive(store) ? (
                                        <>
                                            <i className="fa fa-toggle-on" /> Απενεργοποίηση
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa fa-toggle-off" /> Ενεργοποίηση
                                        </>
                                    )}
                                </button>

                                {/* Edit (only SUPER_ADMIN) */}
                                <button
                                    className="edit-button"
                                    disabled={loggedInUserRole !== "SUPER_ADMIN"}
                                    title={
                                        loggedInUserRole !== "SUPER_ADMIN"
                                            ? "Μόνο ο Super Admin μπορεί να επεξεργαστεί αποθήκες"
                                            : "Επεξεργασία"
                                    }
                                    onClick={() => {
                                        if (loggedInUserRole !== "SUPER_ADMIN") return;
                                        setEditingStore(store);
                                        setEditFormData({
                                            title: store.title,
                                            address: store.address,
                                            status: store.status || StoreStatus.fromLegacyEnable(store.enable),
                                        });
                                    }}
                                >
                                    <i className="fa fa-edit" /> Επεξεργασία
                                </button>

                                {/* View is disabled when the store is inactive */}
                                <button
                                    className="view-button"
                                    disabled={!isStoreActive(store)}
                                    title={!isStoreActive(store) ? "Η αποθήκη είναι ανενεργή" : "Προβολή"}
                                    onClick={() => {
                                        if (!isStoreActive(store)) return;
                                        navigate(`/dashboard/manage-stores/${store.id}/materials`);
                                    }}
                                >
                                    <i className="fa fa-eye" /> Προβολή
                                </button>

                                {/* Delete (only SUPER_ADMIN) */}
                                <button
                                    className="delete-button"
                                    disabled={loggedInUserRole !== "SUPER_ADMIN" || store.isSystemEntity}
                                    title={
                                        store.isSystemEntity
                                            ? "Αυτή η αποθήκη είναι προστατευμένη από το σύστημα"
                                            : loggedInUserRole !== "SUPER_ADMIN"
                                                ? "Μόνο ο Super Admin μπορεί να διαγράψει αποθήκες"
                                                : "Διαγραφή"
                                    }
                                    onClick={() => {
                                        if (loggedInUserRole !== "SUPER_ADMIN" || store.isSystemEntity) return;
                                        openConfirmationDialog(store);
                                    }}
                                >
                                    <i className="fa fa-trash" /> Διαγραφή
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Editing Store Modal */}
            {editingStore && (
                <div className="edit-modal-store">
                    <h3>Επεξεργασία Αποθήκης</h3>
                    <input
                        type="text"
                        placeholder="Τίτλος"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Διεύθυνση"
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    />
                    <div className="status-select-container">
                        <label>Κατάσταση:</label>
                        <select
                            value={editFormData.status}
                            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        >
                            <option value="ACTIVE">Ενεργή</option>
                            <option value="INACTIVE">Ανενεργή</option>
                        </select>
                    </div>
                    <div className="edit-actions">
                        <button className="cancel-button" onClick={() => setEditingStore(null)}>
                            Ακύρωση
                        </button>
                        <button className="save-button" onClick={handleUpdateStore}>
                            Αποθήκευση
                        </button>
                    </div>
                </div>
            )}

            {/* Distribution Form */}
            {showDistributionForm && (
                <div className="distribution-modal">
                    <h3>Μεταφορά Υλικού</h3>

                    {/* First Dropdown: Select Store */}
                    <select
                        value={distributionData.storeId}
                        onChange={(e) => {
                            const selectedStoreId = e.target.value;
                            setDistributionData({
                                ...distributionData,
                                storeId: selectedStoreId,
                                materialId: "", // Reset material selection when store changes
                            });
                        }}
                    >
                        <option value="">Επιλέξτε Αποθήκη Προέλευσης</option>
                        {stores
                            .filter(store => isStoreActive(store)) // Only show active stores
                            .map((store) => (
                                <option key={store.id} value={store.id}>
                                    {store.title}
                                </option>
                            ))}
                    </select>

                    {/* Second Dropdown: Select Material (Filtered by Selected Store) */}
                    <select
                        value={distributionData.materialId}
                        onChange={(e) => setDistributionData({ ...distributionData, materialId: e.target.value })}
                        disabled={!distributionData.storeId}
                    >
                        <option value="">Επιλέξτε Υλικό</option>
                        {materials
                            .filter((m) => m.storeId === Number(distributionData.storeId))
                            .map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.text} - Μέγεθος: {m.sizeName}
                                </option>
                            ))}
                    </select>

                    {/* Third Dropdown: Select Receiver Store */}
                    <select
                        value={distributionData.receiverStoreId}
                        onChange={(e) => setDistributionData({ ...distributionData, receiverStoreId: e.target.value })}
                    >
                        <option value="">Επιλέξτε Αποθήκη Προορισμού</option>
                        {stores
                            .filter(store => isStoreActive(store) && store.id !== Number(distributionData.storeId))
                            .map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.title}
                                </option>
                            ))}
                    </select>

                    {/* Input for Quantity */}
                    <input
                        type="number"
                        placeholder="Ποσότητα"
                        value={distributionData.quantity}
                        onChange={(e) => setDistributionData({ ...distributionData, quantity: e.target.value })}
                    />

                    <div className="button-container">
                        <button className="cancel-button" onClick={() => setShowDistributionForm(false)}>
                            Ακύρωση
                        </button>
                        <button className="distribution-button" onClick={handleDistributeMaterial}>
                            Μεταφορά
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {showConfirmation && (
                <div className="confirmation-dialog">
                    <div className="confirmation-content">
                        <p>
                            Είστε σίγουροι ότι θέλετε να διαγράψετε την αποθήκη{" "}
                            <strong>{storeToDelete?.title}</strong>;
                        </p>
                        <div className="store-button-group">
                            <button className="store-cancel-button" onClick={closeConfirmationDialog}>
                                Ακύρωση
                            </button>
                            <button className="store-confirm-button" onClick={confirmDelete}>
                                Επιβεβαίωση
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreManagement;