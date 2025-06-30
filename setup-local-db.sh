#!/bin/bash

# MentalCare Local Database Setup Script

echo "🏥 Setting up MentalCare local PostgreSQL database..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true

# Start PostgreSQL container
echo "🚀 Starting PostgreSQL container..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d postgres
else
    docker compose up -d postgres
fi

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if docker exec mentalcare-db pg_isready -U mentalcare_user -d mentalcare &> /dev/null; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    
    echo "Waiting for database... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
    echo "❌ Database failed to start within $timeout seconds"
    exit 1
fi

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.local .env
    echo "✅ Created .env file with local database configuration"
    echo "📝 Please edit .env file to add your Twilio credentials for SMS notifications (optional)"
else
    echo "⚠️  .env file already exists. Please make sure DATABASE_URL points to local PostgreSQL:"
    echo "DATABASE_URL=postgresql://mentalcare_user:mentalcare_password@localhost:5432/mentalcare"
fi

echo ""
echo "🎉 Local database setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file to configure your settings"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:5000"
echo ""
echo "🔧 Database management:"
echo "• Connect: psql postgresql://mentalcare_user:mentalcare_password@localhost:5432/mentalcare"
echo "• Stop: docker-compose down"
echo "• Restart: docker-compose restart postgres"
echo "• Logs: docker-compose logs postgres"
echo ""
echo "📱 Test accounts (password: password123):"
echo "• User: testuser"
echo "• Expert: drsarah"