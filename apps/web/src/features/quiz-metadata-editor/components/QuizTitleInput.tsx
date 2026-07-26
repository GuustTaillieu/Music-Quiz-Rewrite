import { Input } from '#/features/shared/components/ui/input';
import { Badge } from '#/features/shared/components/ui/badge';
import { GitFork } from 'lucide-react';

interface QuizTitleInputProps {
  title: string;
  onChangeTitle: (val: string) => void;
  forkedFromCreator?: string | null;
}

export function QuizTitleInput({ title, onChangeTitle, forkedFromCreator }: QuizTitleInputProps) {
  return (
    <div className="flex flex-col flex-1 w-0 pr-4 min-w-lg">
      <div className="flex items-center gap-2 ">
        <div className="inline-grid items-center w-full max-w-xs sm:max-w-md md:max-w-lg">
          <span className="col-start-1 row-start-1 invisible whitespace-pre text-xl font-black px-3 py-0.5 pointer-events-none truncate">
            {title || 'Untitled Quiz Title...'}
          </span>
          <Input
            type="text"
            placeholder="Untitled Quiz Title..."
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            className="col-start-1 row-start-1 w-full bg-transparent border-b border-transparent hover:border-cyan-500/20 focus:border-[#00f0ff] focus:outline-none text-xl font-black text-white placeholder-cyan-500/20 py-0.5 truncate"
          />
        </div>
        {forkedFromCreator && (
          <Badge variant="magenta" className="text-[8px] py-0.5 px-2 font-bold shrink-0">
            <GitFork size={10} className="mr-1" /> @{forkedFromCreator}
          </Badge>
        )}
      </div>
      {title.length > 0 && title.trim().length < 2 && (
        <p className="text-[10px] text-rose-400 font-bold mt-0.5">
          Title must be at least 2 characters long.
        </p>
      )}
    </div>
  );
}
