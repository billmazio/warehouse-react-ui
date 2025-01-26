import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllMaterialsPaginated, fetchSizes, deleteMaterial, editMaterial, fetchUserDetails, fetchStores } from "../../services/api";
import "./MaterialsList.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
    const [error, setError] = useState("");


    useEffect(() => {
        const loadUserDetails = async () => {
            try {
                const userDetails = await fetchUserDetails();
                const roles = userDetails.roles.map((role) => role.name);

                // Check and set the user's role
                if (roles.includes("SUPER_ADMIN")) {
                    setLoggedInUserRole("SUPER_ADMIN");
                } else if (roles.includes("LOCAL_ADMIN")) {
                    setLoggedInUserRole("LOCAL_ADMIN");
                } else {
                    console.error("Unrecognized role");
                }
            } catch (err) {
                console.error("Failed to fetch user details", err);
            }
        };
        loadUserDetails();
    }, []);


    const loadMaterials = useCallback(async () => {
        try {
            const response = await fetchAllMaterialsPaginated(currentPage, 5, filterText, filterSize);
            setMaterials(response.content || []);
            setTotalPages(response.totalPages || 0);
        } catch (err) {
            setError("Failed to fetch materials.");
            console.error(err);
        }
    }, [currentPage, filterText, filterSize]);

    const loadSizes = useCallback(async () => {
        try {
            const sizesData = await fetchSizes();
            setSizes(sizesData);
        } catch (err) {
            setError("Failed to fetch sizes.");
            console.error(err);
        }
    }, []);

    const loadStores = useCallback(async () => {
        try {
            const storesData = await fetchStores();
            setStores(storesData);
        } catch (err) {
            setError("Failed to fetch stores.");
            console.error(err);
        }
    }, []);

    useEffect(() => {
        loadMaterials();
        loadSizes();
        loadStores();
    }, [loadMaterials, loadSizes, loadStores]);


    const handleEditClick = (material) => {
        if (loggedInUserRole !== "SUPER_ADMIN") {
            toast.error("Δεν έχετε δικαίωμα να επεξεργαστείτε προϊόντα.");
            return;
        }
        setEditingMaterial(material);
        setEditFormData({
            text: material.text,
            sizeId: material.sizeId,
            quantity: material.quantity,
        });
    };

    const handleSaveEdit = async () => {
        if (loggedInUserRole !== "SUPER_ADMIN") {
            toast.error("Δεν έχετε δικαίωμα να αποθηκεύσετε αλλαγές.");
            return;
        }
        try {
            await editMaterial(editingMaterial.id, editFormData);
            setEditingMaterial(null);
            loadMaterials();
            toast.success("Το προϊόν ενημερώθηκε επιτυχώς!");
        } catch (err) {
            console.error("Αποτυχία ενημέρωσης προϊόντος", err);
            toast.error("Αποτυχία ενημέρωσης προϊόντος.");
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
        if (loggedInUserRole !== "SUPER_ADMIN") {
            toast.error("Δεν έχετε δικαίωμα να διαγράψετε προϊόντα.");
            return;
        }
        try {
            await deleteMaterial(materialToDelete.id);
            setMaterials(materials.filter((m) => m.id !== materialToDelete.id));
            toast.success("Το προϊόν διαγράφηκε επιτυχώς!");
        } catch (err) {
            console.error("Αποτυχία διαγραφής προϊόντος", err);
            toast.error("Αποτυχία διαγραφής προϊόντος.");
        } finally {
            closeConfirmationDialog();
        }
    };

    const getStoreTitle = (storeId) => {
        const store = stores.find(store => store.id === storeId);
        return store ? store.title : '';
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
                <button className="create-button" onClick={loadMaterials}>
                    Φιλτράρισμα
                </button>
            </div>

            {/* Materials Table */}
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
                            <td>{getStoreTitle(material.storeId)}</td> {/* Get store title instead of ID */}

                            <td>

                                    <>
                                        <button
                                            className="view-button"
                                            onClick={() => handleEditClick(material)}
                                        >
                                            Επεξεργασία
                                        </button>
                                        <button
                                            className="delete-button"
                                            onClick={() => openConfirmationDialog(material)}
                                        >
                                            Διαγραφή
                                        </button>
                                    </>

                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="4">Δεν υπάρχουν διαθέσιμα προϊόντα.</td>
                    </tr>
                )}
                </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="pagination">
                <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                    disabled={currentPage === 0}
                    className="pagination-button"
                >
                    Προηγούμενη
                </button>
                <span>
        Σελίδα {currentPage + 1} από {totalPages}
    </span>
                <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="pagination-button"
                >
                    Επόμενη
                </button>
            </div>


            {/* Edit Modal */}
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
                    {/* Centered Buttons */}
                    <div className="button-group">
                        <button
                            className="materials-cancel-button"
                            onClick={() => setEditingMaterial(null)}
                        >
                            Ακύρωση
                        </button>
                        <button
                            className="materials-confirm-button"
                            onClick={handleSaveEdit}
                        >
                            Αποθήκευση
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showConfirmation && (
                <div className="confirmation-dialog">
                    <div className="confirmation-content">
                        <p>
                            Είστε σίγουροι ότι θέλετε να διαγράψετε το προϊόν{" "}
                            <strong>{materialToDelete?.text}</strong>;
                        </p>
                        {/* Centered Buttons */}
                        <div className="materials-button-group">
                            <button
                                className="materials-cancel-button"
                                onClick={closeConfirmationDialog}
                            >
                                Ακύρωση
                            </button>
                            <button
                                className="materials-confirm-button"
                                onClick={confirmDelete}
                            >
                                Επιβεβαίωση
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CentralMaterialsList;
