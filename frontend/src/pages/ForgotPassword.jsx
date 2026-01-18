import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const secondHandRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, [countdown]);

  // Reset countdown when leaving page
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !email.includes('@')) {
      toast.error('Por favor, insira um e-mail válido');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { 
        email,
        expiresIn: '1h', // Informa ao backend para expirar em 1 hora
        redirectUrl: `${window.location.origin}/reset-password` // URL para redirecionamento
      });
      
      setIsSent(true);
      setCountdown(60); // 60 segundos para poder reenviar
      
      // Mostrar mensagem de sucesso com mais detalhes
      toast.success(
        <div>
          <strong>E-mail enviado com sucesso!</strong>
          <div style={{ fontSize: '14px', marginTop: '5px' }}>
            Verifique a sua caixa de entrada e o spam.
            <br />
            O link expira em 1 hora.
          </div>
        </div>,
        { duration: 6000 }
      );
      
      // Log para debugging (remover em produção)
      console.log('Reset link generated:', {
        email,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      });
      
    } catch (err) {
      // Mostrar erros específicos se disponíveis
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Erro ao processar o pedido. Tente novamente mais tarde.';
      
      toast.error(errorMessage);
      
      // Simular envio para demonstração (remover em produção)
      if (process.env.NODE_ENV === 'development') {
        console.log('DEBUG - Simulated reset link:', {
          email,
          resetToken: 'demo-token-' + Date.now(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          resetUrl: `${window.location.origin}/reset-password?token=demo&email=${encodeURIComponent(email)}`
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) {
      toast.error(`Aguarde ${countdown} segundos para reenviar`);
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { 
        email,
        resend: true 
      });
      
      setCountdown(60);
      toast.success('Link reenviado com sucesso!');
    } catch (err) {
      toast.error('Erro ao reenviar o link');
    } finally {
      setLoading(false);
    }
  };

  const handleTryAnotherEmail = () => {
    setIsSent(false);
    setEmail('');
    setCountdown(0);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Efeito de partículas (mantido do código anterior)
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

  // Se o e-mail foi enviado, mostrar tela de confirmação
  if (isSent) {
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
            <div className="time-glyph success">
              <svg className="success-icon" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <div className="success-glow"></div>
            </div>
            
            <div className="header-text">
              <h1 className="chronicle-title">E-mail Enviado!</h1>
              <p className="chronicle-subtitle">Verifique a sua caixa de entrada</p>
            </div>
          </div>
          
          <div className="success-message">
            <p>Enviamos um link de recuperação para:</p>
            <div className="email-display">
              <svg className="email-icon" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <strong>{email}</strong>
            </div>
            
            <div className="instructions">
              <h3>Instruções:</h3>
              <ul>
                <li>Verifique a sua caixa de entrada e pasta de spam</li>
                <li>Clique no link para redefinir a sua palavra-passe</li>
                <li>O link é válido por <strong>1 hora</strong></li>
                <li>Não partilhe este link com ninguém</li>
              </ul>
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              className="chronicle-button secondary"
              onClick={handleResend}
              disabled={loading || countdown > 0}
            >
              <span className="button-text">
                {loading ? 'A enviar...' : countdown > 0 ? `Reenviar (${countdown}s)` : 'Reenviar Link'}
              </span>
            </button>
            
            <button 
              className="chronicle-button"
              onClick={handleTryAnotherEmail}
            >
              <span className="button-text">Usar outro e-mail</span>
            </button>
          </div>
          
          <div className="chronicle-footer">
            <Link to="/login" className="footer-link">
              ← Voltar ao Login
            </Link>
            
            <div className="security-badge warning">
              <svg className="badge-icon" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
              <span>Expira em 1 hora</span>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          /* Todos os estilos anteriores permanecem */
          /* Adicionar estilos específicos para tela de sucesso */
          
          .time-glyph.success {
            background: rgba(34, 197, 94, 0.1);
            border: 3px solid rgba(34, 197, 94, 0.3);
            border-radius: 50%;
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            position: relative;
          }
          
          .success-icon {
            width: 40px;
            height: 40px;
            fill: #22c55e;
            z-index: 2;
            position: relative;
          }
          
          .success-glow {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 60px;
            background: radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            animation: successPulse 2s ease-in-out infinite;
          }
          
          .success-message {
            background: rgba(30, 41, 59, 0.3);
            border-radius: 12px;
            padding: 24px;
            margin: 30px 0;
            border: 1px solid rgba(226, 183, 20, 0.1);
          }
          
          .success-message p {
            color: #94a3b8;
            margin-bottom: 16px;
            text-align: center;
          }
          
          .email-display {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            background: rgba(15, 15, 25, 0.5);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 24px;
            border: 1px solid rgba(226, 183, 20, 0.2);
          }
          
          .email-display strong {
            color: #e2b714;
            font-size: 16px;
          }
          
          .email-icon {
            width: 20px;
            height: 20px;
            fill: #e2b714;
          }
          
          .instructions {
            text-align: left;
          }
          
          .instructions h3 {
            color: #e2b714;
            margin-bottom: 12px;
            font-size: 16px;
          }
          
          .instructions ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .instructions li {
            color: #94a3b8;
            margin-bottom: 8px;
            padding-left: 24px;
            position: relative;
            font-size: 14px;
          }
          
          .instructions li:before {
            content: "•";
            color: #22c55e;
            font-size: 20px;
            position: absolute;
            left: 0;
            top: -2px;
          }
          
          .instructions li strong {
            color: #e2b714;
          }
          
          .action-buttons {
            display: flex;
            gap: 12px;
            margin-bottom: 25px;
          }
          
          .chronicle-button.secondary {
            background: rgba(30, 41, 59, 0.5);
            border: 1px solid #334155;
            color: #cbd5e1;
            flex: 1;
          }
          
          .chronicle-button.secondary:hover:not(:disabled) {
            background: rgba(226, 183, 20, 0.1);
            border-color: #e2b714;
            color: #e2b714;
          }
          
          .security-badge.warning {
            border-color: rgba(234, 179, 8, 0.3);
            background: rgba(234, 179, 8, 0.1);
          }
          
          @keyframes successPulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          }
          
          @media (max-width: 768px) {
            .action-buttons {
              flex-direction: column;
            }
            
            .instructions li {
              font-size: 13px;
            }
          }
        `}</style>
      </div>
    );
  }

  // Tela normal do formulário
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
            <h1 className="chronicle-title">Recuperar Tempo</h1>
            <p className="chronicle-subtitle">Redefina a sua palavra-passe e recupere o acesso</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="chronicle-form" style={{ marginTop: '20px' }}>
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
                disabled={loading}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="chronicle-button"
            disabled={loading}
          >
            <span className="button-text">
              {loading ? 'A enviar...' : 'Enviar Link de Recuperação'}
            </span>
            <div className="button-arrows">
              <div className="arrow">→</div>
            </div>
            <div className="button-glow"></div>
          </button>
        </form>
        
        <div className="recovery-note">
          <svg className="recovery-icon" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <div>
            <strong>Como funciona:</strong>
            <p style={{ margin: '5px 0 0 0', fontSize: '13px' }}>
              Enviaremos um link seguro para o seu e-mail com instruções para redefinir a sua palavra-passe.
            </p>
          </div>
        </div>
        
        <div className="chronicle-footer">
          <Link to="/login" className="footer-link">
            ← Voltar ao Login
          </Link>
          
          <div className="security-badge">
            <svg className="badge-icon" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
            <span>Link expira em 1 hora</span>
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
          padding: 16px 52px 16px 16px;
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
        
        .input-wrapper:focus-within .input-icon {
          fill: #e2b714;
        }

        .input-wrapper:focus-within .chronicle-input,
        .chronicle-input:not(:placeholder-shown) {
          background: #ffffff;
          color: #111827;
          border-color: #e2b714;
        }

        .input-wrapper:focus-within .input-icon {
          fill: #111827;
        }

        .chronicle-input::placeholder {
          color: #94a3b8;
        }

        .chronicle-input:not(:placeholder-shown)::placeholder {
          color: transparent;
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
        
        .recovery-note {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          background: rgba(30, 41, 59, 0.3);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 25px;
          border: 1px solid rgba(226, 183, 20, 0.1);
        }
        
        .recovery-icon {
          width: 24px;
          height: 24px;
          fill: #10b981;
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        .recovery-note div {
          flex: 1;
        }
        
        .recovery-note strong {
          color: #e2b714;
          display: block;
          margin-bottom: 5px;
        }
        
        .recovery-note p {
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.4;
          margin: 0;
        }
        
        .chronicle-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 25px;
          border-top: 1px solid #334155;
        }
        
        .footer-link {
          color: #e2b714;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
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
        
        @keyframes arrowFloat {
          0%, 100% { transform: translateX(0); opacity: 0.5; }
          50% { transform: translateX(5px); opacity: 1; }
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
            padding: 14px 50px 14px 14px;
            font-size: 16px;
            height: 50px;
          }
          
          .input-icon {
            left: 14px;
            width: 18px;
            height: 18px;
          }
          
          .clock-date-display,
          .clock-digital-time {
            display: none;
          }
          
          .chronicle-footer {
            flex-direction: column;
            gap: 20px;
            align-items: flex-start;
          }
          
          .recovery-note {
            flex-direction: column;
            align-items: center;
            text-align: center;
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
            padding: 12px 46px 12px 12px;
            font-size: 15px;
            height: 48px;
          }
          
          .input-icon {
            left: 12px;
            width: 16px;
            height: 16px;
          }
          
          .chronicle-footer {
            align-items: center;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

export default ForgotPassword;