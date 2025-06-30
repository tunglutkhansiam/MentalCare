# MentalCare - Local Database Setup

## Quick Start with Docker

1. **Start the local PostgreSQL database**:
   ```bash
   bash setup-local-db.sh
   ```

2. **Start the application**:
   ```bash
   npm run dev
   ```

3. **Access the app**: Open http://localhost:5000

## Manual Setup Options

### Option 1: Docker (Recommended)

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Copy environment configuration
cp .env.local .env

# Start the app
npm run dev
```

### Option 2: System PostgreSQL

If you have PostgreSQL installed locally:

```bash
# Create database and user
sudo -u postgres createdb mentalcare
sudo -u postgres createuser mentalcare_user
sudo -u postgres psql -c "ALTER USER mentalcare_user WITH PASSWORD 'mentalcare_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mentalcare TO mentalcare_user;"

# Update your .env file
echo "DATABASE_URL=postgresql://mentalcare_user:mentalcare_password@localhost:5432/mentalcare" > .env
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env
```

## Database Configuration

The app uses these connection details:
- **Host**: localhost
- **Port**: 5432
- **Database**: mentalcare
- **Username**: mentalcare_user
- **Password**: mentalcare_password

## Features Included

✓ **Automatic Schema Creation**: All tables created on startup
✓ **Sample Data**: Pre-loaded mental health experts and questionnaires
✓ **User Authentication**: Complete login/registration system
✓ **Expert Profiles**: 4 mental health professionals
✓ **Mental Health Assessment**: 21-question comprehensive questionnaire
✓ **Appointment Booking**: Schedule consultations with IST timezone
✓ **Real-time Chat**: WebSocket messaging between users and experts
✓ **SMS Reminders**: Optional Twilio integration for appointment notifications

## Test Accounts

After setup, you can login with:

**Regular Users**:
- Username: `testuser` | Password: `password123`

**Mental Health Experts**:
- Username: `drsarah` | Password: `password123` (Dr. Sarah Johnson - Counseling Psychology)
- Username: `drjames` | Password: `password123` (Dr. James Wilson - Clinical Psychology)
- Username: `drchen` | Password: `password123` (Dr. Thomas Chen - Cognitive Behavioral Therapy)
- Username: `dremily` | Password: `password123` (Dr. Emily Davis - Child Psychology)

## Database Management

```bash
# Connect to database
psql postgresql://mentalcare_user:mentalcare_password@localhost:5432/mentalcare

# View tables
\dt

# Check users
SELECT username, first_name, last_name FROM users;

# Check experts
SELECT name, specialty FROM experts;

# Stop database
docker-compose down
```

## Troubleshooting

**Database Connection Issues**:
- Ensure Docker is running: `docker ps`
- Check database container: `docker logs mentalcare-db`
- Verify connection: `psql postgresql://mentalcare_user:mentalcare_password@localhost:5432/mentalcare`

**Port Conflicts**:
- Check if port 5432 is in use: `lsof -i :5432`
- Change database port in docker-compose.yml if needed

**Permission Issues**:
- Ensure your user can run Docker: `docker run hello-world`
- On Linux, add user to docker group: `sudo usermod -aG docker $USER`

## SMS Notifications (Optional)

To enable SMS appointment reminders:

1. Create a Twilio account at https://console.twilio.com/
2. Add these to your .env file:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

## Production Deployment

For production deployment without Neon:

1. **Use a managed PostgreSQL service**:
   - AWS RDS PostgreSQL
   - Google Cloud SQL
   - DigitalOcean Managed Databases
   - Azure Database for PostgreSQL

2. **Update your DATABASE_URL** with the production connection string

3. **Set secure environment variables**:
   ```
   DATABASE_URL=postgresql://user:pass@prod-host:5432/mentalcare
   SESSION_SECRET=your-secure-random-string
   NODE_ENV=production
   ```

The app will automatically create all required tables and sample data on first startup.