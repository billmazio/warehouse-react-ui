import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchMaterialsByStoreId, fetchSizes, fetchStoreDetails } from "../../services/api";
import "./MaterialsList.css";

const StoreMaterialsList = () => {
    const { storeId } = useParams();
    const navigate = useNavigate();

    const [storeTitle, setStoreTitle] = useState("");
    const [materials, setMaterials] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [filterText, setFilterText] = useState("");
    const [filterSize, setFilterSize] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState("");

    const loadStoreDetails = useCallback(async () => {
        try {
            const storeData = await fetchStoreDetails(storeId);
            setStoreTitle(storeData.title);
        } catch (err) {
            setError("Failed to fetch store details.");
            console.error(err);
        }
    }, [storeId]);

    const loadMaterials = useCallback(async () => {
        try {
            const response = await fetchMaterialsByStoreId(storeId, currentPage, 5, filterText, filterSize);
            setMaterials(response.content || []);
            setTotalPages(response.totalPages || 0);
        } catch (err) {
            setError("Failed to fetch materials.");
            console.error(err);
        }
    }, [storeId, currentPage, filterText, filterSize]);

    const loadSizes = useCallback(async () => {
        try {
            const sizesData = await fetchSizes();
            setSizes(sizesData);
        } catch (err) {
            setError("Failed to fetch sizes.");
            console.error(err);
        }
    }, []);

    useEffect(() => {
        loadStoreDetails();
        loadMaterials();
        loadSizes();
    }, [loadStoreDetails, loadMaterials, loadSizes]);

    const handleFilter = () => {
        setCurrentPage(0);
        loadMaterials();
    };

    return (
        <div className="materials-list-container">
            <button onClick={() => navigate("/dashboard/manage-stores")} className="back-button">
                Πίσω στις Αποθήκες
            </button>

            <h2>Ενδύματα: {storeTitle}</h2>
            {error && <p className="error-message">{error}</p>}

            {/* Filters */}
            <div className="store-filters">
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
            </div>

            {/* Materials */}
            {materials.length > 0 ? (
                <ul>
                    {materials.map((material) => (
                        <li key={material.id}>
                            <strong>{material.text}</strong> - Μέγεθος: {material.sizeName}, Ποσότητα: {material.quantity}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Δεν υπάρχουν ενδύματα για αυτήν την αποθήκη.</p>
            )}

            <div className="pagination">
                <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))} disabled={currentPage === 0}>
                    Προηγούμενη
                </button>
                <span>
                    Σελίδα {currentPage + 1} από {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                    disabled={currentPage >= totalPages - 1}
                >
                    Επόμενη
                </button>
            </div>
        </div>
    );
};

export default StoreMaterialsList;
