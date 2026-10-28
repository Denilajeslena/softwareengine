import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';

interface Patron {
  id: string;
  name: string;
  email: string;
  department: string;
  activeLoans: number;
  standing: 'Good Standing' | 'Overdue Fine';
}

export const LibrarianStudentDirectoryPage: React.FC = () => {
  const patrons: Patron[] = [
    {
      id: 'STU-2024-8841',
      name: 'Alexandra Vance',
      email: 'alex.vance@student.edu',
      department: 'Computer Science',
      activeLoans: 3,
      standing: 'Good Standing',
    },
    {
      id: 'STU-2023-1102',
      name: 'Julian Croft',
      email: 'j.croft@student.edu',
      department: 'Data Science',
      activeLoans: 2,
      standing: 'Good Standing',
    },
    {
      id: 'STU-2024-4421',
      name: 'Maya Lin',
      email: 'm.lin@student.edu',
      department: 'Mathematics',
      activeLoans: 1,
      standing: 'Good Standing',
    },
    {
      id: 'STU-2024-5114',
      name: 'Ethan Winters',
      email: 'e.winters@student.edu',
      department: 'Literature',
      activeLoans: 4,
      standing: 'Overdue Fine',
    },
  ];

  const columns: Column<Patron>[] = [
    {
      header: 'Student Name',
      cell: (item) => (
        <div>
          <span className="font-serif font-bold text-forest-dark block">{item.name}</span>
          <span className="text-xs text-charcoal-muted">{item.email}</span>
        </div>
      ),
    },
    {
      header: 'Student ID',
      accessorKey: 'id',
      cell: (item) => <span className="font-mono text-xs">{item.id}</span>,
    },
    {
      header: 'Department',
      accessorKey: 'department',
    },
    {
      header: 'Active Loans',
      cell: (item) => <span className="font-mono font-bold text-xs">{item.activeLoans} / 5</span>,
    },
    {
      header: 'Standing',
      cell: (item) => (
        <StatusBadge
          size="sm"
          status={item.standing === 'Good Standing' ? 'success' : 'danger'}
          label={item.standing}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <PageHeader
        title="Student Patron Directory"
        subtitle="Lookup student borrowing records, active loan quotas, and verified card standings."
      />

      <DataTable
        columns={columns}
        data={patrons}
        keyExtractor={(item) => item.id}
      />
    </div>
  );
};
