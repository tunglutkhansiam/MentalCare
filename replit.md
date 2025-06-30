# MentalCare - Mental Health Consultation Platform

## Overview

MentalCare is a full-stack mental health consultation platform built with React, Express.js, and PostgreSQL. The application provides a comprehensive platform for connecting users with mental health experts, scheduling appointments, conducting assessments, and facilitating real-time communication through chat functionality.

## System Architecture

The application follows a modern full-stack architecture with clear separation of concerns:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with custom Tailwind CSS styling
- **Build Tool**: Vite for fast development and optimized builds
- **Mobile-First Design**: Progressive Web App (PWA) capabilities with responsive design

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy and express-session
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Real-time Communication**: WebSocket integration for live chat functionality
- **Background Services**: Node.js cron jobs for appointment reminders

### Database Architecture
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle migrations for version control
- **Connection Pooling**: @neondatabase/serverless for optimized connections

## Key Components

### Authentication System
- Session-based authentication using express-session
- Password hashing with Node.js crypto module (scrypt)
- Role-based access control (users vs experts)
- Protected routes with authentication middleware

### User Management
- Comprehensive user profiles with health information
- Expert profiles with specializations and credentials
- Avatar and profile image management
- Account settings and preferences

### Appointment System
- Calendar-based appointment booking with date/time selection
- Appointment status tracking (pending, confirmed, completed, cancelled)
- Automated SMS reminders via Twilio integration
- Expert availability management
- Holiday and blackout date handling

### Real-time Messaging
- WebSocket-based chat system for user-expert communication
- Message persistence with PostgreSQL storage
- Message deletion and conversation management
- Real-time message broadcasting to connected clients

### Assessment System
- Dynamic questionnaire engine with multiple question types
- Scoring algorithms for mental health assessments
- Progress tracking and completion status
- Results storage and analysis

### Notification System
- SMS notifications via Twilio for appointment confirmations and reminders
- Email notifications via SendGrid (configured but not actively used)
- In-app notifications using toast components

## Data Flow

### User Registration and Authentication
1. User submits registration form with validation
2. Password is hashed using scrypt algorithm
3. User account is created in PostgreSQL database
4. Express-session manages login state with secure cookies

### Appointment Booking Flow
1. User browses available experts and selects preferred specialist
2. Calendar component displays available time slots
3. Appointment request is validated and stored in database
4. SMS confirmation is sent to user's phone number
5. Expert receives notification of new appointment
6. Automated reminders are scheduled via background job

### Chat Communication Flow
1. WebSocket connection established between user and expert
2. Messages are validated and stored in PostgreSQL
3. Real-time broadcasting to all connected clients in conversation
4. Message history persisted for future reference
5. Connection cleanup on client disconnect

### Assessment Completion Flow
1. User selects questionnaire from available assessments
2. Questions are dynamically loaded based on questionnaire type
3. Responses are validated and scored in real-time
4. Results are calculated and stored with completion timestamp
5. Recommendations are generated based on assessment scores

## External Dependencies

### Database and Infrastructure
- **PostgreSQL**: Local or cloud PostgreSQL database with connection pooling
- **Drizzle ORM**: Type-safe database operations and migrations
- **Docker**: Optional containerized PostgreSQL for local development

### Communication Services
- **Twilio**: SMS notifications for appointment reminders and confirmations
- **SendGrid**: Email service integration (configured for future use)

### UI and Development Tools
- **Shadcn/ui**: Pre-built accessible UI components
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Radix UI**: Headless UI primitives for complex components
- **Lucide React**: Icon library for consistent iconography

### Build and Development
- **TypeScript**: Static type checking across frontend and backend
- **Vite**: Fast build tool with hot module replacement
- **ESBuild**: JavaScript bundler for production builds

## Deployment Strategy

### Development Environment
- Local development with hot reloading via Vite
- Database migrations handled by Drizzle Kit
- Environment variables for service configuration

### Production Deployment
- Frontend built as static assets and served by Express
- Backend compiled to ESM modules with esbuild
- Database schema managed through migration files
- Environment-specific configuration for services

### Progressive Web App Features
- Service worker for offline functionality
- App manifest for mobile installation
- Push notification capabilities (configured for future use)
- Responsive design optimized for mobile devices

## Changelog

- June 30, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.