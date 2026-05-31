# StoryApp - Application Specification

## Overview
StoryApp is a collaborative storytelling backend: a .NET 9 Web API with PostgreSQL and SignalR. Users join **pulses**, add sequential **beats** (text contributions), and see updates in real time. JWT secures both REST and the SignalR hub.

This repository contains the **backend solution** only; a separate React (or other) client would consume these APIs and connect to **`/pulseHub`**.

## Architecture

**Backend Stack:**
- .NET 9 Web API
- PostgreSQL with Entity Framework Core
- SignalR for real-time beats, typing, and presence-style user status
- JWT Bearer authentication (HTTP header and hub query string)
- Clean Architecture: Core, Infrastructure, Services, Api

**Typical client stack (not in this repo):**
- React with TypeScript, Vite, SignalR client, Axios — aligned with product docs elsewhere in the monorepo if applicable

**Project Structure:**
- `StoryApp.Core` — Entities, DTOs, interfaces, exceptions, query builders
- `StoryApp.Infrastructure` — DbContext (`PulseDbContext`), repositories, migrations, seeding
- `StoryApp.Services` — Auth, user, and pulse application services (`PulseService`)
- `StoryApp.Api` — Controllers, SignalR **`PulseHub`**, middleware, DI

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

### 3. Pulses (collaborative spaces)
- Create pulses (name, description, public/private)
- List pulses the current user collaborates on
- Get pulse detail (collaborators only)
- Update pulse metadata (**pulse creator** only)
- Delete pulse (**pulse creator** only)
- Creating user is recorded on the pulse (`CreatedBy`) and added as an initial collaborator

### 4. Pacer participation (pulse membership)
- Add pacers (`POST .../pacers`), body `AddPacerRequest` (`userId`) — **pulse creator** only
- Remove pacers (`DELETE .../pacers/{userId}`): **pulse creator** may remove another collaborator; any collaborator may remove themselves; removing the **`CreatedBy`** user from memberships is rejected
- Unique membership per user per pulse
- Join timestamps tracked

### 5. Beats (contributions within a pulse)
- **REST:** Paginated beat history (`GET /api/pulses/{pulseId}/beats`)
- **SignalR:** Send, edit, and delete beats in real time (`SendBeat`, `EditBeat`, `DeleteBeat`)
- Beat contributions are serialized as text (**`passage`**) (`SendBeat`), with room to extend the model later
- Edit/delete restricted to the beat author (enforced in the hub)

### 6. Real-time features (SignalR `/pulseHub`)
- Broadcast new, edited, and deleted beats to pulse groups
- Join/leave pulse groups (`JoinPulse`, `LeavePulse`) with membership checks
- Typing indicators (`StartTyping`, `StopTyping`) scoped by pulse
- User online/offline broadcasts (`UserStatusChanged`)
- JWT supplied via query parameter: `?access_token={token}`

## Database Schema (conceptual)

### Users
- Identity, credentials (password hash), refresh token fields, `CreatedAt`, `LastSeen`, `IsOnline`

### Pulses (`Pulses` table)
- `Name`, `Description`, `IsPrivate`, `CreatedBy`, `CreatedAt`

### Pacers (`Pacers` table)
- `UserId`, `PulseId`, `JoinedAt`
- Unique (UserId, PulseId)

### Beats
- `Passage`, `UserId`, `PulseId`, `CreatedAt`, `EditedAt`
- Indexed for efficient paging by pulse and time

Exact column definitions and cascade behaviors live in EF configurations under `StoryApp.Infrastructure` (`PulseDbContext`).

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` — `RegisterRequest` → token payload
- `POST /api/auth/login` — `LoginRequest` → token payload
- `POST /api/auth/refresh` — refresh token → new tokens
- `POST /api/auth/logout` — revoke refresh token (authenticated)
- `GET /api/auth/me` — current user ids from JWT (authenticated)

### Pulses (`/api/pulses`)
- `GET /api/pulses` — pulses for the current user
- `GET /api/pulses/{pulseId}` — detail (403 if not a collaborator, 404 if missing)
- `POST /api/pulses` — create pulse
- `PUT /api/pulses/{pulseId}` — update (pulse creator)
- `DELETE /api/pulses/{pulseId}` — delete (pulse creator)
- `GET /api/pulses/{pulseId}/beats?page=&pageSize=` — paginated beats (default page size 50)
- `POST /api/pulses/{pulseId}/pacers` — add pacer
- `DELETE /api/pulses/{pulseId}/pacers/{userId}` — remove pacer

### Users (`/api/users`)
- `GET /api/users/me` — current profile
- `PUT /api/users/me` — update profile
- `GET /api/users/{userId}` — user by id
- `GET /api/users/search?query=` — search
- `GET /api/users` — list users

### SignalR Hub (`/pulseHub`)

**Connection:** JWT via `access_token` query parameter; `[Authorize]` on the hub.

**Client → server (examples):**
- `JoinPulse(int pulseId)` / `LeavePulse(int pulseId)`
- `SendBeat(int pulseId, string passage)`
- `EditBeat(int beatId, string newPassage)` / `DeleteBeat(int beatId)`
- `StartTyping(int pulseId)` / `StopTyping(int pulseId)`

**Server → client (event names):**
- `ReceiveBeat` — `BeatDto`
- `BeatEdited` — `BeatEditedDto`
- `BeatDeleted` — `BeatDeletedDto`
- `UserJoinedPulse` / `UserLeftPulse` — `PulseEventDto`
- `UserStartedTyping` / `UserStoppedTyping` — `TypingIndicatorDto` (includes `PulseId`)
- `UserStatusChanged` — `UserStatusChangedDto`

## Security (summary)
- Password hashing (BCrypt)
- JWT for API and SignalR
- Pulse membership checks for pulse-scoped operations
- Hub uses `HubException` for predictable client errors
- CORS policy `AllowReactApp` for typical local dev origins (see `Program.cs`)

## Development features
- Swagger in Development
- Migrations applied on API startup
- Idempotent seed when the database has no users (`PulseDbContext` seed hook calls **`PulseDbSeeder.SeedAsync`**)

## Sample seed data
- Users: `aya`, `bobby`, `carlos` (password `test123`)
- Pulses (example, Dutch demo copy): **"Het Neon-Noedel Bijpand"**, **"Logboek van de stormglaswaker"**, **"De envelop met de koperen sleutel"** — twee pacers per pulse en beats in het rond (**`PulseDbSeeder`**)

## Configuration (reference)
- **Connection string:** `DefaultConnection` in `StoryApp.Api` configuration (PostgreSQL)
- **JWT:** `JwtSettings` — e.g. Issuer `StoryApp.API.Dev`, Audience `StoryApp.Web.Dev` in Development
- **CORS:** e.g. `http://localhost:3000`, `http://localhost:5173`

## Technical constraints (typical)
- Beat **passage** text and string max lengths match EF `StringLength` on entities (e.g. long text fields on beats/pulses/users)
- Default beat pagination: **50** per page on `GetPulseBeats`

---

**Document version:** 1.2  
**Last updated:** May 2026  
**Note:** Describes the backend as implemented in this repository; client apps and future features may extend the contract.
