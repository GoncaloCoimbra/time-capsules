import React from 'react';
import './tags.css';

export default function TagsChips({ tags=[], onRemove=()=>{} }){
  return (
    <div className="tags-chips">
      {tags.map(t => (
        <span className="tag-chip" key={t}>
          {t} <button onClick={()=>onRemove(t)} className="tag-remove">×</button>
        </span>
      ))}
    </div>
  );
}
