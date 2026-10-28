import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ShieldCheck } from 'lucide-react';

export const AdminRoleManagementPage: React.FC = () => {
  const roles = [
    {
      role: 'Student Patron',
      badge: 'Public & Academic',
      permissions: [
        'Browse library catalogue and search volumes',
        'Request borrow transactions for available books (up to 5)',
        'Place holds / reservations on checked out volumes',
        'Create and maintain personal reading lists',
        'Receive automated email and web due-date notifications',
      ],
    },
    {
      role: 'Librarian Staff',
      badge: 'Circulation & Cataloguing',
      permissions: [
        'Catalogue new books and manage stack placements',
        'Process physical checkout loans and inspect book returns',
        'Manage overdue notices, hold queues, and student records',
        'Execute physical stack inventory audits and stock reorders',
        'View and export departmental circulation trend reports',
      ],
    },
    {
      role: 'System Administrator',
      badge: 'Full Governance',
      permissions: [
        'Configure circulation policy rules (durations, fines, quotas)',
        'Manage user roles and institutional SSO bindings',
        'Inspect immutable audit trails and security activity logs',
        'Monitor backend health, database replica sets, and background workers',
      ],
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <PageHeader
        title="Role-Based Access Control (RBAC)"
        subtitle="Hierarchy of roles and capability boundaries across the university library management platform."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((r) => (
          <div
            key={r.role}
            className="bg-white rounded-xl border border-ivory-border p-6 shadow-scholarly flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-ivory-cream mb-4">
                <h3 className="font-serif font-bold text-base text-forest-dark">{r.role}</h3>
                <span className="text-[10px] font-semibold text-gold-dark bg-ivory-cream px-2 py-0.5 rounded border border-ivory-border">
                  {r.badge}
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-charcoal">
                {r.permissions.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-forest shrink-0 mt-0.5" />
                    <span className="leading-tight">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 mt-6 border-t border-ivory-cream text-center text-xs text-charcoal-muted italic">
              Permissions enforced in Part 2
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
