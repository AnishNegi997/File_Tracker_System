import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';
import File from '../data/files.js';
import Movement from '../data/movementModel.js';

const router = express.Router();

// @desc    Get all file movements
// @route   GET /api/movements
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const movements = await Movement.find();
    res.json({
      success: true,
      count: movements.length,
      data: movements
    });
  } catch (error) {
    console.error('Get all movements error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get movements for a specific file
// @route   GET /api/movements/file/:fileId
// @access  Private
router.get('/file/:fileId', protect, async (req, res) => {
  try {
    const { fileId } = req.params;
    const movements = await Movement.find({ fileCode: fileId });
    res.json({
      success: true,
      count: movements.length,
      data: movements
    });
  } catch (error) {
    console.error('Get file movements error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Add movement to a file
// @route   POST /api/movements/file/:fileId
// @access  Private
router.post('/file/:fileId', protect, [
  body('action').notEmpty().withMessage('Action is required'),
  body('remarks').optional().isString().withMessage('Remarks must be a string'),
  body('sentBy').optional().isString().withMessage('Sent by must be a string'),
  body('sentThrough').optional().isString().withMessage('Sent through must be a string'),
  body('recipientName').optional().isString().withMessage('Recipient name must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    const { fileId } = req.params;
    // Check if file exists
    const file = await File.findOne({ code: fileId });
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    const movementData = {
      fileCode: fileId,
      user: req.user.name,
      action: req.body.action,
      remarks: req.body.remarks,
      icon: req.body.icon,
      sentBy: req.body.sentBy,
      sentThrough: req.body.sentThrough,
      recipientName: req.body.recipientName,
      datetime: new Date()
    };
    const newMovement = await Movement.create(movementData);
    res.status(201).json({
      success: true,
      data: newMovement
    });
  } catch (error) {
    console.error('Add movement error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update a movement
// @route   PUT /api/movements/:movementId
// @access  Private
router.put('/:movementId', protect, [
  body('action').optional().notEmpty().withMessage('Action cannot be empty'),
  body('remarks').optional().isString().withMessage('Remarks must be a string'),
  body('sentBy').optional().isString().withMessage('Sent by must be a string'),
  body('sentThrough').optional().isString().withMessage('Sent through must be a string'),
  body('recipientName').optional().isString().withMessage('Recipient name must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    const { movementId } = req.params;
    const updatedMovement = await Movement.findByIdAndUpdate(movementId, req.body, { new: true });
    if (!updatedMovement) {
      return res.status(404).json({
        success: false,
        error: 'Movement not found'
      });
    }
    res.json({
      success: true,
      data: updatedMovement
    });
  } catch (error) {
    console.error('Update movement error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete a movement
// @route   DELETE /api/movements/:movementId
// @access  Private (Admin only)
router.delete('/:movementId', protect, async (req, res) => {
  try {
    const { movementId } = req.params;
    const deleted = await Movement.findByIdAndDelete(movementId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Movement not found'
      });
    }
    res.json({
      success: true,
      message: 'Movement deleted successfully'
    });
  } catch (error) {
    console.error('Delete movement error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router; 