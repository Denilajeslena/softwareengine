import React from 'react';
import { MapPin, Clock, Award, ShieldCheck } from 'lucide-react';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useNavigate } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 text-left">
      {/* Title */}
      <div className="border-b border-ivory-border pb-6">
        <span className="text-xs uppercase font-bold tracking-widest text-gold-dark">
          Academic Heritage & Mission
        </span>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-forest-dark mt-1">
          About The Scholar's Shelf
        </h1>
        <p className="text-base text-charcoal-muted mt-2 leading-relaxed">
          Where Knowledge Finds Its Place. Serving university students, faculty researchers, and scholars worldwide.
        </p>
      </div>

      {/* History and Mission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4 text-sm text-charcoal leading-relaxed">
          <h2 className="font-serif text-xl font-bold text-forest-dark">
            A Modern Digital Sanctuary for Learning
          </h2>
          <p>
            Established as a cornerstone of college intellectual life, <strong>The Scholar's Shelf</strong> bridges timeless library traditions with modern digital circulation. Our collection spans classical literature, state-of-the-art computational algorithms, deep learning papers, pure mathematics, and primary historical manuscripts.
          </p>
          <p>
            Our core mission is to make scholarly knowledge effortlessly accessible, whether you are preparing for exams, pursuing advanced thesis research, or discovering foundational classics.
          </p>
        </div>

        <div className="bg-ivory-cream p-6 rounded-xl border border-ivory-border space-y-4">
          <h3 className="font-serif font-bold text-forest-dark text-base">
            Library At A Glance
          </h3>
          <div className="space-y-3 text-xs text-charcoal">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-forest shrink-0" />
              <span>Central Campus Library, Main Quadrangle (North Building)</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-forest shrink-0" />
              <span>Monday – Friday: 07:30 AM – 11:00 PM | Weekends: 09:00 AM – 09:00 PM</span>
            </div>
            <div className="flex items-center gap-3">
              <Award className="h-4 w-4 text-forest shrink-0" />
              <span>Over 85,000 Catalogued Physical & Digital Stacks</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-forest shrink-0" />
              <span>Automated Circulation, RFID Tracking & Course Reserves</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stack Organization Guide */}
      <div className="space-y-6 pt-4">
        <h2 className="font-serif text-2xl font-bold text-forest-dark">
          Navigating Campus Stacks
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg border border-ivory-border shadow-2xs">
            <h4 className="font-serif font-bold text-sm text-forest-dark">Stack 1 — Level 1</h4>
            <p className="text-xs text-charcoal-muted mt-1">Physics, Chemistry, Astronomy & Natural Sciences</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-ivory-border shadow-2xs">
            <h4 className="font-serif font-bold text-sm text-forest-dark">Stack 2 — Level 1</h4>
            <p className="text-xs text-charcoal-muted mt-1">Pure Mathematics, Applied Statistics & Calculus</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-ivory-border shadow-2xs">
            <h4 className="font-serif font-bold text-sm text-forest-dark">Stack 3 — Level 2</h4>
            <p className="text-xs text-charcoal-muted mt-1">Computer Science, Systems & Software Engineering</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-ivory-border shadow-2xs">
            <h4 className="font-serif font-bold text-sm text-forest-dark">Stack 4 — Level 2</h4>
            <p className="text-xs text-charcoal-muted mt-1">Artificial Intelligence, Robotics & Machine Learning</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-ivory-border shadow-2xs">
            <h4 className="font-serif font-bold text-sm text-forest-dark">Stack 5 — Level 3</h4>
            <p className="text-xs text-charcoal-muted mt-1">World History, Anthropology & Ancient Civilizations</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-ivory-border shadow-2xs">
            <h4 className="font-serif font-bold text-sm text-forest-dark">Stack 6 — Level 3</h4>
            <p className="text-xs text-charcoal-muted mt-1">Literature, Poetry, Drama & Literary Criticism</p>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="p-6 bg-forest text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold">Have Questions or Need Research Help?</h3>
          <p className="text-xs text-ivory/80 mt-1">
            Our reference librarians are available daily at the Information Desk or via online enquiry.
          </p>
        </div>
        <PrimaryButton
          size="sm"
          onClick={() => navigate('/catalogue')}
          className="bg-gold text-forest-dark hover:bg-gold-light border-gold shrink-0"
        >
          Explore Catalogue
        </PrimaryButton>
      </div>
    </div>
  );
};
