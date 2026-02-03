import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    createOrder,
    fetchUsers,
    fetchStores,
    fetchMaterials,
    fetchSizes,
    fetchOrders,
    editOrder,
    deleteOrder,
    fetchUserDetails,
} from "../../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./OrderManagement.css";
import { orderErrorToGreek } from "../../utils/orderErrors";

// For debugging API calls
const logOrderData = (order, operation) => {
    console.log(`${operation} Order Data:`, JSON.stringify(order, null, 2));
};

// CSS for status colors
const statusStyles = `
.status-pending {
  background-color: #ff9800 !important;
  color: black !important;
  font-weight: bold !important;
}
.status-processing {
  background-color: #2196f3 !important;
  color: black !important;
  font-weight: bold !important;
}
.status-completed {
  background-color: #4caf50 !important;
  color: black !important;
  font-weight: bold !important;
}
.status-cancelled {
  background-color: #f44336 !important;
  color: black !important;
  font-weight: bold !important;
}
`;

const OrderManagement = () => {
    const navigate = useNavigate();

    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [orders, setOrders] = useState([]);

    const [materialSizeWarnings, setMaterialSizeWarnings] = useState(new Set());

    const [newOrder, setNewOrder] = useState({
        quantity: 0,
        dateOfOrder: "",
        stock: "",
        orderStatus: "PENDING",

        // These fields remain for UI selection/filtering.
        user: { username: "" },
        store: { title: "" },
        material: { text: "" },
        size: { name: "" },

        // IMPORTANT: what backend needs now
        materialId: "",
    });

    const [editingOrder, setEditingOrder] = useState(null);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 5;

    const [orderToDelete, setOrderToDelete] = useState(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

    // OrderStatus helpers
    const OrderStatus = {
        PENDING: "PENDING",
        PROCESSING: "PROCESSING",
        COMPLETED: "COMPLETED",
        CANCELLED: "CANCELLED",

        fromGreekText: (text) => {
            switch (text) {
                case "ΕΚΚΡΕΜΕΙ":
                    return "PENDING";
                case "ΣΕ ΕΠΕΞΕΡΓΑΣΙΑ":
                    return "PROCESSING";
                case "ΟΛΟΚΛΗΡΩΜΕΝΗ":
                    return "COMPLETED";
                case "ΑΚΥΡΩΜΕΝΗ":
                    return "CANCELLED";
                default:
                    return "PENDING";
            }
        },

        toGreekText: (status) => {
            switch (status) {
                case "PENDING":
                    return "ΕΚΚΡΕΜΕΙ";
                case "PROCESSING":
                    return "ΣΕ ΕΠΕΞΕΡΓΑΣΙΑ";
                case "COMPLETED":
                    return "ΟΛΟΚΛΗΡΩΜΕΝΗ";
                case "CANCELLED":
                    return "ΑΚΥΡΩΜΕΝΗ";
                default:
                    return "Άγνωστη Κατάσταση";
            }
        },

        fromLegacyStatus: (statusNum) => {
            switch (Number(statusNum)) {
                case 1:
                    return "PENDING";
                case 2:
                    return "COMPLETED";
                case 3:
                    return "CANCELLED";
                default:
                    return "PENDING";
            }
        },
    };

    const getStatusClassName = (status) => {
        if (typeof status === "number") {
            status = OrderStatus.fromLegacyStatus(status);
        }

        switch (status) {
            case "PENDING":
                return "status-pending";
            case "PROCESSING":
                return "status-processing";
            case "COMPLETED":
                return "status-completed";
            case "CANCELLED":
                return "status-cancelled";
            default:
                return "";
        }
    };

    // Function to check if a material/size combination still exists
    const checkMaterialSizeExistence = async () => {
        try {
            const warningSet = new Set();

            for (const order of orders) {
                const materialText = order.material?.text || order.materialText;
                const sizeName = order.size?.name || order.sizeName;
                const storeTitle = order.store?.title || order.storeTitle;

                if (materialText && sizeName && storeTitle) {
                    const matchingMaterial = materials.find(
                        (material) =>
                            material.text === materialText &&
                            material.sizeName === sizeName &&
                            stores.find((store) => store.id === material.storeId)?.title === storeTitle
                    );

                    if (!matchingMaterial) {
                        warningSet.add(order.id);
                    }
                }
            }

            setMaterialSizeWarnings(warningSet);
        } catch (err) {
            console.error("Error checking material/size existence:", err);
        }
    };

    useEffect(() => {
        if (orders.length > 0 && materials.length > 0 && stores.length > 0) {
            checkMaterialSizeExistence();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders, materials, stores]);

    const getWarningMessage = (order) => {
        if (!materialSizeWarnings.has(order.id)) return null;

        const materialText = order.material?.text || order.materialText;
        const sizeName = order.size?.name || order.sizeName;

        return `⚠️ Προειδοποίηση: Το υλικό "${materialText}" με μέγεθος "${sizeName}" δεν υπάρχει πλέον στα διαθέσιμα προϊόντα. Αυτή η παραγγελία ενδέχεται να έχει ξεπερασμένες πληροφορίες.`;
    };

    const renderWarningSummary = () => {
        if (materialSizeWarnings.size === 0) return null;

        return (
            <div className="warning-summary">
                <div className="warning-banner">
                    <i className="fa fa-exclamation-triangle"></i>
                    <span>
            <strong>Προειδοποίηση:</strong> {materialSizeWarnings.size} παραγγελία(ες) αναφέρονται σε προϊόντα που δεν
            υπάρχουν πλέον στα διαθέσιμα υλικά. Ελέγξτε τις παραγγελίες με το σύμβολο ⚠️ για περισσότερες πληροφορίες.
          </span>
                </div>
            </div>
        );
    };

    const renderOrderRow = (order) => {
        const hasWarning = materialSizeWarnings.has(order.id);
        const warningMessage = getWarningMessage(order);

        const displayStatus =
            OrderStatus.toGreekText(order.orderStatus) ||
            (typeof order.status === "number"
                ? OrderStatus.toGreekText(OrderStatus.fromLegacyStatus(order.status))
                : "Άγνωστη Κατάσταση");

        return (
            <tr key={order.id} className={hasWarning ? "order-row-warning" : ""} data-test="order-row">
                <td>{order.quantity}</td>
                <td>{order.dateOfOrder}</td>
                <td>{order.stock}</td>
                <td>
                    <div className="material-cell">
                        {order.material?.text || order.materialText}
                        {hasWarning && (
                            <span className="warning-icon" title={warningMessage}>
                ⚠️
              </span>
                        )}
                    </div>
                </td>
                <td>
                    <div className="size-cell">
                        {order.size?.name || order.sizeName}
                        {hasWarning && (
                            <span className="warning-icon" title={warningMessage}>
                ⚠️
              </span>
                        )}
                    </div>
                </td>
                <td>{order.store?.title || order.storeTitle}</td>
                <td>{order.user?.username || order.userName}</td>
                <td className={getStatusClassName(order.orderStatus || order.status)}>{displayStatus}</td>
                <td>
                    <div className="order-action-buttons">
                        <button
                            className="order-edit-button"
                            data-test="edit-button"
                            title={hasWarning ? "Προσοχή: Αυτή η παραγγελία έχει ξεπερασμένες πληροφορίες" : "Επεξεργασία"}
                            onClick={() => handleEditButtonClick(order.id)}
                        >
                            <i className="fa fa-edit"></i> Επεξεργασία
                        </button>
                        <button
                            className="order-delete-button"
                            data-test="delete-button"
                            title="Διαγραφή"
                            onClick={() => openConfirmationDialog(order)}
                        >
                            <i className="fa fa-trash"></i> Διαγραφή
                        </button>
                    </div>
                </td>
            </tr>
        );
    };

    // Load data
    const loadData = async (page = 0, size = 5) => {
        try {
            const [storeData, userData, materialData, sizeData, loggedInUser] = await Promise.all([
                fetchStores(),
                fetchUsers(),
                fetchMaterials(),
                fetchSizes(),
                fetchUserDetails(),
            ]);

            setStores(storeData);
            setUsers(userData);
            setMaterials(materialData);
            setSizes(sizeData);

            const userRoles = (loggedInUser.roles || []).map((role) => role.name);

            if (userRoles.includes("SUPER_ADMIN")) {
                const orderData = await fetchOrders(page, size, null, null, "", "");
                setOrders(orderData.content || []);
                setTotalPages(orderData.totalPages || 0);
            } else if (userRoles.includes("LOCAL_ADMIN")) {
                const userStoreId = loggedInUser.store.id;
                const orderData = await fetchOrders(page, size, userStoreId, null, "", "");
                setOrders(orderData.content || []);
                setTotalPages(orderData.totalPages || 0);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error(orderErrorToGreek(err, { op: "load" }));
        }
    };

    useEffect(() => {
        loadData(currentPage, pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, pageSize]);

    const validateOrder = () => {
        if (!newOrder.quantity || newOrder.quantity <= 0) {
            toast.warning("Παρακαλώ εισάγετε έγκυρη ποσότητα");
            return false;
        }
        if (!newOrder.dateOfOrder) {
            toast.warning("Παρακαλώ επιλέξτε ημερομηνία παραγγελίας");
            return false;
        }

        // UI validation still uses these:
        if (!newOrder.store.title) {
            toast.warning("Παρακαλώ επιλέξτε αποθήκη");
            return false;
        }
        if (!newOrder.material.text) {
            toast.warning("Παρακαλώ επιλέξτε υλικό");
            return false;
        }
        if (!newOrder.size.name) {
            toast.warning("Παρακαλώ επιλέξτε μέγεθος");
            return false;
        }

        // IMPORTANT: backend requires materialId now
        if (!newOrder.materialId) {
            toast.warning("Παρακαλώ επιλέξτε υλικό (materialId)");
            return false;
        }

        // user is no longer required by backend if user is from auth,
        // but keep it if your UI needs it
        if (!newOrder.user.username) {
            toast.warning("Παρακαλώ επιλέξτε χρήστη");
            return false;
        }

        return true;
    };

    const handleCreate = async () => {
        if (!validateOrder()) return;

        const orderData = {
            quantity: newOrder.quantity,
            dateOfOrder: newOrder.dateOfOrder,
            orderStatus: newOrder.orderStatus,
            materialId: newOrder.materialId,
        };

        logOrderData(orderData, "Create");

        try {
            await createOrder(orderData);
            resetOrderForm();
            toast.success("Η παραγγελία δημιουργήθηκε με επιτυχία.");
            loadData(currentPage, pageSize);
        } catch (err) {
            console.error("API Error:", err);
            const ctx = {
                op: "createOrder",
                materialText: newOrder.material.text,
                sizeName: newOrder.size.name,
                storeTitle: newOrder.store.title,
            };
            toast.error(orderErrorToGreek(err, ctx));
        }
    };

    const resetOrderForm = () => {
        setNewOrder({
            quantity: 0,
            dateOfOrder: "",
            stock: "",
            orderStatus: "PENDING",
            user: { username: "" },
            store: { title: "" },
            material: { text: "" },
            size: { name: "" },
            materialId: "",
        });
        setEditingOrder(null);
    };

    const handleEdit = async () => {
        if (!editingOrder) return;
        if (!validateOrder()) return;

        const orderData = {
            quantity: newOrder.quantity,
            dateOfOrder: newOrder.dateOfOrder,
            orderStatus: newOrder.orderStatus,
            materialId: newOrder.materialId,
        };

        logOrderData(orderData, "Edit");

        try {
            const updatedOrder = await editOrder(editingOrder.id, orderData);
            setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
            toast.success("Η παραγγελία ενημερώθηκε με επιτυχία.");
            resetOrderForm();
            loadData(currentPage, pageSize);
        } catch (err) {
            console.error("API Edit Error:", err);
            const ctx = {
                op: "editOrder",
                materialText: newOrder.material.text,
                sizeName: newOrder.size.name,
                storeTitle: newOrder.store.title,
            };
            toast.error(orderErrorToGreek(err, ctx));
        }
    };

    const handleEditButtonClick = (orderId) => {
        const orderToEdit = orders.find((order) => order.id === orderId);
        if (!orderToEdit) return;

        setEditingOrder(orderToEdit);

        let orderStatus = orderToEdit.orderStatus;
        if (typeof orderToEdit.status === "number") {
            orderStatus = OrderStatus.fromLegacyStatus(orderToEdit.status);
        }

        setNewOrder({
            quantity: orderToEdit.quantity,
            dateOfOrder: orderToEdit.dateOfOrder,
            stock: orderToEdit.stock || "",
            orderStatus: orderStatus || "PENDING",
            user: { username: orderToEdit.user?.username || orderToEdit.userName || "" },
            store: { title: orderToEdit.store?.title || orderToEdit.storeTitle || "" },
            material: { text: orderToEdit.material?.text || orderToEdit.materialText || "" },
            size: { name: orderToEdit.size?.name || orderToEdit.sizeName || "" },

            // IMPORTANT: ensure edit form keeps the id
            materialId: orderToEdit.materialId || "",
        });
    };

    const openConfirmationDialog = (order) => {
        setOrderToDelete(order);
        setIsConfirmationOpen(true);
    };

    const closeConfirmationDialog = () => {
        setOrderToDelete(null);
        setIsConfirmationOpen(false);
    };

    const confirmDelete = async () => {
        try {
            await deleteOrder(orderToDelete.id);
            setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
            toast.success(`Η παραγγελία με ID "${orderToDelete.id}" διαγράφηκε επιτυχώς.`);
        } catch (err) {
            toast.error(orderErrorToGreek(err, { op: "deleteOrder" }));
        } finally {
            closeConfirmationDialog();
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) setCurrentPage(newPage);
    };

    // Derived lists for UI
    const filteredMaterials = materials.filter((m) => m.storeTitle === newOrder.store.title);
    const filteredSizes = sizes.filter((s) => filteredMaterials.some((m) => m.sizeId === s.id));
    const uniqueMaterials = filteredMaterials.reduce((acc, m) => {
        if (!acc.some((x) => x.text === m.text)) acc.push(m);
        return acc;
    }, []);

    return (
        <div className="order-management-container">
            <style>{statusStyles}</style>
            <ToastContainer />

            <button onClick={() => navigate("/dashboard")} className="back-button" data-test="back-to-dashboard">
                Πίσω στην Κεντρική Διαχείριση
            </button>

            <h2>{editingOrder ? "Επεξεργασία" : "Δημιουργία"} Παραγγελίας</h2>

            <div className="order-create-form" data-test="order-form">
                <input
                    type="number"
                    placeholder="Ποσότητα"
                    min={1}
                    value={newOrder.quantity || ""}
                    onChange={(e) =>
                        setNewOrder({
                            ...newOrder,
                            quantity: e.target.value === "" ? 0 : Math.max(1, parseInt(e.target.value, 10)),
                        })
                    }
                    data-test="order-quantity"
                />

                <input
                    type="date"
                    placeholder="Ημερομηνία Παραγγελίας"
                    value={newOrder.dateOfOrder}
                    onChange={(e) => setNewOrder({ ...newOrder, dateOfOrder: e.target.value })}
                    data-test="order-date"
                />

                <select
                    value={newOrder.store.title}
                    onChange={(e) =>
                        setNewOrder({
                            ...newOrder,
                            store: { title: e.target.value },
                            material: { text: "" },
                            size: { name: "" },
                            materialId: "", // IMPORTANT reset
                        })
                    }
                    data-test="order-store"
                >
                    <option value="" disabled>
                        Επιλογή Αποθήκης
                    </option>
                    {stores.map((store) => (
                        <option key={store.id} value={store.title}>
                            {store.title}
                        </option>
                    ))}
                </select>

                <select
                    value={newOrder.material.text}
                    onChange={(e) => {
                        const selectedMaterial = uniqueMaterials.find((m) => m.text === e.target.value);
                        setNewOrder({
                            ...newOrder,
                            material: { text: e.target.value },
                            materialId: selectedMaterial ? selectedMaterial.id : "",
                            size: { name: "" },
                        });
                    }}
                    disabled={!newOrder.store.title}
                    data-test="order-material"
                >
                    <option value="" disabled>
                        Επιλογή Υλικού
                    </option>
                    {uniqueMaterials.map((material) => (
                        <option key={material.id} value={material.text}>
                            {material.text}
                        </option>
                    ))}
                </select>

                <select
                    value={newOrder.size.name}
                    onChange={(e) => setNewOrder({ ...newOrder, size: { name: e.target.value } })}
                    disabled={!newOrder.material.text}
                    data-test="order-size"
                >
                    <option value="" disabled>
                        Επιλογή Μεγέθους
                    </option>
                    {filteredSizes.map((size) => (
                        <option key={size.id} value={size.name}>
                            {size.name}
                        </option>
                    ))}
                </select>

                <select
                    value={newOrder.user.username}
                    onChange={(e) => setNewOrder({ ...newOrder, user: { username: e.target.value } })}
                    data-test="order-user"
                >
                    <option value="" disabled>
                        Επιλογή Χρήστη
                    </option>
                    {users.map((user) => (
                        <option key={user.id} value={user.username}>
                            {user.username}
                        </option>
                    ))}
                </select>

                <select
                    value={newOrder.orderStatus}
                    onChange={(e) => setNewOrder({ ...newOrder, orderStatus: e.target.value })}
                    data-test="order-status"
                >
                    <option value="PENDING">ΕΚΚΡΕΜΕΙ</option>
                    <option value="PROCESSING">ΣΕ ΕΠΕΞΕΡΓΑΣΙΑ</option>
                    <option value="COMPLETED">ΟΛΟΚΛΗΡΩΜΕΝΗ</option>
                    <option value="CANCELLED">ΑΚΥΡΩΜΕΝΗ</option>
                </select>

                {!editingOrder ? (
                    <button className="create-button" onClick={handleCreate} data-test="create-order-button">
                        Δημιουργία Παραγγελίας
                    </button>
                ) : (
                    <button className="edit-button" onClick={handleEdit} data-test="update-order-button">
                        Ενημέρωση Παραγγελίας
                    </button>
                )}

                <button className="cancel-button" onClick={resetOrderForm} data-test="cancel-order-button">
                    Ακύρωση
                </button>
            </div>

            {renderWarningSummary()}

            <h2>Λίστα Παραγγελιών</h2>

            <table className="order-table" data-test="orders-table">
                <thead>
                <tr>
                    <th>ΠΟΣΟΤΗΤΑ</th>
                    <th>ΗΜΕΡΟΜΗΝΙΑ</th>
                    <th>ΑΠΟΘΕΜΑ</th>
                    <th>ΥΛΙΚΟ</th>
                    <th>ΜΕΓΕΘΟΣ</th>
                    <th>ΑΠΟΘΗΚΗ</th>
                    <th>ΧΡΗΣΤΗΣ</th>
                    <th>ΚΑΤΑΣΤΑΣΗ</th>
                    <th>ΕΝΕΡΓΕΙΕΣ</th>
                </tr>
                </thead>
                <tbody>{orders.map((order) => renderOrderRow(order))}</tbody>
            </table>

            {isConfirmationOpen && (
                <div className="confirmation-dialog" data-test="confirmation-dialog">
                    <div className="confirmation-content">
                        <p>
                            Είστε σίγουροι ότι θέλετε να διαγράψετε την παραγγελία <strong>#{orderToDelete?.id}</strong>;
                        </p>
                        <div className="order-button-group">
                            <button className="order-cancel-button" onClick={closeConfirmationDialog} data-test="confirm-cancel">
                                Ακύρωση
                            </button>
                            <button className="order-confirm-button" onClick={confirmDelete} data-test="confirm-delete">
                                Επιβεβαίωση
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="pagination-controls">
                <button data-test="pagination-prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>
                    Προηγούμενη
                </button>
                <span>
          Σελίδα {currentPage + 1} από {totalPages}
        </span>
                <button
                    data-test="pagination-next"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage + 1 === totalPages}
                >
                    Επόμενη
                </button>
            </div>
        </div>
    );
};

export default OrderManagement;
