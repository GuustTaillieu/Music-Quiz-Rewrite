interface CavaVisualizerProps {
  isPlaying: boolean;
}

export function CavaVisualizer({ isPlaying }: CavaVisualizerProps) {
  const bars = [40, 70, 35, 90, 60, 80, 45, 100, 50, 75, 30, 85];

  return (
    <div className="flex items-end justify-center gap-1.5 h-10 py-1">
      {bars.map((height, idx) => (
        <div
          key={idx}
          style={{
            height: isPlaying ? `${height}%` : '20%',
            animationDelay: `${idx * 0.08}s`,
          }}
          className={`w-1.5 rounded-full transition-all duration-300 ${
            isPlaying
              ? 'bg-gradient-to-t from-cyan-500 to-[#00f0ff] animate-pulse shadow-[0_0_8px_rgba(0,240,255,0.6)]'
              : 'bg-cyan-950/40'
          }`}
        />
      ))}
    </div>
  );
}
