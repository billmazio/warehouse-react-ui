import React, { useState, useEffect } from "react";
import { fetchSizes, fetchStores, createMaterial } from "../../services/api";
import { toast } from "react-toastify";
import { materialErrorToGreek } from "../../utils/materialErrors";

const AddMaterialModal = ({ show, onClose, userRole, userStoreId, onMaterialAdded }) => {
    const [formData, setFormData] = useState({
        text: "",
        sizeId: "",
        quantity: "",
        storeId: userRole === "LOCAL_ADMIN" ? userStoreId : ""
    });
    const [sizes, setSizes] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            if (!show) return;

            setLoading(true);
            try {
                // Reset form when opening
                setFormData({
                    text: "",
                    sizeId: "",
                    quantity: "",
                    storeId: userRole === "LOCAL_ADMIN" ? userStoreId : ""
                });

                // Load sizes
                const sizesData = await fetchSizes();
                setSizes(sizesData || []);

                // Load stores (only for SUPER_ADMIN)
                if (userRole === "SUPER_ADMIN") {
                    const storesData = await fetchStores();
                    setStores(storesData || []);
                }
            } catch (err) {
                console.error("Failed to load modal data", err);
                setError("Παρουσιάστηκε σφάλμα κατά τη φόρτωση των δεδομένων.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [show, userRole, userStoreId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === "quantity" ? parseInt(value, 10) || "" : value
        });
    };

    const validateForm = () => {
        if (!formData.text.trim()) {
            toast.error("Παρακαλώ συμπληρώστε την περιγραφή του προϊόντος.");
            return false;
        }

        if (!formData.sizeId) {
            toast.error("Παρακαλώ επιλέξτε μέγεθος.");
            return false;
        }

        if (!formData.quantity || formData.quantity <= 0) {
            toast.error("Παρακαλώ συμπληρώστε έγκυρη ποσότητα.");
            return false;
        }

        if (!formData.storeId) {
            toast.error("Παρακαλώ επιλέξτε αποθήκη.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await createMaterial(formData);
            toast.success("Το προϊόν προστέθηκε επιτυχώς!");
            onMaterialAdded(); // Refresh materials list
            onClose(); // Close the modal
        } catch (err) {
            console.error("Error creating material:", err);
                 const sizeName =
                       (sizes || []).find((s) => String(s.id) === String(formData.sizeId))?.name;
                 const msg = materialErrorToGreek(err, {
                       op: "createMaterial",
                       text: formData.text?.trim(),
                   sizeName
                 });
                 toast.error(msg);

        }
    };

    if (!show) return null;

    return (
        <div className="edit-modal-store" data-test="add-store-modal">
            <h3 data-test="add-material-title">Προσθήκη Νέου Ενδύματος</h3>

            {error && <p className="error-message" data-test="add-material-error">{error}</p>}

            {loading ? (
                <p style={{ textAlign: "center" }} data-test="add-material-loading">Φόρτωση...</p>
            ) : (
                <>
                    <input
                        type="text"
                        name="text"
                        value={formData.text}
                        onChange={handleChange}
                        placeholder="Περιγραφή προϊόντος (π.χ. Μπλούζα Polo)"
                        required
                        autoFocus
                        data-test="add-material-text"
                    />

                    <select
                        name="sizeId"
                        value={formData.sizeId}
                        onChange={handleChange}
                        required
                        data-test="add-material-size"
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
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        placeholder="Ποσότητα"
                        min="1"
                        required
                        data-test="add-material-quantity"
                    />

                    {userRole === "SUPER_ADMIN" ? (
                        <select
                            name="storeId"
                            value={formData.storeId}
                            onChange={handleChange}
                            required
                            data-test="add-material-store"
                        >
                            <option value="">Επιλέξτε αποθήκη</option>
                            {stores.map((store) => (
                                <option key={store.id} value={store.id}>
                                    {store.title}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div style={{ padding: "10px", backgroundColor: "#e9e9e9", borderRadius: "4px" }}  data-test="add-material-store-readonly">
                            <strong>Αποθήκη:</strong>{" "}
                            {stores.find((s) => s.id === userStoreId)?.title || "Η αποθήκη σας"}
                            <input type="hidden" name="storeId" value={userStoreId || ""} />
                        </div>
                    )}

                    <div className="button-group">
                        <button type="button" className="cancel-button" onClick={onClose} data-test="add-material-cancel">

                            Ακύρωση
                        </button>
                        <button type="button" className="save-button" onClick={handleSubmit} data-test="add-material-submit">
                            Προσθήκη
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default AddMaterialModal;
