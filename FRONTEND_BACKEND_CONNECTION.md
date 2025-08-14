# Frontend-Backend Connection Guide

## Overview

The File Tracker application now has a complete separation between frontend (React) and backend (Express). Here's how they connect and work together:

## Architecture

```
┌─────────────────┐    HTTP/JSON    ┌─────────────────┐
│   React Frontend │ ◄─────────────► │ Express Backend  │
│   (Port 5173)    │                 │   (Port 5000)    │
└─────────────────┘                 └─────────────────┘
```

## Connection Mechanism

### 1. API Service Layer (`src/services/apiService.js`)

The frontend communicates with the backend through a centralized API service that:

- **Base URL**: `http://localhost:5000/api`
- **Authentication**: Uses JWT tokens stored in localStorage
- **Headers**: Automatically includes Authorization headers for protected routes
- **Error Handling**: Centralized error handling for all API calls

### 2. Authentication Flow

```javascript
// Frontend login
const result = await authAPI.login(email, password);
// Backend validates credentials and returns JWT token
// Frontend stores token in localStorage
localStorage.setItem('token', response.token);
```

### 3. Protected Routes

All API calls include the JWT token in headers:
```javascript
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};
```

## Setup Instructions

### 1. Start the Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm run dev
```

The backend will run on `http://localhost:5000`

### 2. Start the Frontend

```bash
# In a new terminal, navigate to the root directory
cd file_tracker

# Install dependencies (if not already done)
npm install

# Start the React development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. Verify Connection

1. Open browser to `http://localhost:5173`
2. Try to login with test credentials:
   - Email: `alice@company.com`
   - Password: `password123`
3. Check browser console for any connection errors

## API Endpoints

The backend provides these main API categories:

### Authentication (`/api/auth`)
- `POST /login` - User login
- `POST /register` - User registration
- `GET /me` - Get current user
- `PUT /profile` - Update profile
- `PUT /change-password` - Change password

### Files (`/api/files`)
- `GET /` - Get all files
- `GET /:id` - Get file by ID
- `GET /code/:code` - Get file by code
- `POST /` - Create new file
- `PUT /:id` - Update file
- `DELETE /:id` - Delete file
- `GET /search` - Search files

### Movements (`/api/movements`)
- `GET /` - Get all movements
- `GET /file/:fileId` - Get movements for file
- `POST /` - Add movement
- `PUT /:id` - Update movement
- `DELETE /:id` - Delete movement

### Forwards (`/api/forwards`)
- `GET /` - Get all forwards
- `GET /file/:fileId` - Get forwards for file
- `GET /:id` - Get forward by ID
- `POST /` - Create forward
- `PUT /:id` - Update forward
- `PATCH /:id/status` - Update status
- `DELETE /:id` - Delete forward

### Users (`/api/users`) - Admin only
- `GET /` - Get all users
- `GET /department/:department` - Get users by department
- `GET /:id` - Get user by ID
- `POST /` - Create user
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user
- `PATCH /:id/reset-password` - Reset password

### Dashboard (`/api/dashboard`)
- `GET /stats` - Get dashboard statistics
- `GET /recent-activities` - Get recent activities
- `GET /status-distribution` - Get status distribution
- `GET /priority-distribution` - Get priority distribution
- `GET /forwarding-stats` - Get forwarding statistics
- `GET /user-stats` - Get user statistics
- `GET /timeline` - Get timeline data

## Data Flow Examples

### 1. Loading Files

```javascript
// Frontend component
const [files, setFiles] = useState([]);

useEffect(() => {
  const loadFiles = async () => {
    try {
      const response = await filesAPI.getAll();
      setFiles(response.data);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };
  
  loadFiles();
}, []);
```

### 2. Creating a File

```javascript
// Frontend form submission
const handleSubmit = async (fileData) => {
  try {
    const newFile = await filesAPI.create(fileData);
    // Update UI with new file
    setFiles(prev => [...prev, newFile]);
  } catch (error) {
    // Handle error
  }
};
```

### 3. Authentication Check

```javascript
// Frontend checks if user is authenticated
useEffect(() => {
  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const user = await authAPI.getCurrentUser();
        setUser(user);
      } catch (error) {
        // Token is invalid, redirect to login
        authAPI.logout();
        navigate('/login');
      }
    }
  };
  
  checkAuth();
}, []);
```

## Error Handling

The API service includes comprehensive error handling:

```javascript
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  
  return data;
};
```

Common error scenarios:
- **401 Unauthorized**: Invalid or expired token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **422 Validation Error**: Invalid input data
- **500 Server Error**: Backend error

## Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **CORS Protection**: Configured for specific origin
3. **Rate Limiting**: Prevents abuse
4. **Input Validation**: Server-side validation for all inputs
5. **Role-based Access**: Different permissions for different user roles

## Development Workflow

1. **Backend Development**:
   - Modify routes in `backend/routes/`
   - Update data models in `backend/data/`
   - Test with Postman or similar tool

2. **Frontend Development**:
   - Update components in `src/pages/` and `src/components/`
   - Modify API calls in `src/services/apiService.js`
   - Test UI changes

3. **Integration Testing**:
   - Start both servers
   - Test complete user flows
   - Check browser console for errors

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure backend CORS_ORIGIN is set to `http://localhost:5173`
   - Check that both servers are running

2. **Authentication Errors**:
   - Clear localStorage and try logging in again
   - Check that JWT_SECRET is set in backend config

3. **API Connection Errors**:
   - Verify backend is running on port 5000
   - Check network tab in browser dev tools
   - Ensure API_BASE_URL is correct in `apiService.js`

4. **Data Not Loading**:
   - Check browser console for errors
   - Verify API endpoints are working
   - Check authentication token is valid

### Debug Mode

Enable debug logging by adding to frontend:
```javascript
// In apiService.js
const DEBUG = true;

const handleResponse = async (response) => {
  if (DEBUG) console.log('API Response:', response);
  // ... rest of function
};
```

## Production Deployment

For production, update the API_BASE_URL in `src/services/apiService.js`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

And set the environment variable:
```bash
REACT_APP_API_URL=https://your-backend-domain.com/api
```

## Summary

The frontend and backend are now fully connected through a RESTful API. The frontend uses the `apiService.js` to communicate with the backend, which provides all the necessary endpoints for file management, user authentication, and data retrieval. The connection is secure, scalable, and follows modern web development best practices. 