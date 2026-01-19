import React, { useState } from 'react';
import './social.css';

export default function FollowButton({ initial=false }){
  const [following, setFollowing] = useState(initial);
  return (
    <button className={`follow-btn ${following? 'on':''}`} onClick={()=>setFollowing(f=>!f)}>
      {following? 'A seguir' : 'Seguir'}
    </button>
  );
}
