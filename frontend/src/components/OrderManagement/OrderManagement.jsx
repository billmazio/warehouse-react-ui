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

} from "../../services/api"; // Added editOrder and deleteOrder
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./OrderManagement.css";

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


            const userRoles = loggedInUser.roles.map((role) => role.name);
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
            toast.error("Αποτυχία φόρτωσης δεδομένων.");
        }
    };



    useEffect(() => {
        loadData(currentPage, pageSize);
    }, [currentPage, pageSize]);

    const handleCreate = async () => {
        const requiredFields = ["quantity", "dateOfOrder", "userName", "storeTitle", "materialText", "sizeName"];
        const missingFields = requiredFields.filter(field => !newOrder[field]);

        if (missingFields.length > 0) {
            const fieldTranslations = {
                quantity: "Ποσότητα",
                dateOfOrder: "Ημερομηνία Παραγγελίας",
                userName: "Χρήστης",
                storeTitle: "Αποθήκη",
                materialText: "Υλικό",
                sizeName: "Μέγεθος"
            };

            const translatedFields = missingFields.map(field => fieldTranslations[field]).join(", ");
            toast.warning(`Λείπουν απαιτούμενα πεδία: ${translatedFields}`);
            return;
        }

        try {
            const createdOrder = await createOrder(newOrder);
            setOrders([...orders, createdOrder]); // Use the returned order with updated stock and sold values
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
            toast.error("Αποτυχία δημιουργίας παραγγελίας.");
        }
    };


    const handleEdit = async () => {
        if (!editingOrder) return;

        try {
            const updatedOrder = await editOrder(editingOrder.id, newOrder); // Send updated data to the backend
            setOrders(orders.map(order => order.id === updatedOrder.id ? updatedOrder : order)); // Update order list
            toast.success("Η παραγγελία ενημερώθηκε με επιτυχία.");
            setEditingOrder(null); // Clear editing state
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
            toast.error("Αποτυχία ενημέρωσης παραγγελίας.");
        }
    };


    const handleEditButtonClick = (orderId) => {
        const orderToEdit = orders.find(order => order.id === orderId);
        if (orderToEdit) {
            setEditingOrder(orderToEdit); // Track the order being edited
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

    const [orderToDelete, setOrderToDelete] = useState(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

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
            setOrders(orders.filter((order) => order.id !== orderToDelete.id));
            toast.success(`Η παραγγελία με ID "${orderToDelete.id}" διαγράφηκε επιτυχώς.`);
        } catch (err) {
            console.error("Error deleting order:", err);
            toast.error(
                `Δεν μπορείτε να διαγράψετε την παραγγελία με ID "${orderToDelete.id}" επειδή περιέχει συνδεδεμένα δεδομένα.`
            );
        } finally {
            closeConfirmationDialog();
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
        }
    };

    const filteredMaterials = materials.filter(
        (material) => material.storeTitle === newOrder.storeTitle
    );


    const filteredSizes = sizes.filter(size => filteredMaterials.some(material => material.sizeId === size.id));

    const uniqueMaterials = filteredMaterials.reduce((acc, material) => {
        if (!acc.some((item) => item.text === material.text)) {
            acc.push(material);
        }
        return acc;
    }, []);

    return (
        <div className="order-management-container">
            <ToastContainer/>
            <button onClick={() => navigate("/dashboard")} className="back-button">
                Πίσω στην Κεντρική Διαχείριση
            </button>

            <h2>Δημιουργία Παραγγελίας</h2>
            <div className="order-create-form">
                <input
                    type="number"
                    placeholder="Ποσότητα"
                    value={newOrder.quantity || ""} // Show placeholder when quantity is 0 or empty
                    onChange={(e) => setNewOrder({
                        ...newOrder,
                        quantity: e.target.value ? parseInt(e.target.value) : 0
                    })}
                />

                <input
                    type="date"
                    placeholder="Ημερομηνία Παραγγελίας"
                    value={newOrder.dateOfOrder}
                    onChange={(e) => setNewOrder({...newOrder, dateOfOrder: e.target.value})}
                />
                <select
                    value={newOrder.storeTitle}
                    onChange={(e) => setNewOrder({...newOrder, storeTitle: e.target.value})}
                >
                    <option value="" disabled>Επιλογή Αποθήκης</option>
                    {stores.map((store) => (
                        <option key={store.id} value={store.title}>
                            {store.title}
                        </option>
                    ))}
                </select>

                <select
                    value={newOrder.materialText}
                    onChange={(e) => {
                        const selectedMaterial = uniqueMaterials.find((material) => material.text === e.target.value);
                        setNewOrder({
                            ...newOrder,
                            materialText: e.target.value,
                            materialStoreId: selectedMaterial ? selectedMaterial.id : "",
                        });
                    }}
                >
                    <option value="" disabled>Επιλογή Υλικού</option>
                    {uniqueMaterials.map((material) => (
                        <option key={material.id} value={material.text}>
                            {material.text}
                        </option>
                    ))}
                </select>
                <select
                    value={newOrder.sizeName}
                    onChange={(e) => setNewOrder({...newOrder, sizeName: e.target.value})}
                >
                    <option value="" disabled>Επιλογή Μεγέθους</option>
                    {filteredSizes.map((size) => (
                        <option key={size.id} value={size.name}>
                            {size.name}
                        </option>
                    ))}
                </select>
                <select
                    value={newOrder.userName}
                    onChange={(e) => setNewOrder({...newOrder, userName: e.target.value})}
                >
                    <option value="" disabled>Επιλογή Χρήστη</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.username}>
                            {user.username}
                        </option>
                    ))}
                </select>
                <select
                    value={newOrder.status}
                    onChange={(e) => setNewOrder({...newOrder, status: e.target.value})}
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
                        <td>{order.status === 1 ? "Σε Εκκρεμότητα" : order.status === 2 ? "Ολοκληρωμένη" : "Ακυρωμένη"}</td>
                        <td>

                            <div className="order-action-buttons">
                                <button className="order-edit-button"
                                        onClick={() => handleEditButtonClick(order.id)}>Επεξεργασία
                                </button>
                                <button
                                    className="order-delete-button"
                                    onClick={() => openConfirmationDialog(order)}
                                >
                                    Διαγραφή
                                </button>

                                {isConfirmationOpen && (
                                    <div className="confirmation-dialog">
                                        <div className="confirmation-content">
                                            <p>Είστε σίγουροι ότι θέλετε να διαγράψετε το
                                                προϊόν <strong>{orderToDelete.materialText}</strong>;</p>
                                            <div className="order-button-group">
                                                <button className="order-cancel-button"
                                                        onClick={closeConfirmationDialog}>Ακύρωση
                                                </button>
                                                <button className="order-confirm-button"
                                                        onClick={confirmDelete}>Επιβεβαίωση
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            <div className="pagination-controls">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>
                    Προηγούμενη
                </button>
                <span>
                    Σελίδα {currentPage + 1} από {totalPages}
                </span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage + 1 === totalPages}>
                    Επόμενη
                </button>
            </div>

        </div>
    );
};

export default OrderManagement;
