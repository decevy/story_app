# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Build and Run
- `dotnet build` - Build the entire solution
- `dotnet run --project StoryApp.Api` - Run the API server (will apply database migrations on startup)
- `dotnet restore` - Restore NuGet packages

### Database
- `dotnet ef migrations add <MigrationName> --project StoryApp.Infrastructure --startup-project StoryApp.Api` - Add new migration
- `dotnet ef database update --project StoryApp.Infrastructure --startup-project StoryApp.Api` - Apply migrations

### Testing
- No test projects are currently configured in this solution

## Architecture

This is a .NET 9 **StoryApp** backend using Clean Architecture with four projects:

### StoryApp.Core
Domain layer containing:
- **Entities**: User, Story, Turn, StoryMember, TurnReaction and related enums
- **DTOs**: API and SignalR payloads (auth, users, stories, turns)
- **Interfaces**: Repository and service contracts (e.g. `IStoryRepository`, `ITurnRepository`, `IAuthService`, `IStoryService`)

### StoryApp.Infrastructure
Data access layer containing:
- **StoryDbContext**: EF Core with PostgreSQL, configurations and in-context seeding
- **Repositories**: User, Story, Turn repositories
- **Dependencies**: PostgreSQL (Npgsql), Redis, Azure Blob (packages as configured)

### StoryApp.Services
Application services: **AuthService**, **UserService**, **StoryService**

### StoryApp.Api
- **ASP.NET Core Web API**, Swagger, JWT, CORS
- **SignalR** hub **`StoryHub`** at **`/storyHub`** (JWT via `access_token` query string)

## Key Configurations

- **Database**: PostgreSQL with automatic migrations on startup
- **Authentication**: JWT from appsettings
- **SignalR**: JWT on WebSocket via query parameter for `/storyHub`
- **CORS**: React dev origins (e.g. localhost:3000)

## Entity Relationships (summary)

- Users collaborate on **Stories** via **StoryMember**
- **Turns** belong to a Story and User; **TurnReaction** on turns
