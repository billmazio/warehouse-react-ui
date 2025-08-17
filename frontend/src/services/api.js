import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    withCredentials: false
});

// Token management utilities
const TokenManager = {
    getToken: () => localStorage.getItem("token"),

    setToken: (token) => {
        localStorage.setItem("token", token);
        // Set expiration time (15 minutes from now)
        const expirationTime = new Date().getTime() + (15 * 60 * 1000);
        localStorage.setItem("tokenExpiration", expirationTime.toString());
    },

    removeToken: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiration");
    },

    isTokenExpired: () => {
        const expirationTime = localStorage.getItem("tokenExpiration");
        if (!expirationTime) return true;

        return new Date().getTime() > parseInt(expirationTime);
    },

    getTimeUntilExpiry: () => {
        const expirationTime = localStorage.getItem("tokenExpiration");
        if (!expirationTime) return 0;

        const timeLeft = parseInt(expirationTime) - new Date().getTime();
        return Math.max(0, Math.floor(timeLeft / 1000)); // Return seconds
    }
};

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = TokenManager.getToken();

        // Check if token is expired before making request
        if (token && TokenManager.isTokenExpired()) {
            console.warn("Token has expired, redirecting to login...");
            TokenManager.removeToken();
            window.location.href = "/login";
            return Promise.reject(new Error("Token expired"));
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            // Only warn for protected endpoints (not login/public endpoints)
            if (!config.url.includes('/api/auth/login') &&
                !config.url.includes('/api/setup')) {
                console.warn("No token found! Request may fail.");
            }
        }

        return config;
    },
    (error) => {
        console.error("Error in Axios request interceptor:", error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        // Handle successful login - store token with expiration
        if (response.config.url.includes('/api/auth/login') && response.data.token) {
            TokenManager.setToken(response.data.token);
            console.log("Token stored successfully, expires in 15 minutes");
        }

        return response;
    },
    (error) => {
        console.error("API Error:", error.response?.data || error.message);

        // Handle different error scenarios
        if (error.response?.status === 401) {
            console.warn("Unauthorized! Token may be expired or invalid.");
            TokenManager.removeToken();

            // Don't redirect if it's a login attempt
            if (!error.config.url.includes('/api/auth/login')) {
                window.location.href = "/login";
            }
        }

        if (error.response?.status === 403) {
            console.warn("Forbidden! Insufficient permissions.");
            // You might want to show a "Access Denied" page instead of redirect
        }

        // Handle network errors
        if (!error.response) {
            console.error("Network error - server may be down");
        }

        return Promise.reject(error);
    }
);

export { TokenManager};

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

export default api;






