# The Scholar's Shelf — An Intelligent Library Management System

> *"Where Knowledge Finds Its Place."*

The Scholar's Shelf is a comprehensive university library platform engineered for students, faculty researchers, and academic librarians. Built with a warm, vintage scholarly aesthetic (Deep Forest Green, Warm Ivory, Muted Antique Gold, and Charcoal), this application bridges traditional academic stacks with modern discovery, automated circulation governance, machine-learning demand prediction, and accessibility tools.

---

## 1. Project Implementation Status: All 8 Parts Completed

### Implemented Phases:
- **Part 1 (Completed)**: Project foundation, scholarly design system tokens, reusable UI component library, public landing page, student dashboard, librarian dashboard, admin governance shell, Flask REST API foundation, MongoDB connectivity diagnostics, and responsive layouts.
- **Part 2 (Completed)**: Multi-role authentication (Student, Librarian, Admin), PBKDF2 password hashing, HS256 JWT sessions, public registration safeguards (strictly preventing unauthorized admin self-provisioning), client-side `<ProtectedRoute>` guards, and user profile management.
- **Part 3 (Completed)**: Full book catalogue management, copy-level physical inventory tracking (`BookCopy[]`), barcode minting, live student search with category filtering & sorting, book detail sheets, printable copy QR labels, and camera QR/barcode scanner (`html5-qrcode`).
- **Part 4 (Completed)**: Self-service student loan requests, librarian circulation desk issuance, book returns, dynamic overdue fine calculations ($0.50/day past due), renewal policy (enforced cap of 2 renewals; hold-blocked), reservation queues, and stock synchronization.
- **Part 5 (Completed)**: BookMind AI semantic vector search, n-gram TF-IDF vector space modeling with cosine similarity, transparent relevance explanations, in-stock alternative recommendations for checked-out books, and personalized student reading recommendations with heuristic keyword fallback.
- **Part 6 (Completed)**: BookPulse librarian analytics dashboard, interactive Recharts visualizations (circulation trends, category ratios), Scikit-learn + Pandas ML demand forecasting (Ridge regression time-series), model evaluation metrics (MAE, RMSE, $R^2$), copy procurement recommendations with demand pressure indexing, and CSV intelligence export.
- **Part 7 (Completed)**: Web Speech API Text-to-Speech (TTS) audio narration with speed controls, typography scaling (`normal`, `large`, `xlarge`), contrast modes (Ivory, Dark, Monochrome), dyslexia-friendly font mode, voice-based speech recognition book search, in-app notification center (due dates, overdue fines, hold arrivals), reading lists & bookmarks, reading goals with streak tracking, 6 gamified badges, peer book reviews & 5-star ratings, and BookMind AI Study Assistant (summaries, key concepts, practice quizzes, and recall flashcards).
- **Part 8 (Completed — Final Release)**: Complete multi-module system integration, end-to-end lifecycle verification, security hardening, removal of placeholders, audit log CSV reporting, live database integration, 42 automated tests passing 100%, clean production TypeScript builds, and full project documentation.

---

## 2. Default Seeded Accounts for Testing

The platform includes pre-configured accounts representing all institutional roles:

| Role | Institutional Email | Password | Access Boundary |
| :--- | :--- | :--- | :--- |
| **Student** | `student@scholars.shelf` | `StudentPass123!` | `/student/*`, `/catalogue`, `/books/:id`, `/student/study-assistant`, `/student/reading-list`, `/student/notifications` |
| **Librarian** | `librarian@scholars.shelf` | `LibrarianPass123!` | `/librarian/*`, `/librarian/books`, `/librarian/inventory`, `/librarian/loans`, `/librarian/reports` |
| **Administrator** | `admin@scholars.shelf` | `AdminPass123!` | Full institutional governance, `/admin/*`, user provisioning, audit trails |

---

