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
import ForgotPassword from './pages/ForgotPassword';
import './i18n'; 


// Componente para proteger rotas privadas
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading-screen">A carregar linha do tempo...</div>;
  return user ? children : <Navigate to='/login' />;
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* Rotas Públicas */}
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/forgot' element={<ForgotPassword />} />
          <Route path='/auth/callback' element={<AuthCallback />} />
          
          {/* Rotas Privadas (Protegidas) */}
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
          
          {/* Perfil (Pode ser público ou privado dependendo da tua lógica) */}
          <Route 
            path='/profile/:userId' 
            element={<UserProfile />} 
          />

          {/* Redirecionamento Inicial */}
          <Route path='/' element={<Navigate to='/dashboard' />} />
          
          {/* Rota 404 (Opcional) */}
          <Route path='*' element={<Navigate to='/login' />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;