import React, { useEffect, useRef, useState } from 'react';
import './editor.css';

// Lazy-load rich editor if available (react-quill), fallback to textarea
export default function EditorWrapper({ value='', onChange=()=>{}, autosaveKey='capsule_editor', autoSaveMs=10000 }){
  const [EditorComp, setEditorComp] = useState(null);
  const [val, setVal] = useState(value);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async ()=>{
      try{
        const m = await import('react-quill');
        if (!mounted.current) return;
        setEditorComp(() => m.default);
      }catch(e){
        // module not installed; keep textarea
      }
    })();
    return ()=>{ mounted.current = false };
  }, []);

  useEffect(() => { const id = setInterval(()=>{ try{ localStorage.setItem(autosaveKey, val);}catch{} }, autoSaveMs); return ()=>clearInterval(id); }, [val, autosaveKey, autoSaveMs]);

  useEffect(()=> setVal(value), [value]);

  const handleChange = (v) => { setVal(v); onChange(v); };

  if (EditorComp) {
    const Quill = EditorComp;
    return <Quill value={val} onChange={handleChange} />;
  }

  return <textarea className="jl-rich-fallback" value={val} onChange={e=>handleChange(e.target.value)} />;
}
