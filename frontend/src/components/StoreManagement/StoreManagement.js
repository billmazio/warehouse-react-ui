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



const StoreManagement = () => {
    const [stores, setStores] = useState([]);
    const [loggedInUserRole, setLoggedInUserRole] = useState("");
    const [error, setError] = useState("");
    const [editingStore, setEditingStore] = useState(null);
    const [editFormData, setEditFormData] = useState({
        title: "",
        address: "",
        enable: 1,
    });
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [storeToDelete, setStoreToDelete] = useState(null);
    const [newStore, setNewStore] = useState({
        title: "",
        address: "",
        enable: 1,
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

    useEffect(() => {
        const loadData = async () => {
            try {
                const [storeData, loggedInUser, materialsData] = await Promise.all([
                    fetchStores(),
                    fetchUserDetails(),
                    fetchMaterials(),
                ]);
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
        const prev = store.enable;            // 0 or 1
        const next = prev === 1 ? 0 : 1;      // flip

        // optimistic update
        setStores(list => list.map(s => s.id === store.id ? { ...s, enable: next } : s));

        try {
            const updated = await apiToggleStoreStatus(store.id, next === 1);

            // sync with server truth
            setStores(list => list.map(s =>
                s.id === store.id ? { ...s, enable: updated.enable } : s
            ));

            toast.success(
                `Η αποθήκη "${store.title}" ${updated.enable === 1 ? "ενεργοποιήθηκε" : "απενεργοποιήθηκε"} επιτυχώς.`
            );
        } catch (err) {
            // rollback
            setStores(list => list.map(s => s.id === store.id ? { ...s, enable: prev } : s));
            console.error("store toggle error:", err?.response?.status, err?.response?.data);
            toast.error(storeErrorToGreek(err));
        }
    };

    const handleCreate = async () => {
        if (!newStore.title.trim() || !newStore.address.trim()) {
            toast.warning("Ο Τίτλος και η Διεύθυνση είναι απαραίτητα.");
            return;
        }

        try {
            const createdStore = await createStore(newStore);
            setStores([...stores, createdStore]);
            setNewStore({ title: "", address: "", enable: 1 });
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

    return (
        <div className="store-management-container">
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
                        Enable:
                        <input
                            type="checkbox"
                            checked={newStore.enable === 1}
                            onChange={(e) => setNewStore({ ...newStore, enable: e.target.checked ? 1 : 0 })}
                        />
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
                                    enable: 1,
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
                    <span className={`status-badge ${store.enable === 1 ? 'active' : 'inactive'}`}>
                        {store.enable === 1 ? "Ενεργή" : "Ανενεργή"}
                    </span>
                        </td>
                        <td>
                            <div className="action-buttons">
                                {/* Toggle Status Button */}
                                <button
                                    className={`toggle-button ${store.enable === 1 ? 'deactivate' : 'activate'}`}
                                    onClick={() => handleToggleStoreStatus(store)}
                                    title={store.enable === 1 ? 'Απενεργοποίηση αποθήκης' : 'Ενεργοποίηση αποθήκης'}
                                >
                                    {store.enable === 1 ? (
                                        <>
                                            <i className="fa fa-toggle-on"></i> Απενεργοποίηση
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa fa-toggle-off"></i> Ενεργοποίηση
                                        </>
                                    )}
                                </button>

                                {/* Edit Button */}
                                <button
                                    className="edit-button"
                                    onClick={() => {
                                        setEditingStore(store);
                                        setEditFormData({
                                            title: store.title,
                                            address: store.address,
                                            enable: store.enable,
                                        });
                                    }}
                                >
                                    <i className="fa fa-edit"></i> Επεξεργασία
                                </button>

                                {/* View Button */}
                                <button
                                    className="view-button"
                                    onClick={() => navigate(`/dashboard/manage-stores/${store.id}/materials`)}
                                >
                                    <i className="fa fa-eye"></i> Προβολή
                                </button>

                                {/* Delete Button */}
                                <button
                                    className="delete-button"
                                    onClick={() => openConfirmationDialog(store)}
                                >
                                    <i className="fa fa-trash"></i> Διαγραφή
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
                    <div className="checkbox-container">
                        <label>Enable:</label>
                        <input
                            type="checkbox"
                            checked={editFormData.enable === 1}
                            onChange={(e) =>
                                setEditFormData({
                                    ...editFormData,
                                    enable: e.target.checked ? 1 : 0,
                                })
                            }
                        />
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
                        {stores.map((store) => (
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
                            .filter((s) => s.id !== Number(distributionData.storeId))
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
