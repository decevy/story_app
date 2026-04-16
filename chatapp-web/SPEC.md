# ChatApp Web - Application Specification

## Overview

ChatApp Web is a real-time chat application built as a single-page application (SPA) that enables users to collaborate in **stories** (shared threads) through a web interface. The application provides user authentication, story-based **turns** (messages in a story), and real-time delivery via WebSocket connections.

## Technology Stack

### Frontend Framework
- **React 19.1.1** - UI library
- **TypeScript** - Type-safe development
- **Vite** (rolldown-vite 7.1.14) - Build tool and dev server

### Routing & State Management
- **React Router DOM 7.9.4** - Client-side routing
- **React Context API** - State management (AuthContext, ChatContext)

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
- Main chat interface is protected and requires authentication
- Unauthenticated users are redirected to login page
- Loading state shown during authentication check

### 2. Stories

#### Story list
- Displays all stories the user is a member of
- Shows story information:
  - Story name
  - Member count
  - Last turn preview (truncated to 50 characters)
  - Timestamp of last turn (relative time, e.g., "2 hours ago")
- Empty state message when no stories are available
- Clicking a story selects it and loads its turns

#### Story selection
- Selecting a story:
  - Leaves the current story (if any)
  - Loads story details and turns (paginated, 50 turns per page)
  - Joins the SignalR story group for real-time updates
- Story selection is visually indicated with highlighted background

#### Story data model
- Stories have:
  - ID, name, description (optional)
  - Privacy flag (isPrivate)
  - Creator information
  - Creation timestamp
  - Member list with roles
  - Member count

### 3. Turns (messages in a story)

#### Turn display
- Turns are displayed in a scrollable list
- Turns show:
  - Content (text)
  - Sender username
  - Timestamp (formatted as HH:mm)
  - Visual distinction between own turns (blue background) and others (white background)
- Timestamps are shown:
  - For the first turn
  - When more than 5 minutes have passed since the previous turn
- Turns are aligned right for own turns, left for others
- Auto-scroll to bottom when new turns arrive
- Empty state shown when no turns exist

#### Turn sending
- Text input area with multi-line support
- Send button (disabled when disconnected or input is empty)
- Enter key sends a turn (Shift+Enter for new line)
- Turns are sent via SignalR to the current story
- Input is cleared after successful send
- Connection status indicator shows if SignalR is connected

#### Turn data model
- Turns contain:
  - ID, content, story ID (`storyId`)
  - User information (sender)
  - Creation timestamp
  - Optional edit timestamp
  - Turn type (numeric: 0 Text, 1 Image, 2 File, 3 System)
  - Optional attachment URL and filename
  - Reactions array (with emoji and user lists)

### 4. Real-time Communication

#### SignalR Connection
- Automatic connection when user is authenticated
- Connection uses JWT access token for authentication
- Automatic reconnection on connection loss
- Reconnection automatically rejoins the current story
- Connection status displayed in header (green/red indicator)

#### Real-time events handled
- **ReceiveTurn** - New turns appear instantly
- **TurnEdited** - Turn edit notifications (handler exists, not used in UI)
- **TurnDeleted** - Turn deletion notifications (handler exists, not used in UI)
- **UserJoinedStory** - User join notifications (handler exists, not used in UI)
- **UserLeftStory** - User leave notifications (handler exists, not used in UI)
- **UserStartedTyping** - Typing indicators; payload uses `storyId` (handler exists, not used in UI)
- **UserStoppedTyping** - Typing indicators; payload uses `storyId` (handler exists, not used in UI)
- **UserStatusChanged** - Online/offline status changes (handler exists, not used in UI)

#### SignalR methods (client ↔ hub)
- `JoinStory(storyId)` - Join a story group
- `LeaveStory(storyId)` - Leave a story group
- `SendTurn(storyId, content)` - Send a turn
- `EditTurn(turnId, newContent)` - Edit a turn (available, not used in UI)
- `DeleteTurn(turnId)` - Delete a turn (available, not used in UI)
- `StartTyping(storyId)` - Indicate typing started (available, not used in UI)
- `StopTyping(storyId)` - Indicate typing stopped (available, not used in UI)

### 5. User Interface

#### Layout Structure
- **Header Bar**:
  - Application title ("ChatApp")
  - Connection status indicator
  - Current user information (username, email)
  - Logout button
- **Sidebar** (left):
  - Story list (fixed width: 320px)
  - Scrollable story list
- **Main chat area** (right):
  - Turn list (scrollable)
  - Message input at bottom (sends a turn)
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
- `POST /stories/:id/members` - Add member to story (available, not used in UI)
- `DELETE /stories/:id/members/:userId` - Remove member from story (available, not used in UI)
- `GET /stories/:storyId/turns` - Get story turns (paginated, `page` and `pageSize` query params)

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
  members: StoryMember[];
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
  memberCount: number;
  lastTurn?: Turn;
}
```

### Turn
```typescript
{
  id: number;
  content: string;
  user: User;
  storyId: number;
  createdAt: string; // ISO date string
  editedAt?: string; // ISO date string
  attachmentUrl?: string;
  attachmentFileName?: string;
  type: TurnType; // 0=Text, 1=Image, 2=File, 3=System
  reactions: TurnReaction[];
}
```

### StoryMember
```typescript
{
  userId: number;
  username: string;
  email: string;
  role: string;
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
   - If valid, proceed to chat interface; if invalid, redirect to login

2. **Authentication Flow**:
   - User visits `/login` or `/register`
   - After successful auth, tokens stored and user redirected to `/`
   - Protected routes check authentication before rendering

3. **Chat flow**:
   - On authenticated load, SignalR connection established
   - User's stories are fetched and displayed
   - User selects a story from the list
   - Story details and turns (last 50) are loaded
   - User joins SignalR story group
   - Turns can be sent and received in real-time
   - User can switch stories (automatically leaves previous, joins new)

4. **Logout Flow**:
   - Logout API call made
   - Tokens cleared from localStorage
   - User state cleared
   - Redirect to login page

## Current Limitations / Unused Features

The following API endpoints and SignalR handlers exist but are not currently used in the UI:
- Story creation, update, deletion
- Story member management (add/remove)
- Turn editing and deletion
- Typing indicators
- User search and profile management
- Turn reactions
- File/image attachments (data model supports, but UI doesn't handle)
- System turns

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

