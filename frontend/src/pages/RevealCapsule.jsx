import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { capsuleAPI } from '../services/capsuleService';
import ReactionPicker from '../components/ReactionPicker';
import '../pages/Dashboard.css';

SyntaxHighlighter.registerLanguage('javascript', js);

export default function RevealCapsule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [capsule, setCapsule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(false);
  const [currentCode, setCurrentCode] = useState('');
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 700 : false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await capsuleAPI.getById(id);
        setCapsule(res.data.capsule || res.data || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (loading) return <div className="chronicle-card main-card">Carregando...</div>;
  if (!capsule) return <div className="chronicle-card main-card">Cápsula não encontrada.</div>;

  const now = new Date();
  const unlock = new Date(capsule.unlockDate);
  const isUnlocked = capsule.isUnlocked || now >= unlock;

  const tryOpen = () => {
    if (!isUnlocked) {
      alert('Paradoxo temporal detectado! ⏰ Tentar abrir antes do tempo é proibido.');
      return;
    }
    setOpened(true);
  };

  const computeEvolution = () => {
    const oldCode = String(capsule.codeSnippet || capsule.content || '');
    const newCode = String(currentCode || '');
    const oldLen = Math.max(oldCode.split('\n').filter((l) => l.trim() !== '').length, 1);
    const newLen = newCode.split('\n').filter((l) => l.trim() !== '').length;
    const diff = newLen - oldLen;
    const pct = Math.round((diff / oldLen) * 100);
    const sign = diff === 0 ? 0 : diff > 0 ? 1 : -1;
    return { oldLen, newLen, diff, pct, sign };
  };

  const { pct, sign } = computeEvolution();

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const generateShareLink = () => {
    const payload = { id: capsule.id || capsule._id || id, exp: Date.now() + 1000 * 60 * 60 };
    const token = btoa(JSON.stringify(payload));
    return `${window.location.origin}/reveal/${payload.id}?share=${token}`;
  };

  const copyShareLink = async () => {
    const url = generateShareLink();
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copiado para a área de transferência');
    } catch (err) {
      window.prompt('Copie este link:', url);
    }
  };

  return (
    <div className="chronicle-card main-card" ref={containerRef}>
      <div className="card-header">
        <h2>🔓 Revelação: {capsule.title}</h2>
        <div className="card-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">Voltar</button>
          <button onClick={copyShareLink} className="btn-secondary">Partilhar</button>
          <button onClick={toggleFullscreen} className="btn-secondary">Tela cheia</button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <p style={{ color: '#94a3b8' }}>Desbloqueia em: {new Date(capsule.unlockDate).toLocaleString()}</p>

        {/* ========================================
            NOVO: SISTEMA DE REAÇÕES
            ======================================== */}
        <div style={{ 
          marginTop: 16, 
          padding: 16, 
          background: 'rgba(30, 41, 59, 0.3)', 
          borderRadius: 12,
          borderLeft: '3px solid #e2b714'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 12 
          }}>
            <h4 style={{ margin: 0, color: '#e2b714' }}> Reações da Comunidade</h4>
          </div>
          
          <ReactionPicker capsuleId={id} variant="default" />
          
          <div style={{ 
            marginTop: 12, 
            fontSize: 12, 
            color: '#94a3b8',
            fontStyle: 'italic' 
          }}>
            ✨ Reage com emojis para expressar o que sentes sobre esta cápsula!
          </div>
        </div>

        {!opened ? (
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            alignItems: 'center', 
            flexDirection: isMobile ? 'column' : 'row',
            marginTop: 20 
          }}>
            <div style={{ flex: 1 }}>
              <p>{capsule.content}</p>
            </div>
            <div style={{ width: isMobile ? '100%' : 200, textAlign: 'center' }}>
              <button onClick={tryOpen} className="chronicle-button">Abrir Cápsula</button>
              {!isUnlocked && <div style={{ marginTop: 8, color: '#fca5a5' }}>Tenta abrir após a data de desbloqueio.</div>}
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            style={{ marginTop: 20 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div>
                <h4>📜 Código antigo (na cápsula)</h4>
                <SyntaxHighlighter language={capsule.language || 'javascript'} style={atomOneDark}>
                  {capsule.codeSnippet || capsule.content || ''}
                </SyntaxHighlighter>
              </div>

              <div>
                <h4>🧭 Código atual (insere para comparar)</h4>
                <textarea 
                  value={currentCode} 
                  onChange={(e) => setCurrentCode(e.target.value)} 
                  rows={12} 
                  className="chronicle-input" 
                />
                <div style={{ marginTop: 8 }}>
                  <strong>Métrica automática:</strong>
                  <div style={{ color: '#e2b714', marginTop: 6 }}>
                    {sign === 0 && 'Sem alterações detectadas.'}
                    {sign > 0 && `Aumentou ${Math.abs(pct)}% em linhas (estimado)`}
                    {sign < 0 && `Reduziu ${Math.abs(pct)}% em linhas (estimado)`}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}