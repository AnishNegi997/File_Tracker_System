// API Service for connecting React frontend to Express backend
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // Handle validation errors
    if (data.errors && Array.isArray(data.errors)) {
      const errorMessages = data.errors.map(error => error.msg).join(', ');
      throw new Error(errorMessages);
    }
    // Handle single error message
    if (data.error) {
      throw new Error(data.error);
    }
    // Handle generic error
    throw new Error(data.message || 'Something went wrong');
  }
  
  return data;
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Helper function to get forwards for admin
export const getForwardsForAdmin = async (department) => {
  try {
    let url;
    if (department === 'all') {
      url = `${API_BASE_URL}/forwards`;
    } else {
      url = `${API_BASE_URL}/forwards/admin/${department}`;
    }

    const response = await fetch(url, {
      headers: getAuthHeaders()
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching forwards for admin:', error);
    throw error;
  }
};

// Helper function to get department employees
export const getDepartmentEmployees = async (department) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/department/${department}/employees`, {
      headers: getAuthHeaders()
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching department employees:', error);
    throw error;
  }
};

// Authentication API calls
export const authAPI = {
  // Login user
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: String(email).trim(), password: typeof password === 'string' ? password.trim() : password })
    });
    
    const data = await handleResponse(response);
    
    // Store token and user data
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  // Register user
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...userData,
        email: String(userData.email).trim(),
        password: typeof userData.password === 'string' ? userData.password.trim() : userData.password
      })
    });
    
    const data = await handleResponse(response);
    
    // Store token and user data
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Update profile
  updateProfile: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    
    const data = await handleResponse(response);
    
    // Update stored user data
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  // Change password
  changePassword: async (passwords) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(passwords)
    });
    
    return handleResponse(response);
  },

  // Logout (clear local storage)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Files API calls
export const filesAPI = {
  // Get all files
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/files`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Get all files for Received Files page (no department restrictions)
  getAllForReceived: async () => {
    const response = await fetch(`${API_BASE_URL}/files/received/all`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Get file by ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/files/${id}`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Get file by code
  getByCode: async (code) => {
    const response = await fetch(`${API_BASE_URL}/files/code/${code}`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Get files by user
  getByUser: async (userId, status = '') => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    const response = await fetch(`${API_BASE_URL}/files/user/${userId}?${params}`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Get files by creator
  getByCreator: async (creatorName) => {
    console.log('API: Calling getByCreator for:', creatorName);
    console.log('API: URL:', `${API_BASE_URL}/files/creator/${creatorName}`);
    const response = await fetch(`${API_BASE_URL}/files/creator/${creatorName}`, {
      headers: getAuthHeaders()
    });
    
    console.log('API: Response status:', response.status);
    const result = await handleResponse(response);
    console.log('API: Response data:', result);
    return result;
  },

  // Create new file
  create: async (fileData) => {
    const response = await fetch(`${API_BASE_URL}/files`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(fileData)
    });
    
    return handleResponse(response);
  },

  // Update file
  update: async (id, fileData) => {
    const response = await fetch(`${API_BASE_URL}/files/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(fileData)
    });
    
    return handleResponse(response);
  },

  // Release file to user
  release: async (id, releaseData) => {
    const response = await fetch(`${API_BASE_URL}/files/${id}/release`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(releaseData)
    });
    
    return handleResponse(response);
  },

  // Delete file
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/files/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Search files
  search: async (searchTerm, department = '') => {
    const params = new URLSearchParams({ search: searchTerm });
    if (department) params.append('department', department);
    
    const response = await fetch(`${API_BASE_URL}/files/search?${params}`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  }
};

// Movements API calls
export const movementsAPI = {
  // Get all movements
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/movements`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Get movements for specific file
  getByFileId: async (fileId) => {
    const response = await fetch(`${API_BASE_URL}/movements/file/${fileId}`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Add movement
  add: async (movementData) => {
    const response = await fetch(`${API_BASE_URL}/movements`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(movementData)
    });
    
    return handleResponse(response);
  },

  // Update movement
  update: async (id, movementData) => {
    const response = await fetch(`${API_BASE_URL}/movements/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(movementData)
    });
    
    return handleResponse(response);
  },

  // Delete movement
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/movements/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  }
};

// Forwards API calls
export const forwardsAPI = {
  // Get all forwards
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/forwards`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Get forwards for specific file
  getByFileId: async (fileId) => {
    const response = await fetch(`${API_BASE_URL}/forwards/file/${fileId}`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Get forward by ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/forwards/${id}`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Create forward
  create: async (forwardData) => {
    const response = await fetch(`${API_BASE_URL}/forwards`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(forwardData)
    });
    
    return handleResponse(response);
  },

  // Update forward
  update: async (id, forwardData) => {
    const response = await fetch(`${API_BASE_URL}/forwards/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(forwardData)
    });
    
    return handleResponse(response);
  },

  // Update forward status
  updateStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/forwards/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    
    return handleResponse(response);
  },

  // Delete forward
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/forwards/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  }
};

// Users API calls (admin only)
export const usersAPI = {
  // Get all users
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Get users by department
  getByDepartment: async (department) => {
    const response = await fetch(`${API_BASE_URL}/users/department/${department}`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Get user by ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Create user
  create: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    
    return handleResponse(response);
  },

  // Update user
  update: async (id, userData) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    
    return handleResponse(response);
  },

  // Delete user
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Reset password
  resetPassword: async (id, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}/reset-password`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword })
    });
    
    return handleResponse(response);
  }
};

// Dashboard API calls
export const dashboardAPI = {
  // Get dashboard stats
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Get recent activities
  getRecentActivities: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/recent-activities`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Get status distribution
  getStatusDistribution: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/status-distribution`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Get priority distribution
  getPriorityDistribution: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/priority-distribution`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Get forwarding stats
  getForwardingStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/forwarding-stats`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Get user stats
  getUserStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/user-stats`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Get timeline
  getTimeline: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/timeline`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Notifications API calls
export const notificationsAPI = {
  // Get all notifications for current user
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly);
    if (params.type) queryParams.append('type', params.type);
    
    const response = await fetch(`${API_BASE_URL}/notifications?${queryParams}`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Get unread notifications count
  getUnreadCount: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Mark notification as read
  markAsRead: async (id) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Delete notification
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  // Create notification (admin only)
  create: async (notificationData) => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(notificationData)
    });
    
    return handleResponse(response);
  },

  // Get notification by ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  }
}; 