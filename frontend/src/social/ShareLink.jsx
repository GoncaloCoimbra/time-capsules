import React from 'react';
import './social.css';

export default function ShareLink({ url }){
  const copy = async ()=>{ try{ await navigator.clipboard.writeText(url); alert('Link copiado'); }catch{ alert('Não foi possível copiar'); } };
  return (
    <div className="share-link">
      <input value={url} readOnly />
      <button onClick={copy} className="jl-cta">Copiar</button>
    </div>
  );
}
