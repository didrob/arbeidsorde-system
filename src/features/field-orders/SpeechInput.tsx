import React, { useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useSpeechRecognition } from './useSpeechRecognition';
import { cn } from '@/lib/utils';

interface SpeechInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SpeechInput: React.FC<SpeechInputProps> = ({ value, onChange, placeholder }) => {
  const { isListening, transcript, isSupported, startListening, stopListening } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      onChange(transcript);
    }
  }, [transcript, onChange]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[56px] text-base pr-16 resize-none"
        rows={2}
      />
      {isSupported && (
        <button
          type="button"
          onClick={toggleListening}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center',
            'min-h-[48px] min-w-[48px] rounded-full transition-all',
            isListening
              ? 'bg-destructive text-destructive-foreground animate-pulse'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          )}
        >
          {isListening ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
      )}
    </div>
  );
};
