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

const OrderManagement = () => {
    const navigate = useNavigate();
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [orders, setOrders] = useState([]);
    const [newOrder, setNewOrder] = useState({
        quantity: 0,
        dateOfOrder: "",
        status: 1,
        materialText: "",
        materialStoreId: "",
        sizeName: "",
        storeTitle: "",
        userName: "",
    });

    const [editingOrder, setEditingOrder] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 5;

    const [orderToDelete, setOrderToDelete] = useState(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

    const loadData = async (page = 0, size = 5) => {
        try {
            const [storeData, userData, materialData, sizeData, loggedInUser] =
                await Promise.all([fetchStores(), fetchUsers(), fetchMaterials(), fetchSizes(), fetchUserDetails()]);

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

    const requiredFields = ["quantity", "dateOfOrder", "userName", "storeTitle", "materialText", "sizeName"];

    const handleCreate = async () => {
        const missing = requiredFields.filter((f) => !newOrder[f]);
        if (missing.length > 0) {
            const t = {
                quantity: "Ποσότητα",
                dateOfOrder: "Ημερομηνία Παραγγελίας",
                userName: "Χρήστης",
                storeTitle: "Αποθήκη",
                materialText: "Υλικό",
                sizeName: "Μέγεθος",
            };
            toast.warning(`Λείπουν απαιτούμενα πεδία: ${missing.map((m) => t[m]).join(", ")}`);
            return;
        }

        try {
            const createdOrder = await createOrder(newOrder);
            setOrders((prev) => [...prev, createdOrder]);
            setNewOrder({
                quantity: 0,
                dateOfOrder: "",
                status: 1,
                materialText: "",
                materialStoreId: "",
                sizeName: "",
                storeTitle: "",
                userName: "",
            });
            toast.success("Η παραγγελία δημιουργήθηκε με επιτυχία.");
        } catch (err) {
            const ctx = {
                op: "createOrder",
                materialText: newOrder.materialText,
                sizeName: newOrder.sizeName,
                storeTitle: newOrder.storeTitle,
            };
            toast.error(orderErrorToGreek(err, ctx));
        }
    };

    const handleEdit = async () => {
        if (!editingOrder) return;

        try {
            const updatedOrder = await editOrder(editingOrder.id, newOrder);
            setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
            toast.success("Η παραγγελία ενημερώθηκε με επιτυχία.");
            setEditingOrder(null);
            setNewOrder({
                quantity: 0,
                dateOfOrder: "",
                status: 1,
                materialText: "",
                materialStoreId: "",
                sizeName: "",
                storeTitle: "",
                userName: "",
            });
        } catch (err) {
            const ctx = {
                op: "editOrder",
                materialText: newOrder.materialText,
                sizeName: newOrder.sizeName,
                storeTitle: newOrder.storeTitle,
            };
            toast.error(orderErrorToGreek(err, ctx));
        }
    };

    const handleEditButtonClick = (orderId) => {
        const orderToEdit = orders.find((order) => order.id === orderId);
        if (orderToEdit) {
            setEditingOrder(orderToEdit);
            setNewOrder({
                quantity: orderToEdit.quantity,
                dateOfOrder: orderToEdit.dateOfOrder,
                status: orderToEdit.status,
                materialText: orderToEdit.materialText,
                materialStoreId: orderToEdit.materialStoreId,
                sizeName: orderToEdit.sizeName,
                storeTitle: orderToEdit.storeTitle,
                userName: orderToEdit.userName,
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
    const filteredMaterials = materials.filter((m) => m.storeTitle === newOrder.storeTitle);
    const filteredSizes = sizes.filter((s) => filteredMaterials.some((m) => m.sizeId === s.id));
    const uniqueMaterials = filteredMaterials.reduce((acc, m) => {
        if (!acc.some((x) => x.text === m.text)) acc.push(m);
        return acc;
    }, []);

    return (
        <div className="order-management-container">
            <ToastContainer />
            <button onClick={() => navigate("/dashboard")} className="back-button">
                Πίσω στην Κεντρική Διαχείριση
            </button>

            <h2>Δημιουργία Παραγγελίας</h2>
            <div className="order-create-form">
                <input
                    type="number"
                    placeholder="Ποσότητα"
                    value={newOrder.quantity || ""} // show placeholder when 0
                    onChange={(e) =>
                        setNewOrder({
                            ...newOrder,
                            quantity: e.target.value ? parseInt(e.target.value, 10) : 0,
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
                    value={newOrder.storeTitle}
                    onChange={(e) => setNewOrder({ ...newOrder, storeTitle: e.target.value })}
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
                    value={newOrder.materialText}
                    onChange={(e) => {
                        const selectedMaterial = uniqueMaterials.find((m) => m.text === e.target.value);
                        setNewOrder({
                            ...newOrder,
                            materialText: e.target.value,
                            materialStoreId: selectedMaterial ? selectedMaterial.id : "",
                        });
                    }}
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
                    value={newOrder.sizeName}
                    onChange={(e) => setNewOrder({ ...newOrder, sizeName: e.target.value })}
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
                    value={newOrder.userName}
                    onChange={(e) => setNewOrder({ ...newOrder, userName: e.target.value })}
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
                    value={newOrder.status}
                    onChange={(e) => setNewOrder({ ...newOrder, status: Number(e.target.value) })}
                >
                    <option value={1}>Σε Εκκρεμότητα</option>
                    <option value={2}>Ολοκληρωμένη</option>
                    <option value={3}>Ακυρωμένη</option>
                </select>

                <button className="create-button" onClick={handleCreate} disabled={editingOrder !== null}>
                    Δημιουργία Παραγγελίας
                </button>

                {editingOrder && (
                    <button className="edit-button" onClick={handleEdit}>
                        Ενημέρωση Παραγγελίας
                    </button>
                )}

                <button
                    className="cancel-button"
                    onClick={() =>
                        setNewOrder({
                            quantity: 0,
                            dateOfOrder: "",
                            status: 1,
                            materialText: "",
                            materialStoreId: "",
                            sizeName: "",
                            storeTitle: "",
                            userName: "",
                        })
                    }
                >
                    Ακύρωση
                </button>
            </div>

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
                {orders.map((order) => (
                    <tr key={order.id}>
                        <td>{order.quantity}</td>
                        <td>{order.dateOfOrder}</td>
                        <td>{order.stock}</td>
                        <td>{order.materialText}</td>
                        <td>{order.sizeName}</td>
                        <td>{order.storeTitle}</td>
                        <td>{order.userName}</td>
                        <td>
                            {order.status === 1
                                ? "Σε Εκκρεμότητα"
                                : order.status === 2
                                    ? "Ολοκληρωμένη"
                                    : "Ακυρωμένη"}
                        </td>
                        <td>
                            <div className="order-action-buttons">
                                <button className="order-edit-button" onClick={() => handleEditButtonClick(order.id)}>
                                    <i className="fa fa-edit"></i> Επεξεργασία
                                </button>
                                <button className="order-delete-button" onClick={() => openConfirmationDialog(order)}>
                                    <i className="fa fa-trash"></i> Διαγραφή
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Single confirmation modal */}
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
