import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function ProtectedRoute({ children }) {
  // Get the authentication state directly
  const auth = useSelector((state) => state.auth);
  
  // Check if there's a user in localStorage as a fallback
  let userFromStorage = null;
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      userFromStorage = JSON.parse(storedUser);
    }
  } catch (error) {
    // Silent error handling for localStorage issues
  }
  
  // Determine if user is authenticated (either from Redux or localStorage)
  const isAuthenticated = auth.user || userFromStorage;
  
  // Show loading spinner
  if (auth.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated, render children
  return children;
}

export default ProtectedRoute;
