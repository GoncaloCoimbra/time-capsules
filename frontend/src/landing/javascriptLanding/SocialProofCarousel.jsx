import React, { useEffect, useState, useRef } from 'react';
import './social.css';

const items = [
  { id: 1, text: 'Adorei guardar memórias — voltei a chorar a rir.', author: 'Ana, Lisboa' },
  { id: 2, text: 'O design é lindo e o tempo torna tudo mais mágico.', author: 'João, Porto' },
  { id: 3, text: 'Funcionalidade de partilha temporária salvou-me tantas surpresas.', author: 'Marta, Braga' },
  { id: 4, text: 'Simples e com atenção aos detalhes — recomendo!', author: 'Rui, Faro' }
];

export default function SocialProofCarousel({ autoplay = true, interval = 3500 }){
  const [index, setIndex] = useState(0);
  const len = items.length;
  const ref = useRef(null);

  useEffect(() => {
    if (!autoplay) return;
    const id = setInterval(() => setIndex(i => (i + 1) % len), interval);
    return () => clearInterval(id);
  }, [autoplay, interval, len]);

  const goto = (i) => setIndex((i + len) % len);

  return (
    <section className="jl-social">
      <div className="jl-social-inner">
        <h3 className="jl-social-title">O que a comunidade diz</h3>
        <div className="jl-carousel" ref={ref}>
          {items.map((it, i) => (
            <blockquote key={it.id} className={`jl-testimonial ${i === index ? 'active' : ''}`}>
              <p className="jl-test-text">“{it.text}”</p>
              <footer className="jl-test-author">— {it.author}</footer>
            </blockquote>
          ))}
        </div>

        <div className="jl-carousel-controls">
          <button onClick={() => goto(index - 1)} aria-label="Anterior">‹</button>
          {items.map((_, i) => (
            <button key={i} className={`dot ${i === index ? 'on' : ''}`} onClick={() => goto(i)} aria-label={`Ir para ${i+1}`} />
          ))}
          <button onClick={() => goto(index + 1)} aria-label="Próximo">›</button>
        </div>
      </div>
    </section>
  );
}
