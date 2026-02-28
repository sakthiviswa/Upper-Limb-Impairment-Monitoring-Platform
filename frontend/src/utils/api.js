import axios from "axios";

/**
 * Axios instance configured for Flask backend
 */
const api = axios.create({
    baseURL: "http://localhost:5000/api",   // ✅ Flask backend URL
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: false, // set true only if using cookies
});

/**
 * Attach JWT token to every request
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Handle unauthorized responses
 */
api.interceptors.response.use(
    (response) => response,

    (error) => {
        if (error.response) {

            // Token expired or invalid
            if (error.response.status === 401) {

                console.warn("Session expired. Logging out...");

                localStorage.removeItem("token");
                localStorage.removeItem("user");

                // prevent redirect loop
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }

            // Forbidden
            if (error.response.status === 403) {
                window.location.href = "/unauthorized";
            }
        }

        return Promise.reject(error);
    }
);

export default api;