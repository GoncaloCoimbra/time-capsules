import React from 'react';
import './tags.css';

const icons = ['🏷️','📁','💡','📚','📝','💼','🎯','🌟'];

export default function CategoryIconPicker({ value, onChange }){
  return (
    <div className="cat-icons">
      {icons.map(ic => (
        <button key={ic} className={`cat-icon ${value===ic? 'sel':''}`} onClick={()=>onChange(ic)}>{ic}</button>
      ))}
    </div>
  );
}
