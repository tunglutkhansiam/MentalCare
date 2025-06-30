# MentalCare Deployment Guide for Render.com

## Prerequisites

1. **Neon Database**: Create a PostgreSQL database at [neon.tech](https://neon.tech)
2. **Twilio Account**: For SMS notifications (optional but recommended)
3. **Render Account**: For hosting at [render.com](https://render.com)

## Environment Variables Required

Set these environment variables in your Render dashboard:

### Required
- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `SESSION_SECRET`: A random string for session encryption (generate with: `openssl rand -base64 32`)

### Optional (for SMS notifications)
- `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token  
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number (format: +1234567890)

## Deployment Steps

### 1. Database Setup
Your Neon database will be automatically set up when the app starts. The migration system will:
- Create all required tables (users, experts, appointments, messages, etc.)
- Set up proper indexes for performance
- Initialize sample data including mental health experts and questionnaires

### 2. Render Configuration
Create a new Web Service on Render with these settings:
- **Build Command**: `npm install`
- **Start Command**: `npm run dev`
- **Environment**: Node.js
- **Instance Type**: Starter (or higher for production)

### 3. Environment Variables
In your Render dashboard, add the environment variables listed above.

### 4. Deploy
Connect your repository and deploy. The app will:
1. Install dependencies
2. Run database migrations automatically
3. Start the Express server
4. Initialize the appointment reminder scheduler

## Features Enabled After Deployment

✅ **User Authentication**: Registration and login system  
✅ **Expert Profiles**: Mental health professionals with specializations  
✅ **Appointment Booking**: Schedule consultations with experts  
✅ **Real-time Chat**: WebSocket-based messaging between users and experts  
✅ **Mental Health Assessment**: 21-question comprehensive questionnaire  
✅ **SMS Notifications**: Appointment reminders 1 hour before scheduled time  
✅ **Mobile-First Design**: PWA with offline capabilities  
✅ **IST Timezone Support**: All appointments and reminders use Indian Standard Time  

## Sample Accounts

After deployment, you can log in with these test accounts:

**Expert Accounts:**
- Username: `drjames` | Password: `password123`
- Username: `drsarah` | Password: `password123`
- Username: `drchen` | Password: `password123`
- Username: `dremily` | Password: `password123`

**Regular User:**
- Username: `testuser` | Password: `password123`

## API Endpoints

The app provides RESTful APIs for:
- `/api/auth/*` - Authentication (login, register, logout)
- `/api/users/*` - User management
- `/api/experts/*` - Expert profiles and specializations
- `/api/appointments/*` - Appointment booking and management
- `/api/messages/*` - Chat messaging
- `/api/questionnaires/*` - Mental health assessments

## Monitoring

The app includes comprehensive logging for:
- Database operations
- SMS notification status
- Appointment reminder system
- User authentication events
- API request/response timing

## Support

If you encounter issues:
1. Check Render logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure your Neon database is accessible
4. Test Twilio credentials if SMS isn't working

The app is designed to gracefully handle missing optional services (like Twilio) and will continue to function with core features even if SMS is unavailable.