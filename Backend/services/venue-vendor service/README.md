# EventZen Venue & Vendor Service

A comprehensive Node.js microservice for managing venues and vendors in the EventZen event management platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 7+
- npm or yarn

### Installation & Setup

1. **Clone or navigate to the venue-vendor-service directory**
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB:**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod

   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7
   ```

5. **Seed the database with sample data:**
   ```bash
   npm run seed
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

The service will be available at `http://localhost:3001`

## 📋 Features

### Venue Management
- ✅ Public venue listings with advanced filters
- ✅ Geospatial search (find venues by location)
- ✅ Venue availability checking
- ✅ Real-time booking system with conflict detection
- ✅ Multi-hall venue support
- ✅ Admin venue management (CRUD operations)

### Vendor Management
- ✅ Verified vendor directory by service type
- ✅ Location-based vendor search
- ✅ Rating and review system
- ✅ Contract management system
- ✅ Multi-service vendor support
- ✅ Performance metrics tracking

### Advanced Features
- ✅ JWT Authentication & Role-based Authorization
- ✅ Rate limiting by user role
- ✅ Input validation & sanitization
- ✅ Comprehensive error handling
- ✅ Request/response logging
- ✅ Health monitoring
- ✅ Geospatial indexing for performance

## 🔧 API Endpoints

### Public Endpoints
```
GET    /health                      - Service health check
GET    /api                         - API documentation
GET    /api/v1/venues              - List venues (with filters)
GET    /api/v1/venues/:id          - Get venue details
GET    /api/v1/venues/nearby       - Find venues by location
POST   /api/v1/venues/search       - Advanced venue search
GET    /api/v1/venues/:id/halls    - Get venue halls
```

### Protected Endpoints (JWT Required)
```
GET    /api/v1/venues/:id/availability     - Check venue availability
GET    /api/v1/vendors                     - List vendors
GET    /api/v1/vendors/:id                 - Get vendor details
GET    /api/v1/vendors/service/:type       - Get vendors by service type
GET    /api/v1/vendors/nearby              - Find vendors by location
POST   /api/v1/vendors/search              - Advanced vendor search
```

### Organizer Endpoints
```
POST   /api/v1/venues/:id/book             - Book venue
POST   /api/v1/vendors/events/:id/hire     - Hire vendor
```

### Admin Endpoints
```
POST   /api/v1/venues                      - Create venue
PUT    /api/v1/venues/:id                  - Update venue
DELETE /api/v1/venues/:id                  - Delete venue
GET    /api/v1/venues/:id/bookings         - Get venue bookings
POST   /api/v1/venues/:id/halls            - Add hall to venue
POST   /api/v1/vendors                     - Create vendor
PUT    /api/v1/vendors/:id                 - Update vendor
DELETE /api/v1/vendors/:id                 - Delete vendor
PATCH  /api/v1/vendors/contracts/:id/status - Update contract status
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run linting
npm run lint
```

### Manual Testing with Postman
1. Import the Postman collection: `EventZen_Venue_Vendor_Service.postman_collection.json`
2. Import the environment: `EventZen_Development.postman_environment.json`
3. Set up JWT tokens in the environment variables
4. Run the test collection

### Test Scenarios
See `TEST_CASES.md` for comprehensive test cases covering:
- All API endpoints
- Authentication & authorization
- Error handling
- Business logic validation
- Performance testing

## 📊 Database Schema

### Collections
- **venues** - Venue information with geospatial data
- **venue_halls** - Individual halls within venues
- **vendors** - Vendor profiles and services
- **event_vendors** - Vendor contracts and agreements
- **event_venue_bookings** - Venue booking records

### Key Features
- UUIDs for all primary keys
- Geospatial indexing for location-based queries
- Soft deletes for data preservation
- Audit fields (created_by, updated_by, timestamps)
- Optimized indexes for performance

## 🔐 Authentication & Authorization

### User Roles
- **Public**: Access to venue listings (no auth required)
- **User**: Basic authenticated access
- **Organizer**: Can book venues and hire vendors
- **Vendor**: Can manage own profile and contracts
- **Admin**: Full access to all resources

### JWT Token Format
```json
{
  "userId": "user-uuid",
  "email": "user@example.com",
  "role": "organizer",
  "permissions": ["venue:book", "vendor:hire"],
  "iat": 1640995200,
  "exp": 1641081600
}
```

## ⚡ Performance

### Optimization Features
- MongoDB indexes for fast queries
- Geospatial 2dsphere indexes for location searches
- Connection pooling (max 10 connections)
- Request rate limiting
- Response caching for venue listings
- Pagination for large result sets

### Response Time Targets
- GET endpoints: < 200ms
- POST/PUT endpoints: < 500ms
- Search endpoints: < 1000ms
- Geospatial queries: < 300ms

## 🔧 Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/eventzen_venues
JWT_SECRET=your-super-secret-jwt-key

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=1000

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Logging
LOG_LEVEL=info
ENABLE_MONGODB_LOGGING=false
```

## 📁 Project Structure

```
venue-vendor-service/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── validators/      # Input validation schemas
│   └── server.js       # Application entry point
├── logs/               # Application logs
├── tests/             # Test files
├── .env              # Environment variables
├── package.json      # Dependencies and scripts
└── README.md        # This file
```

## 🚀 Deployment

### Docker Deployment
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Build Commands
```bash
# Production build
npm run build

# Start production server
npm start

# Health check
curl http://localhost:3001/health
```

### Environment Setup
1. Production MongoDB cluster
2. Load balancer configuration
3. SSL/TLS certificates
4. Environment-specific JWT secrets
5. Monitoring and logging setup

## 📈 Monitoring

### Health Endpoints
- `GET /health` - Service health status
- `GET /api/health` - API health check

### Logging
- Request/response logging
- Error tracking with stack traces
- Performance metrics
- Database query logging (optional)

### Metrics to Monitor
- Response times
- Error rates
- Database connection health
- Memory usage
- Request volume by endpoint

## 🤝 Integration

### Frontend Integration
The service integrates with the React frontend through:
- API service layer (`venueVendorService.js`)
- React components (`VenueList.jsx`, `VendorList.jsx`)
- Environment configuration

### Service Communication
- JWT token validation with Auth Service
- Event data synchronization with Event Service
- Payment processing with Finance Service

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if MongoDB is running
   sudo systemctl status mongod

   # Check connection string in .env
   echo $MONGODB_URI
   ```

2. **JWT Token Invalid**
   ```bash
   # Verify JWT secret matches across services
   # Check token expiry and format
   ```

3. **Geospatial Queries Not Working**
   ```bash
   # Ensure coordinates are [longitude, latitude]
   # Check if 2dsphere indexes are created
   ```

4. **Rate Limiting Issues**
   ```bash
   # Adjust rate limits in .env
   # Check if user roles are set correctly in JWT
   ```

### Debug Commands
```bash
# Enable debug logging
DEBUG=* npm run dev

# Check database indexes
npm run db:indexes

# Validate configuration
npm run config:validate
```

## 📚 Additional Resources

- [API Documentation](http://localhost:3001/api) - Interactive API docs
- [Test Cases](./TEST_CASES.md) - Comprehensive test scenarios
- [Postman Collection](./EventZen_Venue_Vendor_Service.postman_collection.json) - API testing
- [Database Schema](./docs/database-schema.md) - Detailed schema documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**EventZen Venue & Vendor Service** - Built with ❤️ by the EventZen Team