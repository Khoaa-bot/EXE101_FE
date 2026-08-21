const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function checkDbConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/db-check`);
    return await response.json();
  } catch (error) {
    console.error('API connection error:', error);
    return { success: false, error: 'Could not connect to backend server' };
  }
}

export default {
  checkDbConnection,
};
