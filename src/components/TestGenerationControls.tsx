import { Button } from '@/components/ui/button';

interface TestGenerationControlsProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

export function TestGenerationControls({ onGenerate, isGenerating }: TestGenerationControlsProps) {
  return (
    <Button 
      onClick={onGenerate}
      disabled={isGenerating}
    >
      {isGenerating ? 'Generating...' : 'Generate Tests'}
    </Button>
  );
} 