import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createFileForward } from '../services/dataService';
import { DEPARTMENTS } from '../utils/constants';
import Barcode from '../components/Barcode';

export default function SendForwardFile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const file = location.state?.file;

  // Predefined team/peon list for hand delivery
  const deliveryTeam = [
    'Peon 1',
    'Peon 2',
    'Peon 3',
    'Peon 4',
    'Peon 5'
  ];

  const [formData, setFormData] = useState({
    recipientDepartment: '',
    recipientName: '',
    sentThrough: 'hand-delivery',
    remarks: '',
    deadline: '',
    trackingNumber: '',
    deliveryPerson: ''
  });
  const [success, setSuccess] = useState(false);
  const [deadlineModified, setDeadlineModified] = useState(false);
  const fileDetailsRef = useRef(null);
  const [fileDetailsHeight, setFileDetailsHeight] = useState(null);

  useEffect(() => {
    if (!file) {
      navigate('/dashboard');
    } else {
      // Set suggested deadline based on importance level
      const suggestedDeadline = getSuggestedDeadline(file.priority);
      setFormData(prev => ({
        ...prev,
        deadline: suggestedDeadline
      }));
    }
  }, [file, navigate]);

  useEffect(() => {
    if (fileDetailsRef.current) {
      setFileDetailsHeight(fileDetailsRef.current.offsetHeight);
    }
  }, [file]);

  const getSuggestedDeadline = (importance) => {
    const today = new Date();
    let businessDays = 0;
    
    switch (importance) {
      case 'Routine':
        businessDays = 5;
        break;
      case 'Important':
        businessDays = 3;
        break;
      case 'Critical':
        businessDays = 1;
        break;
      case 'Emergency':
        businessDays = 0.5; // 4 hours
        break;
      default:
        businessDays = 3;
    }

    if (businessDays === 0.5) {
      // For emergency (4 hours), add 4 hours to current time
      const deadline = new Date(today.getTime() + (4 * 60 * 60 * 1000));
      return deadline.toISOString().slice(0, 16); // Format for datetime-local
    } else {
      // For other levels, add business days
      const deadline = addBusinessDays(today, businessDays);
      return deadline.toISOString().slice(0, 10); // Format for date input
    }
  };

  const addBusinessDays = (date, businessDays) => {
    const result = new Date(date);
    let addedDays = 0;
    
    while (addedDays < businessDays) {
      result.setDate(result.getDate() + 1);
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        // Check if it's a holiday (second Saturday, public holidays, etc.)
        if (!isHoliday(result)) {
          addedDays++;
        }
      }
    }
    
    return result;
  };

  const isHoliday = (date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const dayOfWeek = date.getDay();
    
    // Second Saturday (second Saturday of every month)
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstSaturday = 6 - firstDayOfMonth.getDay();
    const secondSaturday = firstSaturday + 7;
    
    if (day === secondSaturday && dayOfWeek === 6) {
      return true;
    }
    
    // Public holidays (you can add more holidays here)
    const holidays = [
      { day: 1, month: 1 },   // New Year's Day
      { day: 26, month: 1 },  // Republic Day
      { day: 15, month: 8 },  // Independence Day
      { day: 2, month: 10 },  // Gandhi Jayanti
      { day: 25, month: 12 }, // Christmas
    ];
    
    return holidays.some(holiday => holiday.day === day && holiday.month === month);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Track if user has modified the deadline
    if (name === 'deadline') {
      setDeadlineModified(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.recipientDepartment) {
      alert('Please select a recipient department');
      return;
    }

    if (!formData.remarks.trim()) {
      alert('Please enter remarks');
      return;
    }

    if (!formData.deadline) {
      alert('Please set a deadline for action');
      return;
    }

    if (formData.sentThrough === 'courier' && !formData.trackingNumber.trim()) {
      alert('Please enter the courier tracking number');
      return;
    }
    if (formData.sentThrough === 'hand-delivery' && !formData.deliveryPerson) {
      alert('Please select the delivery person');
      return;
    }

    try {
      const forwardData = {
        fileCode: file.code,
        action: 'forward',
        recipientDepartment: formData.recipientDepartment,
        recipientName: formData.recipientName,
        sentBy: user?.name || '',
        sentThrough: formData.sentThrough,
        priority: file.priority || 'Routine',
        trackingNumber: formData.sentThrough === 'courier' ? formData.trackingNumber : '',
        deliveryPerson: formData.sentThrough === 'hand-delivery' ? formData.deliveryPerson : '',
        remarks: formData.remarks.trim(),
        deadline: formData.deadline,
        isUrgent: file.priority === 'Emergency' || file.priority === 'Critical'
      };
      
      createFileForward(forwardData);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/sent-files');
      }, 2000);
    } catch (error) {
      alert('Error sending file: ' + error.message);
    }
  };

  const getImportanceColor = (importance) => {
    switch (importance) {
      case 'Routine': return 'secondary';
      case 'Important': return 'primary';
      case 'Critical': return 'warning';
      case 'Emergency': return 'danger';
      default: return 'secondary';
    }
  };

  const getSuggestedDeadlineText = (importance) => {
    switch (importance) {
      case 'Routine': return '5 business days';
      case 'Important': return '3 business days';
      case 'Critical': return '24 business hours (1 business day)';
      case 'Emergency': return '4 hours';
      default: return '3 business days';
    }
  };

  const getDeadlinePlaceholder = (importance) => {
    const suggestedText = getSuggestedDeadlineText(importance);
    if (importance === 'Emergency') {
      return `Suggested: ${suggestedText} (including time)`;
    } else if (importance === 'Critical') {
      return `Suggested: ${suggestedText}`;
    } else {
      return `Suggested: ${suggestedText} (business days)`;
    }
  };

  const getDeadlineCalculation = (importance) => {
    const today = new Date();
    const suggestedDeadline = getSuggestedDeadline(importance);
    const deadlineDate = new Date(suggestedDeadline);
    
    if (importance === 'Emergency') {
      return `Today ${today.toLocaleDateString()} + 4 hours = ${deadlineDate.toLocaleDateString()} at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (importance === 'Critical') {
      const totalDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
      return `Today ${today.toLocaleDateString()} + 1 business day (24 business hours, ${totalDays} calendar days) = ${deadlineDate.toLocaleDateString()}`;
    } else {
      const businessDays = getSuggestedDeadlineText(importance).split(' ')[0];
      const totalDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
      return `Today ${today.toLocaleDateString()} + ${businessDays} business days (${totalDays} calendar days) = ${deadlineDate.toLocaleDateString()}`;
    }
  };

  if (!file) {
    return (
      <div className="content-card">
        <div className="content-card-body">
          <div className="alert alert-warning">No file selected for sending.</div>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="send-forward-page-container">
      {/* Page Header */}
      <div className="page-header sticky-header">
        <div className="d-flex align-items-center">
          <button className="btn btn-secondary me-3 back-btn-spaced" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div>
            <h1 className="page-title">Send File</h1>
            <p className="page-subtitle">Send file to another department</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="content-card">
          <div className="content-card-body">
            <div className="alert alert-success">
              File sent successfully! Redirecting to Sent Files...
            </div>
          </div>
        </div>
      )}

      <div className="row send-forward-row main-content-with-header">
        {/* File Information */}
        <div className="col-4 d-flex flex-column">
          <div className="content-card flex-fill" ref={fileDetailsRef}>
            <div className="content-card-header">
              <h3 className="card-title">File Details</h3>
            </div>
            <div className="content-card-body">
              <div className="mb-3">
                <div className="fw-bold text-primary">{file.code}</div>
                <div className="text-muted fs-sm">File ID</div>
                <div className="mt-2 barcode-container">
                  <Barcode value={file.code} />
                </div>
              </div>
              <div className="mb-3">
                <div className="fw-bold">{file.title}</div>
                <div className="text-muted fs-sm">Title</div>
              </div>
              <div className="mb-3">
                <div>{file.department}</div>
                <div className="text-muted fs-sm">Department</div>
              </div>
              <div className="mb-3">
                <span className={`badge badge-${getImportanceColor(file.priority)}`}>
                  {file.priority}
                </span>
                <div className="text-muted fs-sm">Importance Level</div>
                <div className="text-muted fs-xs">
                  Suggested: {getSuggestedDeadlineText(file.priority)}
                </div>
              </div>
              <div className="mb-3">
                <span className="badge badge-secondary">{file.type}</span>
                <div className="text-muted fs-sm">Type</div>
              </div>
              <div>
                <div>{file.currentHolder}</div>
                <div className="text-muted fs-sm">Current Holder</div>
              </div>
            </div>
          </div>
        </div>

        {/* Send Form */}
        <div className="col-8 d-flex flex-column">
          <div className="content-card flex-fill" style={fileDetailsHeight ? { minHeight: fileDetailsHeight } : {}}>
            <div className="content-card-header">
              <h3 className="card-title">Send Details</h3>
            </div>
            <div className="content-card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Recipient Department *</label>
                  <select 
                    className="form-select" 
                    name="recipientDepartment" 
                    value={formData.recipientDepartment}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.filter(dept => dept !== file.department).map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <div className="text-muted fs-sm mt-1">
                    File will be sent to this department
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Attention To (Optional)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleInputChange}
                    placeholder="e.g., HR Manager, Finance Team"
                  />
                  <div className="text-muted fs-sm mt-1">
                    Optional: Specify who should handle this file
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Send Method</label>
                  <select 
                    className="form-select" 
                    name="sentThrough" 
                    value={formData.sentThrough}
                    onChange={handleInputChange}
                  >
                    <option value="hand-delivery">Hand Delivery</option>
                    <option value="internal-mail">Internal Mail</option>
                    <option value="courier">Courier</option>
                  </select>
                </div>

                {formData.sentThrough === 'courier' && (
                  <div className="form-group">
                    <label className="form-label">Courier Tracking Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="trackingNumber"
                      value={formData.trackingNumber}
                      onChange={handleInputChange}
                      placeholder="Enter tracking number"
                      required
                    />
                  </div>
                )}

                {formData.sentThrough === 'hand-delivery' && (
                  <div className="form-group">
                    <label className="form-label">Select Delivery Person *</label>
                    <select
                      className="form-select"
                      name="deliveryPerson"
                      value={formData.deliveryPerson}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Person</option>
                      {deliveryTeam.map(person => (
                        <option key={person} value={person}>{person}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Deadline for Action *</label>
                  {file.priority === 'Emergency' ? (
                    <input 
                      type="datetime-local" 
                      className="form-control" 
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      placeholder={!deadlineModified ? getDeadlinePlaceholder(file.priority) : ''}
                      required
                    />
                  ) : (
                    <input 
                      type="date" 
                      className="form-control" 
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      placeholder={!deadlineModified ? getDeadlinePlaceholder(file.priority) : ''}
                      required
                    />
                  )}
                  <div className="text-muted fs-sm mt-1">
                    {deadlineModified ? (
                      <span className="text-primary">✓ Custom deadline set</span>
                    ) : (
                      <div>
                        <span className="text-muted">Click to modify suggested deadline</span>
                        <div className="text-muted fs-xs mt-1">
                          {getDeadlineCalculation(file.priority)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks *</label>
                  <textarea 
                    className="form-control" 
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter remarks about this send action..."
                    required
                  />
                </div>

                <div className="d-flex gap-3 mt-4">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                  >
                    Send File
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .send-forward-page-container {
          padding-left: 2.5rem;
          padding-right: 2.5rem;
        }
        @media (max-width: 768px) {
          .send-forward-page-container {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }
        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #fff;
          padding-top: 1rem;
          padding-bottom: 1rem;
          box-shadow: 0 2px 8px 0 rgba(0,0,0,0.03);
        }
        .back-btn-spaced {
          margin-left: 1.25rem;
        }
        .main-content-with-header {
          margin-top: 1.5rem;
        }
        .barcode-container {
          width: 100%;
          overflow: hidden;
          display: flex;
          justify-content: center;
        }
        .barcode-container svg {
          max-width: 100%;
          height: auto;
        }
        .send-forward-row {
          display: flex;
          align-items: stretch;
        }
        .content-card.flex-fill {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .content-card-body {
          flex: 1 1 auto;
        }
        @media (max-width: 768px) {
          .barcode-container svg {
            transform: scale(0.8);
          }
          .send-forward-row {
            flex-direction: column;
          }
          .back-btn-spaced {
            margin-left: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
} 