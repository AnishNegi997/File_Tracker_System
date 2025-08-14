# File Tracker Backend API

A comprehensive Express.js backend API for the File Tracker application with authentication, file management, movement tracking, and forwarding capabilities.

## Features

- 🔐 **Authentication & Authorization**: JWT-based authentication with role-based access control
- 📁 **File Management**: CRUD operations for files with department-based access
- 📊 **Movement Tracking**: Complete audit trail of file movements and actions
- 📤 **File Forwarding**: Advanced forwarding system with tracking and status updates
- 👥 **User Management**: Admin tools for user management and role assignment
- 📈 **Dashboard Analytics**: Comprehensive statistics and reporting
- 🛡️ **Security**: Rate limiting, input validation, and security headers

## Tech Stack

- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors, rate-limiting
- **File Upload**: multer (ready for implementation)

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**:
   ```bash
   # Copy the config file
   cp config.env.example config.env
   
   # Edit the configuration
   nano config.env
   ```

3. **Start the server**:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## MongoDB Setup & Usage

This backend now uses MongoDB for persistent data storage via Mongoose.

### 1. Prerequisites
- You need a running MongoDB instance (local or cloud, e.g., MongoDB Atlas).

### 2. Configuration
- Set the `MONGODB_URI` variable in your `config.env` file:
  ```env
  MONGODB_URI=mongodb://localhost:27017/file-tracker
  ```
  - For production, use your cloud MongoDB URI.

### 3. Running Locally
- By default, the backend connects to `mongodb://localhost:27017/file-tracker`.
- Make sure MongoDB is running locally before starting the backend:
  ```bash
  # Start MongoDB (if installed locally)
  mongod
  ```

### 4. Mongoose Models
- All file data is now stored in MongoDB using the Mongoose model in `backend/data/files.js`.
- You can extend or modify the schema as needed for your application.

### 5. Notes
- The server will only start after a successful MongoDB connection.
- If the connection fails, check your `MONGODB_URI` and MongoDB server status.

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/profile` | Update profile | Private |
| PUT | `/api/auth/change-password` | Change password | Private |

### Files

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/files` | Get all files | Private |
| GET | `/api/files/:id` | Get file by ID | Private |
| GET | `/api/files/code/:code` | Get file by code | Private |
| POST | `/api/files` | Create new file | Private |
| PUT | `/api/files/:id` | Update file | Private |
| DELETE | `/api/files/:id` | Delete file | Admin |
| GET | `/api/files/search` | Search files | Private |

### Movements

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/movements` | Get all movements | Private |
| GET | `/api/movements/file/:fileId` | Get file movements | Private |
| POST | `/api/movements/file/:fileId` | Add movement | Private |
| PUT | `/api/movements/:id` | Update movement | Private |
| DELETE | `/api/movements/:id` | Delete movement | Private |

### Forwards

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/forwards` | Get all forwards | Private |
| GET | `/api/forwards/:id` | Get forward by ID | Private |
| POST | `/api/forwards` | Create forward | Private |
| PUT | `/api/forwards/:id` | Update forward | Private |
| PATCH | `/api/forwards/:id/status` | Update status | Private |
| DELETE | `/api/forwards/:id` | Delete forward | Private |

### Users (Admin)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/users` | Get all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Admin |
| POST | `/api/users` | Create user | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |
| PATCH | `/api/users/:id/reset-password` | Reset password | Admin |

### Dashboard

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/dashboard/stats` | Get statistics | Private |
| GET | `/api/dashboard/departments` | Department breakdown | Private |
| GET | `/api/dashboard/recent-activities` | Recent activities | Private |
| GET | `/api/dashboard/status-distribution` | Status distribution | Private |
| GET | `/api/dashboard/priority-distribution` | Priority distribution | Private |
| GET | `/api/dashboard/forwarding-stats` | Forwarding statistics | Private |

## Authentication

### Login Example

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@company.com",
    "password": "password123"
  }'
```

### Using JWT Token

```bash
curl -X GET http://localhost:5000/api/files \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Data Models

### File Structure

```javascript
{
  id: 1,
  code: "THDC-F-2025-0012",
  title: "Employee Leave Application",
  department: "HR",
  status: "Received",
  priority: "Normal",
  type: "Physical",
  requisitioner: "Alice Johnson",
  remarks: "Received at front desk",
  datetime: "2025-07-08 10:00",
  currentHolder: "Alice (Records Office)",
  createdBy: "Alice Johnson",
  createdAt: "2025-07-08T10:00:00.000Z"
}
```

### Movement Structure

```javascript
{
  id: 1,
  user: "Alice (Records Office)",
  action: "Received",
  remarks: "Received at front desk",
  datetime: "2025-07-08 10:00",
  icon: "📥",
  sentBy: null,
  sentThrough: null,
  recipientName: null
}
```

### Forward Structure

```javascript
{
  id: 1,
  fileId: "THDC-F-2025-0012",
  action: "forward",
  recipientDepartment: "Finance",
  recipientName: "Finance Manager",
  sentBy: "HR Manager",
  sentThrough: "internal-mail",
  priority: "Important",
  trackingNumber: "INT-2025-001",
  remarks: "Forwarded for budget approval",
  deadline: "2025-01-15",
  isUrgent: false,
  datetime: "2025-07-08 14:00",
  status: "In Transit",
  deliveryInstructions: "Please handle with care"
}
```

## Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

## Mock Data

The backend includes comprehensive mock data for testing:

- **10 Users** with different roles and departments
- **15 Sample Files** across 6 departments
- **File Movements** with complete audit trails
- **File Forwards** with tracking information

### Test Users

| Email | Password | Role | Department |
|-------|----------|------|------------|
| alice@company.com | password123 | user | HR |
| bob@company.com | password123 | user | Finance |
| charlie@company.com | password123 | user | IT |
| diana@company.com | password123 | admin | Administration |
| super@admin.com | password123 | superadmin | All |

## Error Handling

The API returns consistent error responses:

```javascript
{
  "success": false,
  "error": "Error message",
  "errors": [] // For validation errors
}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **Input Validation**: Comprehensive validation using express-validator
- **Rate Limiting**: Configurable rate limiting per IP
- **CORS**: Cross-origin resource sharing configuration
- **Security Headers**: Helmet.js for security headers
- **Role-based Access**: Granular permission system

## Development

### Project Structure

```
backend/
├── data/           # Mock data and helper functions
├── middleware/     # Custom middleware
├── routes/         # API route handlers
├── config.env      # Environment configuration
├── index.js        # Main server file
├── package.json    # Dependencies and scripts
└── README.md       # This file
```

### Adding New Routes

1. Create route file in `routes/` directory
2. Import and use in `index.js`
3. Add appropriate middleware for authentication/authorization
4. Include input validation using express-validator

### Database Integration

To integrate with a real database:

1. Replace mock data functions with database queries
2. Add database connection and models
3. Update environment variables for database configuration
4. Implement proper error handling for database operations

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong JWT secret
3. Configure proper CORS origins
4. Set up reverse proxy (nginx)
5. Use PM2 or similar process manager
6. Implement proper logging
7. Set up monitoring and health checks

## API Testing

You can test the API using tools like:

- **Postman**: Import the collection
- **curl**: Command-line testing
- **Thunder Client**: VS Code extension
- **Insomnia**: API testing tool

## Support

For issues and questions:

1. Check the error logs
2. Verify environment configuration
3. Test with provided mock data
4. Review API documentation

## License

This project is part of the File Tracker application. 