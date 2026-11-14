# StoryApp - Application Specification

## Overview
StoryApp is a collaborative storytelling backend: a .NET 9 Web API with PostgreSQL and SignalR. Users join **stories**, add sequential **passages** (text contributions), and see updates in real time. JWT secures both REST and the SignalR hub.

This repository contains the **backend solution** only; a separate React (or other) client would consume these APIs and connect to **`/storyHub`**.

## Architecture

**Backend Stack:**
- .NET 9 Web API
- PostgreSQL with Entity Framework Core
- SignalR for real-time passages, typing, and presence-style user status
- JWT Bearer authentication (HTTP header and hub query string)
- Clean Architecture: Core, Infrastructure, Services, Api

**Typical client stack (not in this repo):**
- React with TypeScript, Vite, SignalR client, Axios — aligned with product docs elsewhere in the monorepo if applicable

**Project Structure:**
- `StoryApp.Core` — Entities, DTOs, interfaces, exceptions, query builders
- `StoryApp.Infrastructure` — DbContext (`StoryDbContext`), repositories, migrations, seeding
- `StoryApp.Services` — Auth, user, and story application services (`StoryService`)
- `StoryApp.Api` — Controllers, SignalR **`StoryHub`**, middleware, DI

## Core Features

### 1. Authentication & Authorization
- Register, login, refresh, logout
- JWT access tokens (configurable expiry; default 24 hours in dev settings)
- Refresh tokens with configurable lifetime
- Protected REST routes and hub connections

### 2. User Management
- Profile read/update for the current user
- User search by username or email
- Get user by ID; list users
- Online/offline flag and last-seen updates (including on hub connect/disconnect)

### 3. Stories (collaborative spaces)
- Create stories (name, description, public/private)
- List stories the current user collaborates on
- Get story detail (collaborators only)
- Update story metadata (**story creator** only)
- Delete story (**story creator** only)
- Creating user is recorded on the story (`CreatedBy`) and added as an initial collaborator

### 4. Writer participation (story membership)
- Add writers (`POST .../writers`), body `AddWriterRequest` (`userId`) — **story creator** only
- Remove writers (`DELETE .../writers/{userId}`): **story creator** may remove another collaborator; any collaborator may remove themselves; removing the **`CreatedBy`** user from memberships is rejected
- Unique membership per user per story
- Join timestamps tracked

### 5. Passages (contributions within a story)
- **REST:** Paginated passage history (`GET /api/stories/{storyId}/passages`)
- **SignalR:** Send, edit, and delete passages in real time (`SendPassage`, `EditPassage`, `DeletePassage`)
- Passages contain ordered **segments** (`PassageSegment`); hub methods **`SendPassage`** / **`EditPassage`** accept **`IList<PassageSegmentDto>`**
- Edit/delete restricted to the passage author (enforced in the hub)

### 6. Real-time features (SignalR `/storyHub`)
- Broadcast new, edited, and deleted passages to story groups
- Join/leave story groups (`JoinStory`, `LeaveStory`) with membership checks
- Typing indicators (`StartTyping`, `StopTyping`) scoped by story
- User online/offline broadcasts (`UserStatusChanged`)
- JWT supplied via query parameter: `?access_token={token}`

## Database Schema (conceptual)

### Users
- Identity, credentials (password hash), refresh token fields, `CreatedAt`, `LastSeen`, `IsOnline`

### Stories (`Stories` table)
- `Name`, `Description`, `IsPrivate`, `CreatedBy`, `CreatedAt`

### Writers (`Writers` table)
- `UserId`, `StoryId`, `JoinedAt`
- Unique (UserId, StoryId)

### Passages
- `Order`, `SeamBefore?`, `UserId`, `StoryId`, `CreatedAt`, `EditedAt`
- Child **`PassageSegment`** rows: `Order`, `Text`, `SeamAfter?`, `PassageId`
- Indexed for efficient paging by story and order/time

Exact column definitions and cascade behaviors live in EF configurations under `StoryApp.Infrastructure` (`StoryDbContext`).

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` — `RegisterRequest` → token payload
- `POST /api/auth/login` — `LoginRequest` → token payload
- `POST /api/auth/refresh` — refresh token → new tokens
- `POST /api/auth/logout` — revoke refresh token (authenticated)
- `GET /api/auth/me` — current user ids from JWT (authenticated)

### Stories (`/api/stories`)
- `GET /api/stories` — stories for the current user
- `GET /api/stories/{storyId}` — detail (403 if not a collaborator, 404 if missing)
- `POST /api/stories` — create story
- `PUT /api/stories/{storyId}` — update (story creator)
- `DELETE /api/stories/{storyId}` — delete (story creator)
- `GET /api/stories/{storyId}/passages?page=&pageSize=` — paginated passages (default page size 50)
- `POST /api/stories/{storyId}/writers` — add writer
- `DELETE /api/stories/{storyId}/writers/{userId}` — remove writer

### Users (`/api/users`)
- `GET /api/users/me` — current profile
- `PUT /api/users/me` — update profile
- `GET /api/users/{userId}` — user by id
- `GET /api/users/search?query=` — search
- `GET /api/users` — list users

### SignalR Hub (`/storyHub`)

**Connection:** JWT via `access_token` query parameter; `[Authorize]` on the hub.

**Client → server (examples):**
- `JoinStory(int storyId)` / `LeaveStory(int storyId)`
- `SendPassage(int storyId, IList<PassageSegmentDto> segments)`
- `EditPassage(int passageId, IList<PassageSegmentDto> segments)` / `DeletePassage(int passageId)`
- `StartTyping(int storyId)` / `StopTyping(int storyId)`

**Server → client (event names):**
- `ReceivePassage` — `PassageDto`
- `PassageEdited` — `PassageEditedDto`
- `PassageDeleted` — `PassageDeletedDto`
- `UserJoinedStory` / `UserLeftStory` — `StoryEventDto`
- `UserStartedTyping` / `UserStoppedTyping` — `TypingIndicatorDto` (includes `StoryId`)
- `UserStatusChanged` — `UserStatusChangedDto`

## Security (summary)
- Password hashing (BCrypt)
- JWT for API and SignalR
- Story membership checks for story-scoped operations
- Hub uses `HubException` for predictable client errors
- CORS policy `AllowReactApp` for typical local dev origins (see `Program.cs`)

## Development features
- Swagger in Development
- Migrations applied on API startup
- Idempotent seed when the database has no users (`StoryDbContext` seed hook calls **`StoryDbSeeder.SeedAsync`**)

## Sample seed data
- Users: `aya`, `bobby`, `carlos` (password `test123`)
- Stories (example, Dutch demo copy): **"Het Neon-Noedel Bijpand"**, **"Logboek van de stormglaswaker"**, **"De envelop met de koperen sleutel"** — twee writers per story en passages in het rond (**`StoryDbSeeder`**)

## Configuration (reference)
- **Connection string:** `DefaultConnection` in `StoryApp.Api` configuration (PostgreSQL)
- **JWT:** `JwtSettings` — e.g. Issuer `StoryApp.API.Dev`, Audience `StoryApp.Web.Dev` in Development
- **CORS:** e.g. `http://localhost:3000`, `http://localhost:5173`

## Technical constraints (typical)
- Passage **segment text** max length **2000** (EF `StringLength` on `PassageSegment.Text`)
- Default passage pagination: **50** per page on `GetStoryPassages`

---

**Document version:** 1.2  
**Last updated:** May 2026  
**Note:** Describes the backend as implemented in this repository; client apps and future features may extend the contract.
