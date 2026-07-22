interface QuestionTypeConfigProps {
  questionType: 'TRACK_NAME' | 'ARTIST_NAME' | 'FILL_IN_THE_GAP';
  onChangeType: (type: 'TRACK_NAME' | 'ARTIST_NAME' | 'FILL_IN_THE_GAP') => void;
}

export function QuestionTypeConfig({ questionType, onChangeType }: QuestionTypeConfigProps) {
  return (
    <div className="text-left">
      <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">
        Guesser Question Type
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
        {[
          { id: 'TRACK_NAME', label: 'Guess Track Name' },
          { id: 'ARTIST_NAME', label: 'Guess Artist' },
          { id: 'FILL_IN_THE_GAP', label: 'Fill in the Lyrics' },
        ].map((opt) => {
          const isSel = questionType === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeType(opt.id as any)}
              className={`px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${
                isSel
                  ? 'bg-cyan-500/20 border-cyan-400 text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.15)] font-black'
                  : 'bg-black/30 border-cyan-500/10 text-muted-foreground hover:text-white hover:border-cyan-500/25'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground mt-1.5 max-w-lg leading-relaxed">
        Choose what detail players must guess. Track and artist names will automatically hide based on this selector.
      </p>
    </div>
  );
}