## 3. Technology Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom scholarly theme tokens
- **Data Visualizations**: [Recharts](https://recharts.org/) (Area, Bar, and Dual-series Line charts)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **QR Decoding**: `html5-qrcode` camera & file scanner
- **Accessibility**: Web Speech API (`SpeechSynthesis` & `webkitSpeechRecognition`)

### Backend
- **Language**: Python 3.10+
- **Framework**: [Flask 3.x](https://flask.palletsprojects.com/) application factory pattern
- **Machine Learning & AI**: `scikit-learn` (Ridge Regression, TF-IDF vectorizer, cosine similarity) and `pandas` / `numpy`
- **Security & Tokens**: Werkzeug PBKDF2 (`generate_password_hash`, `check_password_hash`) and PyJWT (`jwt`)
- **QR Code Generation**: `qrcode` + `Pillow` (PIL) rendering themed base64 data URLs
- **Testing**: Built-in Python `unittest` suite (42 tests passing 100%)

### Database
- **Engine**: [MongoDB](https://www.mongodb.com/)
- **Driver**: `pymongo` with resilient in-memory fallback store when local daemon is offline
- **Collections**: `users`, `books`, `loans`, `reservations`, `notifications`, `reading_lists`, `reading_goals`, `book_reviews`

---

## 4. Complete REST API Reference

### System & Health Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Live service diagnostic, database connectivity, and implemented feature inventory. |

### Authentication & RBAC (Part 2)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Student self-registration (forbids privileged staff roles). |
| `POST` | `/api/auth/login` | Public | Authenticates credentials, verifies password hash, issues JWT. |
| `GET` | `/api/auth/me` | Authenticated | Retrieves current authenticated profile. |
| `POST` | `/api/auth/logout` | Authenticated | Stateless session teardown. |
| `GET` | `/api/auth/admin/users` | Admin | Lists registered campus users with role filters. |

### Catalogue, Inventory & QR (Part 3)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/books` | Public | List books with search, category filtering, availability, and sorting. |
| `GET` | `/api/books/<id>` | Public | Detailed volume record with individual copy inventory. |
| `POST` | `/api/books` | Librarian/Admin | Catalogue new volume acquisitions with auto-minted barcodes. |
| `PUT` | `/api/books/<id>` | Librarian/Admin | Update volume metadata, shelf location, or copies. |
| `DELETE` | `/api/books/<id>` | Librarian/Admin | Archive volume from circulation. |
| `POST` | `/api/books/<id>/copies` | Librarian/Admin | Add a physical copy unit. |
| `DELETE` | `/api/books/<id>/copies/<copy_id>` | Librarian/Admin | De-accession a physical copy unit. |
| `GET` | `/api/books/<id>/qr` | Public | Generate base64 QR code PNG for title. |
| `GET` | `/api/books/copies/<copy_id>/qr` | Public | Generate base64 QR code PNG for specific physical copy unit. |
| `POST` | `/api/books/scan` | Public / Staff | Resolve volume by scanned QR, barcode, or copy ID. |

### Borrowing & Circulation (Part 4)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/loans/my-loans` | Student | Active loans, borrowing history, and calculated overdue fines. |
| `POST` | `/api/loans/request` | Student | Self-service student loan request. |
| `POST` | `/api/loans/<id>/renew` | Student / Staff | Renew active loan for 14 days (max 2 renewals). |
| `GET` | `/api/loans` | Librarian/Admin | View all circulation records across campus. |
| `POST` | `/api/loans/issue` | Librarian/Admin | Issue book directly to patron at circulation desk. |
| `POST` | `/api/loans/<id>/return` | Librarian/Admin | Process book return, assess late fines, and route to holds. |
| `GET` | `/api/loans/overdue` | Librarian/Admin | View overdue loans and fine queues. |
| `POST` | `/api/loans/reservations` | Student | Place hold reservation on checked-out volume. |
| `DELETE` | `/api/loans/reservations/<id>` | Student / Staff | Cancel a hold reservation. |
| `GET` | `/api/loans/reservations/my-reservations` | Student | View student's active hold reservations. |
| `GET` | `/api/loans/reservations` | Librarian/Admin | View institutional reservation queues. |

### BookMind AI & Study Assistant (Parts 5 & 7)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/search` | Public | Natural language semantic vector search with relevance explanations. |
| `GET` | `/api/ai/similar/<id>` | Public | Retrieve semantically similar volumes by content overlap. |
| `GET` | `/api/ai/alternatives/<id>` | Public | In-stock available substitutes when a title is checked out. |
| `GET` | `/api/ai/personalized` | Student | Personalized recommendations synthesized from borrowing profile. |
| `POST` | `/api/ai/study-assist` | Public / Student | Synthesizes executive summaries, key concepts, quizzes, and flashcards. |

### BookPulse Analytics & ML Forecasting (Part 6)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/overview` | Librarian/Admin | Real-time aggregate KPIs (titles, copies, active loans, utilization %). |
| `GET` | `/api/analytics/trends` | Librarian/Admin | Month-by-month loan and return time-series. |
| `GET` | `/api/analytics/categories` | Librarian/Admin | Departmental volume distribution and shelf turnover. |
| `GET` | `/api/analytics/popular-books` | Librarian/Admin | Top circulating books ranked by borrow counts and velocity. |
| `GET` | `/api/analytics/low-stock` | Librarian/Admin | Titles requiring immediate replenishment. |
| `GET` | `/api/analytics/forecast` | Librarian/Admin | Scikit-learn Ridge regression forecast, MAE/RMSE/$R^2$ metrics, and procurement recommendations. |

### Notifications & Student Engagement (Part 7)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Authenticated | Retrieve user notifications (due dates, fines, hold arrivals). |
| `PATCH` | `/api/notifications/<id>/read` | Authenticated | Mark notification as read. |
| `POST` | `/api/notifications/mark-all-read` | Authenticated | Mark all notifications as read. |
| `DELETE` | `/api/notifications/<id>` | Authenticated | Dismiss notification. |
| `GET` | `/api/student/reading-list` | Student | Get saved reading references. |
| `POST` | `/api/student/reading-list` | Student | Save volume to reading list. |
| `DELETE` | `/api/student/reading-list/<id>` | Student | Remove volume from reading list. |
| `GET` | `/api/student/reading-goals` | Student | Semester reading target, progress %, and achievement badges. |
| `POST` | `/api/student/reading-goals` | Student | Update semester reading target. |
| `GET` | `/api/books/<id>/reviews` | Public | Peer reviews, average score, and star breakdown. |
| `POST` | `/api/books/<id>/reviews` | Student | Submit peer book review with 1-5 star rating. |

---

## 5. How to Run the Application

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) MongoDB running on `localhost:27017` (auto-falls back to safe memory repository if offline)

### 2. Backend Setup & Startup
```powershell
# Navigate to backend directory
cd backend

# Create virtual environment (if not already created)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install required dependencies
pip install -r requirements.txt

# Run the Flask backend (starts on http://127.0.0.1:5000)
python run.py
```

### 3. Frontend Setup & Startup
```powershell
# Open a separate terminal and navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite development server (starts on http://localhost:5173)
npm run dev
```

### 4. Running the Complete Automated Test Suite
```powershell
# Run all 42 backend unit and integration tests
python -m unittest discover -s backend/tests -p "test_*.py"
```
**Result**: 42 tests passing 100% (`OK`).

### 5. Running the Frontend Production Build
```powershell
cd frontend
npm run build
```
**Result**: Succeeded with 0 TypeScript errors.
