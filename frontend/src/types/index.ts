export type UserRole = 'student' | 'librarian' | 'admin' | 'public';

export type BookAvailability = 'Available' | 'Reserved' | 'Checked Out' | 'Reference Only';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  student_id?: string;
  department?: string;
  status: string;
  created_at?: string;
}

export interface AuthResponseData {
  user: User;
  token: string;
}

export interface BookCopy {
  copyId: string;
  bookId: string;
  copyNumber: number;
  status: 'available' | 'borrowed' | 'reserved' | 'maintenance';
  shelfLocation: string;
  barcode: string;
  condition?: 'mint' | 'good' | 'fair' | string;
  addedAt: string;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  category: string;
  shelfLocation: string;
  totalCopies: number;
  availableCopies: number;
  description: string;
  coverImage?: string;
  accentColor?: string;
  tags: string[];
  rating: number;
  isFeatured?: boolean;
  status?: 'active' | 'archived';
  copies?: BookCopy[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  copyId?: string;
  barcode?: string;
  shelfLocation?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  borrowerName?: string;
  borrowerId?: string;
  studentId?: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: 'active' | 'returned' | 'overdue' | 'pending_approval';
  renewalsCount?: number;
  fineAmount?: number;
  daysOverdue?: number;
  issuedBy?: string;
  returnedTo?: string;
}

export interface Reservation {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userEmail?: string;
  userName: string;
  studentId?: string;
  reservedAt: string;
  status: 'ready' | 'pending' | 'fulfilled' | 'cancelled' | 'expired';
  queuePosition?: number;
  pickupDeadline?: string | null;
  assignedCopyId?: string;
}

export interface StudentDashboardStats {
  currentlyBorrowed: number;
  activeReservations: number;
  overdueCount: number;
  accumulatedFines: number;
  savedToReadingList: number;
}

export interface LibrarianDashboardStats {
  totalTitles: number;
  totalCopies: number;
  availableCopies: number;
  activeLoans: number;
  overdueLoans: number;
  pendingReservations: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeStudents: number;
  activeLibrarians: number;
  totalAuditLogs: number;
  systemHealth: string;
  storageUsage: string;
}

export interface NavItem {
  label: string;
  path: string;
  iconName: string;
  badge?: string | number;
}

export interface HealthResponseData {
  service: string;
  tagline: string;
  status: string;
  timestamp: string;
  phase: string;
  environment: string;
  database: {
    status: 'connected' | 'unavailable' | 'unconfigured' | 'driver_missing' | 'error';
    connected: boolean;
    database: string;
    message: string;
    collections_count?: number;
  };
  features: Record<string, string>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    details?: unknown;
  };
}

export interface AnalyticsOverview {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  activeLoans: number;
  overdueLoans: number;
  totalReservations: number;
  utilizationRate: number;
  updatedAt: string;
  dataSource: string;
}

export interface CategoryStat {
  category: string;
  count: number;
  totalTitles: number;
  totalCopies: number;
  availableCopies: number;
  activeLoans: number;
  utilizationRate: number;
  fill: string;
}

export interface BorrowingTrendPoint {
  month: string;
  loans: number;
  returns: number;
}

export interface PopularBookItem {
  id: string;
  title: string;
  author: string;
  category: string;
  shelfLocation: string;
  borrowCount: number;
  activeHolds: number;
  availableCopies: number;
  totalCopies: number;
  turnoverRate: number;
  rating: number;
}

export interface LowStockAlert {
  bookId: string;
  bookTitle: string;
  author: string;
  category: string;
  shelfLocation: string;
  availableCopies: number;
  totalCopies: number;
  activeHolds: number;
  urgency: 'Critical' | 'Moderate';
  recommendation: string;
}

export interface ModelEvaluationMetrics {
  mae: number;
  rmse: number;
  r2Score: number;
  confidenceScore: string;
}

export interface ForecastDataPoint {
  period: string;
  actual: number | null;
  predicted: number;
  type: 'historical' | 'forecast';
}

export interface ProcurementRecommendation {
  bookId: string;
  bookTitle: string;
  author: string;
  category: string;
  shelfLocation: string;
  currentTotal: number;
  currentAvailable: number;
  demandPressure: number;
  recommendedCopiesToAdd: number;
  priority: 'High' | 'Medium' | 'Low';
  rationale: string;
}

export interface DemandForecastResponse {
  modelName: string;
  dataSufficient: boolean;
  historicalObservations: number;
  forecastHorizon: string;
  evaluationMetrics: ModelEvaluationMetrics;
  forecastSeries: ForecastDataPoint[];
  procurementRecommendations: ProcurementRecommendation[];
  generatedAt: string;
}

export type NotificationType =
  | 'due_date'
  | 'overdue'
  | 'reservation_ready'
  | 'loan_approval'
  | 'inventory_alert'
  | 'bulletin';

export type NotificationSeverity = 'warning' | 'danger' | 'info' | 'success';

export interface NotificationItem {
  id: string;
  userId: string;
  role: string;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface BookReview {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  reviewText: string;
  isRecommended: boolean;
  createdAt: string;
}

export interface BookReviewsResponse {
  bookId: string;
  totalReviews: number;
  averageRating: number;
  distribution: Record<number, number>;
  reviews: BookReview[];
}

export interface ReadingGoal {
  userId: string;
  targetBooks: number;
  completedBooks: number;
  academicTerm: string;
  streakWeeks: number;
  progressPercentage: number;
  updatedAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  unlocked: boolean;
  progress: string;
}

export interface ReadingGoalsResponse {
  goal: ReadingGoal;
  badges: Badge[];
  summary: {
    target: number;
    completed: number;
    activeLoans: number;
    progress: number;
  };
}

export interface QuizItem {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface StudyConcept {
  term: string;
  importance: string;
  explanation: string;
}

export interface StudyAssistantResponse {
  title: string;
  wordCount: number;
  estimatedReadTimeMinutes: number;
  executiveSummary: string;
  keyArguments: string[];
  concepts: StudyConcept[];
  quiz: QuizItem[];
  flashcards: Flashcard[];
  synthesizedAt: string;
  model: string;
}

export type TextSize = 'normal' | 'large' | 'xlarge';
export type ContrastMode = 'normal' | 'high-contrast-dark' | 'high-contrast-light';
export type FontMode = 'standard' | 'dyslexic';


