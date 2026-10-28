import { BorrowRecord, Reservation, StudentDashboardStats } from '@/types';

export const DEMO_STUDENT_STATS: StudentDashboardStats = {
  currentlyBorrowed: 3,
  activeReservations: 1,
  overdueCount: 0,
  accumulatedFines: 0.00,
  savedToReadingList: 8,
};

export const DEMO_STUDENT_BORROWED: BorrowRecord[] = [
  {
    id: 'br-101',
    bookId: 'b-003',
    bookTitle: 'Artificial Intelligence: A Modern Approach',
    borrowerName: 'Alexandra Vance',
    borrowerId: 'STU-2024-8841',
    borrowDate: '2026-10-15',
    dueDate: '2026-11-05',
    status: 'active',
  },
  {
    id: 'br-102',
    bookId: 'b-002',
    bookTitle: 'Introduction to Algorithms (CLRS)',
    borrowerName: 'Alexandra Vance',
    borrowerId: 'STU-2024-8841',
    borrowDate: '2026-10-18',
    dueDate: '2026-11-08',
    status: 'active',
  },
  {
    id: 'br-103',
    bookId: 'b-007',
    bookTitle: 'Pride and Prejudice',
    borrowerName: 'Alexandra Vance',
    borrowerId: 'STU-2024-8841',
    borrowDate: '2026-10-22',
    dueDate: '2026-11-12',
    status: 'active',
  },
];

export const DEMO_STUDENT_RESERVATIONS: Reservation[] = [
  {
    id: 'res-201',
    bookId: 'b-008',
    bookTitle: '1984',
    userId: 'STU-2024-8841',
    userName: 'Alexandra Vance',
    reservedAt: '2026-10-25',
    status: 'pending',
    pickupDeadline: 'Waiting for return (Est. Nov 2)',
  },
];

export const DEMO_STUDENT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Book Return Reminder',
    message: 'Artificial Intelligence: A Modern Approach is due in 8 days (Nov 5, 2026).',
    date: '2 hours ago',
    unread: true,
    type: 'reminder',
  },
  {
    id: 'notif-2',
    title: 'Reservation Status Update',
    message: 'Your hold position for 1984 has progressed to #1 in queue.',
    date: '1 day ago',
    unread: false,
    type: 'info',
  },
  {
    id: 'notif-3',
    title: 'New Additions in Computer Science',
    message: '5 new acquisitions have arrived in the Systems & Networks collection.',
    date: '3 days ago',
    unread: false,
    type: 'announcement',
  },
];

