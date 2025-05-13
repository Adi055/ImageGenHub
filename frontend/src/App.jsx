

import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ToastProvider } from './context/ToastContext'

// Components
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import MemeCreator from './pages/MemeCreator'
import MemeDetails from './pages/MemeDetails'
import Dashboard from './pages/Dashboard'
import EditMeme from './pages/EditMeme'

// Redux actions
import { getMemes } from './store/slices/memeSlice'
import { getTrendingMemes } from './store/slices/memeSlice'

function App() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  // Initialize the app
  useEffect(() => {
    // Check for user in localStorage
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser && !user) {
        // If there's a user in localStorage but not in Redux, dispatch the login action
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser) {
          dispatch({ 
            type: 'auth/login/fulfilled', 
            payload: parsedUser 
          });
        }
      }
    } catch (error) {
      // Silent error handling for localStorage issues
    }
    
    // Load initial memes when app starts
    dispatch(getMemes({ sort: 'new' }))
    
    // Load trending memes
    dispatch(getTrendingMemes('day'))
    dispatch(getTrendingMemes('week'))
  }, [])

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Navbar />
        
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
            <Route path="/create" element={
              <ProtectedRoute>
                <MemeCreator />
              </ProtectedRoute>
            } />
            <Route path="/meme/:id" element={<MemeDetails />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/edit-meme/:id" element={
              <ProtectedRoute>
                <EditMeme />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </ToastProvider>
  )
}

export default App
