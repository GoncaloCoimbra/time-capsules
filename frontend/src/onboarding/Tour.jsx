import React from 'react';
import './onboarding.css';

export default function Tour(){
  return (
    <div className="onb-tour">
      <h3>Tour Interactivo</h3>
      <ol>
        <li>Cria a tua primeira cápsula no botão "Criar"</li>
        <li>Define data e tags</li>
        <li>Usa o preview para rever antes de selar</li>
      </ol>
    </div>
  );
}
