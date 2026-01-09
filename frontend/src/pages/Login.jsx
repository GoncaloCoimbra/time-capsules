import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { login } = useAuth();
  const navigate = useNavigate();
  const secondHandRef = useRef(null);

  // Atualizar tempo em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Efeito de partículas para o fundo
  useEffect(() => {
    const particlesContainer = document.querySelector('.time-particles');
    if (!particlesContainer) return;

    const particleCount = window.innerWidth < 768 ? 20 : 40;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'time-particle';
      
      // Posição aleatória
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      
      // Tamanho aleatório
      const size = Math.random() * 4 + 1;
      
      // Cor baseada na posição (dourado ou azul)
      const isGold = Math.random() > 0.5;
      const color = isGold ? '#e2b714' : '#1f7a8c';
      const opacity = Math.random() * 0.3 + 0.1;
      
      // Animação personalizada
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

  // Formatar hora atual
  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="time-chronicle-container">
      {/* Fundo com partículas de tempo */}
      <div className="time-particles"></div>
      
      {/* Relógio Analógico Gigante Atrás */}
      <div className="majestic-clock">
        {/* Anéis concêntricos */}
        <div className="clock-ring ring-1"></div>
        <div className="clock-ring ring-2"></div>
        <div className="clock-ring ring-3"></div>
        
        {/* Mostrador principal */}
        <div className="clock-face">
          {/* Marcadores das horas */}
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
          
          {/* Marcadores dos minutos */}
          {Array.from({ length: 60 }).map((_, i) => {
            if (i % 5 === 0) return null; // Pular as horas
            
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
          
          {/* Ponteiros */}
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
          
          {/* Centro do relógio */}
          <div className="clock-center">
            <div className="center-glow"></div>
          </div>
        </div>
        
        {/* Data atual */}
        <div className="clock-date-display">
          {currentTime.toLocaleDateString('pt-PT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
        </div>
        
        {/* Hora digital */}
        <div className="clock-digital-time">
          {formatTime(currentTime)}
          <span className="digital-seconds">
            :{currentTime.getSeconds().toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      
      {/* Card de Login Flutuante */}
      <div className="chronicle-card">
        <div className="card-glow"></div>
        
        {/* Cabeçalho */}
        <div className="card-header">
          <div className="time-glyph">
            <div className="glyph-circle">
              <div className="glyph-hand hour"></div>
              <div className="glyph-hand minute"></div>
            </div>
          </div>
          
          <div className="header-text">
            <h1 className="chronicle-title">Time Chronicle</h1>
            <p className="chronicle-subtitle">  Aceder as suas memórias temporais</p>
          </div>
        </div>
        
        {/* Mensagem de erro */}
        {error && (
          <div className="chronicle-error">
            <div className="error-pulse"></div>
            <div className="error-content">
              <span className="error-title">Erro Temporal</span>
              <span className="error-message">{error}</span>
            </div>
          </div>
        )}
        
        {/* Formulário */}
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
              <div className="input-underline"></div>
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
              <div className="input-underline"></div>
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '' : '‍🗨️'}
              </button>
            </div>
          </div>
          
          {/* Opções */}
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
          
          {/* Botão de login */}
          <button 
            type="submit" 
            className="chronicle-button"
            disabled={loading}
          >
            <span className="button-text">
              {loading ? 'A aceder...' : 'Aceder à Cápsula do Tempoe Capsule'}
            </span>
            <div className="button-arrows">
              <div className="arrow">→</div>
            </div>
            <div className="button-glow"></div>
          </button>
        </form>
        
        {/* Divisor */}
        <div className="chronicle-divider">
          <div className="divider-line"></div>
          <span className="divider-text">ou continue com</span>
          <div className="divider-line"></div>
        </div>
        
        {/* Login social */}
        <div className="social-login">
          <button 
            className="social-button github-button"
            type="button"
            onClick={() => alert('Login com GitHub')}
          >
            <svg className="social-icon" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>GitHub</span>
          </button>
          
          <button 
            className="social-button google-button"
            type="button"
            onClick={() => alert('Login com Google')}
          >
            <svg className="social-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google</span>
          </button>
        </div>
        
        {/* Rodapé */}
        <div className="chronicle-footer">
          <p className="footer-text">
            Novo no Time Chronicle?{' '}
            <Link to="/register" className="footer-link">
              Crie sua conta
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
        
        /* Partículas de fundo */
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
        
        /* Relógio majestoso atrás */
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
        
        /* Card de login */
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
        
        /* Cabeçalho do card */
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
        
        /* Mensagem de erro */
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
        
        /* Formulário */
        .chronicle-form {
          margin-bottom: 30px;
        }
        
        .form-group {
          margin-bottom: 25px;
        }
        
        .input-wrapper {
          position: relative;
        }
        
        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          fill: #64748b;
          z-index: 2;
          transition: fill 0.3s ease;
        }
        
        .chronicle-input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid #334155;
          border-radius: 12px;
          color: #f1f5f9;
          font-size: 16px;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
        }
        
        .chronicle-input:focus {
          outline: none;
          border-color: #e2b714;
          background: rgba(30, 41, 59, 0.8);
        }
        
        .chronicle-input:focus ~ .input-icon {
          fill: #e2b714;
        }
        
        .input-underline {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #e2b714, #1f7a8c);
          transition: width 0.3s ease;
          border-radius: 0 0 12px 12px;
        }
        
        .chronicle-input:focus ~ .input-underline {
          width: 100%;
        }
        
        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        
        .password-toggle:hover {
          color: #e2b714;
          background: rgba(226, 183, 20, 0.1);
        }
        
        /* Opções do formulário */
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
        
        /* Botão principal */
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
        
        /* Divisor */
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
        
        /* Login social */
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
        
        /* Rodapé */
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
        
        /* Animações */
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
        
        /* Responsividade */
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
        }
      `}</style>
    </div>
  );
}

export default Login;