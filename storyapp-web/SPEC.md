# StoryApp Web - Application Specification

## Overview

StoryApp Web is a collaborative story application built as a single-page application (SPA) that enables users to work together in **stories** (shared threads). The application provides user authentication, story-level **passages** (messages), and real-time delivery via WebSocket connections.

## Technology Stack

### Frontend Framework
- **React 19.1.1** - UI library
- **TypeScript** - Type-safe development
- **Vite** (rolldown-vite 7.1.14) - Build tool and dev server

### Routing & State Management
- **React Router DOM 7.9.4** - Client-side routing
- **React Context API** - State management (AuthContext, StoryContext)

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
- Main story interface is protected and requires authentication
- Unauthenticated users are redirected to login page
- Loading state shown during authentication check

### 2. Stories

#### Story list
- Displays all stories where the user is a **writer** (collaborator)
- Shows story information:
  - Story name
  - Writer count
  - Last passage preview (truncated to 50 characters)
  - Timestamp of last passage (relative time, e.g., "2 hours ago")
- Empty state message when no stories are available
- Clicking a story selects it and loads its passages

#### Story selection
- Selecting a story:
  - Leaves the current story (if any)
  - Loads story details and passages (paginated, 50 passages per page)
  - Joins the SignalR story group for real-time updates
- Story selection is visually indicated with highlighted background

#### Story data model
- Stories have:
  - ID, name, description (optional)
  - Privacy flag (isPrivate)
  - Creator information
  - Creation timestamp
  - Writer list (`writers`)
  - Writer count (`writerCount` on summaries)

### 3. Passages (messages in a story)

#### Passage display
- Passages are shown as **continuous book-style prose** in a single scrollable page (centered column)
- Each passage’s **segments** render in `order` with typographic breaks derived from `seamAfter`:
  - **First alinea after section / major section / chapter** — large vertical gap (~3 lines), no first-line indent
  - **First new alinea in a section** — one line break + **2em first-line indent**
  - **Further alineas in the same section** — single line break only, no indent
  - **Inline continuation** — flows on the same line as prior text (with a trailing space between passages when appropriate)
- When the **author changes** from the previous passage, a **subtle username line** appears before that passage’s text (no chat bubbles or timestamps in the body)
- After new passages arrive (sent by you or received from others), the view **scrolls smoothly** so the stitch point before the composer sits near the **vertical center** of the viewport
- Empty state: short guidance text when the story has no passages yet

#### Passage sending
- **Inline composer**: a `contentEditable` caret directly after the last committed text (no placeholder text). Prior draft segments render in the same typography as sent passages before the active field.
- **Draft appearance**: in-progress text uses a **random accent color**; holding Enter cycles the draft through a **rainbow** until the passage sends.
- **Structure (Enter / Backspace)**:
  - **Enter (tap)**: advance structure — first Enter starts a **new alinea** (`Paragraph`); further Enters on empty slots upgrade to **new section** (`Section` only in the UI; no Major/Chapter)
  - **Enter (hold ~1.5s)**: **send** the passage (progress anchored to `performance.now()` via rAF, not bare `setTimeout`)
  - **Backspace (tap)**: when the active segment is empty, unwind structure (section → alinea → merge into previous segment); otherwise delete characters
  - **Backspace (hold ~1.5s)**: **clear** the entire draft
  - Extra **Enter** taps in an empty **section** slot are ignored
- **End passage** button (disabled when disconnected or empty) also sends the draft
- Passages are sent via SignalR as **`segments[]`** with `order`, `text`, and optional `seamAfter`
- Draft is cleared after a successful send
- **Reading font**: a dropdown (Inter, Source Serif 4, EB Garamond, IBM Plex Mono); choice is stored in `localStorage` under `book-font`
- Connection status indicator remains in the app header

#### Passage data model
- Passages contain:
  - ID, **`order`**, optional **`seamBefore`**, **`segments[]`** (`id`, `order`, `text`, optional `seamAfter`)
  - Story ID (`storyId`), user information (sender), creation timestamp, optional edit timestamp
- Display text for previews is the concatenation of segment `text` values in `order` (see `passageText()` in `story.types.ts`)
- `SendPassage` / `EditPassage` send **`segments[]`** (`order`, `text`, optional `seamAfter`); the StoryView composer builds multi-segment passages from Enter/Backspace structure

### 4. Real-time Communication

