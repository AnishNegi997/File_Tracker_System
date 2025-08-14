import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import User from '../data/users.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
router.get('/', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { department, role } = req.query;
    let query = {};
    if (department) query.department = department;
    if (role) query.role = role;
    const users = await User.find(query).select('-password');
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get users by department
// @route   GET /api/users/department/:department
// @access  Private (Admin)
router.get('/department/:department', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { department } = req.params;
    const users = await User.find({ department }).select('-password');
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get department users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get employees (users with role 'user') by department
// @route   GET /api/users/department/:department/employees
// @access  Private (Admin)
router.get('/department/:department/employees', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { department } = req.params;
    const employees = await User.find({ 
      department, 
      role: 'user' 
    }).select('name email').sort('name');
    
    res.json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    console.error('Get department employees error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private (Admin)
router.get('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create new user (Admin only)
// @route   POST /api/users
// @access  Private (Admin)
router.post('/', protect, authorize('admin', 'superadmin'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('department').notEmpty().withMessage('Department is required'),
  body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    const { name, email, password, department, role } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }
    // Hash password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      department,
      role
    });
    const { password: _, ...userWithoutPassword } = newUser.toObject();
    res.status(201).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin', 'superadmin'), [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please include a valid email'),
  body('department').optional().notEmpty().withMessage('Department cannot be empty'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    const { name, email, department, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email is already taken'
        });
      }
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (department) user.department = department;
    if (role) user.role = role;
    await user.save();
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    if (user.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete superadmin user'
      });
    }
    await user.deleteOne();
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Reset user password (Admin only)
// @route   PATCH /api/users/:id/reset-password
// @access  Private (Admin)
router.patch('/:id/reset-password', protect, authorize('admin', 'superadmin'), [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    const { newPassword } = req.body;
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router; 