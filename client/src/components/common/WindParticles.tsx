import { useEffect, useRef } from 'react';

/**
 * WindParticles — A full-screen HTML5 Canvas background that renders
 * flowing wind-like particles drifting across the screen.
 * Pure JS + Canvas API, no external libraries.
 */

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  wobbleOffset: number;
  wobbleSpeed: number;
  opacity: number;
  life: number;
  maxLife: number;
}

interface WindParticlesProps {
  /** Number of particles to render */
  count?: number;
  /** Base opacity of particles (0-1) */
  baseOpacity?: number;
  /** Teal-tinted particles vs pure white */
  tealTint?: boolean;
}

export function WindParticles({
  count = 80,
  baseOpacity = 0.25,
  tealTint = true,
}: WindParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handler
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    const createParticle = (randomX = true): Particle => ({
      x: randomX ? Math.random() * canvas.offsetWidth : -10,
      y: Math.random() * canvas.offsetHeight,
      size: Math.random() * 1.8 + 0.5,
      speedX: Math.random() * 1.5 + 0.4,
      speedY: (Math.random() - 0.5) * 0.3,
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.015 + 0.005,
      opacity: Math.random() * baseOpacity + 0.05,
      life: 0,
      maxLife: Math.random() * 400 + 200,
    });

    particlesRef.current = Array.from({ length: count }, () => createParticle(true));

    // Animation loop
    let time = 0;
    const animate = () => {
      time++;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      // Trail effect — semi-transparent clear for motion streaks
      ctx.fillStyle = 'rgba(10, 14, 26, 0.12)';
      ctx.fillRect(0, 0, w, h);

      particlesRef.current.forEach((p, i) => {
        // Update position with sine-wave wobble
        p.x += p.speedX;
        p.y += p.speedY + Math.sin(time * p.wobbleSpeed + p.wobbleOffset) * 0.4;
        p.life++;

        // Fade in/out based on life
        const lifeFraction = p.life / p.maxLife;
        let alpha = p.opacity;
        if (lifeFraction < 0.1) {
          alpha *= lifeFraction / 0.1; // Fade in
        } else if (lifeFraction > 0.8) {
          alpha *= (1 - lifeFraction) / 0.2; // Fade out
        }

        // Reset if off-screen or life expired
        if (p.x > w + 20 || p.y < -20 || p.y > h + 20 || p.life > p.maxLife) {
          particlesRef.current[i] = createParticle(false);
          return;
        }

        // Draw particle
        if (tealTint) {
          // Teal-white gradient tint
          const tealAmount = Math.random() > 0.6 ? 1 : 0.3;
          ctx.fillStyle = `rgba(${Math.floor(0 + 200 * (1 - tealAmount))}, ${Math.floor(212 * tealAmount + 240 * (1 - tealAmount))}, ${Math.floor(180 * tealAmount + 255 * (1 - tealAmount))}, ${alpha})`;
        } else {
          ctx.fillStyle = `rgba(240, 244, 255, ${alpha})`;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw motion trail line for larger particles
        if (p.size > 1.2) {
          ctx.strokeStyle = `rgba(0, 212, 180, ${alpha * 0.3})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.speedX * 6, p.y - p.speedY * 6);
          ctx.stroke();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [count, baseOpacity, tealTint]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
