import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    fetchAllMaterialsPaginated,
    fetchSizes,
    deleteMaterial,
    editMaterial,
    fetchUserDetails,
    fetchStores,
    fetchOrders // Add this import for checking existing orders
} from "../../services/api";
import "./MaterialsList.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddMaterialModal from "./AddMaterialModal";
import { materialErrorToGreek } from "../../utils/materialErrors";

const CentralMaterialsList = () => {
    const navigate = useNavigate();

    const [materials, setMaterials] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [stores, setStores] = useState([]);
    const [filterText, setFilterText] = useState("");
    const [filterSize, setFilterSize] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [editFormData, setEditFormData] = useState({ text: "", sizeId: "", quantity: "" });
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState(null);
    const [loggedInUserRole, setLoggedInUserRole] = useState("");
    const [userStoreId, setUserStoreId] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadUserDetails = async () => {
            try {
                const userDetails = await fetchUserDetails();
                const roles = (userDetails.roles || []).map((role) => role.name);
                if (roles.includes("SUPER_ADMIN")) setLoggedInUserRole("SUPER_ADMIN");
                else if (roles.includes("LOCAL_ADMIN")) {
                    setLoggedInUserRole("LOCAL_ADMIN");
                    if (userDetails.store?.id) setUserStoreId(userDetails.store.id);
                } else {
                    console.error("Unrecognized role");
                }
            } catch (err) {
                console.error("Failed to fetch user details", err);
                toast.error("Αποτυχία φόρτωσης στοιχείων χρήστη.");
            }
        };
        loadUserDetails();
    }, []);

    // Function to check if there are existing orders using this material with the current size
    const checkExistingOrders = async (materialId, currentSizeId, materialText) => {
        try {
            // Fetch all orders to check for conflicts
            const ordersResponse = await fetchOrders(0, 1000, null, null, "", ""); // Get many orders
            const orders = ordersResponse.content || [];

            // Find the current size name
            const currentSize = sizes.find(s => s.id === currentSizeId);
            const currentSizeName = currentSize ? currentSize.name : "";

            // Check for orders that use this material and size combination
            const conflictingOrders = orders.filter(order => {
                // Check if the order uses this material (by materialStoreId or material.id)
                const usesMaterial =
                    order.materialStoreId === materialId ||
                    order.material?.id === materialId ||
                    (order.material?.text === materialText && order.store?.title === getStoreTitle(editingMaterial?.storeId));

                // Check if the order uses the current size
                const usesCurrentSize =
                    order.size?.name === currentSizeName ||
                    order.sizeName === currentSizeName;

                return usesMaterial && usesCurrentSize;
            });

            return {
                hasConflicts: conflictingOrders.length > 0,
                conflictCount: conflictingOrders.length,
                conflictingOrders: conflictingOrders
            };
        } catch (err) {
            console.error("Error checking existing orders:", err);
            // If we can't check, assume there might be conflicts for safety
            return {
                hasConflicts: true,
                conflictCount: 0,
                conflictingOrders: []
            };
        }
    };

    const loadMaterials = useCallback(async () => {
        try {
            const response = await fetchAllMaterialsPaginated(currentPage, 5, filterText, filterSize);
            setMaterials(response.content || []);
            setTotalPages(response.totalPages || 0);
        } catch (err) {
            setError("Αποτυχία φόρτωσης προϊόντων.");
            console.error(err);
            toast.error(materialErrorToGreek(err, { op: "loadMaterials" }));
        }
    }, [currentPage, filterText, filterSize]);

    const loadSizes = useCallback(async () => {
        try {
            const sizesData = await fetchSizes();
            setSizes(sizesData);
        } catch (err) {
            setError("Αποτυχία φόρτωσης μεγεθών.");
            console.error(err);
            toast.error("Αποτυχία φόρτωσης μεγεθών.");
        }
    }, []);

    const loadStores = useCallback(async () => {
        try {
            const storesData = await fetchStores();
            setStores(storesData);
        } catch (err) {
            setError("Αποτυχία φόρτωσης αποθηκών.");
            console.error(err);
            toast.error("Αποτυχία φόρτωσης αποθηκών.");
        }
    }, []);

    useEffect(() => {
        loadMaterials();
        loadSizes();
        loadStores();
    }, [loadMaterials, loadSizes, loadStores]);

    const handleEditClick = (material) => {
        setEditingMaterial(material);
        setEditFormData({
            text: material.text,
            sizeId: material.sizeId,
            quantity: material.quantity
        });
    };

    const handleSaveEdit = async () => {
        // Basic validation
        const qty = Number(editFormData.quantity);
        if (!editFormData.text.trim()) {
            toast.error("Παρακαλώ συμπληρώστε την περιγραφή προϊόντος.");
            return;
        }
        if (!editFormData.sizeId) {
            toast.error("Παρακαλώ επιλέξτε μέγεθος.");
            return;
        }
        if (!qty || qty <= 0) {
            toast.error("Παρακαλώ συμπληρώστε έγκυρη ποσότητα.");
            return;
        }

        // Check if size is being changed
        const originalSizeId = editingMaterial.sizeId;
        const newSizeId = editFormData.sizeId;

        if (String(originalSizeId) !== String(newSizeId)) {
            // Size is being changed - check for existing orders
            toast.info("Έλεγχος υπαρχουσών παραγγελιών...", { autoClose: 2000 });

            const conflictCheck = await checkExistingOrders(
                editingMaterial.id,
                originalSizeId,
                editingMaterial.text
            );

            if (conflictCheck.hasConflicts) {
                const originalSize = sizes.find(s => s.id === originalSizeId);
                const newSize = sizes.find(s => s.id === newSizeId);

                toast.error(
                    `❌ Δεν μπορείτε να αλλάξετε το μέγεθος από "${originalSize?.name}" σε "${newSize?.name}" ` +
                    `γιατί υπάρχουν ${conflictCheck.conflictCount} παραγγελίες που χρησιμοποιούν αυτό το προϊόν με το τρέχον μέγεθος.\n\n` +
                    `💡 Προτάσεις:\n` +
                    `• Διαγράψτε πρώτα όλες τις παραγγελίες που χρησιμοποιούν αυτό το προϊόν\n` +
                    `• Ή δημιουργήστε νέο προϊόν με το νέο μέγεθος\n` +
                    `• Ή αλλάξτε μόνο την περιγραφή και την ποσότητα`,
                    {
                        autoClose: 8000,
                        style: { whiteSpace: 'pre-line' }
                    }
                );
                return;
            }
        }

        try {
            await editMaterial(editingMaterial.id, {
                text: editFormData.text.trim(),
                sizeId: editFormData.sizeId,
                quantity: qty
            });
            setEditingMaterial(null);
            loadMaterials();
            toast.success("Το προϊόν ενημερώθηκε επιτυχώς!");
        } catch (err) {
            console.error("Αποτυχία ενημέρωσης προϊόντος", err);
            const sizeName =
                sizes.find((s) => String(s.id) === String(editFormData.sizeId))?.name;
            toast.error(materialErrorToGreek(err, {
                op: "editMaterial",
                text: editFormData.text,
                sizeName
            }));
        }
    };

    const openConfirmationDialog = (material) => {
        setMaterialToDelete(material);
        setShowConfirmation(true);
    };

    const closeConfirmationDialog = () => {
        setShowConfirmation(false);
        setMaterialToDelete(null);
    };

    const confirmDelete = async () => {
        try {
            await deleteMaterial(materialToDelete.id);
            setMaterials((list) => list.filter((m) => m.id !== materialToDelete.id));
            toast.success("Το προϊόν διαγράφηκε επιτυχώς!");
        } catch (err) {
            console.error("Αποτυχία διαγραφής προϊόντος", err);
            toast.error(materialErrorToGreek(err, { op: "deleteMaterial" }));
        } finally {
            closeConfirmationDialog();
        }
    };

    const getStoreTitle = (storeId) => {
        const store = stores.find((s) => s.id === storeId);
        return store ? store.title : "";
    };

    return (
        <div className="materials-management-container">
            <ToastContainer />
            <button onClick={() => navigate("/dashboard")} className="back-button">
                Πίσω στην Κεντρική Διαχείριση
            </button>

            <h2>Διαχείριση Ενδυμάτων</h2>
            {error && <p className="error-message">{error}</p>}

            <div className="materials-create-form">
                <input
                    type="text"
                    placeholder="Φίλτρο ανά προϊόν"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />
                <select value={filterSize} onChange={(e) => setFilterSize(e.target.value)}>
                    <option value="">Φίλτρο ανά μέγεθος</option>
                    {sizes.map((size) => (
                        <option key={size.id} value={size.id}>
                            {size.name}
                        </option>
                    ))}
                </select>
                <button
                    className="create-button"
                    style={{ backgroundColor: "#28a745", marginLeft: "10px" }}
                    onClick={() => setShowAddModal(true)}
                >
                    Προσθήκη Νέου Ενδύματος
                </button>
            </div>

            <table className="materials-table">
                <thead>
                <tr>
                    <th>ΠΡΟΪΟΝ</th>
                    <th>ΜΕΓΕΘΟΣ</th>
                    <th>ΠΟΣΟΤΗΤΑ</th>
                    <th>ΑΠΟΘΗΚΗ</th>
                    <th>ΕΝΕΡΓΕΙΕΣ</th>
                </tr>
                </thead>
                <tbody>
                {materials.length > 0 ? (
                    materials.map((material) => (
                        <tr key={material.id}>
                            <td>{material.text}</td>
                            <td>{material.sizeName}</td>
                            <td>{material.quantity}</td>
                            <td>{getStoreTitle(material.storeId)}</td>
                            <td>
                                <>
                                    <button
                                        className="edit-button"
                                        title="Επεξεργασία"
                                        onClick={() => handleEditClick(material)}
                                    >
                                        <i className="fa fa-edit"></i> Επεξεργασία
                                    </button>
                                    <button
                                        className="delete-button"
                                        disabled={loggedInUserRole !== "SUPER_ADMIN"}
                                        title={
                                            loggedInUserRole !== "SUPER_ADMIN"
                                                ? "Μόνο ο Super Admin μπορεί να διαγράψει προιόντα"
                                                : "Διαγραφή"
                                        }
                                        onClick={() => openConfirmationDialog(material)}
                                    >
                                        <i className="fa fa-trash"></i> Διαγραφή
                                    </button>
                                </>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="5">Δεν υπάρχουν διαθέσιμα προϊόντα.</td>
                    </tr>
                )}
                </tbody>
            </table>

            <div className="pagination">
                <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                    disabled={currentPage === 0}
                    className="pagination-button"
                >
                    Προηγούμενη
                </button>
                <span>Σελίδα {currentPage + 1} από {totalPages}</span>
                <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="pagination-button"
                >
                    Επόμενη
                </button>
            </div>

            {editingMaterial && (
                <div className="edit-modal-materials">
                    <h3>Επεξεργασία Προϊόντος</h3>
                    <input
                        type="text"
                        placeholder="Προϊόν"
                        value={editFormData.text}
                        onChange={(e) => setEditFormData({ ...editFormData, text: e.target.value })}
                    />
                    <select
                        value={editFormData.sizeId}
                        onChange={(e) => setEditFormData({ ...editFormData, sizeId: e.target.value })}
                    >
                        <option value="">Επιλέξτε μέγεθος</option>
                        {sizes.map((size) => (
                            <option key={size.id} value={size.id}>
                                {size.name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="number"
                        placeholder="Ποσότητα"
                        value={editFormData.quantity}
                        onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                    />
                    <div className="button-group">
                        <button className="materials-cancel-button" onClick={() => setEditingMaterial(null)}>
                            Ακύρωση
                        </button>
                        <button className="materials-confirm-button" onClick={handleSaveEdit}>
                            Αποθήκευση
                        </button>
                    </div>
                </div>
            )}

            {showConfirmation && (
                <div className="confirmation-dialog">
                    <div className="confirmation-content">
                        <p>
                            Είστε σίγουροι ότι θέλετε να διαγράψετε το προϊόν{" "}
                            <strong>{materialToDelete?.text}</strong>;
                        </p>
                        <div className="materials-button-group">
                            <button className="materials-cancel-button" onClick={closeConfirmationDialog}>
                                Ακύρωση
                            </button>
                            <button className="materials-confirm-button" onClick={confirmDelete}>
                                Επιβεβαίωση
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AddMaterialModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                userRole={loggedInUserRole}
                userStoreId={userStoreId}
                onMaterialAdded={loadMaterials}
            />
        </div>
    );
};

export default CentralMaterialsList;