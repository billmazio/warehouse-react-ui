import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    withCredentials: false
});


api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.warn("No token found in localStorage! Some requests may fail.");
        }
        return config; // Return the modified config
    },
    (error) => {
        console.error("Error in Axios request interceptor:", error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("Error in Axios response interceptor:", error.response || error.message);

        if (error.response?.status === 401) {
            console.warn("Unauthorized! Redirecting to login...");
            window.location.href = "/login"; //
        }

        if (error.response?.status === 403) {
            console.warn("Token expired or insufficient permissions.");
        }

        return Promise.reject(error);
    }
);

export const fetchUsers = async () => {
    try {
        const response = await api.get("/api/users");
        return response.data;
    } catch (err) {
        console.error("Error in fetchUsers:", err.response || err.message);
        throw err;
    }
};

export const deleteUser = async (userId) => {
    try {
        const response = await api.delete(`/api/users/${userId}`);
        return response.data;
    } catch (err) {
        console.error("Error in deleteUser:", err.response || err.message);
        throw err;
    }
};


export const createUser = async (userData) => {
    try {
        const response = await api.post("/api/users", {
            username: userData.username,
            password: userData.password,
            enable: userData.enable ? 1 : 0, // Convert boolean to integer for 'enable'
            store: { id: userData.storeId }, // Pass the store ID within a 'store' object
            roles: [{ name: userData.role }] // Pass roles
        });
        return response.data;
    } catch (err) {
        console.error("Error creating user:", err.response || err.message);
        throw err;
    }
};


export const fetchDashboardData = async () => {
    try {
        const response = await api.get("/api/dashboard");
        return response.data;
    } catch (err) {
        console.error("Error in fetchDashboardData:", err.response || err.message);
        throw err;
    }
};


export const fetchUserDetails = async () => {
    try {
        const response = await api.get("/api/users/details");
        return response.data;
    } catch (err) {
        console.error("Error in fetchUserDetails:", err.response || err.message);
        throw err;
    }
};

export const fetchStores = async () => {
    try {
        const response = await api.get("/api/stores"); // Use the correct endpoint
        return response.data;
    } catch (err) {
        console.error("Error fetching stores:", err.response || err.message);
        throw err;
    }
};

export const createStore = async (storeData) => {
    try {
        const response = await api.post("/api/stores", {
            title: storeData.title,
            address: storeData.address,
            enable: storeData.enable ? 1 : 0, // Convert boolean to integer for 'enable'

        });
        return response.data;
    } catch (err) {
        console.error("Error creating store:", err.response || err.message);
        throw err;
    }
};

export const editStore = async (id, updatedData) => {
    try {
        const response = await api.put(`/api/stores/${id}`, updatedData);
        return response.data;
    } catch (error) {
        console.error("Error updating store:", error.response || error.message);
        throw error;
    }
};


export const deleteStore = async (id) => {
    try {
        const response = await api.delete(`/api/stores/${id}`);
        return response.data;
    } catch (err) {
        console.error("Error in deleteStore:", err.response || err.message);
        throw err;
    }
};


export const fetchStoreDetails = async (storeId) => {
    try {
        const response = await api.get(`/api/stores/${storeId}`);
        return response.data;
    } catch (err) {
        console.error("Error fetching store details:", err);
        throw err;
    }
};

export const fetchMaterials = async () => {
    try {
        const response = await api.get('/api/materials');
        return response.data;
    } catch (error) {
        console.error('Error fetching materials:', error);
        throw error;
    }
};



export const fetchMaterialsByStoreId = async (storeId, page = 0, size = 5, text = "", sizeId = "") => {
    try {
        const response = await api.get("/api/materials/paginated", {
            params: { storeId, page, size, text, sizeId },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching store materials:", error);
        throw error;
    }
};

export const fetchAllMaterialsPaginated = async (page = 0, size = 5, text = "", sizeId = "") => {
    try {
        const response = await api.get("/api/materials/all/paginated", {
            params: { page, size, text, sizeId },
        });
        return response.data; // { content, totalPages, number }
    } catch (error) {
        console.error("Error fetching all materials:", error);
        throw error;
    }
};

export const editMaterial = async (id, updatedData) => {
    try {
        const response = await api.put(`/api/materials/${id}`, updatedData);
        return response.data;
    } catch (error) {
        console.error("Error in editMaterial:", error.response || error.message);
        throw error;
    }
};


export const deleteMaterial = async (id) => {
    try {
        const response = await api.delete(`/api/materials/${id}`);
        return response.data;
    } catch (err) {
        console.error("Error in deleteStore:", err.response || err.message);
        throw err;
    }
};

export const distributeMaterial = async (payload) => {
    try {
        const response = await api.post(
            `/api/materials/${payload.materialId}/distribute`,
            {
                receiverStoreId: payload.receiverStoreId,
                quantity: payload.quantity,
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error distributing material:", error);
        throw error;
    }
};


export const fetchSizes = async () => {
    const response = await api.get("/api/sizes");
    return response.data;
};


export const fetchOrders = async (page = 0, size = 5, storeId = null, userId = null, materialText = "", sizeName = "") => {
    try {
        const response = await api.get("/api/orders/paginated", {
            params: { page, size, storeId, userId, materialText, sizeName },
        });
        return response.data; // Assuming response contains { content, totalPages, number }
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
};



export const createOrder = async (orderData) => {
    try {
        // Make sure to include the full backend URL if needed
        const response = await api.post("/api/orders",  {
            dateOfOrder: orderData.dateOfOrder,
            quantity: orderData.quantity,
            sold: orderData.sold,
            status: orderData.status,
            stock: orderData.stock,
            materialText: orderData.materialText,
            sizeName: orderData.sizeName,
            storeTitle:orderData.storeTitle,
            userName:orderData.userName,
        });
        return response.data;
    } catch (error) {
        console.error('Error creating order:', error.response || error.message);
        throw error;
    }
};


export const editOrder = async (id, updatedData) => {
    try {
        const response = await api.put(`/api/orders/${id}`, updatedData);
        return response.data;
    } catch (error) {
        console.error("Error updating order:", error.response || error.message);
        throw error;
    }
};


export const deleteOrder = async (id) => {
    try {
        const response = await api.delete(`/api/orders/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting order:', error);
        throw error;
    }
};


export const createMaterial = async (materialData) => {
    try {
        const response = await api.post('/api/materials', materialData);
        return response.data;
    } catch (error) {
        console.error('Error creating material:', error);
        throw error;
    }
};


// Logout
/*export const logout = async () => {
    try {
        const response = await api.post("/auth/logout");
        localStorage.removeItem("token");
        return response.data;
    } catch (err) {
        console.error("Error in logout:", err.response || err.message);
        throw err;
    }
};*/

// Export the Axios instance
export default api;






