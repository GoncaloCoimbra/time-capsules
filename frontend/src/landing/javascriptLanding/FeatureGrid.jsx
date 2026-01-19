import React from 'react';
import FeatureCard from './FeatureCard';
import './features.css';

const sample = [
  { title: 'Editor Rico', desc: 'Formatação, imagens, e autosave', icon: '✍️' },
  { title: 'Partilha Temporária', desc: 'Links que expiram', icon: '🔗' },
  { title: 'Categorias Visuais', desc: 'Organiza com ícones e cores', icon: '🏷️' },
  { title: 'Notificações', desc: 'Lembretes e alertas', icon: '🔔' },
  { title: 'Pesquisa Avançada', desc: 'Filtros e highlights', icon: '🔎' },
  { title: 'Gamificação', desc: 'XP, badges e leaderboards', icon: '🏆' },
  { title: 'Colaboração', desc: 'Co-autoria em cápsulas', icon: '👥' },
  { title: 'Customização', desc: 'Temas e backgrounds', icon: '🎨' }
];

export default function FeatureGrid(){
  return (
    <section className="jl-features">
      <div className="jl-features-inner">
        {sample.map((s, i) => <FeatureCard key={i} title={s.title} desc={s.desc} icon={s.icon} />)}
      </div>
    </section>
  );
}
