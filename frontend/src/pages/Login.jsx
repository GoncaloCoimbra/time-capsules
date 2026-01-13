import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [oauthConfig, setOauthConfig] = useState({ github: false, google: false });
  const { login } = useAuth();
  const navigate = useNavigate();
  const secondHandRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/auth/config');
        setOauthConfig(res.data || { github: false, google: false });
      } catch (err) {
        console.error('Failed to fetch oauth config', err);
      }
    })();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const particlesContainer = document.querySelector('.time-particles');
    if (!particlesContainer) return;

    const particleCount = window.innerWidth < 768 ? 20 : 40;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'time-particle';
      
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      const size = Math.random() * 4 + 1;
      const isGold = Math.random() > 0.5;
      const color = isGold ? '#e2b714' : '#1f7a8c';
      const opacity = Math.random() * 0.3 + 0.1;
      const duration = Math.random() * 20 + 10;
      const delay = Math.random() * 5;
      
      particle.style.cssText = `
        left: ${posX}%;
        top: ${posY}%;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        opacity: ${opacity};
        animation: floatParticle ${duration}s ease-in-out ${delay}s infinite;
      `;
      
      particlesContainer.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach(p => p.remove());
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciais inválidas. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="time-chronicle-container">
      <div className="time-particles"></div>
      
      <div className="majestic-clock">
        <div className="clock-ring ring-1"></div>
        <div className="clock-ring ring-2"></div>
        <div className="clock-ring ring-3"></div>
        
        <div className="clock-face">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30) * Math.PI / 180;
            const radius = 42;
            const x = 50 + Math.cos(angle) * radius;
            const y = 50 + Math.sin(angle) * radius;
            
            return (
              <div 
                key={i} 
                className="hour-marker"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg)`
                }}
              >
                <div className="marker-inner">
                  <span className="hour-number" style={{ transform: `rotate(${-i * 30}deg)` }}>
                    {i === 0 ? 'XII' : i}
                  </span>
                </div>
              </div>
            );
          })}
          
          {Array.from({ length: 60 }).map((_, i) => {
            if (i % 5 === 0) return null;
            
            const angle = (i * 6) * Math.PI / 180;
            const radius = 44;
            const x = 50 + Math.cos(angle) * radius;
            const y = 50 + Math.sin(angle) * radius;
            
            return (
              <div 
                key={`min-${i}`}
                className="minute-marker"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) rotate(${i * 6}deg)`
                }}
              />
            );
          })}
          
          <div 
            className="clock-hand hour-hand"
            style={{
              transform: `rotate(${(currentTime.getHours() % 12) * 30 + currentTime.getMinutes() * 0.5}deg)`
            }}
          >
            <div className="hand-body"></div>
          </div>
          
          <div 
            className="clock-hand minute-hand"
            style={{
              transform: `rotate(${currentTime.getMinutes() * 6 + currentTime.getSeconds() * 0.1}deg)`
            }}
          >
            <div className="hand-body"></div>
          </div>
          
          <div 
            ref={secondHandRef}
            className="clock-hand second-hand"
            style={{
              transform: `rotate(${currentTime.getSeconds() * 6}deg)`
            }}
          >
            <div className="hand-body"></div>
            <div className="hand-counterweight"></div>
          </div>
          
          <div className="clock-center">
            <div className="center-glow"></div>
          </div>
        </div>
        
        <div className="clock-date-display">
          {currentTime.toLocaleDateString('pt-PT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
        </div>
        
        <div className="clock-digital-time">
          {formatTime(currentTime)}
          <span className="digital-seconds">
            :{currentTime.getSeconds().toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      
      <div className="chronicle-card">
        <div className="card-glow"></div>
        
        <div className="card-header">
          <div className="time-glyph">
            <div className="glyph-circle">
              <div className="glyph-hand hour"></div>
              <div className="glyph-hand minute"></div>
            </div>
          </div>
          
          <div className="header-text">
            <h1 className="chronicle-title">Time Chronicle</h1>
            <p className="chronicle-subtitle">Aceder às suas memórias temporais</p>
          </div>
        </div>
        
        {error && (
          <div className="chronicle-error">
            <div className="error-pulse"></div>
            <div className="error-content">
              <span className="error-title">Erro Temporal</span>
              <span className="error-message">{error}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="chronicle-form">
          <div className="form-group">
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <input
                type="email"
                className="chronicle-input"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                className="chronicle-input"
                placeholder="A sua palavra-passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}
              >
                {showPassword ? (
                  <svg className="eye-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                ) : (
                  <svg className="eye-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <div className="form-options">
            <label className="checkbox-container">
              <input type="checkbox" className="hidden-checkbox" />
              <div className="custom-checkbox">
                <svg className="check-icon" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <span className="checkbox-label">Lembrar-me</span>
            </label>
            
            <Link to="/forgot" className="forgot-link">
              Esqueceu a palavra-passe?
            </Link>
          </div>
          
          <button 
            type="submit" 
            className="chronicle-button"
            disabled={loading}
          >
            <span className="button-text">
              {loading ? 'A aceder...' : 'Aceder à Cápsula do Tempo'}
            </span>
            <div className="button-arrows">
              <div className="arrow">→</div>
            </div>
            <div className="button-glow"></div>
          </button>
        </form>
        
        <div className="chronicle-divider">
          <div className="divider-line"></div>
          <span className="divider-text">ou continue com</span>
          <div className="divider-line"></div>
        </div>
        
        <div className="social-login">
          <button 
            className="social-button github-button"
            type="button"
            disabled={!oauthConfig.github}
            style={!oauthConfig.github ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            onClick={() => {
              if (!oauthConfig.github) {
                toast.error('Login com GitHub não configurado no servidor');
                return;
              }
              window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`;
            }}
          >
            <svg className="social-icon" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>GitHub{!oauthConfig.github ? ' (desativado)' : ''}</span>
          </button>
          
          <button 
            className="social-button google-button"
            type="button"
            disabled={!oauthConfig.google}
            style={!oauthConfig.google ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            onClick={() => {
              if (!oauthConfig.google) {
                toast.error('Login com Google não configurado no servidor');
                return;
              }
              window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
            }}
          >
            <svg className="social-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google{!oauthConfig.google ? ' (desativado)' : ''}</span>
          </button>
        </div>
        
        <div className="chronicle-footer">
          <p className="footer-text">
            Novo no Time Chronicle?{' '}
            <Link to="/register" className="footer-link">
              Crie a sua conta
            </Link>
          </p>
          
          <div className="security-badge">
            <svg className="badge-icon" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
            <span>Criptografia de tempo real</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600&display=swap');
        
        .time-chronicle-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a14 0%, #151528 50%, #1a1a2e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .time-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }
        
        .time-particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        
        @keyframes floatParticle {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.1;
          }
          25% {
            transform: translate(10px, -20px) rotate(90deg);
            opacity: 0.3;
          }
          50% {
            transform: translate(-15px, 10px) rotate(180deg);
            opacity: 0.2;
          }
          75% {
            transform: translate(20px, 15px) rotate(270deg);
            opacity: 0.4;
          }
        }
        
        .majestic-clock {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80vmin;
          height: 80vmin;
          max-width: 800px;
          max-height: 800px;
          min-width: 500px;
          min-height: 500px;
          z-index: 2;
          pointer-events: none;
          opacity: 0.4;
        }
        
        .clock-ring {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 1px solid;
          animation: ringPulse 6s ease-in-out infinite;
        }
        
        .ring-1 {
          border-color: rgba(226, 183, 20, 0.1);
          animation-delay: 0s;
        }
        
        .ring-2 {
          border-color: rgba(31, 122, 140, 0.08);
          animation-delay: 2s;
          transform: scale(1.05);
        }
        
        .ring-3 {
          border-color: rgba(226, 183, 20, 0.05);
          animation-delay: 4s;
          transform: scale(1.1);
        }
        
        .clock-face {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }
        
        .hour-marker {
          position: absolute;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .marker-inner {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .hour-number {
          font-family: 'Orbitron', sans-serif;
          font-size: 2vmin;
          font-weight: 600;
          color: rgba(226, 183, 20, 0.8);
          text-shadow: 0 0 10px rgba(226, 183, 20, 0.3);
          transform-origin: center;
        }
        
        .minute-marker {
          position: absolute;
          width: 2px;
          height: 10px;
          background: rgba(226, 183, 20, 0.3);
        }
        
        .clock-hand {
          position: absolute;
          top: 50%;
          left: 50%;
          transform-origin: center left;
          z-index: 10;
        }
        
        .hand-body {
          position: absolute;
          border-radius: 4px;
          background: linear-gradient(to right, currentColor, transparent);
        }
        
        .hour-hand {
          width: 25%;
          height: 8px;
          color: #e2b714;
        }
        
        .hour-hand .hand-body {
          width: 100%;
          height: 100%;
          box-shadow: 0 0 10px rgba(226, 183, 20, 0.5);
        }
        
        .minute-hand {
          width: 35%;
          height: 6px;
          color: #1f7a8c;
        }
        
        .minute-hand .hand-body {
          width: 100%;
          height: 100%;
          box-shadow: 0 0 10px rgba(31, 122, 140, 0.5);
        }
        
        .second-hand {
          width: 40%;
          height: 3px;
          color: #ff6b6b;
          transition: transform 0.2s cubic-bezier(0.4, 2.3, 0.8, 1);
        }
        
        .second-hand .hand-body {
          width: 80%;
          height: 100%;
          background: linear-gradient(to right, #ff6b6b, transparent);
          box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
        }
        
        .hand-counterweight {
          position: absolute;
          right: 10%;
          top: 50%;
          transform: translateY(-50%);
          width: 12px;
          height: 12px;
          background: #ff6b6b;
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(255, 107, 107, 0.7);
        }
        
        .clock-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          background: #e2b714;
          border-radius: 50%;
          z-index: 11;
          box-shadow: 0 0 30px rgba(226, 183, 20, 0.8);
        }
        
        .center-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: radial-gradient(circle, rgba(226, 183, 20, 0.4) 0%, transparent 70%);
          border-radius: 50%;
          animation: centerPulse 2s ease-in-out infinite;
        }
        
        .clock-date-display {
          position: absolute;
          top: 65%;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Inter', sans-serif;
          font-size: 1.2vmin;
          color: rgba(226, 183, 20, 0.7);
          white-space: nowrap;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .clock-digital-time {
          position: absolute;
          top: 75%;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Orbitron', sans-serif;
          font-size: 2vmin;
          color: #e2b714;
          display: flex;
          align-items: baseline;
          gap: 2px;
          text-shadow: 0 0 15px rgba(226, 183, 20, 0.5);
        }
        
        .digital-seconds {
          font-size: 1.5vmin;
          color: rgba(226, 183, 20, 0.7);
        }
        
        .chronicle-card {
          background: rgba(15, 15, 25, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 40px;
          max-width: 440px;
          width: 100%;
          border: 1px solid rgba(226, 183, 20, 0.15);
          box-shadow: 
            0 25px 60px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(226, 183, 20, 0.05);
          position: relative;
          z-index: 100;
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        
        .chronicle-card:hover {
          transform: translateY(-5px);
          box-shadow: 
            0 35px 80px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            0 0 0 1px rgba(226, 183, 20, 0.1);
        }
        
        .card-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            circle at center,
            rgba(226, 183, 20, 0.05) 0%,
            transparent 70%
          );
          border-radius: 24px;
          z-index: -1;
        }
        
        .card-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .time-glyph {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          position: relative;
        }
        
        .glyph-circle {
          width: 100%;
          height: 100%;
          border: 3px solid rgba(226, 183, 20, 0.3);
          border-radius: 50%;
          position: relative;
          animation: glyphRotate 20s linear infinite;
        }
        
        .glyph-hand {
          position: absolute;
          background: #e2b714;
          transform-origin: bottom center;
          border-radius: 2px;
          left: calc(50% - 1px);
        }
        
        .glyph-hand.hour {
          width: 2px;
          height: 25px;
          top: 15px;
          animation: rotateHour 40s linear infinite;
        }
        
        .glyph-hand.minute {
          width: 1px;
          height: 35px;
          top: 5px;
          animation: rotateMinute 20s linear infinite;
        }
        
        .header-text {
          margin-top: 20px;
        }
        
        .chronicle-title {
          font-size: 36px;
          font-weight: 700;
          background: linear-gradient(135deg, #e2b714 0%, #1f7a8c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
          font-family: 'Orbitron', sans-serif;
        }
        
        .chronicle-subtitle {
          color: #94a3b8;
          font-size: 16px;
          margin: 0;
          font-weight: 400;
        }
        
        .chronicle-error {
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 25px;
          display: flex;
          align-items: center;
          gap: 15px;
          animation: slideIn 0.3s ease;
        }
        
        .error-pulse {
          width: 12px;
          height: 12px;
          background: #ef4444;
          border-radius: 50%;
          flex-shrink: 0;
          animation: errorPulse 1s ease-in-out infinite;
        }
        
        .error-content {
          flex: 1;
        }
        
        .error-title {
          display: block;
          font-family: 'Orbitron', sans-serif;
          font-size: 12px;
          color: #ef4444;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }
        
        .error-message {
          font-size: 14px;
          color: #f87171;
          line-height: 1.4;
        }
        
        .chronicle-form {
          margin-bottom: 30px;
        }
        
        .form-group {
          margin-bottom: 25px;
          position: relative;
        }
        
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        
        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          fill: #64748b;
          z-index: 1;
          transition: fill 0.3s ease;
          pointer-events: none;
        }
        
        .chronicle-input {
          width: 100%;
          padding: 16px 52px 16px 52px;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid #334155;
          border-radius: 12px;
          color: #f1f5f9;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
          box-sizing: border-box;
          height: 52px;
          line-height: 1.5;
          z-index: 2;
          position: relative;
        }
        
        .chronicle-input:focus {
          outline: none;
          border-color: #e2b714;
          background: rgba(30, 41, 59, 0.8);
        }
        
        /* Make icon highlight when wrapper is focused */
        .input-wrapper:focus-within .input-icon {
          fill: #e2b714;
        }

        /* Input becomes white when focused or when it has content (typing) */
        .input-wrapper:focus-within .chronicle-input,
        .chronicle-input:not(:placeholder-shown) {
          background: #ffffff;
          color: #111827;
          border-color: #e2b714;
        }

        .input-wrapper:focus-within .input-icon {
          fill: #111827;
        }

        /* PASSWORD TOGGLE FIXED WITH !IMPORTANT */
        .password-toggle {
          position: absolute !important;
          right: 16px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          background: none !important;
          border: none !important;
          color: #94a3b8 !important;
          cursor: pointer;
          padding: 8px !important;
          border-radius: 6px !important;
          transition: all 0.2s ease !important;
          z-index: 3 !important;
          width: 36px !important;
          height: 36px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 !important;
        }
        
        /* Hover effect - becomes golden */
        .password-toggle:hover {
          color: #e2b714 !important;
          background: rgba(226, 183, 20, 0.1) !important;
        }
        
        /* When input is focused - becomes black */
        .input-wrapper:focus-within .password-toggle {
          color: #111827 !important;
          background: transparent !important;
        }

        .chronicle-input::placeholder {
          color: #94a3b8;
        }

        .chronicle-input:not(:placeholder-shown)::placeholder {
          color: transparent;
        }
        
        .eye-icon {
          width: 20px;
          height: 20px;
        }
        
        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }
        
        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }
        
        .hidden-checkbox {
          display: none;
        }
        
        .custom-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #475569;
          border-radius: 6px;
          background: rgba(30, 41, 59, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .hidden-checkbox:checked + .custom-checkbox {
          background: #e2b714;
          border-color: #e2b714;
        }
        
        .check-icon {
          width: 16px;
          height: 16px;
          fill: white;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .hidden-checkbox:checked + .custom-checkbox .check-icon {
          opacity: 1;
        }
        
        .checkbox-label {
          color: #cbd5e1;
          font-size: 14px;
        }
        
        .forgot-link {
          color: #94a3b8;
          font-size: 14px;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        
        .forgot-link:hover {
          color: #e2b714;
        }
        
        .chronicle-button {
          width: 100%;
          padding: 18px;
          background: linear-gradient(135deg, #e2b714 0%, #1f7a8c 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .chronicle-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(226, 183, 20, 0.3);
        }
        
        .chronicle-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .button-text {
          position: relative;
          z-index: 2;
        }
        
        .button-arrows {
          display: flex;
          gap: 4px;
          position: relative;
          z-index: 2;
        }
        
        .arrow {
          animation: arrowFloat 1.5s ease-in-out infinite;
        }
        
        .button-glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: left 0.7s;
          z-index: 1;
        }
        
        .chronicle-button:hover .button-glow {
          left: 100%;
        }
        
        .chronicle-divider {
          display: flex;
          align-items: center;
          margin: 30px 0;
          color: #64748b;
          font-size: 14px;
        }
        
        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            #334155,
            transparent
          );
        }
        
        .divider-text {
          padding: 0 16px;
          color: #94a3b8;
        }
        
        .social-login {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 30px;
        }
        
        .social-button {
          padding: 14px;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid #334155;
          border-radius: 12px;
          color: #cbd5e1;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.3s ease;
        }
        
        .social-button:hover {
          transform: translateY(-2px);
          border-color: #475569;
        }
        
        .github-button:hover {
          background: rgba(226, 183, 20, 0.1);
          border-color: #e2b714;
          color: #e2b714;
        }
        
        .google-button:hover {
          background: rgba(31, 122, 140, 0.1);
          border-color: #1f7a8c;
          color: #1f7a8c;
        }
        
        .social-icon {
          width: 20px;
          height: 20px;
        }
        
        .chronicle-footer {
          text-align: center;
          padding-top: 25px;
          border-top: 1px solid #334155;
        }
        
        .footer-text {
          color: #94a3b8;
          font-size: 15px;
          margin: 0 0 20px 0;
        }
        
        .footer-link {
          color: #e2b714;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;
        }
        
        .footer-link:hover {
          color: #d4a506;
          text-decoration: underline;
        }
        
        .security-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(30, 41, 59, 0.5);
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid rgba(226, 183, 20, 0.2);
          color: #94a3b8;
          font-size: 12px;
        }
        
        .badge-icon {
          width: 16px;
          height: 16px;
          fill: #e2b714;
        }
        
        @keyframes ringPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        
        @keyframes centerPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
        }
        
        @keyframes glyphRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes rotateHour {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes rotateMinute {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes errorPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes arrowFloat {
          0%, 100% { transform: translateX(0); opacity: 0.5; }
          50% { transform: translateX(5px); opacity: 1; }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .majestic-clock {
            width: 90vmin;
            height: 90vmin;
            min-width: 300px;
            min-height: 300px;
            opacity: 0.2;
          }
          
          .chronicle-card {
            padding: 30px 24px;
            margin: 20px;
          }
          
          .chronicle-title {
            font-size: 28px;
          }
          
          .chronicle-input {
            padding: 14px 50px 14px 50px;
            font-size: 16px;
            height: 50px;
          }
          
          .password-toggle {
            right: 14px !important;
            width: 32px !important;
            height: 32px !important;
          }
          
          .input-icon {
            left: 14px;
            width: 18px;
            height: 18px;
          }
          
          .social-login {
            grid-template-columns: 1fr;
          }
          
          .form-options {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .clock-date-display,
          .clock-digital-time {
            display: none;
          }
        }
        
        @media (max-width: 480px) {
          .majestic-clock {
            display: none;
          }
          
          .chronicle-card {
            padding: 25px 20px;
          }
          
          .chronicle-title {
            font-size: 24px;
          }
          
          .time-glyph {
            width: 60px;
            height: 60px;
          }
          
          .chronicle-input {
            padding: 12px 46px 12px 46px;
            font-size: 15px;
            height: 48px;
          }
          
          .password-toggle {
            right: 12px !important;
            width: 30px !important;
            height: 30px !important;
          }
          
          .input-icon {
            left: 12px;
            width: 16px;
            height: 16px;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;