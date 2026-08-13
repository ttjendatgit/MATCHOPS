# MATCHOP - Sports Venue Booking & Match-Making Platform

## Mục lục

1. [Tổng quan Dự án](#1-tổng-quan-dự-án)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Design Patterns](#4-design-patterns)
5. [API Design](#5-api-design)
6. [Database Schema](#6-database-schema)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Configuration](#8-configuration)
9. [Error Handling](#9-error-handling)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Real-time Features](#11-real-time-features)
12. [AI Integration](#12-ai-integration)
13. [Background Services](#13-background-services)
14. [Coding Conventions](#14-coding-conventions)
15. [Workflow Guidelines](#15-workflow-guidelines)

---

## 1. Tổng quan Dự án

**MATCHOP** là nền tảng đặt sân thể thao và kết nối người chơi (match-making) được xây dựng với kiến trúc full-stack hiện đại.

### Mục tiêu chính:
- Quản lý và đặt sân thể thao trực tuyến
- Kết nối người chơi cùng mức kỹ năng
- Quản lý doanh thu cho chủ sân
- Tích hợp AI hỗ trợ người dùng

### User Roles (Enum):
| Role | Value | Description |
|------|-------|-------------|
| USER | 1 | Người dùng thông thường |
| OWNER | 2 | Chủ sân thể thao |
| ADMIN | 3 | Quản trị viên hệ thống |

### Environment Variables (Backend - `appsettings.json`):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "PostgreSQL connection string"
  },
  "Jwt": {
    "Key": "MATCHOPVerySecretKey123456789012345678901234567890",
    "Issuer": "MATCHOP",
    "Audience": "MATCHOPUsers",
    "ExpireMinutes": 1440
  },
  "Smtp": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "Username": "matchop.system@gmail.com",
    "Password": "app-specific-password"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001"]
  },
  "GoogleAuth": {
    "ClientId": "Google OAuth Client ID"
  },
  "Cloudinary": {
    "CloudName": "dfobhmen1",
    "ApiKey": "...",
    "ApiSecret": "..."
  },
  "Groq": {
    "ApiKey": "Groq LLM API key"
  },
  "Booking": {
    "SlotMinutes": 30,
    "PendingExpireMinutes": 10,
    "MinBookingMinutes": 30,
    "MaxBookingHours": 4
  },
  "RateLimiting": {
    "PermitLimit": 100,
    "WindowSeconds": 60
  }
}
```

### Environment Variables (Frontend - `.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5208/api
```

---

## 2. Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| ASP.NET Core | 9.0 | Web Framework |
| C# | 12 | Programming Language |
| PostgreSQL | - | Database |
| Entity Framework Core | 9.0.8 | ORM |
| Npgsql | 9.0.4 | PostgreSQL Provider |

### Backend Dependencies:
| Package | Version | Purpose |
|---------|---------|---------|
| BCrypt.Net-Next | 4.2.0 | Password hashing |
| FluentValidation | 12.1.1 | Input validation |
| CloudinaryDotNet | 1.29.1 | Image upload/management |
| Google.Apis.Auth | 1.74.0 | Google OAuth |
| MailKit | 4.16.0 | Email sending |
| Microsoft.AspNetCore.Authentication.JwtBearer | 9.0.8 | JWT authentication |
| Swashbuckle.AspNetCore | 6.7.3 | Swagger/OpenAPI docs |
| System.IdentityModel.Tokens.Jwt | 8.18.0 | JWT handling |
| SignalR | (built-in) | Real-time communication |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.3.2 | React Framework |
| TypeScript | 5.7.2 | Type Safety |
| React | 19.0.0 | UI Library |
| Tailwind CSS | 3.4.17 | Styling |
| shadcn/ui | - | UI Component Library |

### Frontend Dependencies:
| Package | Version | Purpose |
|---------|---------|---------|
| @tanstack/react-query | 5.62.0 | Server State Management |
| react-hook-form | 7.54.1 | Form Management |
| @hookform/resolvers | - | Form Validation |
| zod | 3.24.1 | Schema Validation |
| @microsoft/signalr | 10.0.0 | Real-time (client) |
| axios | 1.7.9 | HTTP Client |
| jose | 5.10.0 | JWT Handling |
| gsap | 3.15.0 | Animation |
| motion | 12.40.0 | Motion Animation |
| lucide-react | 0.468.0 | Icons |
| sonner | 1.7.3 | Toast Notifications |
| recharts | 2.15.0 | Charts |
| date-fns | 4.1.0 | Date Utilities |

---

## 3. Project Structure

### Backend Structure
```
Backend/MATCHOP.API/
├── Controllers/              # 18 API Controllers
│   ├── AuthController.cs
│   ├── BookingsController.cs
│   ├── VenuesController.cs
│   ├── CourtsController.cs
│   ├── SportsController.cs
│   ├── MatchingController.cs
│   ├── MembershipController.cs
│   ├── ProfileController.cs
│   ├── ChatController.cs
│   ├── DashboardController.cs
│   ├── PaymentsController.cs
│   ├── CourtBlocksController.cs
│   ├── PriceRulesController.cs
│   ├── UserSkillsController.cs
│   ├── MatchRequestController.cs
│   ├── AdminMatchController.cs
│   ├── ReportsController.cs
│   └── AIController.cs
├── Services/                 # Business Logic Layer
│   ├── Implementations/
│   └── Interfaces/
├── Repositories/             # Data Access Layer
│   ├── Interfaces/
│   └── Implementations/
├── Entities/                 # Database Models (27 entities)
├── DTOs/                    # Data Transfer Objects
│   ├── Auth/
│   ├── Bookings/
│   ├── Venues/
│   ├── Courts/
│   └── ...
├── Enums/                   # Application Enumerations
├── Helpers/                 # Utility Classes
│   ├── ErrorCodes.cs
│   ├── AppException.cs
│   └── ApiResponse.cs
├── Middlewares/             # Custom Middleware
│   └── ExceptionMiddleware.cs
├── Validators/              # FluentValidation
├── Hubs/                    # SignalR Hubs
│   └── ChatHub.cs
├── Migrations/              # EF Core Migrations
├── ApplicationDbContext.cs  # Database Context
└── Program.cs               # Entry Point & DI Setup
```

### Frontend Structure
```
Frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # Auth routes (login, register)
│   │   ├── (public)/       # Public routes (home, venues, etc.)
│   │   ├── owner/          # Owner dashboard routes
│   │   ├── admin/          # Admin dashboard routes
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css      # Global styles
│   ├── components/
│   │   ├── ui/             # Base UI (shadcn pattern)
│   │   ├── layout/         # Navbar, Footer, Sidebar
│   │   ├── home/           # Home page components
│   │   ├── booking/        # Booking components
│   │   ├── venues/         # Venue components
│   │   ├── shared/         # Reusable components
│   │   ├── owner/          # Owner-specific components
│   │   ├── admin/          # Admin-specific components
│   │   └── chat/           # Chat components
│   ├── lib/
│   │   ├── auth.ts         # Authentication utilities
│   │   ├── api.ts         # API fetch wrapper
│   │   └── utils.ts       # Utility functions
│   ├── hooks/              # Custom React hooks
│   ├── providers/         # Context providers
│   │   └── SignalRProvider.tsx
│   └── types/              # TypeScript types
│       ├── api.ts
│       ├── auth.ts
│       ├── venue.ts
│       ├── booking.ts
│       ├── match.ts
│       └── ...
├── public/
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── components.json          # shadcn/ui config
```

---

## 4. Design Patterns

### Backend Patterns

#### 4.1 Layered Architecture
```
┌─────────────┐
│ Controllers │   ← API Entry Points
├─────────────┤
│  Services   │   ← Business Logic
├─────────────┤
│ Repositories│   ← Data Access
├─────────────┤
│    EF Core  │   ← Database
└─────────────┘
```

#### 4.2 Repository Pattern
- **Purpose**: Abstract data access layer
- **Location**: `Repositories/Interfaces/` and `Repositories/Implementations/`
- **Examples**: `IUserRepository`, `IVenueRepository`, `IBookingRepository`

#### 4.3 Service Layer Pattern
- **Purpose**: Encapsulate business logic
- **Location**: `Services/Interfaces/` and `Services/Implementations/`
- **Examples**: `IAuthService`, `IBookingService`, `IVenueService`

#### 4.4 DTO Pattern
- **Purpose**: Separate API contracts from domain models
- **Location**: `DTOs/` folder, organized by feature
- **Structure**:
  - `Requests/` - Input DTOs (validated with FluentValidation)
  - `Responses/` - Output DTOs

#### 4.5 Dependency Injection
- All services/repositories registered in `Program.cs`
- Constructor injection throughout
- Service lifetimes: Scoped for DB operations, Singleton for stateless services

#### 4.6 Unit of Work
- `ApplicationDbContext` acts as Unit of Work
- All repositories share the same context instance within a scope

### Frontend Patterns

#### 4.7 Component Patterns
- **Compound Components**: Card components (Card, CardHeader, CardTitle, CardContent, CardFooter)
- **Component Variants**: Using CVA (class-variance-authority) for button variants
- **Client vs Server Components**: Explicit "use client" directives

#### 4.8 Layout Groups (Next.js Route Groups)
| Group | Layout | Routes |
|-------|--------|--------|
| `(auth)` | AuthLayout | /login, /register, /verify-email |
| `(public)` | PublicLayout | Home, venues, bookings, etc. |
| `owner` | OwnerShell | /owner/* (owner dashboard) |
| `admin` | AdminShell | /admin/* (admin dashboard) |

#### 4.9 Hook Patterns
- Custom hooks for reusable stateful logic
- Example: `useAiChat` for AI conversation management

#### 4.10 Context Pattern
- SignalR context for real-time connections
- Authentication state via localStorage + context

---

## 5. API Design

### 5.1 Base URL
```
http://localhost:5208/api
```

### 5.2 Response Format

**Success Response:**
```csharp
ApiResponse<T> {
    Success: true,
    Data: T,
    Message: "Thành công",
    Code: "SUCCESS"
}
```

**Error Response:**
```json
{
    "success": false,
    "code": "ERROR_CODE",
    "message": "Error message",
    "errors": { "field": ["error message"] }
}
```

### 5.3 API Endpoints

#### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| POST | `/login/google` | Google OAuth login | No |
| GET | `/verify-email` | Verify email token | No |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password | No |
| GET | `/me` | Get current user | Yes |
| PUT | `/change-password` | Change password | Yes |
| POST | `/refresh-token` | Refresh JWT token | Yes |

#### Venues (`/api/venues`)
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all venues | No | - |
| GET | `/{id}` | Get venue details | No | - |
| POST | `/` | Create venue | Yes | OWNER |
| PUT | `/{id}` | Update venue | Yes | OWNER |
| DELETE | `/{id}` | Delete venue | Yes | OWNER |
| GET | `/{id}/courts` | Get venue courts | No | - |
| GET | `/nearby` | Get nearby venues | No | - |
| POST | `/{id}/images` | Upload venue images | Yes | OWNER |

#### Courts (`/api/courts`)
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all courts | No | - |
| GET | `/{id}` | Get court details | No | - |
| POST | `/` | Create court | Yes | OWNER |
| PUT | `/{id}` | Update court | Yes | OWNER |
| DELETE | `/{id}` | Delete court | Yes | OWNER |
| POST | `/{id}/images` | Upload court images | Yes | OWNER |

#### Bookings (`/api/bookings`)
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get user bookings | Yes | - |
| GET | `/{id}` | Get booking details | Yes | - |
| POST | `/` | Create booking | Yes | - |
| PUT | `/{id}/cancel` | Cancel booking | Yes | - |
| GET | `/available-slots` | Get available slots | No | - |

#### Payments (`/api/payments`)
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/create` | Create payment | Yes | - |
| GET | `/vnpay/callback` | VNPay callback | No | - |
| GET | `/history` | Payment history | Yes | - |

#### Matching (`/api/matching`)
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/posts` | Get match posts | No | - |
| POST | `/posts` | Create match post | Yes | - |
| GET | `/posts/{id}` | Get post details | No | - |
| POST | `/queue/join` | Join match queue | Yes | - |
| POST | `/queue/leave` | Leave queue | Yes | - |
| GET | `/rooms` | Get match rooms | No | - |
| GET | `/rooms/{id}` | Get room details | No | - |
| POST | `/rooms/{id}/join` | Join room | Yes | - |
| POST | `/rooms/{id}/leave` | Leave room | Yes | - |

#### Match Requests (`/api/match-requests`)
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get match requests | Yes | - |
| POST | `/` | Send match request | Yes | - |
| PUT | `/{id}/accept` | Accept request | Yes | - |
| PUT | `/{id}/reject` | Reject request | Yes | - |

#### Membership (`/api/membership`)
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/plans` | Get all plans | No | - |
| GET | `/my-plan` | Get user's plan | Yes | - |
| POST | `/subscribe` | Subscribe to plan | Yes | - |

#### Dashboard (`/api/dashboard`)
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/owner` | Owner dashboard stats | Yes | OWNER |
| GET | `/admin` | Admin dashboard stats | Yes | ADMIN |
| GET | `/revenue` | Revenue data | Yes | OWNER |
| GET | `/bookings/trend` | Booking trends | Yes | OWNER |

#### Sports (`/api/sports`)
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all sports | No | - |
| POST | `/` | Create sport | Yes | ADMIN |
| PUT | `/{id}` | Update sport | Yes | ADMIN |
| DELETE | `/{id}` | Delete sport | Yes | ADMIN |

#### AI (`/api/ai`)
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/chat` | Chat with AI | Yes | - |
| POST | `/analytics` | AI analytics | Yes | OWNER/ADMIN |

#### Chat (`/api/chat`)
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/conversations` | Get conversations | Yes | - |
| GET | `/conversations/{id}/messages` | Get messages | Yes | - |
| POST | `/conversations` | Create conversation | Yes | - |

#### Reports (`/api/reports`)
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/bookings` | Booking report | Yes | ADMIN |
| GET | `/revenue` | Revenue report | Yes | ADMIN |
| GET | `/users` | User report | Yes | ADMIN |

#### Admin (`/api/admin/*`)
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/users` | Manage users | Yes | ADMIN |
| PUT | `/users/{id}/role` | Update user role | Yes | ADMIN |
| GET | `/venues/pending` | Pending venues | Yes | ADMIN |
| PUT | `/venues/{id}/approve` | Approve venue | Yes | ADMIN |

### 5.4 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `PERMISSION_DENIED` | 403 | Insufficient permissions |
| `USER_NOT_FOUND` | 404 | User not found |
| `VENUE_NOT_FOUND` | 404 | Venue not found |
| `COURT_NOT_FOUND` | 404 | Court not found |
| `BOOKING_NOT_FOUND` | 404 | Booking not found |
| `VALIDATION_ERROR` | 400 | Validation failed |
| `EMAIL_ALREADY_EXISTS` | 400 | Email already registered |
| `PHONE_ALREADY_EXISTS` | 400 | Phone already registered |
| `SLOT_ALREADY_BOOKED` | 400 | Time slot unavailable |
| `BOOKING_EXPIRED` | 400 | Booking expired |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

---

## 6. Database Schema

### 6.1 Entity Relationships

```
User (1) ─────── (N) Venue
  │                   │
  │                   (1) ─────── (N) Court
  │                   │              │
  │                   │              (1) ─────── (N) Booking
  │                   │              │              │
  │                   │              │              (1) ─────── (N) Payment
  │                   │              │
  │                   │              (1) ─────── (N) PriceRule
  │                   │              │
  │                   │              (1) ─────── (N) CourtBlock
  │                   │
  │                   (1) ─────── (N) Review

User (1) ─────── (N) Booking
User (1) ─────── (N) MatchPost
User (1) ─────── (N) MatchQueue
User (1) ─────── (N) MatchRoomPlayer
User (1) ─────── (N) MatchRequest
User (1) ─────── (N) UserSubscription
User (1) ─────── (N) UserSkill
User (1) ─────── (N) FavoriteSport
User (1) ─────── (N) ConversationParticipant
User (1) ─────── (N) AIConversation

Conversation (1) ─────── (N) Message
Conversation (1) ─────── (N) ConversationParticipant

MatchRoom (1) ─────── (N) MatchRoomPlayer
MatchPost (1) ─────── (N) MatchRoomPlayer

MembershipPlan (1) ─────── (N) UserSubscription
Sport (1) ─────── (N) Venue
Sport (1) ─────── (N) Court
Sport (1) ─────── (N) UserSkill
Sport (1) ─────── (N) FavoriteSport
Sport (1) ─────── (N) MatchPost
```

### 6.2 Core Entities

#### User Entity
```csharp
public class User {
    public Guid Id { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public string FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Address { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public Gender Gender { get; set; }
    public UserRole Role { get; set; }
    public bool IsEmailVerified { get; set; }
    public string? EmailVerificationToken { get; set; }
    public DateTime? EmailVerificationTokenExpiry { get; set; }
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetTokenExpiry { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsActive { get; set; }
}
```

#### Venue Entity
```csharp
public class Venue {
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public string Address { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? ImageUrl { get; set; }
    public Guid OwnerId { get; set; }
    public VenueStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

#### Court Entity
```csharp
public class Court {
    public Guid Id { get; set; }
    public Guid VenueId { get; set; }
    public string Name { get; set; }
    public Guid SportId { get; set; }
    public string? Description { get; set; }
    public decimal PricePerHour { get; set; }
    public bool IsIndoor { get; set; }
    public bool HasLighting { get; set; }
    public bool HasAirConditioning { get; set; }
    public CourtStatus Status { get; set; }
}
```

#### Booking Entity
```csharp
public class Booking {
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid CourtId { get; set; }
    public DateTime BookingDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public BookingStatus Status { get; set; }
    public BookingType Type { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public string? Note { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
```

#### MatchPost Entity
```csharp
public class MatchPost {
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid SportId { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime PlayDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public Guid? VenueId { get; set; }
    public Guid? CourtId { get; set; }
    public int RequiredPlayers { get; set; }
    public int CurrentPlayers { get; set; }
    public MatchLevel Level { get; set; }
    public MatchPostStatus Status { get; set; }
}
```

#### MembershipPlan Entity
```csharp
public class MembershipPlan {
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public decimal MonthlyPrice { get; set; }
    public decimal YearlyPrice { get; set; }
    public PlanType Type { get; set; }  // ForUser, ForOwner
    public bool IsActive { get; set; }
    public int MaxVenues { get; set; }
    public int MaxCourtsPerVenue { get; set; }
    public bool HasAnalytics { get; set; }
    public bool HasPrioritySupport { get; set; }
    // Feature flags...
}
```

### 6.3 Enums

```csharp
public enum UserRole { USER = 1, OWNER = 2, ADMIN = 3 }
public enum Gender { Male = 1, Female = 2, Other = 3 }
public enum VenueStatus { Pending = 1, Approved = 2, Rejected = 3 }
public enum CourtStatus { Available = 1, Maintenance = 2, Inactive = 3 }
public enum BookingStatus { Pending = 1, Confirmed = 2, Cancelled = 3, Completed = 4, Expired = 5 }
public enum BookingType { Online = 1, Offline = 2 }
public enum MatchLevel { Beginner = 1, Intermediate = 2, Advanced = 3, Professional = 4 }
public enum MatchPostStatus { Active = 1, Full = 2, Expired = 3, Cancelled = 4 }
public enum PlanType { ForUser = 1, ForOwner = 2 }
```

---

## 7. Authentication & Authorization

### 7.1 JWT Configuration
```json
{
  "Jwt": {
    "Key": "MATCHOPVerySecretKey123456789012345678901234567890",
    "Issuer": "MATCHOP",
    "Audience": "MATCHOPUsers",
    "ExpireMinutes": 1440
  }
}
```

### 7.2 Token Flow
1. User submits credentials to `/api/auth/login`
2. Server validates and returns JWT token + user data
3. Client stores token in localStorage
4. Client sends token in `Authorization: Bearer <token>` header
5. Token expires after 24 hours (1440 minutes)

### 7.3 Authorization Attributes
```csharp
[Authorize]                                    // Requires authentication
[Authorize(Roles = "OWNER")]                   // Requires OWNER role
[Authorize(Roles = "ADMIN")]                   // Requires ADMIN role
[Authorize(Roles = "OWNER,ADMIN")]            // Requires OWNER or ADMIN
```

### 7.4 Custom Policies
Registered in `Program.cs`:
```csharp
services.AddAuthorization(options => {
    options.AddPolicy("OwnerOnly", policy => 
        policy.RequireRole("OWNER"));
    options.AddPolicy("AdminOnly", policy => 
        policy.RequireRole("ADMIN"));
});
```

### 7.5 Frontend Auth State
```typescript
// localStorage keys
localStorage.setItem('access_token', token);
localStorage.setItem('user', JSON.stringify(user));

// Auth functions in src/lib/auth.ts
- getStoredUser() → User | null
- getStoredToken() → string | null
- setAuthData(token, user) → void
- clearAuthData() → void
- isAuthenticated() → boolean
- verifySession() → Promise<User | null>
```

---

## 8. Configuration

### 8.1 Backend Configuration (`appsettings.json`)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=...;Database=matchop;Username=...;Password=..."
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### 8.2 Environment Variables
| Variable | Description |
|----------|-------------|
| `ASPNETCORE_ENVIRONMENT` | Development/Staging/Production |

### 8.3 Booking Configuration
```json
{
  "Booking": {
    "SlotMinutes": 30,
    "PendingExpireMinutes": 10,
    "MinBookingMinutes": 30,
    "MaxBookingHours": 4
  }
}
```

---

## 9. Error Handling

### 9.1 Exception Middleware
```csharp
// Middlewares/ExceptionMiddleware.cs
public class ExceptionMiddleware {
    // Catches all unhandled exceptions
    // Returns standardized JSON error responses
    // Handles AppException with custom error codes
    // Logs errors with ILogger
}
```

### 9.2 AppException Class
```csharp
public class AppException : Exception {
    public int StatusCode { get; }
    public string ErrorCode { get; }
}
```

### 9.3 Error Response Format
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ...",
  "errors": {
    "Email": ["Email đã được sử dụng"]
  }
}
```

### 9.4 Frontend Error Handling
```typescript
// src/lib/api.ts
async function apiFetch<T>(path, options) {
  // Centralized error handling
  // Extracts error messages from response
  // Throws with error details
}
```

---

## 10. Frontend Architecture

### 10.1 Routing
Next.js 15 App Router with route groups:
- `(auth)` - Authentication pages
- `(public)` - Public pages with navbar/footer
- `owner` - Owner dashboard (protected)
- `admin` - Admin dashboard (protected)

### 10.2 Route Protection

**Owner Routes (`/owner/*`):**
```typescript
// Check in OwnerShell layout
const user = getStoredUser();
if (!user || user.role !== 'OWNER') {
  router.push('/login');
}
```

**Admin Routes (`/admin/*`):**
```typescript
// Check in AdminShell layout
const user = getStoredUser();
if (!user || user.role !== 'ADMIN') {
  router.push('/login');
}
```

### 10.3 API Client
```typescript
// src/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5208/api"

async function apiFetch<T>(path: string, options?: RequestOptions): Promise<T> {
  // Automatic JWT Bearer token injection
  // JSON content-type header
  // Error parsing from response body
  // 204 No Content handling
}
```

### 10.4 Styling

**Design System Colors (`tailwind.config.ts`):**
```typescript
sport: {
  orange: "#FF8000",     // Primary CTA
  green: "#86D232",      // Secondary accent
  dark: "#030303",       // Page background
  surface: "#0A0A0A",    // Card background
  elevated: "#141414",   // Elevated cards
  muted: "#C4C7C9",     // Secondary text
  error: "#FF4B4B",     // Error states
}
```

### 10.5 UI Components (`src/components/ui/`)
| Component | Purpose |
|-----------|---------|
| Button | Primary actions (variants: default, destructive, outline, secondary, ghost, link) |
| Card | Container with header/content/footer |
| Input | Form input with label |
| Label | Form label |
| Select | Dropdown select |
| Dialog | Modal dialog |
| Avatar | User avatar |
| Badge | Status badges |
| Switch | Toggle switch |
| Separator | Visual divider |
| Textarea | Multi-line input |

---

## 11. Real-time Features

### 11.1 SignalR Hub
**Location**: `Hubs/ChatHub.cs`

### 11.2 Connection Events
| Event | Description |
|-------|-------------|
| `ReceiveMessage` | Receive chat message |
| `MatchRequestReceived` | New match request |
| `NotificationReceived` | Push notification |
| `UserOnline` | User came online |
| `UserOffline` | User went offline |

### 11.3 Frontend Provider
```typescript
// src/providers/SignalRProvider.tsx
// Manages SignalR Hub connection
// Handles connection lifecycle
// Provides context for components
```

### 11.4 Usage Example
```typescript
// Connect to hub
const connection = new HubConnectionBuilder()
  .withUrl("http://localhost:5208/hubs/chat")
  .withAutomaticReconnect()
  .build();

// Listen for messages
connection.on("ReceiveMessage", (message) => {
  console.log(message);
});

// Start connection
await connection.start();
```

---

## 12. AI Integration

### 12.1 Provider
- **Groq API** - LLM for chat and analytics

### 12.2 Services
```csharp
// Services/Implementations/AIService.cs
public interface IAIService {
    Task<ApiResponse<string>> ChatAsync(Guid userId, string message);
    Task<ApiResponse<AIAnalyticsResult>> GetAnalyticsAsync(...);
}
```

### 12.3 Frontend Hook
```typescript
// src/hooks/useAiChat.ts
// Manages AI conversation state
// Sends messages to /api/ai/chat
// Returns AI responses
```

### 12.4 Environment
```json
{
  "Groq": {
    "ApiKey": "gsk_..."
  }
}
```

---

## 13. Background Services

### 13.1 Booking Expiration Service
```csharp
// Services/Implementations/BookingExpirationService.cs
// BackgroundHostedService
// Runs periodically to check and expire unpaid bookings
// Updates booking status to Expired
```

---

## 14. Coding Conventions

### 14.1 Backend Conventions

**Naming:**
- Classes: PascalCase (`UserService`, `VenueController`)
- Interfaces: `I` prefix (`IUserRepository`, `IAuthService`)
- Methods: PascalCase
- Properties: PascalCase
- Private fields: `_camelCase` or `camelCase`
- Constants: PascalCase or SCREAMING_SNAKE_CASE

**File Organization:**
```
Controllers/          → Controllers
Services/Interfaces/  → Service interfaces
Services/Implementations/ → Service implementations
Repositories/Interfaces/  → Repository interfaces
Repositories/Implementations/ → Repository implementations
```

**Async/Await:**
```csharp
// Always use async/await for I/O operations
public async Task<ApiResponse<UserDto>> GetUserAsync(Guid id) {
    var user = await _userRepository.GetByIdAsync(id);
    // ...
}
```

### 14.2 Frontend Conventions

**Naming:**
- Files: kebab-case (`user-profile.tsx`, `use-auth.ts`)
- Components: PascalCase (`UserProfile`, `BookingForm`)
- Functions/Variables: camelCase
- Constants: UPPER_SNAKE_CASE or camelCase
- Types/Interfaces: PascalCase

**Component Structure:**
```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Type definitions
interface ComponentProps {
  title: string;
}

// 3. Component
export function Component({ title }: ComponentProps) {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Handlers
  const handleClick = () => { /* ... */ };
  
  // 6. Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>Click</Button>
    </div>
  );
}
```

### 14.3 Git Conventions

**Branch Naming:**
```
feature/short-description
bugfix/short-description
hotfix/short-description
wip/short-description
```

**Commit Messages:**
```
feat: add user profile page
fix: resolve booking slot conflict
refactor: extract API client
docs: update README
```

---

## 15. Workflow Guidelines

### 15.1 Development Setup

**Backend:**
```bash
cd Backend/MATCHOP.API
dotnet restore
dotnet run
# API available at http://localhost:5208
# Swagger at http://localhost:5208/swagger
```

**Frontend:**
```bash
cd Frontend
npm install
npm run dev
# App available at http://localhost:3000
```

**Database:**
```bash
# Apply migrations
dotnet ef database update

# Create new migration
dotnet ef migrations add MigrationName
```

### 15.2 Adding New Features

**Backend:**
1. Create Entity in `Entities/`
2. Add to `ApplicationDbContext`
3. Create DTOs in `DTOs/FeatureName/`
4. Create Repository interface and implementation
5. Create Service interface and implementation
6. Create Controller with endpoints
7. Add FluentValidation validators if needed
8. Update DI container in `Program.cs`
9. Create migration: `dotnet ef migrations add`

**Frontend:**
1. Create types in `src/types/`
2. Add API endpoints to `src/lib/api.ts` if needed
3. Create components in `src/components/feature/`
4. Create pages in `src/app/(public|owner|admin)/feature/`
5. Add routes if using file-based routing

### 15.3 Testing

**Backend Unit Tests:**
```bash
cd Backend/MATCHOP.API.Tests
dotnet test
```

### 15.4 Security Checklist

- [ ] Validate all input with FluentValidation
- [ ] Use parameterized queries (EF Core does this automatically)
- [ ] Hash passwords with BCrypt
- [ ] Validate JWT tokens on protected routes
- [ ] Check user role before executing privileged actions
- [ ] Sanitize user input before displaying
- [ ] Use HTTPS in production
- [ ] Store secrets in environment variables

### 15.5 Performance Considerations

- Use async/await for I/O operations
- Implement pagination for list endpoints
- Use caching for frequently accessed data
- Optimize database queries with proper indexes
- Lazy load images in frontend
- Use React Query for efficient data fetching

---

## Quick Reference

### Common Commands

**Backend:**
```bash
dotnet restore                    # Restore packages
dotnet build                     # Build project
dotnet run                       # Run API
dotnet ef migrations add Name     # Create migration
dotnet ef database update         # Apply migrations
dotnet ef migrations remove       # Remove last migration
```

**Frontend:**
```bash
npm install                      # Install dependencies
npm run dev                      # Development server
npm run build                    # Production build
npm run lint                     # Run linter
```

### Key Files

**Backend:**
| File | Purpose |
|------|---------|
| `Program.cs` | Entry point, DI setup, middleware |
| `ApplicationDbContext.cs` | EF Core context |
| `Helpers/ErrorCodes.cs` | Error code constants |

**Frontend:**
| File | Purpose |
|------|---------|
| `src/lib/api.ts` | API client |
| `src/lib/auth.ts` | Auth utilities |
| `src/providers/SignalRProvider.tsx` | Real-time provider |

### Environment URLs
| Service | URL |
|---------|-----|
| Backend API | http://localhost:5208 |
| Swagger | http://localhost:5208/swagger |
| Frontend | http://localhost:3000 |
| PostgreSQL | dpg-d8u9nf8k1i2s73emfgtg-a.singapore-postgres.render.com |

---

*Document created: 2026-07-11*
*Last updated: 2026-07-11*
