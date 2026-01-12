import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { capsuleAPI } from '../services/capsuleService';
import '../pages/Dashboard.css';

SyntaxHighlighter.registerLanguage('javascript', js);

export default function RevealCapsule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [capsule, setCapsule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(false);
  const [currentCode, setCurrentCode] = useState('');

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
    const oldCode = (capsule.codeSnippet || capsule.content || '').toString();
    const newCode = currentCode || '';
    const oldLen = oldCode.split('\n').length || 1;
    const newLen = newCode.split('\n').length || 0;
    const diff = newLen - oldLen;
    const pct = oldLen === 0 ? 100 : Math.round((diff / oldLen) * 100);
    return { oldLen, newLen, diff, pct };
  };

  const { pct } = computeEvolution();

  return (
    <div className="chronicle-card main-card">
      <div className="card-header">
        <h2>🔓 Revelação: {capsule.title}</h2>
        <div className="card-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">Voltar</button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <p style={{ color: '#94a3b8' }}>Desbloqueia em: {new Date(capsule.unlockDate).toLocaleString()}</p>

        {!opened ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <p>{capsule.content}</p>
            </div>
            <div style={{ width: 200, textAlign: 'center' }}>
              <button onClick={tryOpen} className="chronicle-button">Abrir Cápsula</button>
              {!isUnlocked && <div style={{ marginTop: 8, color: '#fca5a5' }}>Tente abrir após a data de desbloqueio.</div>}
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <h4>📜 Código antigo (na cápsula)</h4>
                <SyntaxHighlighter language={capsule.language || 'javascript'} style={atomOneDark}>
                  {capsule.codeSnippet || capsule.content || ''}
                </SyntaxHighlighter>
              </div>

              <div>
                <h4>🧭 Código atual (insere para comparar)</h4>
                <textarea value={currentCode} onChange={(e) => setCurrentCode(e.target.value)} rows={12} className="chronicle-input" />
                <div style={{ marginTop: 8 }}>
                  <strong>Métrica automática:</strong>
                  <div style={{ color: '#e2b714', marginTop: 6 }}>Evoluíste {pct}% em complexidade (estimado)</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
