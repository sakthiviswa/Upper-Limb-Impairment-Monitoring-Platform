import axios from "axios";

/**
 * Axios instance configured for Flask backend
 */
const api = axios.create({
    baseURL: "/api",   // ✅ Flask backend URL
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
 *
 * Note: 401s from /api/login (bad credentials) are NOT treated as
 * "session expired" – they are left to the calling code to handle.
 */
api.interceptors.response.use(
    (response) => response,

    (error) => {
        if (error.response) {
            const status = error.response.status;
            const reqUrl = error.config?.url || "";

            // Let login/register screens handle their own 401 errors
            if (
                status === 401 &&
                (reqUrl.includes("/login") || reqUrl.includes("/register"))
            ) {
                return Promise.reject(error);
            }

            // Token expired or invalid for authenticated endpoints
            if (status === 401) {
                console.warn("Session expired. Logging out...");

                localStorage.removeItem("token");
                localStorage.removeItem("user");

                // prevent redirect loop
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }

            // Forbidden
            if (status === 403) {
                window.location.href = "/unauthorized";
            }
        }

        return Promise.reject(error);
    }
);

export default api;