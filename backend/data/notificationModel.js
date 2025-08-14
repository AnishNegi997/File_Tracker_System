import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Recipient information
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientName: { type: String, required: true },
  recipientEmail: { type: String, required: true },
  
  // Notification content
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['file_created', 'file_received', 'file_forwarded', 'file_completed', 'file_urgent', 'system', 'user_management', 'forward_status'], 
    required: true 
  },
  
  // Related entities
  fileCode: { type: String }, // If notification is related to a file
  forwardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Forward' }, // If notification is related to a forward
  movementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movement' }, // If notification is related to a movement
  
  // Notification status
  isRead: { type: Boolean, default: false },
  isUrgent: { type: Boolean, default: false },
  
  // Metadata
  icon: { type: String, default: '📢' }, // Emoji icon for the notification
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  readAt: { type: Date },
  expiresAt: { type: Date } // Optional expiration date
});

// Index for efficient queries
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ isUrgent: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;



