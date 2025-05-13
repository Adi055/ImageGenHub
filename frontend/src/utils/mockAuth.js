// This file provides mock authentication for testing purposes
// Remove or replace with real authentication in production

/**
 * Sets a mock user in localStorage and returns the user object
 * This is for testing purposes only
 */
export const setMockUser = () => {
  const mockUser = {
    id: '123456',
    username: 'testuser',
    email: 'test@example.com',
    token: 'mock-jwt-token',
    profilePicture: '',
  };
  
  // Clear any existing user data first
  localStorage.removeItem('user');
  // Then set the new user data
  localStorage.setItem('user', JSON.stringify(mockUser));
  console.log('Mock user set in localStorage:', mockUser);
  return mockUser;
};

/**
 * Removes the mock user from localStorage
 */
export const removeMockUser = () => {
  localStorage.removeItem('user');
};

/**
 * Checks if a user is logged in
 * @returns {boolean} True if a user is logged in, false otherwise
 */
export const isLoggedIn = () => {
  const user = localStorage.getItem('user');
  return !!user;
};

export default {
  setMockUser,
  removeMockUser,
  isLoggedIn,
};
