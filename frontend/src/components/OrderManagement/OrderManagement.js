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
    color: white !important;
    font-weight: bold !important;
}
.status-processing {
    background-color: #2196f3 !important;
    color: white !important;
    font-weight: bold !important;
}
.status-completed {
    background-color: #4caf50 !important;
    color: white !important;
    font-weight: bold !important;
}
.status-cancelled {
    background-color: #f44336 !important;
    color: white !important;
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
        stock:"",
        orderStatus: "PENDING",
        user: { username: "" },
        store: { title: "" },
        material: { text: "" },
        size: { name: "" },
        materialStoreId: "",
    });

    // Define OrderStatus enum to match backend
    const OrderStatus = {
        PENDING: "PENDING",
        PROCESSING: "PROCESSING",
        COMPLETED: "COMPLETED",
        CANCELLED: "CANCELLED",

        // Convert from display text to enum value
        fromGreekText: (text) => {
            switch (text) {
                case "ΕΚΚΡΕΜΕΙ": return "PENDING";
                case "ΣΕ ΕΠΕΞΕΡΓΑΣΙΑ": return "PROCESSING";
                case "ΟΛΟΚΛΗΡΩΜΕΝΗ": return "COMPLETED";
                case "ΑΚΥΡΩΜΕΝΗ": return "CANCELLED";
                default: return "PENDING";
            }
        },

        // Convert from enum value to display text (matching backend toString())
        toGreekText: (status) => {
            switch (status) {
                case "PENDING": return "ΕΚΚΡΕΜΕΙ";
                case "PROCESSING": return "ΣΕ ΕΠΕΞΕΡΓΑΣΙΑ";
                case "COMPLETED": return "ΟΛΟΚΛΗΡΩΜΕΝΗ";
                case "CANCELLED": return "ΑΚΥΡΩΜΕΝΗ";
                default: return "Άγνωστη Κατάσταση";
            }
        },

        // Convert from previous integer status to enum value
        fromLegacyStatus: (statusNum) => {
            switch (Number(statusNum)) {
                case 1: return "PENDING";
                case 2: return "COMPLETED";
                case 3: return "CANCELLED";
                default: return "PENDING";
            }
        },

        // Check if status is active (pending or processing)
        isActive: (status) => {
            return status === "PENDING" || status === "PROCESSING";
        },

        // Check if status is completed
        isCompleted: (status) => {
            return status === "COMPLETED";
        },

        // Check if status is cancelled
        isCancelled: (status) => {
            return status === "CANCELLED";
        }
    };

    // Get CSS class name for status styling
    const getStatusClassName = (status) => {
        if (typeof status === 'number') {
            // Handle legacy status
            status = OrderStatus.fromLegacyStatus(status);
        }

        switch (status) {
            case "PENDING": return "status-pending";
            case "PROCESSING": return "status-processing";
            case "COMPLETED": return "status-completed";
            case "CANCELLED": return "status-cancelled";
            default: return "";
        }
    };

    const [editingOrder, setEditingOrder] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 5;

    const [orderToDelete, setOrderToDelete] = useState(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

    // Function to check if a material/size combination still exists
    const checkMaterialSizeExistence = async () => {
        try {
            const warningSet = new Set();

            // Check each order for potential issues
            for (const order of orders) {
                const materialText = order.material?.text || order.materialText;
                const sizeName = order.size?.name || order.sizeName;
                const storeTitle = order.store?.title || order.storeTitle;

                if (materialText && sizeName && storeTitle) {
                    // Check if this material/size combination still exists in materials
                    const matchingMaterial = materials.find(material =>
                        material.text === materialText &&
                        material.sizeName === sizeName &&
                        stores.find(store => store.id === material.storeId)?.title === storeTitle
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

    // Run the check whenever orders, materials, or stores change
    useEffect(() => {
        if (orders.length > 0 && materials.length > 0 && stores.length > 0) {
            checkMaterialSizeExistence();
        }
    }, [orders, materials, stores]);

    // Function to get warning message for an order
    const getWarningMessage = (order) => {
        if (!materialSizeWarnings.has(order.id)) return null;

        const materialText = order.material?.text || order.materialText;
        const sizeName = order.size?.name || order.sizeName;

        return `⚠️ Προειδοποίηση: Το υλικό "${materialText}" με μέγεθος "${sizeName}" δεν υπάρχει πλέον στα διαθέσιμα προϊόντα. Αυτή η παραγγελία ενδέχεται να έχει ξεπερασμένες πληροφορίες.`;
    };

    // Add warning summary at the top of the table
    const renderWarningSummary = () => {
        if (materialSizeWarnings.size === 0) return null;

        return (
            <div className="warning-summary">
                <div className="warning-banner">
                    <i className="fa fa-exclamation-triangle"></i>
                    <span>
                        <strong>Προειδοποίηση:</strong> {materialSizeWarnings.size} παραγγελία(ες)
                        αναφέρονται σε προϊόντα που δεν υπάρχουν πλέον στα διαθέσιμα υλικά.
                        Ελέγξτε τις παραγγελίες με το σύμβολο ⚠️ για περισσότερες πληροφορίες.
                    </span>
                </div>
            </div>
        );
    };

    // Enhanced table row with warning indicator
    const renderOrderRow = (order) => {
        const hasWarning = materialSizeWarnings.has(order.id);
        const warningMessage = getWarningMessage(order);

        return (
            <tr key={order.id} className={hasWarning ? "order-row-warning" : ""}>
                <td>{order.quantity}</td>
                <td>{order.dateOfOrder}</td>
                <td>{order.stock}</td>
                <td>
                    <div className="material-cell">
                        {order.material?.text || order.materialText}
                        {hasWarning && (
                            <span
                                className="warning-icon"
                                title={warningMessage}
                            >
                                ⚠️
                            </span>
                        )}
                    </div>
                </td>
                <td>
                    <div className="size-cell">
                        {order.size?.name || order.sizeName}
                        {hasWarning && (
                            <span
                                className="warning-icon"
                                title={warningMessage}
                            >
                                ⚠️
                            </span>
                        )}
                    </div>
                </td>
                <td>{order.store?.title || order.storeTitle}</td>
                <td>{order.user?.username || order.userName}</td>
                <td className={getStatusClassName(order.orderStatus || order.status)}>
                    {OrderStatus.toGreekText(order.orderStatus) ||
                        (typeof order.status === 'number' ?
                            OrderStatus.toGreekText(OrderStatus.fromLegacyStatus(order.status)) :
                            "Άγνωστη Κατάσταση")}
                </td>
                <td>
                    <div className="order-action-buttons">
                        <button
                            className="order-edit-button"
                            title={hasWarning ? "Προσοχή: Αυτή η παραγγελία έχει ξεπερασμένες πληροφορίες" : "Επεξεργασία"}
                            onClick={() => handleEditButtonClick(order.id)}
                        >
                            <i className="fa fa-edit"></i> Επεξεργασία
                        </button>
                        <button
                            className="order-delete-button"
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

    // Load data for the component
    const loadData = async (page = 0, size = 5) => {
        try {
            const [storeData, userData, materialData, sizeData, loggedInUser] =
                await Promise.all([fetchStores(), fetchUsers(), fetchMaterials(), fetchSizes(), fetchUserDetails()]);

            setStores(storeData);
            setUsers(userData);
            setMaterials(materialData);
            setSizes(sizeData);

            console.log("Fetched data:", {
                stores: storeData,
                users: userData,
                materials: materialData,
                sizes: sizeData
            });

            const userRoles = (loggedInUser.roles || []).map((role) => role.name);
            if (userRoles.includes("SUPER_ADMIN")) {
                const orderData = await fetchOrders(page, size, null, null, "", "");
                console.log("Fetched orders:", orderData);
                setOrders(orderData.content || []);
                setTotalPages(orderData.totalPages || 0);
            } else if (userRoles.includes("LOCAL_ADMIN")) {
                const userStoreId = loggedInUser.store.id;
                const orderData = await fetchOrders(page, size, userStoreId, null, "", "");
                console.log("Fetched orders:", orderData);
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
        if (!newOrder.user.username) {
            toast.warning("Παρακαλώ επιλέξτε χρήστη");
            return false;
        }
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
        return true;
    };

    const handleCreate = async () => {
        if (!validateOrder()) return;

        // Prepare the order data for API
        const orderData = {
            quantity: newOrder.quantity,
            dateOfOrder: newOrder.dateOfOrder,
            orderStatus: newOrder.orderStatus,
            user: { username: newOrder.user.username },
            store: { title: newOrder.store.title },
            material: { text: newOrder.material.text },
            size: { name: newOrder.size.name },
            materialStoreId: newOrder.materialStoreId
        };

        // Log the data for debugging
        logOrderData(orderData, "Create");

        try {
            const createdOrder = await createOrder(orderData);
            setOrders((prev) => [...prev, createdOrder]);
            resetOrderForm();
            toast.success("Η παραγγελία δημιουργήθηκε με επιτυχία.");
            // Refresh the orders list to get the latest data
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
            orderStatus: "PENDING",
            user: { username: "" },
            store: { title: "" },
            material: { text: "" },
            size: { name: "" },
            materialStoreId: "",
        });
        setEditingOrder(null);
    };

    const handleEdit = async () => {
        if (!editingOrder) return;
        if (!validateOrder()) return;

        // Prepare the order data for API
        const orderData = {
            quantity: newOrder.quantity,
            dateOfOrder: newOrder.dateOfOrder,
            orderStatus: newOrder.orderStatus,
            user: { username: newOrder.user.username },
            store: { title: newOrder.store.title },
            material: { text: newOrder.material.text },
            size: { name: newOrder.size.name },
            materialStoreId: newOrder.materialStoreId
        };

        // Log the data for debugging
        logOrderData(orderData, "Edit");

        try {
            const updatedOrder = await editOrder(editingOrder.id, orderData);
            setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
            toast.success("Η παραγγελία ενημερώθηκε με επιτυχία.");
            resetOrderForm();
            // Refresh the orders list to get the latest data
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
        if (orderToEdit) {
            console.log("Editing order:", orderToEdit);
            setEditingOrder(orderToEdit);

            // Handle potential legacy integer status from existing orders
            let orderStatus = orderToEdit.orderStatus;
            if (typeof orderToEdit.status === 'number') {
                // Convert from old integer status to new enum status
                orderStatus = OrderStatus.fromLegacyStatus(orderToEdit.status);
            }

            // Handle both old and new data structures
            setNewOrder({
                quantity: orderToEdit.quantity,
                dateOfOrder: orderToEdit.dateOfOrder,
                orderStatus: orderStatus || "PENDING",
                user: {
                    username: orderToEdit.user?.username || orderToEdit.userName
                },
                store: {
                    title: orderToEdit.store?.title || orderToEdit.storeTitle
                },
                material: {
                    text: orderToEdit.material?.text || orderToEdit.materialText
                },
                size: {
                    name: orderToEdit.size?.name || orderToEdit.sizeName
                },
                materialStoreId: orderToEdit.materialStoreId,
            });
        }
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

    // Derived lists
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
            <button onClick={() => navigate("/dashboard")} className="back-button">
                Πίσω στην Κεντρική Διαχείριση
            </button>

            <h2>{editingOrder ? "Επεξεργασία" : "Δημιουργία"} Παραγγελίας</h2>
            <div className="order-create-form">
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
                />
                <input
                    type="date"
                    placeholder="Ημερομηνία Παραγγελίας"
                    value={newOrder.dateOfOrder}
                    onChange={(e) => setNewOrder({ ...newOrder, dateOfOrder: e.target.value })}
                />

                <select
                    value={newOrder.store.title}
                    onChange={(e) => setNewOrder({
                        ...newOrder,
                        store: { title: e.target.value },
                        material: { text: "" }, // Clear material when store changes
                        size: { name: "" } // Clear size when store changes
                    })}
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
                            materialStoreId: selectedMaterial ? selectedMaterial.id : "",
                            size: { name: "" } // Clear size when material changes
                        });
                    }}
                    disabled={!newOrder.store.title}
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
                    onChange={(e) => setNewOrder({
                        ...newOrder,
                        size: { name: e.target.value }
                    })}
                    disabled={!newOrder.material.text}
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
                    onChange={(e) => setNewOrder({
                        ...newOrder,
                        user: { username: e.target.value }
                    })}
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
                >
                    <option value="PENDING">ΕΚΚΡΕΜΕΙ</option>
                    <option value="PROCESSING">ΣΕ ΕΠΕΞΕΡΓΑΣΙΑ</option>
                    <option value="COMPLETED">ΟΛΟΚΛΗΡΩΜΕΝΗ</option>
                    <option value="CANCELLED">ΑΚΥΡΩΜΕΝΗ</option>
                </select>

                {!editingOrder ? (
                    <button className="create-button" onClick={handleCreate}>
                        Δημιουργία Παραγγελίας
                    </button>
                ) : (
                    <button className="edit-button" onClick={handleEdit}>
                        Ενημέρωση Παραγγελίας
                    </button>
                )}

                <button className="cancel-button" onClick={resetOrderForm}>
                    Ακύρωση
                </button>
            </div>

            {renderWarningSummary()}

            <h2>Λίστα Παραγγελιών</h2>
            <table className="order-table">
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
                <tbody>
                {orders.map((order) => renderOrderRow(order))}
                </tbody>
            </table>

            {/* Confirmation modal */}
            {isConfirmationOpen && (
                <div className="confirmation-dialog">
                    <div className="confirmation-content">
                        <p>
                            Είστε σίγουροι ότι θέλετε να διαγράψετε την παραγγελία{" "}
                            <strong>#{orderToDelete?.id}</strong>;
                        </p>
                        <div className="order-button-group">
                            <button className="order-cancel-button" onClick={closeConfirmationDialog}>
                                Ακύρωση
                            </button>
                            <button className="order-confirm-button" onClick={confirmDelete}>
                                Επιβεβαίωση
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="pagination-controls">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>
                    Προηγούμενη
                </button>
                <span>
                    Σελίδα {currentPage + 1} από {totalPages}
                </span>
                <button
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