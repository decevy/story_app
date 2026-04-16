# StoryApp - Local Development Setup

## Prerequisites
- Docker Desktop installed and running
- .NET 9 SDK installed
- Your preferred IDE (Visual Studio, Rider, or VS Code with C# extensions)

## Quick Start

### 1. Start Docker Services
```bash
# From the StoryApp directory (where docker-compose.yml lives)
docker compose up -d

# Verify all services are running
docker compose ps
```

You should see three services running:
- `storyapp-postgres` on port 5432
- `storyapp-redis` on port 6379
- `storyapp-pgadmin` on port 5050

### 2. Configure the API
Place or merge `appsettings.Development.json` in **`StoryApp.Api/`** so `ConnectionStrings:DefaultConnection` points at the Postgres container (see **Accessing Services** below for host, database, and credentials).

### 3. Apply Database Migrations
```bash
# From the StoryApp solution root
dotnet ef database update --project StoryApp.Infrastructure --startup-project StoryApp.Api

# Optional: list migrations
dotnet ef migrations list --project StoryApp.Infrastructure --startup-project StoryApp.Api
```

The API also runs pending migrations on startup (`Database.Migrate()`), but applying explicitly is useful before the first run.

### 4. Run the API
```bash
dotnet run --project StoryApp.Api
```

Default URLs (see `StoryApp.Api/Properties/launchSettings.json`):
- HTTPS: `https://localhost:7011`
- HTTP: `http://localhost:5056`

Use your IDE’s run profile (**https** recommended) or the command above.

## Accessing Services

### PostgreSQL Database
- **Host**: localhost:5432
- **Database**: storyappdb_dev
- **Username**: storyapp_user
- **Password**: dev_password_123

### pgAdmin (Web UI for PostgreSQL)
- **URL**: http://localhost:5050
- **Email**: admin@storyapp.dev
- **Password**: admin123

To connect to your database in pgAdmin:
1. Right-click "Servers" → "Register" → "Server"
2. General Tab: Name = "StoryApp Dev"
3. Connection Tab:
   - Host: postgres (use the Docker service name, not localhost)
   - Port: 5432
   - Database: storyappdb_dev
   - Username: storyapp_user
   - Password: dev_password_123

### Redis
- **Host**: localhost:6379
- No authentication required for local dev

## Useful Commands

### Docker
```bash
# Stop all services
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v

# View logs
docker compose logs -f [service_name]

# Restart a specific service
docker compose restart postgres
```

### Entity Framework
```bash
# Add a new migration (from solution root)
dotnet ef migrations add MigrationName --project StoryApp.Infrastructure --startup-project StoryApp.Api

# Remove last migration (if not applied)
dotnet ef migrations remove --project StoryApp.Infrastructure --startup-project StoryApp.Api

# Update database to a specific migration
dotnet ef database update MigrationName --project StoryApp.Infrastructure --startup-project StoryApp.Api

# Generate SQL script for migrations
dotnet ef migrations script --project StoryApp.Infrastructure --startup-project StoryApp.Api

# Drop database (use with care)
dotnet ef database drop --project StoryApp.Infrastructure --startup-project StoryApp.Api
```

### Resetting Database and Seed Data
If you want to reset the database and re-run the seed data:

```bash
# Option 1: Using EF Core (from solution root)
dotnet ef database drop --force --project StoryApp.Infrastructure --startup-project StoryApp.Api
dotnet ef database update --project StoryApp.Infrastructure --startup-project StoryApp.Api
dotnet run --project StoryApp.Api   # Seed runs when the DB is empty

# Option 2: Using Docker (complete reset)
docker compose down -v
docker compose up -d
dotnet ef database update --project StoryApp.Infrastructure --startup-project StoryApp.Api
dotnet run --project StoryApp.Api
```

**Note**: The seeder only runs if the database is empty (no users exist). After running these commands, the database will be populated with:
- 3 test users (aya, bobby, carlos) — password: `test123`
- 3 test stories (General, Bachata, Gym bros)
- Sample turns across those stories

## Troubleshooting

### Database connection fails
- Ensure PostgreSQL container is running: `docker compose ps`
- Check container logs: `docker compose logs postgres`
- Verify the connection string in `StoryApp.Api/appsettings.Development.json`

### Port conflicts
If ports 5432, 6379, or 5050 are already in use, update `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Change first number only
```
Then update your connection string’s port accordingly.

### Migration fails
- Ensure migrations exist under `StoryApp.Infrastructure/Migrations/`
- Try removing and recreating only in a dev database: `dotnet ef migrations remove` then `dotnet ef migrations add InitialCreate` (names may vary)

## Next Steps
Once your environment is running:
1. Confirm the API starts and connects to PostgreSQL
2. Open Swagger UI at `https://localhost:7011/swagger` (when using the HTTPS profile)
3. Connect a client to `/storyHub` with JWT via the `access_token` query parameter for real-time turns
