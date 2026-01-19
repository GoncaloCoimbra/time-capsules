import React from 'react';
import { useNavigate } from 'react-router-dom';
import './final.css';

export default function FinalCTA(){
  const navigate = useNavigate();
  return (
    <section className="jl-final">
      <div className="jl-final-inner">
        <h2>Pronto para começar a sua viagem temporal?</h2>
        <p>Cria hoje a tua primeira cápsula e surpreende-te no futuro.</p>
        <div>
          <button className="jl-cta jl-cta-primary" onClick={() => navigate('/register')}>Registar</button>
          <button className="jl-cta jl-cta-secondary" onClick={() => navigate('/dashboard')}>Explorar Demo</button>
        </div>
      </div>
    </section>
  );
}
