# StoryApp Web - Application Specification

## Overview

StoryApp Web is a collaborative story application built as a single-page application (SPA) that enables users to work together in **pulses** (shared threads). The application provides user authentication, pulse-level **beats** (messages), and real-time delivery via WebSocket connections.

## Technology Stack

### Frontend Framework
- **React 19.1.1** - UI library
- **TypeScript** - Type-safe development
- **Vite** (rolldown-vite 7.1.14) - Build tool and dev server

### Routing & State Management
- **React Router DOM 7.9.4** - Client-side routing
- **React Context API** - State management (AuthContext, PulseContext)

### Real-time Communication
- **Microsoft SignalR 9.0.6** - WebSocket-based real-time messaging

### HTTP Client
- **Axios 1.12.2** - REST API communication

### Styling
- **Tailwind CSS 4.1.14** - Utility-first CSS framework
- **@toolwind/corner-shape 0.0.8-3** - Adaptive rounded corners styling

### Utilities
- **date-fns 4.1.0** - Date formatting and manipulation

## Core Features

### 1. User Authentication

#### Registration
- Users can create accounts with:
  - Username (required)
  - Email (required, validated)
  - Password (required, minimum 6 characters)
  - Password confirmation (must match)
- Registration automatically logs in the user
- Access and refresh tokens are stored in localStorage

#### Login
- Users can log in with email and password
- Successful login stores authentication tokens
- Login page displays test account credentials for development

#### Authentication State Management
- Automatic token validation on app initialization
- Token refresh mechanism for expired access tokens
- Automatic redirect to login if authentication fails
- Logout functionality that clears tokens and redirects to login

#### Protected Routes
- Main pulse interface is protected and requires authentication
- Unauthenticated users are redirected to login page
- Loading state shown during authentication check

### 2. Pulses

#### Pulse list
- Displays all pulses where the user is a **pacer** (collaborator)
- Shows pulse information:
  - Pulse name
  - Pacer count
  - Last beat preview (truncated to 50 characters)
  - Timestamp of last beat (relative time, e.g., "2 hours ago")
- Empty state message when no pulses are available
- Clicking a pulse selects it and loads its beats

#### Pulse selection
- Selecting a pulse:
  - Leaves the current pulse (if any)
  - Loads pulse details and beats (paginated, 50 beats per page)
  - Joins the SignalR pulse group for real-time updates
- Pulse selection is visually indicated with highlighted background

#### Pulse data model
- Pulses have:
  - ID, name, description (optional)
  - Privacy flag (isPrivate)
  - Creator information
  - Creation timestamp
  - Pacer list (`pacers`)
  - Pacer count (`pacerCount` on summaries)

### 3. Beats (messages in a pulse)

#### Beat display
- Beats are shown as **continuous book-style prose** in a single scrollable page (centered column)
- Flowing text: each beat’s **passage** wraps inline with the rest of the pulse; a **space** separates beats
- When the **author changes** from the previous beat, a **subtle username line** appears before that passage (no chat bubbles or timestamps in the body)
- After new beats arrive (sent by you or received from others), the view **scrolls smoothly** so the stitch point before the composer sits near the **vertical center** of the viewport
- Empty state: short guidance text when the pulse has no beats yet

#### Beat sending
- **Inline composer**: a borderless multi-line field directly after the last committed text (not a separate chat bar)
- **End beat** button (disabled when disconnected or empty); **Enter** ends the beat (**Shift+Enter** inserts a newline; blank lines in the draft render as paragraph breaks via `pre-wrap`)
- Beats are sent via SignalR to the current pulse
- Draft is cleared after a successful send
- **Reading font**: a dropdown (Inter, Source Serif 4, EB Garamond, IBM Plex Mono); choice is stored in `localStorage` under `pulse-font`
- Connection status indicator remains in the app header

#### Beat data model
- Beats contain:
  - ID, **passage** (JSON `passage`), pulse ID (`pulseId`)
  - User information (sender)
  - Creation timestamp
  - Optional edit timestamp
  - Beat type (numeric: 0 Text, 1 Image, 2 File, 3 System)

### 4. Real-time Communication

#### SignalR Connection
- Automatic connection when user is authenticated
- Connection uses JWT access token for authentication
- Automatic reconnection on connection loss
- Reconnection automatically rejoins the current pulse
- Connection status displayed in header (green/red indicator)

#### Real-time events handled
- **ReceiveBeat** - New beats appear instantly
- **BeatEdited** - Beat edit notifications (handler exists, not used in UI)
- **BeatDeleted** - Beat deletion notifications (handler exists, not used in UI)
- **UserJoinedPulse** - User join notifications (handler exists, not used in UI)
- **UserLeftPulse** - User leave notifications (handler exists, not used in UI)
- **UserStartedTyping** - Typing indicators; payload uses `pulseId` (handler exists, not used in UI)
- **UserStoppedTyping** - Typing indicators; payload uses `pulseId` (handler exists, not used in UI)
- **UserStatusChanged** - Online/offline status changes (handler exists, not used in UI)

