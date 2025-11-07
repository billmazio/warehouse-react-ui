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
} from "../../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./StoreManagement.css";
import { storeErrorToGreek } from "../../utils/storeErrors";

const logStoreData = (store, operation) => {
    console.log(`${operation} Store Data:`, JSON.stringify(store, null, 2));
};

const StoreStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",

    fromLegacyEnable: (enable) => {
        return Number(enable) === 1 ? "ACTIVE" : "INACTIVE";
    },

    toGreekText: (status) => {
        switch (status) {
            case "ACTIVE": return "ΕΝΕΡΓΗ";
            case "INACTIVE": return "ΑΝΕΝΕΡΓΗ";
            default: return "Άγνωστη Κατάσταση";
        }
    },

    isActive: (status) => {
        return status === "ACTIVE";
    }
};

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

    // Enhanced getStatusClassName function - similar to OrderManagement
    const getStatusClassName = (status) => {
        if (typeof status === 'number') {
            // Handle legacy status
            status = status === 1 ? "ACTIVE" : "INACTIVE";
        }

        switch (status) {
            case "ACTIVE": return "status-active";
            case "INACTIVE": return "status-inactive";
            default: return "";
        }
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

        // Check if the new title already exists (excluding the current store being edited)
        const existingStore = stores.find(store =>
            store.id !== editingStore.id &&
            store.title.toLowerCase() === editFormData.title.trim().toLowerCase()
        );

        if (existingStore) {
            toast.error(`Αποθήκη με το όνομα "${editFormData.title}" υπάρχει ήδη. Παρακαλώ επιλέξτε διαφορετικό όνομα.`);
            return;
        }
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

    const handleCreate = async () => {
        if (!newStore.title.trim() || !newStore.address.trim()) {
            toast.warning("Ο Τίτλος και η Διεύθυνση είναι απαραίτητα.");
            return;
        }

        const existingStore = stores.find(store =>
            store.title.toLowerCase() === newStore.title.trim().toLowerCase()
        );

        if (existingStore) {
            toast.error(`Αποθήκη με το όνομα "${newStore.title}" υπάρχει ήδη. Παρακαλώ επιλέξτε διαφορετικό όνομα.`);
            return;
        }

        try {
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
            toast.error("Αποτυχία μεταφοράς υλικού.");
        }
    };

    const isStoreActive = (store) => {
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
                        data-test="store-create-title"
                    />
                    <input
                        type="text"
                        placeholder="Εισάγετε διεύθυνση αποθήκης"
                        value={newStore.address}
                        onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                        data-test="store-create-address"
                    />
                    <label>
                        <select
                            value={newStore.status}
                            onChange={(e) => setNewStore({ ...newStore, status: e.target.value })}
                            data-test="store-create-status"
                        >
                            <option value="ACTIVE">Ενεργή</option>
                            <option value="INACTIVE">Ανενεργή</option>
                        </select>
                    </label>
                    <button className="create-button" onClick={handleCreate} data-test="create-store">
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
                            data-test="store-create-cancel"
                        >
                            Ακύρωση
                        </button>
                    </div>
                    <button className="distribution-button" onClick={() => setShowDistributionForm(true)} data-test="store-distribution-button">
                        Μεταφορά Υλικών
                    </button>
                </div>
            )}

            <table className="stores-table" data-test="stores-table">
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
                    <tr key={store.id} data-test="store-row">
                        <td>{store.title}</td>
                        <td>{store.address}</td>
                        <td className={getStatusClassName(store.status || (store.enable === 1 ? "ACTIVE" : "INACTIVE"))}>
                            {store.status ? StoreStatus.toGreekText(store.status) :
                                (store.enable === 1 ? "ΕΝΕΡΓΗ" : "ΑΝΕΝΕΡΓΗ")}
                        </td>
                        <td>
                            <div className="action-buttons">
                                {/* Edit (only SUPER_ADMIN) */}
                                <button
                                    className="edit-store-button"
                                    data-test="edit-button"
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
                                    data-test="delete-button"
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
                <div className="edit-modal-store" data-test="edit-store-modal">
                    <h3>Επεξεργασία Αποθήκης</h3>
                    <input
                        type="text"
                        placeholder="Τίτλος"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        data-test="edit-store-name"
                    />
                    <input
                        type="text"
                        placeholder="Διεύθυνση"
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                        data-test="edit-store-address"
                    />
                    <div className="status-select-container">
                        <select
                            value={editFormData.status}
                            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                            data-test="edit-store-status"
                        >
                            <option value="ACTIVE">Ενεργή</option>
                            <option value="INACTIVE">Ανενεργή</option>
                        </select>
                    </div>
                    <div className="edit-actions">
                        <button className="cancel-button" onClick={() => setEditingStore(null)} data-test="edit-store-cancel">
                            Ακύρωση
                        </button>
                        <button className="save-button" onClick={handleUpdateStore} data-test="edit-store-submit">
                            Αποθήκευση
                        </button>
                    </div>
                </div>
            )}

            {/* Distribution Form */}
            {showDistributionForm && (
                <div className="distribution-modal" data-test="distribution-modal">
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
                        data-test="distribution-source-store"
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
                        data-test="distribution-material"
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
                        data-test="distribution-target-store"
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
                        data-test="distribution-quantity"
                    />

                    <div className="button-container">
                        <button className="cancel-button" onClick={() => setShowDistributionForm(false)} data-test="distribution-cancel">
                            Ακύρωση
                        </button>
                        <button className="distribution-button" onClick={handleDistributeMaterial} data-test="distribution-submit">
                            Μεταφορά
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {showConfirmation && (
                <div className="confirmation-dialog" data-test="confirmation-dialog">
                    <div className="confirmation-content">
                        <p>
                            Είστε σίγουροι ότι θέλετε να διαγράψετε την αποθήκη{" "}
                            <strong>{storeToDelete?.title}</strong>;
                        </p>
                        <div className="store-button-group">
                            <button className="store-cancel-button" onClick={closeConfirmationDialog} data-test="confirm-cancel">
                                Ακύρωση
                            </button>
                            <button className="store-confirm-button" onClick={confirmDelete} data-test="confirm-delete">
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