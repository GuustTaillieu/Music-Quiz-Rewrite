import { useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { Input } from '#/features/shared/components/ui/input';
import { useAuth } from '#/features/auth';
import { useValidateLobbyCode } from '#/features/lobby-core';

export function JoinCodeInput() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { lobbyCode, isValidating, isInvalid, errorMessage, handleCodeChange } = useValidateLobbyCode((code) => {
    navigate({
      to: '/lobby/$lobbyId',
      params: { lobbyId: code },
      search: { username: user?.name ?? 'Host' },
    });
  });

  return (
    <div className="flex flex-col items-end">
      <div className="relative">
        <Input
          type="text"
          maxLength={6}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Join Code"
          value={lobbyCode}
          onChange={(e) => handleCodeChange(e.target.value.replace(/\D/g, ''))}
          className={`py-1.5 px-3 text-xs w-36 font-mono font-bold ${isInvalid ? 'border-rose-500 text-rose-400' : ''}`}
        />
        {isValidating && (
          <Loader2 size={12} className="animate-spin text-cyan-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
        )}
      </div>
      {isInvalid && (
        <span className="text-[10px] text-rose-400 font-bold mt-1 max-w-[160px] text-right leading-tight">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
