import React, { useState } from 'react';
import './pricing.css';

export default function PricingTable(){
  const [annual, setAnnual] = useState(true);
  const plans = [
    { name: 'Free', priceMonthly: 0, features: ['Criar cápsulas', 'Partilha básica'] },
    { name: 'Pro', priceMonthly: 6, features: ['Editor Rico', 'Partilha avançada', 'Mais espaço'] },
    { name: 'Teams', priceMonthly: 18, features: ['Colaboração', 'Admin tools', 'SLA'] }
  ];

  return (
    <section className="jl-pricing">
      <div className="jl-pricing-inner">
        <h3>Planos</h3>
        <div className="jl-pricing-toggle">
          <label className={`toggle ${annual ? 'on' : ''}`} onClick={() => setAnnual(!annual)}>
            <span>{annual ? 'Anual' : 'Mensal'}</span>
          </label>
        </div>
        <div className="jl-pricing-grid">
          {plans.map((p,i) => (
            <div className={`jl-plan ${p.name==='Pro'? 'highlight':''}`} key={i}>
              <h4>{p.name}</h4>
              <div className="jl-plan-price">{p.priceMonthly}{annual? '/m (facturado anual)':'/m'}</div>
              <ul>
                {p.features.map((f,idx) => <li key={idx}>{f}</li>)}
              </ul>
              <button className="jl-cta jl-cta-primary">Escolher</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
