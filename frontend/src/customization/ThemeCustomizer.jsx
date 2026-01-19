import React, { useState } from 'react';
import './customization.css';

export default function ThemeCustomizer(){
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const apply = (t)=>{ setTheme(t); localStorage.setItem('theme', t); document.body.classList.toggle('light-mode', t==='light'); };
  return (
    <div className="theme-customizer">
      <button onClick={()=>apply('dark')}>Dark</button>
      <button onClick={()=>apply('light')}>Light</button>
    </div>
  );
}
