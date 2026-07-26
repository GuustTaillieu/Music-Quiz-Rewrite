import { Badge } from '#/features/shared/components/ui/badge';

interface QuestionTypeConfigProps {
  questionType: 'TRACK_NAME' | 'ARTIST_NAME' | 'FILL_IN_THE_GAP';
  onChangeType: (type: 'TRACK_NAME' | 'ARTIST_NAME' | 'FILL_IN_THE_GAP') => void;
}

const QUESTION_TYPE_OPTIONS = [
  { id: 'TRACK_NAME', label: 'Track Title', description: 'Players guess the song title.' },
  { id: 'ARTIST_NAME', label: 'Artist Name', description: 'Players guess the artist name.' },
  { id: 'FILL_IN_THE_GAP', label: 'Lyrics Gap', description: 'Players fill in masked words in the lyrics.' },
];

export function QuestionTypeConfig({ questionType, onChangeType }: QuestionTypeConfigProps) {
  return (
    <div className="text-left">
      <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">
        Guesser Question Type
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
        {QUESTION_TYPE_OPTIONS.map((opt) => {
          const isSel = questionType === opt.id;
          return (
            <Badge
              key={opt.id}
              onClick={() => onChangeType(opt.id as any)}
              variant={isSel ? 'magenta' : 'outline'}
              className="cursor-pointer"
            >
              {opt.label}
            </Badge>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground mt-1.5 max-w-lg leading-relaxed">
        {QUESTION_TYPE_OPTIONS.find((opt) => opt.id === questionType)?.description}
      </p>
    </div>
  );
}
