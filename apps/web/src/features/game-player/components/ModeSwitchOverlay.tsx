import type { FlashBannerInfo } from '../hooks/useModeSwitchFlash';

interface ModeSwitchOverlayProps {
  banner: FlashBannerInfo | null;
}

export function ModeSwitchOverlay({ banner }: ModeSwitchOverlayProps) {
  if (!banner) return null;

  const colorHex = banner.isSpeed ? '#ff007f' : '#00f0ff';
  const shadowGlow = banner.isSpeed
    ? 'shadow-[inset_0_0_160px_rgba(255,0,127,0.9),_0_0_90px_rgba(255,0,127,0.8)] border-[#ff007f]'
    : 'shadow-[inset_0_0_160px_rgba(0,240,255,0.9),_0_0_90px_rgba(0,240,255,0.8)] border-[#00f0ff]';

  return (
    <div
      className={`fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-black/75 backdrop-blur-md transition-all duration-300 border-8 sm:border-[16px] ${shadowGlow}`}
    >
      <div className="flex flex-col items-center justify-center space-y-3 px-6 text-center animate-in fade-in zoom-in duration-300">
        <h1
          style={{ textShadow: `0 0 35px ${colorHex}` }}
          className={`text-5xl sm:text-7xl font-black uppercase tracking-widest ${
            banner.isSpeed ? 'text-[#ff007f]' : 'text-[#00f0ff]'
          }`}
        >
          {banner.message}
        </h1>
        <p className="text-lg sm:text-2xl font-black text-white tracking-wide drop-shadow-lg">
          {banner.subtext}
        </p>
      </div>
    </div>
  );
}
