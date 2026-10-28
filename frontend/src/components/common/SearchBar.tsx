import React, { useState } from 'react';
import { Search, X, Mic, MicOff } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAccessibility } from '@/context/AccessibilityContext';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  defaultValue?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search by title, author, topic or ISBN...',
  onSearch,
  defaultValue = '',
  className,
  size = 'md',
  autoFocus = false,
}) => {
  const [query, setQuery] = useState(defaultValue);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const { isListening, voiceSupported, startVoiceSearch, stopVoiceSearch } = useAccessibility();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (onSearch) {
      onSearch(val.trim());
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopVoiceSearch();
      return;
    }

    if (!voiceSupported) {
      setVoiceNotice('Voice search is not supported in this browser. Please type your query.');
      setTimeout(() => setVoiceNotice(null), 4000);
      return;
    }

    setVoiceNotice('Listening... Speak book title, author, or research query.');
    startVoiceSearch(
      (transcript) => {
        setQuery(transcript);
        setVoiceNotice(`Heard: "${transcript}"`);
        if (onSearch) {
          onSearch(transcript);
        }
        setTimeout(() => setVoiceNotice(null), 3000);
      },
      (err) => {
        setVoiceNotice(`Voice error: ${err}`);
        setTimeout(() => setVoiceNotice(null), 4000);
      }
    );
  };

  const sizeClasses = {
    sm: 'py-1.5 pl-8 pr-16 text-xs',
    md: 'py-2.5 pl-10 pr-20 text-sm',
    lg: 'py-3.5 pl-12 pr-24 text-base',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5 left-2.5',
    md: 'h-4 w-4 left-3.5',
    lg: 'h-5 w-5 left-4',
  };

  return (
    <div className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-charcoal-muted pointer-events-none transition-colors',
            iconSizes[size]
          )}
        />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={isListening ? 'Listening... Speak your book or topic search now' : placeholder}
          autoFocus={autoFocus}
          aria-label="Search library catalogue"
          className={cn(
            'w-full bg-white text-charcoal placeholder:text-sage-600/70',
            'border border-ivory-border rounded-lg shadow-sm transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold',
            isListening ? 'border-gold bg-gold/5 ring-2 ring-gold/40' : '',
            sizeClasses[size]
          )}
        />

        {/* Action Buttons Right (Clear & Voice Mic) */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search query"
              className="text-charcoal-muted hover:text-charcoal p-1 rounded focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleVoiceToggle}
            aria-label={isListening ? 'Stop voice recognition' : 'Start voice book search'}
            title={isListening ? 'Listening... Click to stop' : 'Search by voice'}
            className={cn(
              'p-1.5 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-gold',
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-xs'
                : 'text-charcoal-muted hover:text-forest hover:bg-ivory'
            )}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        </div>
      </form>

      {/* Voice Status Notification Banner */}
      {voiceNotice && (
        <div className="absolute top-full left-0 mt-1 z-30 px-3 py-1.5 rounded-lg bg-forest-dark text-warm-ivory text-xs shadow-scholarly border border-gold/30 animate-in fade-in">
          {voiceNotice}
        </div>
      )}
    </div>
  );
};
