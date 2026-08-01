import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Headphones, Loader2, ArrowLeft, Play, QrCode } from 'lucide-react';
import { BsSpotify } from 'react-icons/bs';
import { Button } from '#/features/shared/components/ui/button';
import { Input } from '#/features/shared/components/ui/input';
import { Card } from '#/features/shared/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '#/features/shared/components/ui/input-otp';
import { useAuthActions } from '#/features/auth';
import { useValidateLobbyCode } from '#/features/lobby-core';
import { useDeviceCapability } from '#/features/shared/hooks/useDeviceCapability';
import { InAppQRScannerModal } from './InAppQRScannerModal';

interface GuestJoinPortalProps {
  initialLobbyCode?: string;
}

export function GuestJoinPortal({ initialLobbyCode }: GuestJoinPortalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'code' | 'name'>('code');
  const [guestName, setGuestName] = useState('');
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const { signInWithSpotify, loginError } = useAuthActions();
  const { canScanQR } = useDeviceCapability();

  const {
    lobbyCode,
    isValidating: isCodeValidating,
    isInvalid: isCodeInvalid,
    errorMessage: joinError,
    handleCodeChange,
  } = useValidateLobbyCode(() => {
    setStep('name');
  }, initialLobbyCode);

  const handleJoinLobby = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!lobbyCode || !guestName.trim()) return;

    navigate({
      to: '/guest/lobby/$lobbyId',
      params: { lobbyId: lobbyCode },
      search: { username: guestName.trim() },
    });
  };

  return (
    <div className="relative w-full h-dvh flex flex-col items-center justify-center overflow-hidden px-6 bg-[#05070f]">
      <div className="synth-grid absolute inset-0 pointer-events-none" />

      <Card className="w-full max-w-md p-8 z-10 text-center shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {step === 'code' ? (
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center justify-center p-4 bg-spotify/10 rounded-2xl border border-spotify/30 text-spotify mb-3 shadow-[0_0_15px_rgba(29,185,84,0.15)]">
              <Headphones size={36} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-0.5">SoundQuiz</h2>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-8">
              Powered by Spotify
            </span>

            <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-3">
              Music trivia,<br />
              <span className="text-spotify">done right.</span>
            </h1>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mb-8">
              Build quizzes from your Spotify library and challenge friends with live multiplayer rounds.
            </p>

            {loginError && (
              <div className="w-full bg-rose-500/10 border border-rose-500/25 text-rose-400 p-3.5 rounded-2xl mb-5 text-xs font-bold text-left flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{loginError}</span>
              </div>
            )}

            {/* Desktop Only: Spotify Login Button */}
            <div className="hidden md:block w-full mb-8">
              <Button
                variant="spotify"
                size="lg"
                onClick={() => signInWithSpotify()}
                className="w-full"
              >
                <BsSpotify size={16} /> Sign In with Spotify
              </Button>
            </div>

            {/* Mobile with camera support: Scan QR Code Button */}
            {canScanQR && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setIsQRScannerOpen(true)}
                className="w-full mb-6 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 cursor-pointer gap-2 font-bold shadow-[0_0_15px_rgba(0,240,255,0.1)]"
              >
                <QrCode size={18} /> Scan Lobby QR Code
              </Button>
            )}

            <div className="w-full flex items-center gap-3 mb-6">
              <div className="h-px bg-cyan-500/10 flex-1" />
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                {canScanQR ? 'or enter code manually' : 'enter join code'}
              </span>
              <div className="h-px bg-cyan-500/10 flex-1" />
            </div>

            {/* Split XXX - XXX OTP Input */}
            <div className="relative w-full mb-4 flex flex-col items-center justify-center">
              <InputOTP
                maxLength={6}
                value={lobbyCode}
                onChange={(val) => handleCodeChange(val)}
                disabled={isCodeValidating}
                inputMode="numeric"
              >
                <InputOTPGroup className="gap-1.5 sm:gap-2">
                  <InputOTPSlot aria-invalid={isCodeInvalid} index={0} />
                  <InputOTPSlot aria-invalid={isCodeInvalid} index={1} />
                  <InputOTPSlot aria-invalid={isCodeInvalid} index={2} />
                </InputOTPGroup>

                <InputOTPSeparator className="text-cyan-400/60 font-bold px-1" />

                <InputOTPGroup className="gap-1.5 sm:gap-2">
                  <InputOTPSlot aria-invalid={isCodeInvalid} index={3} />
                  <InputOTPSlot aria-invalid={isCodeInvalid} index={4} />
                  <InputOTPSlot aria-invalid={isCodeInvalid} index={5} />
                </InputOTPGroup>
              </InputOTP>

              {isCodeValidating && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-cyan-400 font-bold animate-pulse">
                  <Loader2 size={14} className="animate-spin" /> Validating lobby code...
                </div>
              )}
            </div>

            {joinError ? (
              <p className="text-[11px] font-bold text-rose-500 mb-2">{joinError}</p>
            ) : (
              <div className="text-[10px] text-muted-foreground/60 leading-normal">
                <span className="hidden md:inline">Spotify Premium required to host & create quizzes.<br /></span>
                Guests can join and play on any device.
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-start text-left">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('code')}
              className="mb-6 cursor-pointer -ml-2 text-cyan-400 hover:text-cyan-300"
            >
              <ArrowLeft size={14} /> Back
            </Button>

            <h2 className="text-2xl font-black text-white mb-1">Enter Nickname</h2>
            <p className="text-muted-foreground text-xs mb-6">
              Joining quiz lobby <span className="text-[#00f0ff] font-bold font-mono">{lobbyCode.length === 6 ? `${lobbyCode.slice(0, 3)}-${lobbyCode.slice(3)}` : lobbyCode}</span>
            </p>

            <form onSubmit={handleJoinLobby} className="w-full space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Choose your username
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. MusicMaster"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  autoFocus
                  className="py-3"
                />
              </div>

              <Button type="submit" variant="default" size="lg" className="w-full mt-2">
                <Play size={16} fill="currentColor" /> Enter Lobby
              </Button>
            </form>
          </div>
        )}
      </Card>

      <InAppQRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={(scannedCode) => handleCodeChange(scannedCode)}
      />
    </div>
  );
}
