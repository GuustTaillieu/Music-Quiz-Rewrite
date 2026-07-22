import { useEffect, useRef } from 'react';

export function CavaVisualizer({ isPlaying }: { isPlaying: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barCount = 20;
    const barWidth = 6;
    const barGap = 3;

    // Fit canvas bounds
    canvas.width = barCount * (barWidth + barGap) - barGap;
    canvas.height = 40;

    // Phase angles for wave oscillators
    const phases = Array.from({ length: barCount }, () => Math.random() * Math.PI * 2);
    const speeds = Array.from({ length: barCount }, () => 0.08 + Math.random() * 0.08);

    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < barCount; i++) {
        // Calculate dynamic height based on sine oscillators
        let height = 4;
        if (isPlaying) {
          phases[i] += speeds[i] * Math.min(deltaTime * 60, 3);
          const sine = Math.sin(phases[i]);
          height = 4 + Math.floor(Math.abs(sine) * (canvas.height - 8));
        } else {
          // Subtle idle floating pulse
          const sine = Math.sin(Date.now() * 0.002 + i * 0.5);
          height = 4 + Math.floor(Math.abs(sine) * 6);
        }

        const x = i * (barWidth + barGap);
        const y = canvas.height - height;

        // Draw neon cyan / magenta gradient bar
        const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
        gradient.addColorStop(0, '#ff007f'); // Magenta top
        gradient.addColorStop(1, '#00f0ff'); // Cyan bottom

        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, 3);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return <canvas ref={canvasRef} className="block" />;
}
