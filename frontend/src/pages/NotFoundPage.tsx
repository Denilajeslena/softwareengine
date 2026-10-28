import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookX, ArrowLeft, Home } from 'lucide-react';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-ivory-border shadow-scholarly-elevated space-y-5">
        <div className="w-16 h-16 rounded-full bg-ivory-cream border border-ivory-border text-forest mx-auto flex items-center justify-center">
          <BookX className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-bold tracking-widest text-gold-dark">
            Error 404 &bull; Volume Missing
          </span>
          <h1 className="font-serif text-3xl font-bold text-forest-dark">
            Page Not In The Stacks
          </h1>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            The page or catalog shelf you requested does not exist or has been relocated to another stack location.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <SecondaryButton
            size="sm"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Go Back
          </SecondaryButton>
          <PrimaryButton
            size="sm"
            onClick={() => navigate('/')}
            leftIcon={<Home className="h-4 w-4" />}
          >
            Return to Home
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

