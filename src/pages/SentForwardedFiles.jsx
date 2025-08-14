import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFileForwards, getAllFiles } from '../services/dataService';
import { DEPARTMENTS, FORWARD_STATUSES } from '../utils/constants';

export default function SentForwardedFiles() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forwards, setForwards] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [filteredForwards, setFilteredForwards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [allForwards, allFilesData] = await Promise.all([
          getFileForwards(),
          getAllFiles()
        ]);
        setForwards(allForwards);
        setFilteredForwards(allForwards);
        setAllFiles(allFilesData);
      } catch (error) {
        console.error('Error loading forwarded files:', error);
        setForwards([]);
        setFilteredForwards([]);
        setAllFiles([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    let filtered = forwards;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(forward =>
        forward.fileId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        forward.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        forward.sentBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        forward.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(forward => forward.status === statusFilter);
    }

    // Filter by department
    if (departmentFilter) {
      filtered = filtered.filter(forward => forward.recipientDepartment === departmentFilter);
    }

    // Filter by action
    if (actionFilter) {
      filtered = filtered.filter(forward => forward.action === actionFilter);
    }

    setFilteredForwards(filtered);
  }, [forwards, searchTerm, statusFilter, departmentFilter, actionFilter]);

  const handleViewDetails = (forward) => {
    const file = allFiles.find(f => f.code === forward.fileId);
    if (file) {
      navigate('/file-details', { state: { file } });
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Delivered': return 'success';
      case 'In Transit': return 'warning';
      case 'Returned': return 'secondary';
      case 'Cancelled': return 'danger';
      default: return 'info';
    }
  };

  const getActionBadgeColor = (action) => {
    return action === 'forward' ? 'info' : 'primary';
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h1 className="h3 fw-bold mb-0">Sent & Forwarded Files</h1>
        </div>
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading forwarded files...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 fw-bold mb-0">Sent & Forwarded Files</h1>
        <button 
          className="btn btn-outline-secondary"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>

      {/* Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by file ID, recipient, sender, or tracking number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {FORWARD_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Action</label>
              <select
                className="form-select"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="">All Actions</option>
                <option value="send">Send</option>
                <option value="forward">Forward</option>
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary me-2"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setDepartmentFilter('');
                  setActionFilter('');
                }}
              >
                Clear Filters
              </button>
              <span className="text-muted">
                {filteredForwards.length} of {forwards.length} records
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Sent & Forwarded Files</h5>
        </div>
        <div className="card-body p-0">
          {filteredForwards.length === 0 ? (
            <div className="text-center py-5">
              <div className="text-muted">
                <i className="fas fa-inbox fa-3x mb-3"></i>
                <p>No sent or forwarded files found.</p>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>File ID</th>
                    <th>Action</th>
                    <th>Recipient</th>
                    <th>Sent By</th>
                    <th>Method</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Tracking</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredForwards.map((forward) => (
                    <tr key={forward.id}>
                      <td>
                        <div>{new Date(forward.datetime).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                        <small className="text-muted">
                          {new Date(forward.datetime).toLocaleTimeString()}
                        </small>
                      </td>
                      <td>
                        <strong>{forward.fileId}</strong>
                      </td>
                      <td>
                        <span className={`badge bg-${getActionBadgeColor(forward.action)}`}>
                          {forward.action === 'forward' ? 'Forwarded' : 'Sent'}
                        </span>
                      </td>
                      <td>
                        <div><strong>{forward.recipientName}</strong></div>
                        <small className="text-muted">{forward.recipientDepartment}</small>
                        {forward.recipientEmail && (
                          <div><small className="text-muted">{forward.recipientEmail}</small></div>
                        )}
                      </td>
                      <td>{forward.sentBy}</td>
                      <td>
                        <span className="badge bg-secondary">{forward.sentThrough}</span>
                      </td>
                      <td>
                        <span className={`badge bg-${forward.priority === 'Urgent' ? 'danger' : 'secondary'}`}>
                          {forward.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${getStatusBadgeColor(forward.status)}`}>
                          {forward.status}
                        </span>
                      </td>
                      <td>
                        {forward.trackingNumber ? (
                          <div>
                            <small className="text-muted">{forward.trackingNumber}</small>
                            {forward.expectedDeliveryDate && (
                              <div><small className="text-muted">Expected: {new Date(forward.expectedDeliveryDate).toLocaleDateString()}</small></div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleViewDetails(forward)}
                            title="View File Details"
                          >
                            👁️
                          </button>
                          <button
                            className="btn btn-outline-info"
                            onClick={() => navigate('/send-forward', { 
                              state: { 
                                file: allFiles.find(f => f.code === forward.fileId),
                                editForward: forward 
                              } 
                            })}
                            title="Edit Forward"
                          >
                            ✏️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mt-4">
        <div className="col-md-3">
          <div className="card text-bg-primary">
            <div className="card-body text-center">
              <h5 className="card-title">Total Sent</h5>
              <p className="card-text display-6">{forwards.length}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-bg-warning">
            <div className="card-body text-center">
              <h5 className="card-title">In Transit</h5>
              <p className="card-text display-6">
                {forwards.filter(f => f.status === 'In Transit').length}
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-bg-success">
            <div className="card-body text-center">
              <h5 className="card-title">Delivered</h5>
              <p className="card-text display-6">
                {forwards.filter(f => f.status === 'Delivered').length}
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-bg-info">
            <div className="card-body text-center">
              <h5 className="card-title">Forwarded</h5>
              <p className="card-text display-6">
                {forwards.filter(f => f.action === 'forward').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 