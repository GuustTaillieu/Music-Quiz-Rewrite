import type { FlashBannerInfo } from '../hooks/useModeSwitchFlash';

interface ModeSwitchOverlayProps {
  banner: FlashBannerInfo | null;
}

export function ModeSwitchOverlay({ banner }: ModeSwitchOverlayProps) {
  if (!banner) return null;

  const isSpeed = banner.isSpeed;
  const glowStyle = isSpeed
    ? 'border-[#ff007f]/60 bg-[#160614]/90 shadow-[0_0_35px_rgba(255,0,127,0.45)] text-[#ff007f]'
    : 'border-[#00f0ff]/60 bg-[#04141e]/90 shadow-[0_0_35px_rgba(0,240,255,0.45)] text-[#00f0ff]';

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-sm px-4 flex justify-center">
      <div
        className={`w-full px-5 py-3 rounded-2xl border backdrop-blur-xl flex flex-col items-center justify-center text-center transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${glowStyle}`}
      >
        <span className="text-xl sm:text-2xl font-black uppercase tracking-widest drop-shadow-md">
          {banner.message}
        </span>
        <span className="text-xs sm:text-sm font-semibold text-white/90 tracking-wide mt-0.5">
          {banner.subtext}
        </span>
      </div>
    </div>
  );
}
