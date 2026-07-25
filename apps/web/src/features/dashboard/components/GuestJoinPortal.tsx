import React from 'react';
import { Headphones, Loader2, ArrowLeft, Play } from 'lucide-react';
import { BsSpotify } from 'react-icons/bs';
import { Button } from '#/features/shared/components/ui/button';
import { Input } from '#/features/shared/components/ui/input';
import { Card } from '#/features/shared/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '#/features/shared/components/ui/input-otp';
import { DASHBOARD_CONSTANTS } from '../constants/dashboardConstants';

interface GuestJoinPortalProps {
  step: 'code' | 'name';
  setStep: (step: 'code' | 'name') => void;
  lobbyCode: string;
  guestName: string;
  setGuestName: (name: string) => void;
  isCodeValidating: boolean;
  isCodeInvalid: boolean;
  joinError: string;
  socialLoginError: string;
  handleCodeChange: (code: string) => void;
  handleJoinLobby: (e?: React.FormEvent) => void;
  handleSpotifyLogin: () => void;
}

export function GuestJoinPortal({
  step,
  setStep,
  lobbyCode,
  guestName,
  setGuestName,
  isCodeValidating,
  isCodeInvalid,
  joinError,
  socialLoginError,
  handleCodeChange,
  handleJoinLobby,
  handleSpotifyLogin,
}: GuestJoinPortalProps) {
  return (
    <div className="relative w-full h-[100dvh] flex flex-col items-center justify-center overflow-hidden px-6 bg-[#05070f]">
      {/* Synthwave grid background */}
      <div className="synth-grid absolute inset-0 pointer-events-none" />

      <Card className="w-full max-w-md p-8 z-10 text-center shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {step === 'code' ? (
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center justify-center p-4 bg-[#1DB954]/10 rounded-2xl border border-[#1DB954]/30 text-[#1DB954] mb-3 shadow-[0_0_15px_rgba(29,185,84,0.15)]">
              <Headphones size={36} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-0.5">SoundQuiz</h2>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-12">
              Powered by Spotify
            </span>

            <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-3">
              Music trivia,<br />
              <span className="text-[#1DB954]">done right.</span>
            </h1>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mb-8">
              Build quizzes from your Spotify library and challenge friends with live multiplayer rounds.
            </p>

            {socialLoginError && (
              <div className="w-full bg-rose-500/10 border border-rose-500/25 text-rose-400 p-3.5 rounded-2xl mb-5 text-xs font-bold text-left flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{socialLoginError}</span>
              </div>
            )}

            <Button
              variant="spotify"
              size="lg"
              onClick={handleSpotifyLogin}
              className="w-full mb-8"
            >
              <BsSpotify size={16} /> Sign In with Spotify
            </Button>

            <div className="w-full flex items-center gap-3 mb-6">
              <div className="h-px bg-cyan-500/10 flex-1" />
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                have a join code?
              </span>
              <div className="h-px bg-cyan-500/10 flex-1" />
            </div>

            <div className="relative w-full mb-3 flex flex-col items-center justify-center">
              <InputOTP
                maxLength={DASHBOARD_CONSTANTS.LOBBY_CODE_MAX_LENGTH}
                value={lobbyCode}
                onChange={(val) => handleCodeChange(val)}
                disabled={isCodeValidating}
              >
                <InputOTPGroup className="gap-1.5 sm:gap-2">
                  {Array.from({ length: DASHBOARD_CONSTANTS.LOBBY_CODE_MAX_LENGTH }).map((_, index) => (
                    <InputOTPSlot aria-invalid={isCodeInvalid} index={index} key={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              {isCodeValidating && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-cyan-400 font-bold animate-pulse">
                  <Loader2 size={14} className="animate-spin" /> Validating lobby code...
                </div>
              )}
            </div>

            {joinError ? (
              <p className="text-[11px] font-bold text-rose-500">{joinError}</p>
            ) : (
              <div className="text-[10px] text-muted-foreground/60 leading-normal">
                Spotify Premium required to create quizzes<br />
                Guests can join and play any quiz
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
              Joining quiz lobby <span className="text-[#00f0ff] font-bold">{lobbyCode}</span>
            </p>

            <form onSubmit={handleJoinLobby} className="w-full space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Choose your username
                </label>
                <Input
                  type="text"
                  required
                  placeholder={DASHBOARD_CONSTANTS.PLACEHOLDERS.USERNAME}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  autoFocus
                  className="py-3"
                />
              </div>

              {joinError && <p className="text-xs font-bold text-rose-500">{joinError}</p>}

              <Button type="submit" variant="default" size="lg" className="w-full mt-2">
                <Play size={16} fill="currentColor" /> Enter Lobby
              </Button>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
}
