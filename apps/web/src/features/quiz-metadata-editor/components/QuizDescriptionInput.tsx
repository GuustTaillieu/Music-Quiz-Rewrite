import { Input } from '#/features/shared/components/ui/input';

interface QuizDescriptionInputProps {
  description: string;
  onChangeDescription: (val: string) => void;
}

export function QuizDescriptionInput({ description, onChangeDescription }: QuizDescriptionInputProps) {
  return (
    <Input
      type="text"
      placeholder="Add quiz descriptions here..."
      value={description}
      onChange={(e) => onChangeDescription(e.target.value)}
      className="bg-transparent border-b border-transparent hover:border-cyan-500/20 focus:border-[#00f0ff] focus:outline-none text-xs text-muted-foreground truncate max-w-lg mt-0.5 placeholder-cyan-500/10 py-0.5"
    />
  );
}
