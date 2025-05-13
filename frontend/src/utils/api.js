import axios from 'axios';

const API_URL = 'https://igh-backend.onrender.com/api';

// Helper function to get auth token
const getAuthToken = () => {
  try {
    const userString = localStorage.getItem('user');
    if (!userString) return null;
    
    const user = JSON.parse(userString);
    return user && user.token ? user.token : null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    // Handle specific error cases
    if (response && response.status === 401) {
      // Unauthorized - clear user from localStorage and redirect to login
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Helper function to extract error message from API response
export const extractErrorMessage = (error) => {
  return (
    (error.response && 
      error.response.data && 
      error.response.data.message) ||
    error.message ||
    error.toString()
  );
};

// File upload utility function - completely rewritten for reliability
export const uploadMemeImage = async (file) => {
  try {
    // Get auth token
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('image', file);
    
    // Make direct axios request with proper headers
    const response = await axios({
      method: 'post',
      url: `${API_URL}/memes/upload`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Upload error details:', error);
    throw error;
  }
};

export default api;
