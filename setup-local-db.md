# Local PostgreSQL Database Setup for MentalCare

## Option 1: Using Docker (Recommended)

### 1. Create docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: mentalcare-db
    environment:
      POSTGRES_DB: mentalcare
      POSTGRES_USER: mentalcare_user
      POSTGRES_PASSWORD: mentalcare_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  postgres_data:
```

### 2. Start the database
```bash
docker-compose up -d
```

### 3. Update your environment variables
```bash
DATABASE_URL=postgresql://mentalcare_user:mentalcare_password@localhost:5432/mentalcare
SESSION_SECRET=your-secret-key-here
# Optional: Twilio credentials for SMS
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number
```

## Option 2: Native PostgreSQL Installation

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS (using Homebrew):
```bash
brew install postgresql
brew services start postgresql
```

### Windows:
Download and install from: https://www.postgresql.org/download/windows/

### Create database and user:
```bash
sudo -u postgres psql
CREATE DATABASE mentalcare;
CREATE USER mentalcare_user WITH PASSWORD 'mentalcare_password';
GRANT ALL PRIVILEGES ON DATABASE mentalcare TO mentalcare_user;
\q
```

## Option 3: Using Replit Database

Replit provides a built-in PostgreSQL database that you can use directly.

### 1. Enable Replit Database
In your Replit project, go to Tools → Database and enable PostgreSQL.

### 2. Get connection details
Replit will provide you with:
- Host
- Port
- Database name
- Username
- Password

### 3. Update environment variables
Set your DATABASE_URL in Replit Secrets with the provided connection string.

## Database Schema Initialization

The app will automatically create all required tables when it starts up. The migration system handles:

- **Users table**: User accounts and profiles
- **Experts table**: Mental health professionals
- **Appointments table**: Consultation scheduling
- **Messages table**: Chat conversations
- **Questionnaires table**: Mental health assessments
- **Session table**: Authentication sessions

## Testing the Setup

1. Start your application: `npm run dev`
2. Check logs for "Database setup completed"
3. Visit the app and try to register/login
4. The database will be automatically populated with sample data

## Connection String Format

Your DATABASE_URL should follow this format:
```
postgresql://username:password@host:port/database_name
```

Examples:
- Local: `postgresql://mentalcare_user:mentalcare_password@localhost:5432/mentalcare`
- Docker: `postgresql://mentalcare_user:mentalcare_password@localhost:5432/mentalcare`
- Remote: `postgresql://user:pass@your-server.com:5432/mentalcare`

## Troubleshooting

### Connection Issues:
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check if port 5432 is available: `netstat -tulpn | grep 5432`
- Ensure user has proper permissions

### Authentication Issues:
- Check pg_hba.conf for authentication methods
- Verify username and password are correct
- Try connecting with psql: `psql -h localhost -U mentalcare_user -d mentalcare`

### Database Creation Issues:
- Check PostgreSQL logs: `sudo journalctl -u postgresql`
- Verify database exists: `psql -l`
- Check user privileges: `\du` in psql

## Benefits of Local Database

✅ **Full Control**: Complete control over database configuration
✅ **No Internet Dependency**: Works offline
✅ **Better Performance**: Lower latency for local development
✅ **Cost-Free**: No subscription or usage charges
✅ **Privacy**: Data stays on your local machine
✅ **Debugging**: Easy access to database logs and debugging tools