#### SignalR methods (client ↔ hub)
- `JoinPulse(pulseId)` - Join a pulse group
- `LeavePulse(pulseId)` - Leave a pulse group
- `SendBeat(pulseId, passage)` - Send a beat
- `EditBeat(beatId, newPassage)` - Edit a beat (available, not used in UI)
- `DeleteBeat(beatId)` - Delete a beat (available, not used in UI)
- `StartTyping(pulseId)` - Indicate typing started (available, not used in UI)
- `StopTyping(pulseId)` - Indicate typing stopped (available, not used in UI)

### 5. User Interface

#### Layout Structure
- **Header Bar**:
  - Application title ("StoryApp")
  - Connection status indicator
  - Current user information (username, email)
  - Logout button
- **Sidebar** (left):
  - Pulse list (fixed width: 320px)
  - Scrollable pulse list
- **Main content area** (right):
  - **Book view** when a pulse is selected: title bar with font picker, scrollable page column, inline composer
  - Empty state when no pulse is selected

#### Styling
- Uses Tailwind CSS utility classes
- Adaptive rounded corners (squircle style) via custom CSS
- Responsive design considerations
- Gray/blue color scheme
- Loading states with spinner animations

## API Integration

### Authentication API (`/api/auth`)
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh access token

### Pulses API (`/api/pulses`)
- `GET /pulses` - Get user's pulses (returns `PulseSummary[]`)
- `GET /pulses/:id` - Get pulse details
- `POST /pulses` - Create pulse (available, not used in UI); body: `CreatePulseRequest` (`name`, `description`, `isPrivate`, etc.)
- `PUT /pulses/:id` - Update pulse (available, not used in UI)
- `DELETE /pulses/:id` - Delete pulse (available, not used in UI)
- `POST /pulses/:id/pacers` - Add pacer / collaborator (`AddPacerRequest`)
- `DELETE /pulses/:id/pacers/:userId` - Remove pacer from pulse
- `GET /pulses/:pulseId/beats` - Get pulse beats (paginated, `page` and `pageSize` query params)

### Users API (`/api/users`)
- `GET /users/me` - Get current user profile (available, not used in UI)
- `GET /users/:id` - Get user by ID (available, not used in UI)
- `GET /users/search?query=...` - Search users (available, not used in UI)
- `PUT /users/me` - Update current user (available, not used in UI)
- `GET /users` - Get all users (available, not used in UI)

### HTTP Client Configuration
- Base URL: `${VITE_API_URL}/api`
- Automatic JWT token injection in Authorization header
- Automatic token refresh on 401 responses
- Request queuing during token refresh
- Automatic redirect to login on refresh failure

## Data Models

### User
```typescript
{
  id: number;
  username: string;
  email: string;
  isOnline: boolean;
  lastSeen: string; // ISO date string
}
```

### Pulse
```typescript
{
  id: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  creator: User;
  createdAt: string; // ISO date string
  pacers: Pacer[];
}
```

### PulseSummary
```typescript
{
  id: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  creator: User;
  createdAt: string;
  pacerCount: number;
  lastBeat?: Beat;
}
```

### Beat
```typescript
{
  id: number;
  passage: string;
  user: User;
  pulseId: number;
  createdAt: string; // ISO date string
  editedAt?: string; // ISO date string
}
```

### Pacer (pulse collaborator)
```typescript
{
  userId: number;
  username: string;
  email: string;
  joinedAt: string; // ISO date string
}
```

## Environment Configuration

### Required Environment Variables
- `VITE_API_URL` - Base URL for REST API (e.g., `http://localhost:3000`)
- `VITE_HUB_URL` - SignalR hub URL (e.g., `http://localhost:3000/pulseHub`)

### Development Setup
- Vite dev server runs on port 3000
- Proxies `/api` requests to `https://localhost:7011`
- Proxies `/pulseHub` WebSocket connections to `https://localhost:7011`

## Application Flow

1. **Initial Load**:
   - Check for stored authentication tokens
   - If tokens exist, validate by fetching current user
   - If valid, proceed to the main app; if invalid, redirect to login

2. **Authentication Flow**:
   - User visits `/login` or `/register`
   - After successful auth, tokens stored and user redirected to `/`
   - Protected routes check authentication before rendering

3. **Pulse collaboration flow**:
   - On authenticated load, SignalR connection established
   - User's pulses are fetched and displayed
   - User selects a pulse from the list
   - Pulse details and beats (last 50) are loaded
   - User joins SignalR pulse group
   - Beats can be sent and received in real-time
   - User can switch pulses (automatically leaves previous, joins new)

4. **Logout Flow**:
   - Logout API call made
   - Tokens cleared from localStorage
   - User state cleared
   - Redirect to login page

## Current Limitations / Unused Features

The following API endpoints and SignalR handlers exist but are not currently used in the UI:
- Pulse creation, update, deletion
- Pulse pacer management (add/remove)
- Beat editing and deletion
- Typing indicators
- User search and profile management
- System beats

## File Structure

```
src/
├── api/              # API client functions
├── components/       # React components
├── config/           # Configuration files
├── contexts/         # React Context providers
├── pages/            # Page components
├── services/         # Service layer (SignalR, token management)
├── types/            # TypeScript type definitions
└── styles/           # CSS files
```

## Build & Development

- **Development**: `npm run dev` - Starts Vite dev server
- **Build**: `npm run build` - Production build
- **Preview**: `npm run preview` - Preview production build
- **Lint**: `npm run lint` - Run ESLint

---

*This specification documents the current state of the application as of the analysis date. It does not include planned or future features.*

