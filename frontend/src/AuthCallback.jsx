import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthData } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        toast.error('Erro ao autenticar. Token não encontrado.');
        navigate('/login');
        return;
      }

      try {
        // Guardar token
        localStorage.setItem('token', token);
        
        // Buscar dados do utilizador
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Falha ao obter dados do utilizador');
        }

        const data = await response.json();
        
        // Guardar utilizador no localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Atualizar contexto de autenticação
        if (setAuthData) {
          setAuthData({ token, user: data.user });
        }

        toast.success('Login efetuado com sucesso!');
        navigate('/dashboard');
      } catch (error) {
        console.error('Erro no callback OAuth:', error);
        toast.error('Erro ao completar autenticação. Por favor, tente novamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuthData]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a14 0%, #151528 50%, #1a1a2e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#e2b714',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(226, 183, 20, 0.3)',
          borderTop: '4px solid #e2b714',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p style={{ fontSize: '18px', fontWeight: '500' }}>A processar autenticação...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default AuthCallback;