#### SignalR Connection
- Automatic connection when user is authenticated
- Connection uses JWT access token for authentication
- Automatic reconnection on connection loss
- Reconnection automatically rejoins the current story
- Connection status displayed in header (green/red indicator)

#### Real-time events handled
- **ReceivePassage** - New passages appear instantly
- **PassageEdited** - Passage edit notifications (handler exists, not used in UI)
- **PassageDeleted** - Passage deletion notifications (handler exists, not used in UI)
- **UserJoinedStory** - User join notifications (handler exists, not used in UI)
- **UserLeftStory** - User leave notifications (handler exists, not used in UI)
- **UserStartedTyping** - Typing indicators; payload uses `storyId` (handler exists, not used in UI)
- **UserStoppedTyping** - Typing indicators; payload uses `storyId` (handler exists, not used in UI)
- **UserStatusChanged** - Online/offline status changes (handler exists, not used in UI)

#### SignalR methods (client ↔ hub)
- `JoinStory(storyId)` - Join a story group
- `LeaveStory(storyId)` - Leave a story group
- `SendPassage(storyId, segments)` — `segments`: `{ order, text, seamAfter? }[]`
- `EditPassage(passageId, segments)` — same segment shape (available, not used in UI)
- `DeletePassage(passageId)` - Delete a passage (available, not used in UI)
- `StartTyping(storyId)` - Indicate typing started (available, not used in UI)
- `StopTyping(storyId)` - Indicate typing stopped (available, not used in UI)

### 5. User Interface

#### Layout Structure
- **Header Bar**:
  - Application title ("StoryApp")
  - Connection status indicator
  - Current user information (username, email)
  - Logout button
- **Sidebar** (left):
  - Story list (fixed width: 320px)
  - Scrollable story list
- **Main content area** (right):
  - **Book view** when a story is selected: title bar with font picker, scrollable page column, inline composer
  - Empty state when no story is selected

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

### Stories API (`/api/stories`)
- `GET /stories` - Get user's stories (returns `StorySummary[]`)
- `GET /stories/:id` - Get story details
- `POST /stories` - Create story (available, not used in UI); body: `CreateStoryRequest` (`name`, `description`, `isPrivate`, etc.)
- `PUT /stories/:id` - Update story (available, not used in UI)
- `DELETE /stories/:id` - Delete story (available, not used in UI)
- `POST /stories/:id/writers` - Add writer / collaborator (`AddWriterRequest`)
- `DELETE /stories/:id/writers/:userId` - Remove writer from story
- `GET /stories/:storyId/passages` - Get story passages (paginated, `page` and `pageSize` query params)

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

### Story
```typescript
{
  id: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  creator: User;
  createdAt: string; // ISO date string
  writers: Writer[];
}
```

### StorySummary
```typescript
{
  id: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  creator: User;
  createdAt: string;
  writerCount: number;
  lastPassage?: Passage;
}
```

### Passage
```typescript
{
  id: number;
  order: number;
  seamBefore?: Seam;
  segments: PassageSegment[];
  user: User;
  storyId: number;
  createdAt: string; // ISO date string
  editedAt?: string; // ISO date string
}
```

### Writer (story collaborator)
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
- `VITE_HUB_URL` - SignalR hub URL (e.g., `http://localhost:3000/storyHub`)

### Development Setup
- Vite dev server runs on port 3000
- Proxies `/api` requests to `https://localhost:7011`
- Proxies `/storyHub` WebSocket connections to `https://localhost:7011`

## Application Flow

1. **Initial Load**:
   - Check for stored authentication tokens
   - If tokens exist, validate by fetching current user
   - If valid, proceed to the main app; if invalid, redirect to login

2. **Authentication Flow**:
   - User visits `/login` or `/register`
   - After successful auth, tokens stored and user redirected to `/`
   - Protected routes check authentication before rendering

3. **Story collaboration flow**:
   - On authenticated load, SignalR connection established
   - User's stories are fetched and displayed
   - User selects a story from the list
   - Story details and passages (last 50) are loaded
   - User joins SignalR story group
   - Passages can be sent and received in real-time
   - User can switch stories (automatically leaves previous, joins new)

4. **Logout Flow**:
   - Logout API call made
   - Tokens cleared from localStorage
   - User state cleared
   - Redirect to login page

## Current Limitations / Unused Features

The following API endpoints and SignalR handlers exist but are not currently used in the UI:
- Story creation, update, deletion
- Story writer management (add/remove)
- Passage editing and deletion
- Typing indicators
- User search and profile management
- System passages

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

