import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ToastNotification from './components/ToastNotification';
import Login from './pages/Login';
import Register from './pages/Register'; 
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import CreateCapsule from './pages/CreateCapsule';
import RevealCapsule from './pages/RevealCapsule';
import AuthCallback from './pages/AuthCallback';
import ForgotPassword from './pages/ForgotPassword';
import './i18n'; 
import LandingPage from './landing/LandingPage';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import './App.css';


// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔴 Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100vw',
          height: '100vh',
          background: '#0f172a',
          color: '#f87171',
          fontFamily: 'monospace',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div>
            <h1>⚠️ Erro da Aplicação</h1>
            <p>{this.state.error?.message}</p>
            <button onClick={() => window.location.reload()}>
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Componente para proteger rotas privadas
function PrivateRoute({ children }) {
  try {
    const authContext = useAuth();
    const { user, loading } = authContext || { user: null, loading: true };
    const token = localStorage.getItem('token');
    
    console.log('🔐 PrivateRoute check - user:', user, 'token:', !!token, 'loading:', loading);
    
    if (loading) return <div className="loading-screen">A carregar linha do tempo...</div>;
    
    // Se há token, permitir acesso
    if (!token) {
      console.log('⚠️ Sem token, redirecionando para login');
      return <Navigate to='/login' />;
    }
    
    return children;
  } catch (error) {
    console.error('❌ Erro em PrivateRoute:', error);
    return <Navigate to='/login' />;
  }
}

function App() {
  console.log('🚀 App.jsx renderizando...');
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastNotification />
        <Toaster position="top-right" />
        <Router>
          <Routes>
            {/* Rotas Públicas */}
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/forgot' element={<ForgotPassword />} />
            <Route path='/auth/callback' element={<AuthCallback />} />
            <Route path='/terms' element={<Terms />} />
            <Route path='/privacy' element={<Privacy />} />
            
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
            <Route path='/landing' element={<LandingPage />} />
            <Route path='/' element={<Navigate to='/dashboard' />} />
            
            {/* Rota 404 (Opcional) */}
            <Route path='*' element={<Navigate to='/login' />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;