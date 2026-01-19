import React, { useState } from 'react';
import './search.css';

export default function SearchBar({ onSearch = ()=>{} }){
  const [q, setQ] = useState('');
  return (
    <div className="search-bar">
      <input placeholder="Pesquisar cápsulas, tags..." value={q} onChange={e=>setQ(e.target.value)} />
      <button onClick={()=>onSearch(q)} className="jl-cta">Pesquisar</button>
    </div>
  );
}
