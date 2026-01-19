import React, { useState, useEffect } from 'react';
import './landing.css';

export default function Demo() {
  const [value, setValue] = useState(() => {
    try { return localStorage.getItem('jl_demo') || ''; } catch { return ''; }
  });
  const [sealed, setSealed] = useState(() => false);
  const [unlockAt, setUnlockAt] = useState(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => { try { localStorage.setItem('jl_demo', value); } catch {} }, [value]);

  useEffect(() => {
    let id;
    if (sealed && unlockAt) {
      const tick = () => {
        const rem = Math.max(0, Math.floor((unlockAt - Date.now()) / 1000));
        setCountdown(rem);
        if (rem <= 0) { setSealed(false); setUnlockAt(null); clearInterval(id); }
      };
      tick();
      id = setInterval(tick, 500);
    }
    return () => clearInterval(id);
  }, [sealed, unlockAt]);

  const handleSeal = () => {
    const delay = 10; // 10s demo unlock
    const at = Date.now() + delay * 1000;
    setSealed(true);
    setUnlockAt(at);
  };

  return (
    <section className="jl-demo">
      <div className="jl-demo-inner">
        <div>
          <label className="jl-label">Mini-editor</label>
          <textarea
            className="jl-editor"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Escreve algo para selar..."
            disabled={sealed}
          />

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button className="jl-cta jl-cta-primary" onClick={handleSeal} disabled={sealed}>{sealed ? 'Selada' : 'Selar'}</button>
            <button className="jl-cta jl-cta-secondary" onClick={() => { setValue(''); localStorage.removeItem('jl_demo'); }}>Limpar</button>
          </div>
        </div>

        <div className="jl-preview">
          <div className="jl-preview-header">Pré-visualização</div>
          <div className="jl-preview-body">{value || <em>Sem conteúdo</em>}</div>
          {sealed && (
            <div className="jl-seal-overlay">
              <div className="jl-seal">SELADA</div>
              <div className="jl-seal-timer">Desbloqueio: {Math.floor(countdown/60)}:{String(countdown%60).padStart(2,'0')}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
