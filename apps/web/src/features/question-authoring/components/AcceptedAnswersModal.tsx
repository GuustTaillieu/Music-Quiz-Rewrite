import { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, Trash2 } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Input } from '#/features/shared/components/ui/input';
import { generateAnswerSuggestions } from '../utils/answerSuggestions';

interface AcceptedAnswersModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldLabel: string;
  defaultAnswer: string;
  acceptedAnswers: string[];
  onSave: (updated: string[]) => void;
}

export function AcceptedAnswersModal({
  isOpen,
  onClose,
  fieldLabel,
  defaultAnswer,
  acceptedAnswers,
  onSave,
}: AcceptedAnswersModalProps) {
  const [inputs, setInputs] = useState<string[]>(['']);

  useEffect(() => {
    if (isOpen) {
      let initialList: string[] = [];
      if (acceptedAnswers && acceptedAnswers.length > 0) {
        initialList = [...acceptedAnswers];
      } else if (defaultAnswer && defaultAnswer.trim()) {
        initialList = generateAnswerSuggestions(defaultAnswer);
      }

      // Ensure there is an extra empty field at the end for typing
      if (initialList.length === 0 || initialList[initialList.length - 1].trim() !== '') {
        initialList.push('');
      }

      setInputs(initialList);
    }
  }, [isOpen, acceptedAnswers, defaultAnswer]);

  if (!isOpen) return null;

  const handleInputChange = (index: number, val: string) => {
    const next = [...inputs];
    next[index] = val;

    // If typing at least 2 characters in the last input field, spawn another empty input field underneath
    if (val.trim().length >= 2 && index === next.length - 1) {
      next.push('');
    }

    setInputs(next);
  };

  const handleRemoveField = (index: number) => {
    const next = inputs.filter((_, i) => i !== index);
    // Ensure there's always at least 1 input field (or trailing empty input)
    if (next.length === 0 || next[next.length - 1].trim() !== '') {
      next.push('');
    }
    setInputs(next);
  };

  const handleAutoGenerate = () => {
    const suggestions = generateAnswerSuggestions(defaultAnswer);
    const existingClean = inputs.map((s) => s.trim()).filter((s) => s.length >= 2);
    const merged = Array.from(new Set([...suggestions, ...existingClean]));
    merged.push('');
    setInputs(merged);
  };

  const handleSave = () => {
    const validAnswers = inputs
      .map((s) => s.trim())
      .filter((s) => s.length >= 2);
    onSave(validAnswers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0a0d18] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl flex flex-col text-white max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/10 mb-4 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Accepted Variations
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Allowed answers for <span className="text-cyan-400 font-bold">{fieldLabel}</span>: &quot;{defaultAnswer}&quot;
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-cyan-400 hover:text-white cursor-pointer"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Auto-generate helper bar */}
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-3.5 mb-4 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-cyan-300 font-semibold flex items-center gap-2">
            <Sparkles size={16} className="text-[#00f0ff] shrink-0" />
            <span>Auto-fill variations (lowercase, stripped special chars)</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAutoGenerate}
            className="shrink-0 text-xs font-bold gap-1 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 cursor-pointer"
          >
            <Sparkles size={14} /> Auto Prefill
          </Button>
        </div>

        {/* Scrollable List of Input Fields */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 min-h-[160px] max-h-[340px]">
          {inputs.map((val, idx) => {
            const canDelete = val.trim().length >= 2 || idx !== inputs.length - 1;

            return (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-cyan-500/60 w-5 text-right shrink-0">
                  {idx + 1}.
                </span>
                <Input
                  type="text"
                  placeholder={idx === inputs.length - 1 ? 'Start typing another accepted answer...' : 'Accepted answer...'}
                  value={val}
                  onChange={(e) => handleInputChange(idx, e.target.value)}
                  className={`flex-1 text-xs py-2 bg-black/40 border-cyan-500/20 focus:border-cyan-400 ${canDelete ? 'text-white font-semibold' : 'text-muted-foreground'
                    }`}
                />
                {canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveField(idx)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer shrink-0"
                    title="Remove answer"
                  >
                    <Trash2 size={15} />
                  </Button>
                ) : (
                  <div className="w-8 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-cyan-500/10 mt-4 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-cyan-500/20 text-muted-foreground hover:text-white cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleSave}
            className="gap-1.5 cursor-pointer font-bold"
          >
            <CheckCircle2 size={16} /> Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
