import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './landing.css';
import ParticleCanvas from './ParticleCanvas';

function Typewriter({ text, speed = 60 }) {
  const [out, setOut] = useState('');
  useEffect(() => {
    let i = 0;
    setOut('');
    const id = setInterval(() => {
      setOut((s) => s + text[i]);
      i += 1;
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return <span>{out}</span>;
}

export default function Hero() {
  const navigate = useNavigate();
  const handleSaberMais = () => {
    const section = document.querySelector('.jl-how');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="jl-hero">
      <ParticleCanvas />
      <div className="jl-hero-inner">
        <div className="jl-logo" aria-hidden>
          <div className="jl-logo-glitch" data-text="Temporal">Temporal</div>
        </div>

        <h1 className="jl-tagline">
          <Typewriter text={'Escreve para o futuro — guarda memórias, volta a elas'} />
          <span className="jl-type-cursor">▍</span>
        </h1>

        <p className="jl-sub">Sela momentos, define uma data de desbloqueio e surpreende-te quando o tempo chegar.</p>

        <div className="jl-ctas">
          <button className="jl-cta jl-cta-primary" onClick={() => navigate('/register')}>Experimentar Demo</button>
          <button className="jl-cta jl-cta-secondary" onClick={handleSaberMais}>Saber Mais</button>
        </div>

        <div className="jl-scroll-indicator" aria-hidden>
          <div className="chevrons">⌄</div>
        </div>
      </div>
    </section>
  );
}
