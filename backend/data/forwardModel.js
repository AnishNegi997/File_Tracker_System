import mongoose from 'mongoose';

const forwardSchema = new mongoose.Schema({
  fileCode: { type: String, required: true },
  recipientDepartment: { type: String, required: true },
  recipientName: { type: String, required: true },
  sentBy: { type: String, required: true },
  sentThrough: { type: String },
  priority: { type: String, enum: ['Normal', 'Urgent', 'Important', 'Critical'], default: 'Normal' },
  status: { 
    type: String, 
    enum: ['Pending Admin Review', 'Admin Approved', 'Distributed to Employee', 'In Transit', 'Received', 'Completed', 'Rejected'], 
    default: 'Pending Admin Review' 
  },
  remarks: { type: String },
  isUrgent: { type: Boolean, default: false },
  sentAt: { type: Date, default: Date.now },
  receivedAt: { type: Date },
  completedAt: { type: Date },
  // New fields for admin workflow
  adminApprovedBy: { type: String }, // Name of admin who approved
  adminApprovalDate: { type: Date },
  adminRemarks: { type: String }, // Admin's remarks when distributing
  distributedTo: { type: String }, // Final employee who received the file
  distributionDate: { type: Date },
  originalRecipientName: { type: String }, // Store the originally intended recipient
  originalRecipientDepartment: { type: String } // Store the originally intended department
});

const Forward = mongoose.models.Forward || mongoose.model('Forward', forwardSchema);

export default Forward;


