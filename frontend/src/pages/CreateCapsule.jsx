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

// Register languages
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
  const [codeSnippet, setCodeSnippet] = useState('// Write your code here\nconsole.log("Hello Future Me!");\n\nfunction timeCapsule() {\n  return "This will be unlocked in the future!";\n}');
  const [language, setLanguage] = useState('javascript');
  const [unlockDate, setUnlockDate] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [color, setColor] = useState('#e2b714');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSealModal, setShowSealModal] = useState(false);
  const [sealing, setSealing] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await categoryAPI.getAll();
        setCategories(res.data.categories || []);
      } catch (err) { 
        console.warn('Could not load categories:', err);
      }
    };
    load();
    
    // Set default unlock date to 1 year from now
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() + 1);
    setUnlockDate(defaultDate.toISOString().slice(0, 16));
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
        language,
        categoryId: selectedCategory
      };

      const res = await capsuleAPI.create(payload);
      const newId = res.data?.capsule?.id || res.data?.id || null;

      toast.success('Cápsula criada e selada com sucesso! 🎉', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#0f172a',
          color: '#e2b714',
          border: '1px solid #e2b714'
        }
      });
      
      // Navigate back to dashboard after animation
      setTimeout(() => {
        navigate(`/dashboard${newId ? `?newId=${newId}` : ''}`);
      }, 800);
    } catch (err) {
      console.error('Erro ao criar cápsula:', err);
      toast.error('Erro ao criar cápsula: ' + (err?.response?.data?.message || err.message), {
        duration: 5000,
        position: 'top-right'
      });
    } finally {
      setSealing(false);
      setShowSealModal(false);
    }
  };

  const handleSealComplete = () => {
    handleCreate();
  };

  // Countdown renderer
  const renderCountdown = ({ seconds, completed }) => {
    if (completed) {
      return <span>Selando...</span>;
    } else {
      return <span>{seconds}s</span>;
    }
  };

  return (
    <div className="create-capsule-page">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="chronicle-card main-card"
      >
        <div className="card-header">
          <h2>✨ Criar Nova Cápsula do Tempo</h2>
          <div className="card-actions">
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">
              <i className="fas fa-arrow-left"></i> Cancelar
            </button>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setShowSealModal(true); }}>
          <div className="form-grid">
            <div className="form-group">
              <label>
                <i className="fas fa-heading"></i> Título
              </label>
              <input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="chronicle-input" 
                placeholder="Dê um título épico à sua cápsula"
                required 
              />
            </div>

            <div className="form-group">
              <label>
                <i className="fas fa-calendar-alt"></i> Data de Desbloqueio
              </label>
              <input 
                type="datetime-local" 
                value={unlockDate} 
                onChange={(e) => setUnlockDate(e.target.value)} 
                className="chronicle-input" 
                required 
              />
              <small style={{ color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                Escolha uma data no futuro
              </small>
            </div>

            <div className="form-group full-width">
              <label>
                <i className="fas fa-envelope-open-text"></i> Mensagem para o eu do futuro
              </label>
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                rows={4} 
                className="chronicle-input" 
                placeholder="Escreva uma mensagem para você mesmo no futuro..."
              />
            </div>

            <div className="form-group full-width">
              <label>
                <i className="fas fa-code"></i> Editor de Código
              </label>
              <div className="language-selector">
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)} 
                  className="chronicle-input" 
                  style={{ maxWidth: 220 }}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="bash">Bash/Shell</option>
                  <option value="go">Go</option>
                  <option value="json">JSON</option>
                  <option value="text">Texto Simples</option>
                </select>
                <span className="tag" style={{ background: 'rgba(226, 183, 20, 0.1)', color: '#e2b714' }}>
                  {language.toUpperCase()}
                </span>
              </div>
              
              <div className="code-editor-container">
                <div style={{ flex: 1 }}>
                  <textarea 
                    value={codeSnippet} 
                    onChange={(e) => setCodeSnippet(e.target.value)} 
                    rows={12} 
                    className="chronicle-input code-textarea"
                    placeholder="Escreva seu código aqui..."
                  />
                </div>

                <div className="code-preview">
                  <div className="code-preview-header">
                    <h4>
                      <i className="fas fa-eye"></i> Pré-visualização
                    </h4>
                    <span className="preview-badge">
                      <i className="fas fa-code"></i> {language}
                    </span>
                  </div>
                  <div className="code-preview-content">
                    <SyntaxHighlighter 
                      language={language === 'text' ? null : language} 
                      style={atomOneDark} 
                      customStyle={{ 
                        margin: 0, 
                        borderRadius: 8,
                        fontSize: '13px',
                        background: 'transparent'
                      }}
                    >
                      {codeSnippet}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>
                <i className="fas fa-palette"></i> Cor da Cápsula
              </label>
              <div className="color-picker-container">
                <div 
                  className="color-preview" 
                  style={{ background: color }}
                  title="Cor selecionada"
                ></div>
                <input 
                  type="color" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)} 
                  className="color-input" 
                  title="Selecionar cor"
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <i className="fas fa-eye"></i> Visibilidade
              </label>
              <div className="radio-group">
                <div 
                  className={`radio-option ${isPrivate ? 'selected' : ''}`}
                  onClick={() => setIsPrivate(true)}
                >
                  <input 
                    type="radio" 
                    checked={isPrivate} 
                    onChange={() => setIsPrivate(true)} 
                  />
                  <i className="fas fa-lock"></i>
                  <span>Privada</span>
                  <small style={{ color: '#94a3b8', fontSize: '12px' }}>Só você</small>
                </div>
                <div 
                  className={`radio-option ${!isPrivate ? 'selected' : ''}`}
                  onClick={() => setIsPrivate(false)}
                >
                  <input 
                    type="radio" 
                    checked={!isPrivate} 
                    onChange={() => setIsPrivate(false)} 
                  />
                  <i className="fas fa-globe"></i>
                  <span>Pública</span>
                  <small style={{ color: '#94a3b8', fontSize: '12px' }}>Comunidade</small>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>
                <i className="fas fa-tags"></i> Categoria
              </label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="chronicle-input"
              >
                <option value="">— Selecionar Categoria —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {categories.length === 0 && (
                <div className="no-categories">
                  <small>Nenhuma categoria disponível</small>
                  <button type="button" className="link-btn">
                    <i className="fas fa-plus"></i> Criar nova categoria
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="chronicle-button" 
              disabled={sealing || !unlockDate || !title}
            >
              <i className="fas fa-seal"></i> Pré-visualizar e Selar Cápsula
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')} 
              className="btn-secondary"
            >
              <i className="fas fa-times"></i> Cancelar
            </button>
          </div>
        </form>
      </motion.div>

      {showSealModal && (
        <div className="modal-overlay">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="modal-card"
          >
            <h3>🔒 Selar Cápsula do Tempo</h3>
            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
              Confirme os dados abaixo. Sua cápsula será selada em 5 segundos.
            </p>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 280px', 
              gap: '24px',
              marginBottom: '30px'
            }}>
              <div>
                <div style={{ 
                  background: 'rgba(30, 41, 59, 0.5)', 
                  borderRadius: '12px', 
                  padding: '20px',
                  border: '1px solid rgba(226, 183, 20, 0.2)'
                }}>
                  <h4 style={{ 
                    color: '#e2b714', 
                    marginBottom: '12px',
                    fontSize: '18px'
                  }}>
                    <i className="fas fa-capsules"></i> {title}
                  </h4>
                  
                  {content && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ 
                        color: '#94a3b8', 
                        fontSize: '12px',
                        marginBottom: '4px'
                      }}>
                        Mensagem:
                      </div>
                      <p style={{ 
                        color: '#cbd5e1', 
                        margin: 0,
                        lineHeight: '1.5'
                      }}>
                        {content}
                      </p>
                    </div>
                  )}
                  
                  <div style={{ 
                    marginTop: '16px',
                    borderTop: '1px solid rgba(226, 183, 20, 0.1)',
                    paddingTop: '16px'
                  }}>
                    <div style={{ 
                      color: '#94a3b8', 
                      fontSize: '12px',
                      marginBottom: '8px'
                    }}>
                      Código ({language}):
                    </div>
                    <div style={{ 
                      background: '#0f172a', 
                      borderRadius: '8px',
                      padding: '12px',
                      maxHeight: '150px',
                      overflow: 'auto'
                    }}>
                      <SyntaxHighlighter 
                        language={language} 
                        style={atomOneDark} 
                        customStyle={{ 
                          margin: 0, 
                          borderRadius: 6,
                          fontSize: '12px',
                          background: 'transparent'
                        }}
                      >
                        {codeSnippet}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#94a3b8',
                    marginBottom: '8px'
                  }}>
                    <i className="fas fa-hourglass-half"></i> Selando em:
                  </div>
                  <div className="countdown-timer">
                    <Countdown 
                      date={Date.now() + 5000} 
                      onComplete={handleSealComplete}
                      renderer={renderCountdown}
                    />
                  </div>
                </div>

                <div style={{ 
                  background: 'rgba(30, 41, 59, 0.5)', 
                  borderRadius: '12px', 
                  padding: '16px',
                  border: '1px solid rgba(226, 183, 20, 0.2)',
                  marginBottom: '16px'
                }}>
                  <div style={{ 
                    color: '#94a3b8', 
                    fontSize: '12px',
                    marginBottom: '8px'
                  }}>
                    Detalhes:
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: '6px'
                    }}>
                      <span style={{ color: '#cbd5e1', fontSize: '12px' }}>Visibilidade:</span>
                      <span style={{ 
                        color: isPrivate ? '#e2b714' : '#2bcbba',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {isPrivate ? 'Privada' : 'Pública'}
                      </span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: '6px'
                    }}>
                      <span style={{ color: '#cbd5e1', fontSize: '12px' }}>Data de abertura:</span>
                      <span style={{ color: '#e2b714', fontSize: '12px' }}>
                        {new Date(unlockDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1', fontSize: '12px' }}>Cor:</span>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        background: color,
                        borderRadius: '4px',
                        border: '2px solid rgba(255,255,255,0.2)'
                      }}></div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                  <button 
                    onClick={() => { setShowSealModal(false); }} 
                    className="btn-secondary"
                    disabled={sealing}
                    style={{ width: '100%' }}
                  >
                    <i className="fas fa-times"></i> Cancelar
                  </button>
                  <button 
                    onClick={handleCreate}
                    className="chronicle-button"
                    disabled={sealing}
                    style={{ width: '100%' }}
                  >
                    <i className="fas fa-seal"></i> Selar Agora
                  </button>
                </div>
              </div>
            </div>

            <div style={{ 
              background: 'rgba(226, 183, 20, 0.1)', 
              border: '1px solid rgba(226, 183, 20, 0.3)',
              borderRadius: '8px', 
              padding: '12px',
              textAlign: 'center'
            }}>
              <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
              <span style={{ color: '#e2b714', fontSize: '13px' }}>
                Após selar, sua cápsula não poderá ser alterada até a data de desbloqueio.
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}