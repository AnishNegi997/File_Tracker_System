import express from 'express';
import { protect } from '../middleware/auth.js';
import File from '../data/files.js';
import Movement from '../data/movementModel.js';
import Forward from '../data/forwardModel.js';
import User from '../data/users.js';

const router = express.Router();

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const { department } = req.query;
    
    let files = [];
    if (department) {
      files = await File.find({ department });
    } else {
      files = await File.find();
    }
    
    const today = new Date().toISOString().split('T')[0];
    const todayFiles = files.filter(file => file.datetime && file.datetime.includes(today));
    
    const stats = {
      totalFiles: files.length,
      filesToday: todayFiles.length,
      pendingFiles: files.filter(f => f.status === 'On Hold').length,
      completedFiles: files.filter(f => f.status === 'Complete').length,
      urgentFiles: files.filter(f => f.priority === 'Urgent' || f.priority === 'Critical').length,
      digitalFiles: files.filter(f => f.type === 'Digital').length,
      physicalFiles: files.filter(f => f.type === 'Physical').length
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get department breakdown
// @route   GET /api/dashboard/departments
// @access  Private
router.get('/departments', protect, async (req, res) => {
  try {
    const departments = ['HR', 'Finance', 'IT', 'Administration', 'Procurement', 'Legal'];
    const allFiles = await File.find();
    
    const departmentBreakdown = departments.map(dept => ({
      department: dept,
      count: allFiles.filter(f => f.department === dept).length,
      pending: allFiles.filter(f => f.department === dept && f.status === 'On Hold').length,
      completed: allFiles.filter(f => f.department === dept && f.status === 'Complete').length,
      urgent: allFiles.filter(f => f.department === dept && (f.priority === 'Urgent' || f.priority === 'Critical')).length
    }));
    
    res.json({
      success: true,
      data: departmentBreakdown
    });
  } catch (error) {
    console.error('Get department breakdown error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get recent activities
// @route   GET /api/dashboard/recent-activities
// @access  Private
router.get('/recent-activities', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recentMovements = await Movement.find()
      .sort({ datetime: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: recentMovements.length,
      data: recentMovements
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get status distribution
// @route   GET /api/dashboard/status-distribution
// @access  Private
router.get('/status-distribution', protect, async (req, res) => {
  try {
    const allFiles = await File.find();
    
    const statusDistribution = [
      { status: 'Created', count: allFiles.filter(f => f.status === 'Created').length },
      { status: 'Received', count: allFiles.filter(f => f.status === 'Received').length },
      { status: 'On Hold', count: allFiles.filter(f => f.status === 'On Hold').length },
      { status: 'Released', count: allFiles.filter(f => f.status === 'Released').length },
      { status: 'Complete', count: allFiles.filter(f => f.status === 'Complete').length }
    ];
    
    res.json({
      success: true,
      data: statusDistribution
    });
  } catch (error) {
    console.error('Get status distribution error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get priority distribution
// @route   GET /api/dashboard/priority-distribution
// @access  Private
router.get('/priority-distribution', protect, async (req, res) => {
  try {
    const allFiles = await File.find();
    
    const priorityDistribution = [
      { priority: 'Normal', count: allFiles.filter(f => f.priority === 'Normal').length },
      { priority: 'Important', count: allFiles.filter(f => f.priority === 'Important').length },
      { priority: 'Urgent', count: allFiles.filter(f => f.priority === 'Urgent').length },
      { priority: 'Critical', count: allFiles.filter(f => f.priority === 'Critical').length }
    ];
    
    res.json({
      success: true,
      data: priorityDistribution
    });
  } catch (error) {
    console.error('Get priority distribution error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get forwarding stats
// @route   GET /api/dashboard/forwarding-stats
// @access  Private
router.get('/forwarding-stats', protect, async (req, res) => {
  try {
    const allForwards = await Forward.find();
    
    const forwardingStats = {
      totalForwards: allForwards.length,
      pendingAdminReview: allForwards.filter(f => f.status === 'Pending Admin Review').length,
      adminApproved: allForwards.filter(f => f.status === 'Admin Approved').length,
      distributedToEmployee: allForwards.filter(f => f.status === 'Distributed to Employee').length,
      inTransitForwards: allForwards.filter(f => f.status === 'In Transit').length,
      receivedForwards: allForwards.filter(f => f.status === 'Received').length,
      completedForwards: allForwards.filter(f => f.status === 'Completed').length,
      rejectedForwards: allForwards.filter(f => f.status === 'Rejected').length,
      urgentForwards: allForwards.filter(f => f.isUrgent).length,
      // Department-wise breakdown
      byDepartment: {}
    };

    // Group forwards by department
    const departments = ['HR', 'Finance', 'IT', 'Administration', 'Procurement', 'Legal'];
    departments.forEach(dept => {
      const deptForwards = allForwards.filter(f => f.recipientDepartment === dept);
      forwardingStats.byDepartment[dept] = {
        total: deptForwards.length,
        pendingAdminReview: deptForwards.filter(f => f.status === 'Pending Admin Review').length,
        distributed: deptForwards.filter(f => f.status === 'Distributed to Employee').length,
        completed: deptForwards.filter(f => f.status === 'Completed').length,
        urgent: deptForwards.filter(f => f.isUrgent).length
      };
    });
    
    res.json({
      success: true,
      data: forwardingStats
    });
  } catch (error) {
    console.error('Get forwarding stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get user stats
// @route   GET /api/dashboard/user-stats
// @access  Private
router.get('/user-stats', protect, async (req, res) => {
  try {
    const allUsers = await User.find();
    const allFiles = await File.find();
    
    const userStats = allUsers.map(user => ({
      name: user.name,
      department: user.department,
      filesCreated: allFiles.filter(f => f.createdBy === user.name).length,
      filesReceived: allFiles.filter(f => f.currentHolder === user.name).length
    }));
    
    res.json({
      success: true,
      data: userStats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get timeline
// @route   GET /api/dashboard/timeline
// @access  Private
router.get('/timeline', protect, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const recentMovements = await Movement.find({
      datetime: { $gte: startDate }
    }).sort({ datetime: -1 });
    
    const timeline = recentMovements.map(movement => ({
      id: movement._id,
      action: movement.action,
      user: movement.user,
      fileCode: movement.fileCode,
      remarks: movement.remarks,
      datetime: movement.datetime,
      icon: movement.icon
    }));
    
    res.json({
      success: true,
      count: timeline.length,
      data: timeline
    });
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router; 