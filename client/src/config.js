// central location for backend base URL
// using VITE env variable with fallback to localhost
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
