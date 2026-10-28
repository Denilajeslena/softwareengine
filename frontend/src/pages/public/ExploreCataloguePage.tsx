import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '@/components/common/SearchBar';
import { BookCard } from '@/components/books/BookCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { DEMO_BOOKS, DEMO_CATEGORIES } from '@/data/demo/books';
import { fetchBooksApi } from '@/services/books';
import { semanticSearchApi, SemanticBookResult } from '@/services/ai';
import { Book } from '@/types';
import {
  BookOpen,
  SlidersHorizontal,
  ArrowUpDown,
  RefreshCw,
  Sparkles,
  Search,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const ExploreCataloguePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All Categories';
  const initialMode = searchParams.get('mode') === 'ai' ? 'ai' : 'standard';

  const [searchMode, setSearchMode] = useState<'standard' | 'ai'>(initialMode);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available'>('all');
  const [sortBy, setSortBy] = useState<'title_asc' | 'title_desc' | 'year_desc' | 'year_asc' | 'rating_desc'>('title_asc');

  const [books, setBooks] = useState<Book[]>(DEMO_BOOKS);
  const [aiResults, setAiResults] = useState<SemanticBookResult[]>([]);
  const [aiMeta, setAiMeta] = useState<{ model: string; fallbackUsed: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([...DEMO_CATEGORIES]);

  const sampleAiPrompts = [
    'Suggest beginner-friendly machine learning books',
    'Operating systems architecture and memory management',
    'Foundational algorithms, complexity and graphs',
    'Classical world history and civilizations',
  ];

  // Fetch books based on current mode
  const loadData = async () => {
    setLoading(true);

    if (searchMode === 'ai' && searchQuery.trim()) {
      const res = await semanticSearchApi(searchQuery, {
        top_k: 8,
        category: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
        available_only: availabilityFilter === 'available',
      });
      if (res.success && res.data) {
        setAiResults(res.data.results);
        setAiMeta({ model: res.data.model, fallbackUsed: res.data.fallbackUsed });
      }
    } else {
      const res = await fetchBooksApi({
        search: searchQuery || undefined,
        category: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
        available: availabilityFilter === 'available' ? true : undefined,
      });
      if (res.success && res.data?.books) {
        setBooks(res.data.books);
        const uniqueCats = Array.from(new Set(res.data.books.map((b) => b.category)));
        if (uniqueCats.length > 0) {
          setCategories(['All Categories', ...uniqueCats.filter((c) => c !== 'All Categories')]);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory, availabilityFilter, searchMode]);

  // Client-side sort for standard mode
  const sortedStandardBooks = useMemo(() => {
    const list = [...books];
    list.sort((a, b) => {
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
      if (sortBy === 'title_desc') return b.title.localeCompare(a.title);
      const yearA = a.year || (a as any).publicationYear || 0;
      const yearB = b.year || (b as any).publicationYear || 0;
      if (sortBy === 'year_desc') return yearB - yearA;
      if (sortBy === 'year_asc') return yearA - yearB;
      if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });
    return list;
  }, [books, sortBy]);

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'All Categories') {
      newParams.delete('category');
    } else {
      newParams.set('category', cat);
    }
    setSearchParams(newParams);
  };

  const handleModeSwitch = (mode: 'standard' | 'ai') => {
    setSearchMode(mode);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('mode', mode);
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn text-left">
      {/* Header with Mode Switcher */}
      <div className="border-b border-ivory-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-gold-dark">
            Catalogue Holdings & Intelligent Discovery
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-forest-dark mt-1">
            Explore Library Catalogue
          </h1>
          <p className="text-sm text-charcoal-muted mt-2 max-w-2xl leading-relaxed">
            Search physical university stacks, inspect real-time availability, or query with natural language using BookMind AI.
          </p>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex items-center gap-1 bg-ivory-cream p-1 rounded-xl border border-ivory-border self-start md:self-auto">
          <button
            onClick={() => handleModeSwitch('standard')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
              searchMode === 'standard'
                ? 'bg-white text-forest shadow-xs'
                : 'text-charcoal-muted hover:text-forest'
            )}
          >
            <Search className="w-3.5 h-3.5" />
            Standard Stack Search
          </button>
          <button
            onClick={() => handleModeSwitch('ai')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
              searchMode === 'ai'
                ? 'bg-forest text-warm-ivory shadow-xs'
                : 'text-charcoal-muted hover:text-forest'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-shelf-gold" />
            BookMind AI
          </button>
        </div>
      </div>

      {/* AI Assistant Banner (when in AI Mode) */}
      {searchMode === 'ai' && (
        <div className="p-4 bg-forest/5 rounded-2xl border border-shelf-gold/40 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-shelf-gold/20 text-shelf-forest rounded-lg">
                <Sparkles className="w-4 h-4 text-shelf-gold" />
              </div>
              <h3 className="font-serif text-sm font-bold text-shelf-forest">
                BookMind AI Semantic Query Assistant
              </h3>
            </div>
            {aiMeta && (
              <span className="text-[10px] font-mono text-charcoal-muted bg-white px-2 py-0.5 rounded border border-ivory-border">
                Engine: {aiMeta.model}
              </span>
            )}
          </div>
          <p className="text-xs text-charcoal-muted">
            Ask questions in everyday conversational language. BookMind converts your research intent into dense semantic embeddings to match title contexts, subject topics, and stack availability.
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-charcoal-muted font-medium">Try asking:</span>
            {sampleAiPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setSearchQuery(prompt)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white hover:bg-warm-sand border border-ivory-border text-forest transition-colors"
              >
                ✨ {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:max-w-xl">
          <SearchBar
            defaultValue={searchQuery}
            onSearch={(val) => setSearchQuery(val)}
            placeholder={
              searchMode === 'ai'
                ? "Ask BookMind AI: e.g. 'Suggest beginner-friendly machine learning books'..."
                : 'Search by title, author, keyword, or ISBN...'
            }
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto text-xs">
          {/* Availability Filter */}
          <div className="flex items-center gap-1">
            <span className="text-charcoal-muted font-medium flex items-center gap-1 mr-1">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filter:
            </span>
            <button
              onClick={() => setAvailabilityFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg border transition-colors',
                availabilityFilter === 'all'
                  ? 'bg-forest text-white border-forest'
                  : 'bg-white text-charcoal border-ivory-border hover:bg-ivory'
              )}
            >
              All Titles
            </button>
            <button
              onClick={() => setAvailabilityFilter('available')}
              className={cn(
                'px-3 py-1.5 rounded-lg border transition-colors',
                availabilityFilter === 'available'
                  ? 'bg-forest text-white border-forest'
                  : 'bg-white text-charcoal border-ivory-border hover:bg-ivory'
              )}
            >
              Available Now
            </button>
          </div>

          {/* Sort Dropdown (Standard Mode Only) */}
          {searchMode === 'standard' && (
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-shelf-forest" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-ivory-border bg-white text-charcoal font-medium focus:outline-none focus:ring-1 focus:ring-forest"
              >
                <option value="title_asc">Title (A - Z)</option>
                <option value="title_desc">Title (Z - A)</option>
                <option value="year_desc">Year (Newest First)</option>
                <option value="year_asc">Year (Oldest First)</option>
                <option value="rating_desc">Highest Rated</option>
              </select>
            </div>
          )}

          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 border border-ivory-border rounded-lg bg-white text-forest hover:bg-ivory transition-colors"
            title="Refresh catalogue"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all',
                isSelected
                  ? 'bg-forest text-gold border-gold/60 shadow-xs'
                  : 'bg-white text-charcoal border-ivory-border hover:border-gold/40'
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Results View */}
      <div>
        <div className="text-xs text-charcoal-muted mb-4 flex items-center justify-between">
          <span>
            {searchMode === 'ai' ? (
              <>
                BookMind AI matched{' '}
                <strong className="text-forest-dark">{aiResults.length}</strong> semantic volumes
                {searchQuery ? ` for "${searchQuery}"` : ''}
              </>
            ) : (
              <>
                Showing <strong className="text-forest-dark">{sortedStandardBooks.length}</strong> matching volumes
              </>
            )}
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-forest hover:underline text-xs"
            >
              Clear search filter
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12">
            <LoadingState
              message={
                searchMode === 'ai'
                  ? 'BookMind AI is projecting query vectors across library stacks...'
                  : 'Searching catalogue volumes and stack availability...'
              }
            />
          </div>
        ) : searchMode === 'ai' ? (
          /* AI Semantic Search Results Grid with Explanations */
          aiResults.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="h-8 w-8 text-forest" />}
              title="No Semantic Matches Found"
              description="BookMind AI couldn't find close conceptual matches for your query. Try rephrasing with subject keywords or selecting one of the suggested prompts above."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {aiResults.map((book) => (
                <div key={book.id} className="flex flex-col space-y-2">
                  <BookCard book={book} />
                  {/* Semantic Match Explanation Pill */}
                  {book.matchExplanation && (
                    <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-950 leading-relaxed">
                      <div className="flex items-center gap-1 font-semibold text-emerald-900 mb-0.5">
                        <Sparkles className="w-3 h-3 text-shelf-gold shrink-0" />
                        <span>AI Match Explanation</span>
                      </div>
                      <p>{book.matchExplanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          /* Standard Catalogue Grid */
          sortedStandardBooks.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-8 w-8 text-forest" />}
              title="No volumes found"
              description="We couldn't find any books matching your active filters. Try searching for broader terms or switching to BookMind AI."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedStandardBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
