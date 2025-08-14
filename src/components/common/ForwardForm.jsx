import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DEPARTMENTS, PRIORITIES, SEND_METHODS } from '../../utils/constants';

export default function ForwardForm({ 
  file, 
  onSubmit, 
  onCancel, 
  editForward = null,
  title = "Send/Forward File"
}) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    action: 'forward',
    recipientDepartment: '',
    recipientName: '',
    sentBy: user?.name || '',
    sentThrough: '',
    priority: 'Normal',
    trackingNumber: '',
    remarks: '',
    isUrgent: false
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editForward) {
      setFormData({
        ...editForward,
        // Only keep essential fields
        action: editForward.action || 'forward',
        recipientDepartment: editForward.recipientDepartment || '',
        recipientName: editForward.recipientName || '',
        sentBy: editForward.sentBy || user?.name || '',
        sentThrough: editForward.sentThrough || '',
        priority: editForward.priority || 'Normal',
        trackingNumber: editForward.trackingNumber || '',
        remarks: editForward.remarks || '',
        isUrgent: editForward.isUrgent || false
      });
    }
  }, [editForward, user?.name]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDepartmentChange = (e) => {
    setFormData(prev => ({
      ...prev,
      recipientDepartment: e.target.value,
      recipientName: '' // Reset recipient when department changes
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">{title}</h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          {/* Action Type and Priority */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Action Type</label>
              <select 
                className="form-select" 
                name="action" 
                value={formData.action}
                onChange={handleInputChange}
              >
                <option value="send">Send New</option>
                <option value="forward">Forward Existing</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Priority</label>
              <select 
                className="form-select" 
                name="priority" 
                value={formData.priority}
                onChange={handleInputChange}
              >
                {PRIORITIES.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Recipient Information */}
          <div className="row mb-3">
            <div className="col-md-12">
              <label className="form-label">Recipient Department *</label>
              <select 
                className="form-select" 
                name="recipientDepartment" 
                value={formData.recipientDepartment}
                onChange={handleDepartmentChange}
                required
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <div className="form-text">
                File will be sent to the department. The department manager will assign it to the appropriate person.
              </div>
            </div>
          </div>
          
          <div className="row mb-3">
            <div className="col-md-12">
              <label className="form-label">Attention To (Optional)</label>
              <input 
                type="text" 
                className="form-control" 
                name="recipientName"
                value={formData.recipientName}
                onChange={handleInputChange}
                placeholder="e.g., HR Manager, Finance Team, etc. (optional)"
              />
              <div className="form-text">
                Optional: Specify who should handle this file within the department
              </div>
            </div>
          </div>

          {/* Sender Information */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Sent By *</label>
              <input 
                type="text" 
                className="form-control" 
                name="sentBy"
                value={formData.sentBy}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Sent Through *</label>
              <select 
                className="form-select" 
                name="sentThrough" 
                value={formData.sentThrough}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Method</option>
                {SEND_METHODS.map(method => (
                  <option key={method} value={method}>
                    {method.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tracking Information */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Tracking Number</label>
              <input 
                type="text" 
                className="form-control" 
                name="trackingNumber"
                value={formData.trackingNumber}
                onChange={handleInputChange}
                placeholder="Enter tracking number (optional)"
              />
            </div>
            <div className="col-md-6">
              <div className="form-check mt-4">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  name="isUrgent"
                  checked={formData.isUrgent}
                  onChange={handleInputChange}
                />
                <label className="form-check-label">Mark as Urgent</label>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="mb-4">
            <label className="form-label">Remarks *</label>
            <textarea 
              className="form-control" 
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows="3"
              placeholder="Enter remarks about this send/forward action..."
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="d-flex justify-content-between">
            <button 
              type="button" 
              className="btn btn-outline-secondary" 
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Processing...' : `${formData.action === 'forward' ? 'Forward' : 'Send'} File`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 