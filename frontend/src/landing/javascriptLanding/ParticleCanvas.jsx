import React, { useRef, useEffect } from 'react';

export default function ParticleCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const container = ref.current;
    if (!container) return;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let w = canvas.width = container.clientWidth;
    let h = canvas.height = container.clientHeight;

    const particles = Array.from({ length: Math.max(8, Math.floor(w / 120)) }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2 + 0.6,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.6 + 0.2
    }));

    let raf = null;
    function draw() {
      ctx.clearRect(0,0,w,h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
        ctx.beginPath();
        ctx.fillStyle = `rgba(226,183,20,${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    function onResize(){
      w = canvas.width = container.clientWidth;
      h = canvas.height = container.clientHeight;
    }

    window.addEventListener('resize', onResize);
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      canvas.remove();
    };
  }, []);

  return <div ref={ref} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}
