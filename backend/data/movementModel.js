import mongoose from 'mongoose';

const movementSchema = new mongoose.Schema({
  fileCode: { type: String, required: true },
  user: { type: String, required: true },
  action: { type: String, required: true },
  remarks: { type: String },
  icon: { type: String },
  sentBy: { type: String },
  sentThrough: { type: String },
  recipientName: { type: String },
  datetime: { type: Date, default: Date.now }
});

const Movement = mongoose.models.Movement || mongoose.model('Movement', movementSchema);

export default Movement;



