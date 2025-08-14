// Data Service - API wrapper for backend communication
import { filesAPI, movementsAPI, forwardsAPI, dashboardAPI } from './apiService';

// Files API
export const getFilesByDepartment = async (department) => {
  try {
    const response = await filesAPI.getAll();
    if (!department) return response.data || [];
    return (response.data || []).filter(file => file.department === department);
  } catch (error) {
    console.error('Error fetching files by department:', error);
    return [];
  }
};

export const getAllFiles = async () => {
  try {
    const response = await filesAPI.getAll();
    return response.data || [];
  } catch (error) {
    console.error('Error fetching all files:', error);
    return [];
  }
};

export const getAllFilesForReceived = async () => {
  try {
    const response = await filesAPI.getAllForReceived();
    return response.data || [];
  } catch (error) {
    console.error('Error fetching all files for received:', error);
    return [];
  }
};

export const getFileById = async (id) => {
  try {
    const response = await filesAPI.getById(id);
    return response.data;
  } catch (error) {
    console.error('Error fetching file by ID:', error);
    return null;
  }
};

export const getFileByCode = async (code) => {
  try {
    const response = await filesAPI.getByCode(code);
    return response.data;
  } catch (error) {
    console.error('Error fetching file by code:', error);
    return null;
  }
};

export const getFilesByUser = async (userId, status = '') => {
  try {
    const response = await filesAPI.getByUser(userId, status);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching files by user:', error);
    return [];
  }
};

export const releaseFile = async (fileId, releaseData) => {
  try {
    const response = await filesAPI.release(fileId, releaseData);
    return response.data;
  } catch (error) {
    console.error('Error releasing file:', error);
    throw error;
  }
};

export const createFile = async (fileData) => {
  try {
    const response = await filesAPI.create(fileData);
    return response.data;
  } catch (error) {
    console.error('Error creating file:', error);
    throw error;
  }
};

export const updateFile = async (id, fileData) => {
  try {
    const response = await filesAPI.update(id, fileData);
    return response.data;
  } catch (error) {
    console.error('Error updating file:', error);
    throw error;
  }
};

export const deleteFile = async (id) => {
  try {
    const response = await filesAPI.delete(id);
    return response.data;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

export const searchFiles = async (searchTerm, department = '') => {
  try {
    const response = await filesAPI.search(searchTerm, department);
    return response.data || [];
  } catch (error) {
    console.error('Error searching files:', error);
    return [];
  }
};

// Movements API
export const getFileMovements = async (fileId) => {
  try {
    const response = await movementsAPI.getByFileId(fileId);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching file movements:', error);
    return [];
  }
};

export const getAllFileMovements = async () => {
  try {
    const response = await movementsAPI.getAll();
    return response.data || [];
  } catch (error) {
    console.error('Error fetching all movements:', error);
    return [];
  }
};

export const addFileMovement = async (movementData) => {
  try {
    const response = await movementsAPI.add(movementData);
    return response.data;
  } catch (error) {
    console.error('Error adding file movement:', error);
    throw error;
  }
};

export const updateFileMovement = async (id, movementData) => {
  try {
    const response = await movementsAPI.update(id, movementData);
    return response.data;
  } catch (error) {
    console.error('Error updating file movement:', error);
    throw error;
  }
};

export const deleteFileMovement = async (id) => {
  try {
    const response = await movementsAPI.delete(id);
    return response.data;
  } catch (error) {
    console.error('Error deleting file movement:', error);
    throw error;
  }
};

// Forwards API
export const getFileForwards = async (fileId = null) => {
  try {
    if (fileId) {
      const response = await forwardsAPI.getByFileId(fileId);
      return response.data || [];
    } else {
      const response = await forwardsAPI.getAll();
      return response.data || [];
    }
  } catch (error) {
    console.error('Error fetching file forwards:', error);
    return [];
  }
};

export const getForwardById = async (id) => {
  try {
    const response = await forwardsAPI.getById(id);
    return response.data;
  } catch (error) {
    console.error('Error fetching forward by ID:', error);
    return null;
  }
};

export const createFileForward = async (forwardData) => {
  try {
    const response = await forwardsAPI.create(forwardData);
    return response.data;
  } catch (error) {
    console.error('Error creating file forward:', error);
    throw error;
  }
};

export const updateFileForward = async (id, forwardData) => {
  try {
    const response = await forwardsAPI.update(id, forwardData);
    return response.data;
  } catch (error) {
    console.error('Error updating file forward:', error);
    throw error;
  }
};

export const updateForwardStatus = async (id, status) => {
  try {
    const response = await forwardsAPI.updateStatus(id, status);
    return response.data;
  } catch (error) {
    console.error('Error updating forward status:', error);
    throw error;
  }
};

export const deleteFileForward = async (id) => {
  try {
    const response = await forwardsAPI.delete(id);
    return response.data;
  } catch (error) {
    console.error('Error deleting file forward:', error);
    throw error;
  }
};

// Dashboard API
export const getDashboardStats = async (department) => {
  try {
    const response = await dashboardAPI.getStats();
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalFiles: 0,
      pendingFiles: 0,
      completedFiles: 0,
      urgentFiles: 0
    };
  }
};

export const getRecentActivities = async () => {
  try {
    const response = await dashboardAPI.getRecentActivities();
    return response.data || [];
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
};

export const getStatusDistribution = async () => {
  try {
    const response = await dashboardAPI.getStatusDistribution();
    return response.data || [];
  } catch (error) {
    console.error('Error fetching status distribution:', error);
    return [];
  }
};

export const getPriorityDistribution = async () => {
  try {
    const response = await dashboardAPI.getPriorityDistribution();
    return response.data || [];
  } catch (error) {
    console.error('Error fetching priority distribution:', error);
    return [];
  }
};

export const getForwardingStats = async () => {
  try {
    const response = await dashboardAPI.getForwardingStats();
    return response.data || [];
  } catch (error) {
    console.error('Error fetching forwarding stats:', error);
    return [];
  }
};

export const getUserStats = async () => {
  try {
    const response = await dashboardAPI.getUserStats();
    return response.data || [];
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return [];
  }
};

export const getTimeline = async () => {
  try {
    const response = await dashboardAPI.getTimeline();
    return response.data || [];
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return [];
  }
};

// Helper functions (keeping for compatibility)
export const getDepartmentBreakdown = async () => {
  try {
    const files = await getAllFiles();
    const breakdown = {};
    files.forEach(file => {
      breakdown[file.department] = (breakdown[file.department] || 0) + 1;
    });
    return breakdown;
  } catch (error) {
    console.error('Error getting department breakdown:', error);
    return {};
  }
};

export const getFilesByCreator = async (creatorName) => {
  try {
    console.log('Calling getFilesByCreator for:', creatorName);
    const response = await filesAPI.getByCreator(creatorName);
    console.log('getFilesByCreator response:', response);
    return response.data || [];
  } catch (error) {
    console.error('Error getting files by creator:', error);
    return [];
  }
};

export const getFilesByAssignee = async (assigneeName) => {
  try {
    const response = await filesAPI.getByUser(assigneeName);
    return response.data || [];
  } catch (error) {
    console.error('Error getting files by assignee:', error);
    return [];
  }
};

export const isFileOverdue = (deadline) => {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const now = new Date();
  return deadlineDate < now;
};

export const getTimeRemaining = (deadline) => {
  if (!deadline) return null;
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diff = deadlineDate - now;
  
  if (diff <= 0) return 'Overdue';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const formatDeadline = (deadline) => {
  if (!deadline) return 'No deadline';
  const date = new Date(deadline);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}; 