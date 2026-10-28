import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '@/components/common/SearchBar';
import { BookCard } from '@/components/books/BookCard';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { DEMO_BOOKS } from '@/data/demo/books';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
  GraduationCap,
  Layers,
  Clock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const categories = [
    'Computer Science',
    'Artificial Intelligence',
    'Mathematics',
    'Literature',
    'Science',
    'History',
  ];

  const handleSearch = (query: string) => {
    navigate(`/catalogue?search=${encodeURIComponent(query)}`);
  };

  const featuredBooks = DEMO_BOOKS.filter((b) => b.isFeatured).slice(0, 4);

  return (
    <div className="space-y-16 md:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-forest-dark text-ivory py-16 md:py-24 border-b border-forest-light">
        {/* Background Subtle Scholarly Patterns */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C3A66B_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest border border-forest-light text-gold-light text-xs font-semibold tracking-wide">
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                <span>The University Digital Library Catalogue</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Discover Your Next <br />
                <span className="italic text-gold-light">Great Read</span>
              </h1>

              <p className="text-base sm:text-lg text-ivory/80 max-w-xl font-sans leading-relaxed">
                Welcome to <strong>The Scholar's Shelf</strong> — where knowledge finds its place. Browse thousands of academic texts, research papers, classical literature, and reserved course readings across all university departments.
              </p>

              {/* Prominent Search Bar */}
              <div className="max-w-xl pt-2">
                <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/20 shadow-scholarly-elevated">
                  <SearchBar
                    size="lg"
                    placeholder="Search by title, author, topic, or ISBN..."
                    onSearch={handleSearch}
                  />
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-ivory/60">
                  <span>Popular queries:</span>
                  <button
                    onClick={() => handleSearch('Algorithms')}
                    className="hover:text-gold underline"
                  >
                    Algorithms
                  </button>
                  <span>&bull;</span>
                  <button
                    onClick={() => handleSearch('Artificial Intelligence')}
                    className="hover:text-gold underline"
                  >
                    Artificial Intelligence
                  </button>
                  <span>&bull;</span>
                  <button
                    onClick={() => handleSearch('Physics')}
                    className="hover:text-gold underline"
                  >
                    Physics
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <PrimaryButton
                  size="lg"
                  onClick={() => navigate('/catalogue')}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Explore Complete Catalogue
                </PrimaryButton>
                <SecondaryButton
                  size="lg"
                  onClick={() => navigate('/student')}
                  className="bg-transparent text-white border-forest-light hover:bg-forest"
                >
                  Student Portal
                </SecondaryButton>
              </div>
            </div>

            {/* Right Hero Visual / Illustration */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md bg-forest p-6 rounded-2xl border border-forest-light shadow-scholarly-elevated">
                <div className="flex items-center justify-between pb-4 border-b border-forest-light/60">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-gold" />
                    <span className="font-serif font-bold text-sm text-white">
                      Curated Academic Stacks
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-gold-light bg-forest-dark px-2 py-0.5 rounded border border-forest-light">
                    Holdings Live
                  </span>
                </div>

                {/* Staggered mini book cards simulation */}
                <div className="mt-4 space-y-3">
                  <div className="bg-forest-dark/90 p-3 rounded-lg border border-forest-light/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-serif text-sm font-bold text-ivory">
                        Artificial Intelligence: A Modern Approach
                      </h4>
                      <p className="text-xs text-ivory/60">Stuart Russell & Peter Norvig</p>
                    </div>
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full shrink-0 ml-2">
                      2 Copies Avail
                    </span>
                  </div>

                  <div className="bg-forest-dark/90 p-3 rounded-lg border border-forest-light/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-serif text-sm font-bold text-ivory">
                        Introduction to Algorithms (CLRS)
                      </h4>
                      <p className="text-xs text-ivory/60">Thomas H. Cormen et al.</p>
                    </div>
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full shrink-0 ml-2">
                      4 Copies Avail
                    </span>
                  </div>

                  <div className="bg-forest-dark/90 p-3 rounded-lg border border-forest-light/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-serif text-sm font-bold text-ivory">
                        Linear Algebra Done Right
                      </h4>
                      <p className="text-xs text-ivory/60">Sheldon Axler</p>
                    </div>
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full shrink-0 ml-2">
                      5 Copies Avail
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-forest-light/40 flex items-center justify-between text-xs text-ivory/70">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-gold" /> RFID & Stack Verified
                  </span>
                  <span className="font-serif text-gold italic">Est. 1894</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse By Category Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-ivory-border">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-gold-dark">
              Academic Disciplines
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest-dark mt-1">
              Browse By Category
            </h2>
          </div>
          <p className="text-xs text-charcoal-muted mt-2 md:mt-0 max-w-sm">
            Quickly navigate our university stacks by departmental subject matter and specialized faculties.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((category) => {
            const count = DEMO_BOOKS.filter((b) => b.category === category).length;
            return (
              <div
                key={category}
                onClick={() => navigate(`/catalogue?category=${encodeURIComponent(category)}`)}
                className="group p-4 bg-white rounded-xl border border-ivory-border shadow-scholarly hover:border-gold hover:shadow-scholarly-lg cursor-pointer transition-all text-center flex flex-col items-center justify-center min-h-[120px]"
              >
                <div className="h-10 w-10 rounded-full bg-ivory-cream text-forest group-hover:bg-forest group-hover:text-gold flex items-center justify-center transition-colors mb-2">
                  <Compass className="h-5 w-5" />
                </div>
                <h4 className="font-serif font-bold text-xs text-forest-dark group-hover:text-gold-dark transition-colors line-clamp-1">
                  {category}
                </h4>
                <span className="text-[11px] text-charcoal-muted mt-0.5">
                  {count > 0 ? `${count} Titles` : 'Extensive Stacks'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Book Holdings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-ivory-border">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-gold-dark">
              Hand-picked by Curators
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest-dark mt-1">
              Featured Books & Core Textbooks
            </h2>
          </div>
          <SecondaryButton
            size="sm"
            onClick={() => navigate('/catalogue')}
            rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            className="mt-3 sm:mt-0"
          >
            View All Stacks
          </SecondaryButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {/* Benefits of The Scholar's Shelf */}
      <section className="bg-ivory-cream/60 py-16 border-y border-ivory-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase font-bold tracking-widest text-gold-dark">
              Modern Academic Experience
            </span>
            <h2 className="font-serif text-3xl font-bold text-forest-dark mt-2">
              Why Scholars Love Our Library
            </h2>
            <p className="mt-2 text-sm text-charcoal-muted leading-relaxed">
              Designed specifically for university students, faculty, and academic librarians to simplify study, discovery, and book management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-ivory-border shadow-scholarly flex flex-col items-start text-left">
              <div className="p-3 rounded-lg bg-forest text-gold mb-4">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-forest-dark">
                Curated Academic Collections
              </h3>
              <p className="text-xs md:text-sm text-charcoal-muted mt-2 leading-relaxed">
                Access required syllabi texts, supplementary reading lists, and foundational research manuscripts verified by faculty departments.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-ivory-border shadow-scholarly flex flex-col items-start text-left">
              <div className="p-3 rounded-lg bg-forest text-gold mb-4">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-forest-dark">
                Intelligent Shelf Location
              </h3>
              <p className="text-xs md:text-sm text-charcoal-muted mt-2 leading-relaxed">
                Know exact floor stack numbers and shelf placements instantly, saving valuable research time before you walk through the stacks.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-ivory-border shadow-scholarly flex flex-col items-start text-left">
              <div className="p-3 rounded-lg bg-forest text-gold mb-4">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-forest-dark">
                Seamless Digital Circulation
              </h3>
              <p className="text-xs md:text-sm text-charcoal-muted mt-2 leading-relaxed">
                Track return dates, place holds on high-demand texts, and manage renewals easily from the student and librarian portals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-forest rounded-2xl p-8 sm:p-12 text-white text-center shadow-scholarly-elevated border border-forest-light relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
              Begin Your Scholarly Exploration Today
            </h2>
            <p className="text-sm sm:text-base text-ivory/80 leading-relaxed font-sans">
              "Where Knowledge Finds Its Place." Dive into our comprehensive catalog or open your student dashboard to review your borrowed texts.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <PrimaryButton
                size="lg"
                onClick={() => navigate('/catalogue')}
                className="bg-gold hover:bg-gold-light text-forest-dark font-bold border-gold"
              >
                Explore Catalogue
              </PrimaryButton>
              <SecondaryButton
                size="lg"
                onClick={() => navigate('/student')}
                className="bg-forest-dark text-ivory border-forest-light hover:bg-forest-light"
              >
                Go to Student Portal
              </SecondaryButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
