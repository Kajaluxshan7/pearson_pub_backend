# Pearson Pub Backend - Docker Setup

This directory contains the production-ready Docker configuration for the NestJS backend with PostgreSQL database.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│    Backend      │    │   Database      │
│    NestJS       │◄──►│   PostgreSQL    │
│   Port: 5000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Linux/Mac

1. **Setup environment**:

   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

2. **Deploy**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh deploy
   ```

### Windows

1. **Setup environment**:

   ```cmd
   copy .env.example .env
   notepad .env
   ```

2. **Deploy**:
   ```cmd
   deploy.bat deploy
   ```

## 📋 Configuration

### Required Environment Variables

```bash
# Database
DB_NAME=pearson_pub
DB_USERNAME=postgres
DB_PASSWORD=your-secure-password  # CHANGE THIS!

# JWT Security
JWT_SECRET=your-32-char-secret    # CHANGE THIS!

# Ports
BACKEND_PORT=5000
DB_PORT=5432

# Frontend URL
FRONTEND_URL=http://localhost:3002
```

### Important Security Notes

🔒 **Before production deployment:**

- Change `DB_PASSWORD` to a strong password (16+ characters)
- Generate a secure `JWT_SECRET` (32+ characters)
- Configure proper CORS settings for your frontend domain

## 🛠️ Available Commands

### Linux/Mac (`./deploy.sh`)

```bash
./deploy.sh deploy     # Deploy backend + database
./deploy.sh status     # Show service status
./deploy.sh logs       # Show all logs
./deploy.sh logs backend    # Show backend logs only
./deploy.sh stop       # Stop all services
./deploy.sh restart    # Restart all services
./deploy.sh backup     # Backup database
./deploy.sh db         # Open database console
```

### Windows (`deploy.bat`)

```cmd
deploy.bat deploy      # Deploy backend + database
deploy.bat status      # Show service status
deploy.bat logs        # Show all logs
deploy.bat stop        # Stop all services
deploy.bat backup      # Backup database
deploy.bat db          # Open database console
```

### Manual Docker Commands

```bash
# Deploy
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f database

# Stop
docker-compose down

# Database backup
docker-compose exec -T database pg_dump -U postgres pearson_pub > backup.sql
```

## 🔍 Service URLs

After deployment, your services will be available at:

- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health
- **Database**: localhost:5432 (for external connections)

## 🗄️ Database Management

### Backup Database

```bash
./deploy.sh backup
# Creates: backend_backup_YYYYMMDD_HHMMSS.sql
```

### Restore Database

```bash
# Stop backend service first
docker-compose stop backend

# Restore
docker-compose exec -T database psql -U postgres pearson_pub < backup.sql

# Start backend
docker-compose start backend
```

### Access Database Console

```bash
./deploy.sh db
# Or manually:
docker-compose exec database psql -U postgres -d pearson_pub
```

## 🔧 Troubleshooting

### Common Issues

**Port 5000 already in use:**

```bash
# Check what's using the port
netstat -tulpn | grep :5000  # Linux/Mac
netstat -an | findstr :5000  # Windows

# Change port in .env file
BACKEND_PORT=5001
```

**Database connection failed:**

```bash
# Check database logs
docker-compose logs database

# Verify database is healthy
docker-compose ps
```

**Backend won't start:**

```bash
# Check backend logs
docker-compose logs backend

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

### Health Checks

Check if services are running properly:

```bash
# Quick status check
docker-compose ps

# Test backend API
curl http://localhost:5000/health

# Test database connection
docker-compose exec database pg_isready -U postgres
```

## 📊 Production Considerations

### Performance

- The backend runs with Node.js production optimizations
- PostgreSQL is configured with basic production settings
- Consider connection pooling for high-traffic applications

### Security

- Backend runs as non-root user
- Database uses non-root postgres user
- Change default passwords before production deployment
- Configure firewall rules for production servers

### Monitoring

- Health checks are configured for both services
- Logs are available via `docker-compose logs`
- Consider adding external monitoring tools for production

### Scaling

For higher loads, consider:

- Multiple backend instances behind a load balancer
- PostgreSQL read replicas
- Redis for session storage and caching

## 🔄 Development vs Production

This configuration is optimized for **production**. For development:

1. Use `npm run start:dev` locally instead of Docker
2. Connect to a local PostgreSQL instance
3. Enable hot reloading and debugging features

## 📞 Support

**Backend not starting?**

1. Check `docker-compose logs backend`
2. Verify environment variables in `.env`
3. Ensure database is healthy: `docker-compose ps`

**Database issues?**

1. Check `docker-compose logs database`
2. Verify PostgreSQL port is not in use
3. Check disk space for database volumes

**API not responding?**

1. Test health endpoint: `curl http://localhost:5000/health`
2. Check firewall settings
3. Verify CORS configuration if accessing from frontend
