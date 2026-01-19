// Very small autosave helper (frontend only)
export function saveDraft(key, data){
  try{ localStorage.setItem(key, JSON.stringify(data)); }catch{}
}
export function loadDraft(key){
  try{ const v = localStorage.getItem(key); return v? JSON.parse(v): null; }catch{ return null }
}
