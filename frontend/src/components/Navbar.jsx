import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../store/slices/authSlice';
import { useState } from 'react';

function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          ImageGenHub
        </Link>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
        
        {/* Desktop and Mobile Navigation */}
        <nav className={`${isMenuOpen ? 'block' : 'hidden'} md:block absolute md:relative top-16 md:top-0 left-0 right-0 md:right-auto bg-white dark:bg-gray-800 md:bg-transparent shadow-md md:shadow-none z-50`}>
          <ul className="flex flex-col md:flex-row md:space-x-6 space-y-2 md:space-y-0 p-4 md:p-0 items-start md:items-center">
            <li className="w-full md:w-auto">
              <Link 
                to="/" 
                className="block w-full md:w-auto hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 md:py-0"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
            </li>
            
            {user ? (
              <>
                <li className="w-full md:w-auto">
                  <Link 
                    to="/create" 
                    className="block w-full md:w-auto hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 md:py-0"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Create Meme
                  </Link>
                </li>
                <li className="w-full md:w-auto">
                  <Link 
                    to="/dashboard" 
                    className="block w-full md:w-auto hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 md:py-0"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="w-full md:w-auto">
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors text-left md:text-center"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="w-full md:w-auto">
                  <Link 
                    to="/login" 
                    className="block w-full md:w-auto hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 md:py-0"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                </li>
                <li className="w-full md:w-auto">
                  <Link 
                    to="/register" 
                    className="block w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors text-left md:text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
