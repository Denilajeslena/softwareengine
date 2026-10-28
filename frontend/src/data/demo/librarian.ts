import { LibrarianDashboardStats } from '@/types';

export const DEMO_LIBRARIAN_STATS: LibrarianDashboardStats = {
  totalTitles: 1845,
  totalCopies: 5240,
  availableCopies: 4120,
  activeLoans: 1120,
  overdueLoans: 28,
  pendingReservations: 43,
};

export const BORROWING_TREND_DATA = [
  { month: 'May', loans: 420, returns: 390 },
  { month: 'Jun', loans: 510, returns: 480 },
  { month: 'Jul', loans: 320, returns: 350 },
  { month: 'Aug', loans: 680, returns: 590 },
  { month: 'Sep', loans: 940, returns: 880 },
  { month: 'Oct', loans: 1120, returns: 1040 },
];

export const POPULAR_CATEGORIES_DATA = [
  { category: 'Computer Science', count: 380, fill: '#183D32' },
  { category: 'AI & Data Science', count: 320, fill: '#235345' },
  { category: 'Mathematics', count: 210, fill: '#C3A66B' },
  { category: 'Literature', count: 190, fill: '#A6884F' },
  { category: 'Science', count: 160, fill: '#4E5D57' },
  { category: 'History', count: 120, fill: '#102B24' },
];

export const RECENT_TRANSACTIONS = [
  {
    id: 'TXN-9041',
    bookTitle: 'Artificial Intelligence: A Modern Approach',
    studentName: 'Julian Croft',
    studentId: 'STU-2023-1102',
    action: 'Borrowed',
    date: '2026-10-28 10:14 AM',
    status: 'Active',
  },
  {
    id: 'TXN-9040',
    bookTitle: 'Linear Algebra Done Right',
    studentName: 'Maya Lin',
    studentId: 'STU-2024-4421',
    action: 'Returned',
    date: '2026-10-28 09:45 AM',
    status: 'Completed',
  },
  {
    id: 'TXN-9039',
    bookTitle: 'The C Programming Language',
    studentName: 'Devon Reed',
    studentId: 'STU-2025-9012',
    action: 'Renewed',
    date: '2026-10-28 09:12 AM',
    status: 'Active',
  },
  {
    id: 'TXN-9038',
    bookTitle: '1984',
    studentName: 'Ethan Winters',
    studentId: 'STU-2024-5114',
    action: 'Overdue Notice Sent',
    date: '2026-10-27 04:30 PM',
    status: 'Flagged',
  },
  {
    id: 'TXN-9037',
    bookTitle: 'The Feynman Lectures on Physics',
    studentName: 'Clara Oswald',
    studentId: 'STU-2023-3398',
    action: 'Returned',
    date: '2026-10-27 02:15 PM',
    status: 'Completed',
  },
];

export const LOW_INVENTORY_ALERTS = [
  {
    id: 'b-008',
    title: '1984',
    author: 'George Orwell',
    available: 0,
    total: 11,
    queue: 4,
    status: 'Critical — All Copies Checked Out',
  },
  {
    id: 'b-004',
    title: 'Deep Learning',
    author: 'Ian Goodfellow et al.',
    available: 1,
    total: 6,
    queue: 2,
    status: 'Low — 1 Copy Left',
  },
  {
    id: 'b-003',
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell & Peter Norvig',
    available: 2,
    total: 10,
    queue: 3,
    status: 'Moderate — High Circulation Rate',
  },
];

