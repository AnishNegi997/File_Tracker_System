import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  department: { type: String, required: true },
  status: { type: String, enum: ['Created', 'Received', 'On Hold', 'Released', 'Complete'], default: 'Created' },
  priority: { type: String, enum: ['Normal', 'Urgent', 'Important', 'Critical'], default: 'Normal' },
  type: { type: String, enum: ['Physical', 'Digital'], required: true },
  requisitioner: { type: String },
  remarks: { type: String },
  datetime: { type: String },
  currentHolder: { type: String },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const File = mongoose.model('File', fileSchema);

export default File; 