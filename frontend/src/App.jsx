import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register'; 
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import CreateCapsule from './pages/CreateCapsule';
import RevealCapsule from './pages/RevealCapsule';
import AuthCallback from './pages/AuthCallback';


function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
 
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to='/login' />;
}

function App() {
  return (
    <AuthProvider>
      <Toaster />
      <Router>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route
            path='/dashboard'
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path='/create'
            element={
              <PrivateRoute>
                <CreateCapsule />
              </PrivateRoute>
            }
          />
          <Route
            path='/reveal/:id'
            element={
              <PrivateRoute>
                <RevealCapsule />
              </PrivateRoute>
            }
          />
          <Route 
            path='/profile/:userId' 
            element={<UserProfile />} 
          />
          <Route path='/auth/callback' element={<AuthCallback />} />
          <Route path='/' element={<Navigate to='/dashboard' />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
