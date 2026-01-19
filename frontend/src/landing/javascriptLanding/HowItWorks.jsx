import React from 'react';
import './how.css';

const steps = [
  { title: 'Escreve', desc: 'Cria a tua cápsula com texto, imagens e tags.' },
  { title: 'Sela', desc: 'Define uma data de desbloqueio e sela a cápsula.' },
  { title: 'Partilha', desc: 'Gera links temporários ou guarda em privado.' },
  { title: 'Revê', desc: 'Recebe a surpresa quando o tempo chegar.' }
];

export default function HowItWorks(){
  return (
    <section className="jl-how">
      <div className="jl-how-inner">
        <h3>Como funciona</h3>
        <div className="jl-timeline">
          {steps.map((s, i) => (
            <div className="jl-step" key={i}>
              <div className="jl-step-index">{i+1}</div>
              <div className="jl-step-body">
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
