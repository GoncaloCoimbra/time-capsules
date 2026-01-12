import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Countdown from 'react-countdown';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import java from 'react-syntax-highlighter/dist/esm/languages/hljs/java';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import go from 'react-syntax-highlighter/dist/esm/languages/hljs/go';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { capsuleAPI, categoryAPI } from '../services/capsuleService';
import toast from 'react-hot-toast';
import '../pages/Dashboard.css';

// Register a small set of common languages — editor now supports multiple languages
SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('go', go);
SyntaxHighlighter.registerLanguage('json', json);

export default function CreateCapsule() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('// Write any code here — supports any language');
  const [language, setLanguage] = useState('javascript');
  const [unlockDate, setUnlockDate] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [color, setColor] = useState('#e2b714');
  const [showSealModal, setShowSealModal] = useState(false);
  const [sealing, setSealing] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await categoryAPI.getAll();
        setCategories(res.data.categories || []);
      } catch (err) { /* ignore */ }
    };
    load();
  }, []);

  const handleCreate = async () => {
    setSealing(true);
    try {
      const payload = {
        title,
        content,
        unlockDate,
        isPrivate,
        color,
        codeSnippet,
        language
      };

      const res = await capsuleAPI.create(payload);
      const newId = res.data?.capsule?.id || res.data?.id || null;

      toast.success('Cápsula criada e selada! 🎉');
      // animation sequence: navigate back with newId to trigger timeline drop animation
      setTimeout(() => {
        navigate(`/dashboard${newId ? `?newId=${newId}` : ''}`);
      }, 800);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar cápsula: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSealing(false);
      setShowSealModal(false);
    }
  };

  const handleSealComplete = () => {
    // After countdown, create capsule
    handleCreate();
  };

  return (
    <div className="create-capsule-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="chronicle-card main-card">
        <div className="card-header">
          <h2>✨ Criar Cápsula Épica</h2>
          <div className="card-actions">
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">Cancelar</button>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setShowSealModal(true); }}>
          <div className="form-grid">
            <div className="form-group">
              <label>Título</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="chronicle-input" required />
            </div>

            <div className="form-group">
              <label>Data de Desbloqueio</label>
              <input type="datetime-local" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} className="chronicle-input" required />
            </div>

            <div className="form-group full-width">
              <label>Mensagem ao eu do futuro</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="chronicle-input" />
            </div>

            <div className="form-group full-width">
              <label>Editor de Código</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="chronicle-input" style={{ maxWidth: 220 }}>
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="bash">Bash</option>
                      <option value="go">Go</option>
                      <option value="json">JSON</option>
                      <option value="text">Plain Text</option>
                    </select>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>Language</div>
                  </div>
                  <textarea value={codeSnippet} onChange={(e) => setCodeSnippet(e.target.value)} rows={8} className="chronicle-input" style={{ width: '100%' }} />
                </div>

                <div style={{ width: '40%', background: '#0f172a', borderRadius: 8, padding: 8 }}>
                  <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>{language}</div>
                  <div style={{ maxHeight: 260, overflow: 'auto' }}>
                    <SyntaxHighlighter language={language === 'text' ? null : language} style={atomOneDark} customStyle={{ margin: 0, borderRadius: 6 }}>
                      {codeSnippet}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Cor</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="color-input" />
            </div>

            <div className="form-group">
              <label>Visibilidade</label>
              <div>
                <label style={{ marginRight: 8 }}><input type="radio" checked={isPrivate} onChange={() => setIsPrivate(true)} /> Privada</label>
                <label><input type="radio" checked={!isPrivate} onChange={() => setIsPrivate(false)} /> Pública</label>
              </div>
            </div>

            <div className="form-group">
              <label>Categoria</label>
              <select className="chronicle-input">
                <option value="">— Selecionar —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: 18 }}>
            <button type="submit" className="chronicle-button" disabled={sealing || !unlockDate || !title}>Preview & Selar</button>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">Voltar</button>
          </div>
        </form>
      </motion.div>

      {showSealModal && (
        <div className="modal-overlay">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-card">
            <h3>Pré-visualização & Selar</h3>
            <p style={{ color: '#94a3b8' }}>Confirme os dados e selaremos a cápsula. A animação terminará em 5s.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 12 }}>
              <div>
                <h4 style={{ marginBottom: 6 }}>{title}</h4>
                <p style={{ color: '#cbd5e1' }}>{content}</p>
                <div style={{ marginTop: 8 }}>
                  <SyntaxHighlighter language={language} style={atomOneDark} customStyle={{ borderRadius: 6 }}>
                    {codeSnippet}
                  </SyntaxHighlighter>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Selando em</div>
                  <div style={{ fontSize: 22, marginTop: 8 }}>
                    <Countdown date={Date.now() + 5000} onComplete={handleSealComplete} />
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <button onClick={() => { setShowSealModal(false); }} className="btn-secondary">Cancelar</button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
