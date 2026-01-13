import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { oauthLogin } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (!token) {
      // no token: go to login
      navigate('/login');
      return;
    }

    // Use the AuthContext helper to set token and fetch user
    (async () => {
      try {
        await oauthLogin(token);
        navigate('/dashboard');
      } catch (err) {
        console.error('OAuth callback failed', err);
        navigate('/login');
      }
    })();
  }, [location.search]);

  return (
    <div style={{ padding: 40 }}>
      <h3>Logando...</h3>
      <p>Aguarde enquanto finalizamos o login.</p>
    </div>
  );
}
