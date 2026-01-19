import React, { useState } from 'react';
import './footer.css';

export default function Footer(){
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const handleSubmit = (e) => { e.preventDefault(); setSent(true); setEmail(''); };
  return (
    <footer className="jl-footer">
      <div className="jl-footer-inner">
        <div className="jl-newsletter">
          <h4>Subscreve a newsletter</h4>
          <form onSubmit={handleSubmit} className="jl-news-form">
            <input placeholder="O teu email" value={email} onChange={e=>setEmail(e.target.value)} />
            <button className="jl-cta jl-cta-primary" type="submit">Subscrever</button>
          </form>
          {sent && <div className="jl-note">Obrigado — verás novidades no teu email.</div>}
        </div>
        <div className="jl-links">
          <a href="/">Home</a>
          <a href="/terms">Termos</a>
          <a href="/privacy">Privacidade</a>
        </div>
      </div>
    </footer>
  );
}
