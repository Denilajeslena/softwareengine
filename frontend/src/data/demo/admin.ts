import { AdminDashboardStats } from '@/types';

export const DEMO_ADMIN_STATS: AdminDashboardStats = {
  totalUsers: 2450,
  activeStudents: 2310,
  activeLibrarians: 18,
  totalAuditLogs: 14290,
  systemHealth: 'Optimal',
  storageUsage: '14.2 GB / 100 GB',
};

export const DEMO_USERS_TABLE = [
  {
    id: 'USR-001',
    name: 'Dr. Eleanor Vance',
    email: 'e.vance@university.edu',
    role: 'Librarian (Chief Cataloguer)',
    status: 'Active',
    lastActive: '12 mins ago',
  },
  {
    id: 'USR-002',
    name: 'Marcus Brody',
    email: 'm.brody@university.edu',
    role: 'Librarian (Circulation)',
    status: 'Active',
    lastActive: '45 mins ago',
  },
  {
    id: 'USR-003',
    name: 'Alexandra Vance',
    email: 'alex.vance@student.edu',
    role: 'Student',
    status: 'Active',
    lastActive: '2 hours ago',
  },
  {
    id: 'USR-004',
    name: 'Liam Chen',
    email: 'l.chen@student.edu',
    role: 'Student',
    status: 'Suspended (Overdue Fine > $50)',
    statusType: 'warning',
    lastActive: '3 days ago',
  },
  {
    id: 'USR-005',
    name: 'Sarah Connor',
    email: 's.connor@university.edu',
    role: 'Administrator',
    status: 'Active',
    lastActive: 'Just now',
  },
];

export const DEMO_AUDIT_LOGS = [
  {
    id: 'LOG-7721',
    timestamp: '2026-10-28 14:12:05',
    actor: 'admin@scholars.shelf',
    action: 'SYSTEM_CONFIG_UPDATED',
    details: 'Max loan duration adjusted to 21 days for postgraduates',
    level: 'INFO',
  },
  {
    id: 'LOG-7720',
    timestamp: '2026-10-28 12:45:19',
    actor: 'system.scheduler',
    action: 'OVERDUE_NOTIFICATION_DISPATCH',
    details: '28 automated overdue emails dispatched successfully',
    level: 'INFO',
  },
  {
    id: 'LOG-7719',
    timestamp: '2026-10-28 09:30:00',
    actor: 'e.vance@university.edu',
    action: 'BATCH_CATALOGUE_IMPORT',
    details: 'Imported 15 new acquisitions into Mathematics section',
    level: 'INFO',
  },
  {
    id: 'LOG-7718',
    timestamp: '2026-10-27 23:00:04',
    actor: 'backup.daemon',
    action: 'SNAPSHOT_BACKUP_COMPLETED',
    details: 'MongoDB replica set snapshot archived (SHA256 verified)',
    level: 'SUCCESS',
  },
];

export const DEMO_LIBRARY_CONFIG = [
  { key: 'Standard Loan Period', value: '14 days', category: 'Circulation Rules' },
  { key: 'Postgraduate Loan Period', value: '28 days', category: 'Circulation Rules' },
  { key: 'Maximum Books Per Student', value: '5 books', category: 'Limits' },
  { key: 'Daily Overdue Fine', value: '$0.50 / day', category: 'Fines' },
  { key: 'Reservation Hold Window', value: '48 hours', category: 'Circulation Rules' },
  { key: 'Automatic Reminder Interval', value: '3 days prior to due date', category: 'Notifications' },
];

