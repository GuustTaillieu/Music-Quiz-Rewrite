import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Sparkles,
  Dice5,
  Pencil,
  Loader2,
  Plus,
  X,
  KeyRound,
} from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Input } from '#/features/shared/components/ui/input';
import { Badge } from '#/features/shared/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/features/shared/components/ui/dialog';
import { useAiProfile, useGenerateAiQuizMutation } from '../hooks/useAiQuiz';
import { AiQuotaExceededDialog } from './AiQuotaExceededDialog';
import { GeminiApiKeyModal } from './GeminiApiKeyModal';
import { useCreateLobbyMutation } from '#/features/lobby-core';

interface AiQuizGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_PROMPTS = [
  '90s Eurodance & Club Anthems',
  '2000s Pop Nostalgia Sing-Alongs',
  'Classic Rock & Power Ballads',
  'Dutch Party Hits & Nederpop',
  'Modern 2020s TikTok & Chart Toppers',
  '80s Synthpop & New Wave',
];

const PRESET_TAGS = [
  '1980s',
  '1990s',
  '2000s',
  '2010s',
  '2020s',
  'Pop',
  'Rock',
  'Hip-Hop',
  'EDM',
  'Dutch',
  'Family Friendly',
  'High Energy',
];

export function AiQuizGenerateModal({ isOpen, onClose }: AiQuizGenerateModalProps) {
  const navigate = useNavigate();
  const { data: profile } = useAiProfile();
  const generateMutation = useGenerateAiQuizMutation();
  const createLobbyMutation = useCreateLobbyMutation();

  const [prompt, setPrompt] = useState('');
  const [trackCount, setTrackCount] = useState<number>(10);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [targetMode, setTargetMode] = useState<'INSTANT_PLAY' | 'STUDIO'>('INSTANT_PLAY');

  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const [quotaErrorMessage, setQuotaErrorMessage] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = customTagInput.trim();
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags((prev) => [...prev, clean]);
      setCustomTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length < 3) return;

    try {
      const result = await generateMutation.mutateAsync({
        prompt: prompt.trim(),
        trackCount,
        tags: selectedTags,
        targetMode,
      });

      onClose();

      if (targetMode === 'INSTANT_PLAY') {
        // Create lobby directly and navigate to it
        const { lobbyId } = await createLobbyMutation.mutateAsync(result.quiz.id);
        navigate({
          to: '/lobby/$lobbyId',
          params: { lobbyId },
          search: { username: 'Host' },
        });
      } else {
        // Navigate to Studio Editor
        navigate({
          to: '/studio/$quizId',
          params: { quizId: result.quiz.id },
        });
      }
    } catch (err: any) {
      if (
        err.code === 'QUOTA_EXCEEDED' ||
        err.code === 'INSUFFICIENT_CREDITS' ||
        err.status === 429 ||
        err.message?.toLowerCase().includes('quota') ||
        err.message?.toLowerCase().includes('credit')
      ) {
        setQuotaErrorMessage(err.message);
        setShowQuotaDialog(true);
      } else {
        alert(err.message || 'Failed to generate quiz');
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-xl border-cyan-500/30 bg-[#05070f]/95 backdrop-blur-2xl text-white shadow-[0_0_60px_rgba(0,240,255,0.15)] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-left pb-2 border-b border-cyan-500/10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-black flex items-center gap-2 text-white">
                <Sparkles size={20} className="text-[#00f0ff] animate-pulse" />
                Generate Music Quiz with AI
              </DialogTitle>

              {/* Credit / Key Status Pill */}
              <button
                type="button"
                onClick={() => setShowKeyModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[10px] font-bold text-cyan-300 transition-colors cursor-pointer"
              >
                {profile?.hasCustomKey ? (
                  <>
                    <KeyRound size={11} className="text-emerald-400" />
                    <span>Personal Key (Unlimited)</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={11} className="text-[#00f0ff]" />
                    <span>{profile?.aiCredits ?? 5} Free Credits</span>
                  </>
                )}
              </button>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Describe your theme or occasion, pick your preferences, and Gemini AI will curate songs directly from Spotify.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-3 text-left">
            {/* Prompt & Inspiration Pills */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Quiz Theme or Prompt *
              </label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Dutch hits from the 2000s that everyone sings along to at parties"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full rounded-xl bg-black/50 border border-cyan-500/20 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00f0ff] focus:outline-none transition-colors"
                autoFocus
              />

              {/* Prompt Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrompt(p)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-cyan-500/5 hover:bg-cyan-500/15 border border-cyan-500/15 text-slate-300 hover:text-cyan-300 transition-colors"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Song Count Selector */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Number of Songs: <strong className="text-[#00f0ff]">{trackCount} Songs</strong>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setTrackCount(count)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${trackCount === count
                      ? 'bg-cyan-500/20 border-[#00f0ff] text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : 'bg-black/40 border-cyan-500/10 text-muted-foreground hover:border-cyan-500/30'
                      }`}
                  >
                    {count} Tracks
                  </button>
                ))}
              </div>
            </div>

            {/* Tags & Demographic Restrictions (Combobox Style) */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Restrictions, Eras & Demographic Tags
              </label>

              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-black/40 border border-cyan-500/10 rounded-xl">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      className="text-[10px] py-0.5 px-2 flex items-center gap-1 font-bold"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-rose-400 cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Tag Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${isSelected
                        ? 'bg-cyan-500/20 border-[#00f0ff] text-[#00f0ff] font-bold'
                        : 'bg-black/30 border-cyan-500/15 text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Custom Tag Input */}
              <div className="flex gap-2 pt-1">
                <Input
                  type="text"
                  placeholder="Type custom tag & press Enter (e.g. Dutch, Hip-Hop)..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={handleAddCustomTag}
                  className="py-1 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCustomTag}
                  disabled={!customTagInput.trim()}
                  className="shrink-0 text-xs border-cyan-500/20"
                >
                  <Plus size={12} className="mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Launch Mode Selection */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Creation Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetMode('INSTANT_PLAY')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${targetMode === 'INSTANT_PLAY'
                    ? 'bg-cyan-500/15 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.15)] text-white'
                    : 'bg-black/40 border-cyan-500/10 text-muted-foreground hover:border-cyan-500/30'
                    }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <Dice5 size={16} className="text-[#00f0ff]" />
                    Surprise Me (Instant Play)
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Jumps straight to the lobby. You play blind without seeing any answers!
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetMode('STUDIO')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${targetMode === 'STUDIO'
                    ? 'bg-cyan-500/15 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.15)] text-white'
                    : 'bg-black/40 border-cyan-500/10 text-muted-foreground hover:border-cyan-500/30'
                    }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <Pencil size={16} className="text-magenta-400" />
                    Open in Studio Editor
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Review tracklist, customize timings, or add more songs before playing.
                  </p>
                </button>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-cyan-500/10">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>

              <Button
                type="submit"
                variant="cyan"
                size="sm"
                disabled={generateMutation.isPending || prompt.trim().length < 3}
                className="px-5 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 size={13} className="animate-spin mr-1.5" />
                    Generating with Gemini...
                  </>
                ) : targetMode === 'INSTANT_PLAY' ? (
                  <>
                    <Dice5 size={14} className="mr-1.5" /> Generate & Start Lobby
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="mr-1.5" /> Generate & Open Studio
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quota Exceeded Modal */}
      <AiQuotaExceededDialog
        isOpen={showQuotaDialog}
        onClose={() => setShowQuotaDialog(false)}
        onOpenKeySettings={() => setShowKeyModal(true)}
        isCustomKey={profile?.hasCustomKey}
        message={quotaErrorMessage}
      />

      {/* Gemini API Key Settings Modal */}
      <GeminiApiKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
      />
    </>
  );
}
