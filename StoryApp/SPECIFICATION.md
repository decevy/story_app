# StoryApp - Application Specification

## Overview
StoryApp is a collaborative storytelling backend: a .NET 9 Web API with PostgreSQL and SignalR. Users join **stories**, add sequential **turns** (text contributions), and see updates in real time. JWT secures both REST and the SignalR hub.

This repository contains the **backend solution** only; a separate React (or other) client would consume these APIs and connect to **`/storyHub`**.

## Architecture

**Backend Stack:**
- .NET 9 Web API
- PostgreSQL with Entity Framework Core
- SignalR for real-time turns, typing, and presence-style user status
- JWT Bearer authentication (HTTP header and hub query string)
- Clean Architecture: Core, Infrastructure, Services, Api

**Typical client stack (not in this repo):**
- React with TypeScript, Vite, SignalR client, Axios — aligned with product docs elsewhere in the monorepo if applicable

**Project Structure:**
- `StoryApp.Core` — Entities, DTOs, interfaces, exceptions, query builders
- `StoryApp.Infrastructure` — DbContext, repositories, migrations, seeding
- `StoryApp.Services` — Auth, user, and story application services
- `StoryApp.Api` — Controllers, SignalR `StoryHub`, middleware, DI

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
- Update story metadata (admin)
- Delete story (admin)
- Story creator becomes admin on create

**Story roles (`StoryMember`):**
- **Admin** — Full control over story settings and members
- **Moderator** — Can manage members (per service rules)
- **Member** — Can participate (turns, subject to membership)

### 4. Story membership
- Add collaborators (`POST .../members`)
- Remove collaborators (`DELETE .../members/{userId}`)
- Unique membership per user per story
- Join timestamps tracked

### 5. Turns (contributions within a story)
- **REST:** Paginated turn history per story (`GET /api/stories/{storyId}/turns`)
- **SignalR:** Send, edit, and delete turns in real time (`SendTurn`, `EditTurn`, `DeleteTurn`)
- Turn types in the model include Text and placeholders for richer types; attachment URL/name fields exist on `Turn`
- Edit/delete restricted to the turn author (enforced in the hub)

### 6. Real-time features (SignalR `/storyHub`)
- Broadcast new, edited, and deleted turns to story groups
- Join/leave story groups (`JoinStory`, `LeaveStory`) with membership checks
- Typing indicators (`StartTyping`, `StopTyping`) scoped by story
- User online/offline broadcasts (`UserStatusChanged`)
- JWT supplied via query parameter: `?access_token={token}`

### 7. Turn reactions (data model)
- `TurnReaction` entity: emoji per user per turn
- Unique constraint on (TurnId, UserId, Emoji)
- REST/hub surface for reactions may be extended over time; model is present for persistence

## Database Schema (conceptual)

### Users
- Identity, credentials (password hash), refresh token fields, `CreatedAt`, `LastSeen`, `IsOnline`

### Stories
- `Name`, `Description`, `IsPrivate`, `CreatedBy`, `CreatedAt`

### StoryMembers
- `UserId`, `StoryId`, `StoryRole`, `JoinedAt`
- Unique (UserId, StoryId)

### Turns
- `Content`, `UserId`, `StoryId`, `Type`, `CreatedAt`, `EditedAt`, optional attachment fields
- Indexed for efficient paging by story and time

### TurnReactions
- `TurnId`, `UserId`, `Emoji`, `CreatedAt`
- Unique (TurnId, UserId, Emoji)

Exact column definitions and cascade behaviors live in EF configurations under `StoryApp.Infrastructure`.

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
- `PUT /api/stories/{storyId}` — update (admin)
- `DELETE /api/stories/{storyId}` — delete (admin)
- `GET /api/stories/{storyId}/turns?page=&pageSize=` — paginated turns (default page size 50)
- `POST /api/stories/{storyId}/members` — add collaborator
- `DELETE /api/stories/{storyId}/members/{userId}` — remove collaborator

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
- `SendTurn(int storyId, string content)`
- `EditTurn(int turnId, string newContent)` / `DeleteTurn(int turnId)`
- `StartTyping(int storyId)` / `StopTyping(int storyId)`

**Server → client (event names):**
- `ReceiveTurn` — `TurnDto`
- `TurnEdited` — `TurnEditedDto`
- `TurnDeleted` — `TurnDeletedDto`
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
- Idempotent seed when the database has no users (`StoryDbSeeder`)

## Sample seed data
- Users: `aya`, `bobby`, `carlos` (password `test123`)
- Stories: "General", "Bachata", "Gym bros" (with mixed roles and sample turns)

## Configuration (reference)
- **Connection string:** `DefaultConnection` in `StoryApp.Api` configuration (PostgreSQL)
- **JWT:** `JwtSettings` — e.g. Issuer `StoryApp.API.Dev`, Audience `StoryApp.Web.Dev` in Development
- **CORS:** e.g. `http://localhost:3000`, `http://localhost:5173`

## Technical constraints (typical)
- Turn content and string max lengths match EF `StringLength` on entities (e.g. long text fields on turns/stories/users)
- Default turn pagination: **50** per page on `GetStoryTurns`

---

**Document version:** 1.1  
**Last updated:** April 2026  
**Note:** Describes the backend as implemented in this repository; client apps and future features may extend the contract.
