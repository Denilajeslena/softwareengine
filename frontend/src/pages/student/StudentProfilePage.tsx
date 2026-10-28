import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { QrCode, User as UserIcon, Mail, Building, ShieldCheck } from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();

  const name = user?.name || 'Alexandra Vance';
  const email = user?.email || 'alex.vance@student.university.edu';
  const studentId = user?.student_id || 'STU-2024-8841';
  const department = user?.department || 'School of Computing & Mathematical Sciences';

  return (
    <div className="space-y-6 text-left max-w-4xl">
      <PageHeader
        title="Student Library Profile"
        subtitle="University library card identification, verified faculty enrollment, and borrowing standing."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Digital Library Card Badge */}
        <div className="bg-forest text-ivory p-6 rounded-2xl border border-forest-light shadow-scholarly-elevated space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-forest-light/60">
              <span className="font-serif font-bold text-sm text-gold-light">
                The Scholar's Shelf
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-ivory/70">
                Library Pass
              </span>
            </div>

            <div className="mt-4">
              <h3 className="font-serif font-bold text-lg text-white">{name}</h3>
              <p className="text-xs text-gold-light/90">ID: {studentId}</p>
              <p className="text-xs text-ivory/70 mt-1 line-clamp-1">{department}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-forest-light/60 flex items-center justify-between">
            <div className="font-mono text-[10px] text-ivory/60">
              Valid Thru: 2028-06-30
            </div>
            <div className="p-2 bg-white rounded-md text-forest shrink-0" title="QR Identification Placeholder (Part 5)">
              <QrCode className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="md:col-span-2 bg-white rounded-xl border border-ivory-border p-6 shadow-scholarly space-y-4">
          <h3 className="font-serif font-bold text-base text-forest-dark pb-2 border-b border-ivory-cream">
            Academic Enrollment Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-charcoal-muted flex items-center gap-1.5 mb-0.5">
                <UserIcon className="h-3.5 w-3.5 text-forest" /> Full Name:
              </span>
              <span className="font-semibold text-charcoal text-sm">{name}</span>
            </div>
            <div>
              <span className="text-charcoal-muted flex items-center gap-1.5 mb-0.5">
                <ShieldCheck className="h-3.5 w-3.5 text-forest" /> Student ID:
              </span>
              <span className="font-semibold font-mono text-charcoal text-sm">{studentId}</span>
            </div>
            <div>
              <span className="text-charcoal-muted flex items-center gap-1.5 mb-0.5">
                <Mail className="h-3.5 w-3.5 text-forest" /> Institutional Email:
              </span>
              <span className="font-semibold text-charcoal">{email}</span>
            </div>
            <div>
              <span className="text-charcoal-muted flex items-center gap-1.5 mb-0.5">
                <Building className="h-3.5 w-3.5 text-forest" /> Department:
              </span>
              <span className="font-semibold text-charcoal">{department}</span>
            </div>
            <div>
              <span className="text-charcoal-muted block mb-0.5">Account Standing:</span>
              <span className="font-semibold text-forest">Good Standing (No Overdue Fines)</span>
            </div>
            <div>
              <span className="text-charcoal-muted block mb-0.5">Active Role:</span>
              <span className="font-semibold text-forest uppercase font-mono">
                {user?.role || 'STUDENT'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
