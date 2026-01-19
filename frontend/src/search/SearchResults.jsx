import React from 'react';
import './search.css';

export default function SearchResults({ results = [] }){
  return (
    <div className="search-results">
      {results.length===0 ? <div className="empty">Sem resultados</div> : (
        <ul>
          {results.map(r => (<li key={r.id}><strong>{r.title}</strong><p>{r.snippet}</p></li>))}
        </ul>
      )}
    </div>
  );
}
