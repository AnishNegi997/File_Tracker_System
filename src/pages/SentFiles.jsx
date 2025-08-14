import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getFileForwards, getAllFiles, formatDeadline, isFileOverdue } from '../services/dataService';

export default function SentFiles() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sentFiles, setSentFiles] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [allForwards, allFilesData] = await Promise.all([
          getFileForwards(),
          getAllFiles()
        ]);
        
        // Get files forwarded to other departments
        const userForwardedFiles = allForwards.filter(forward => forward.sentBy === user?.name);
        
        // Get files directly released to employees by this user
        // Since we don't track who released the file directly, we'll show files that:
        // 1. Are in Released status
        // 2. Are in the user's department
        // 3. Have a current holder (meaning they were assigned to someone)
        const userReleasedFiles = allFilesData.filter(file => 
          file.status === 'Released' && 
          file.currentHolder && 
          file.currentHolder !== user?.name &&
          file.department === user?.department &&
          file.assignedTo && 
          file.assignedTo !== user?.name
        );
        
        console.log('Sent Files Debug:', {
          user: user?.name,
          department: user?.department,
          totalFiles: allFilesData.length,
          forwardedFiles: userForwardedFiles.length,
          releasedFiles: userReleasedFiles.length,
          sampleReleasedFiles: userReleasedFiles.slice(0, 3).map(f => ({
            code: f.code,
            status: f.status,
            department: f.department,
            currentHolder: f.currentHolder,
            assignedTo: f.assignedTo
          }))
        });
        
        // Combine both types of sent files
        const allUserSentFiles = [
          ...userForwardedFiles.map(forward => ({
            ...forward,
            type: 'forwarded',
            action: 'Forwarded to Department'
          })),
          ...userReleasedFiles.map(file => ({
            fileCode: file.code,
            recipientDepartment: file.department,
            recipientName: file.currentHolder || file.assignedTo,
            sentBy: user?.name,
            sentAt: file.updatedAt || file.createdAt,
            status: file.status,
            priority: file.priority,
            remarks: `Released to ${file.currentHolder || file.assignedTo}`,
            type: 'released',
            action: 'Released to Employee'
          }))
        ];
        
        setSentFiles(allUserSentFiles);
        setAllFiles(allFilesData);
      } catch (error) {
        console.error('Error loading sent files:', error);
        setSentFiles([]);
        setAllFiles([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user?.name]);

  const filteredFiles = sentFiles.filter(file =>
    (file.fileCode && file.fileCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (file.recipientDepartment && file.recipientDepartment.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (file.action && file.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (allFiles.find(f => f.code === file.fileCode)?.title && 
     allFiles.find(f => f.code === file.fileCode).title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewFileDetails = (file) => {
    const fileData = allFiles.find(f => f.code === file.fileCode);
    if (fileData) {
      navigate('/file-details', { state: { file: fileData } });
    } else {
      // If it's a forwarded file, we might not have the full file data
      // In that case, we can show a message or navigate to a different view
      console.log('File data not found for:', file.fileCode);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Received': return 'info';
      case 'Distributed to Employee': return 'primary';
      case 'Admin Approved': return 'warning';
      case 'Pending Admin Review': return 'secondary';
      case 'Rejected': return 'danger';
      case 'In Transit': return 'warning';
      case 'Delivered': return 'success';
      case 'Returned': return 'secondary';
      default: return 'primary';
    }
  };

  const getDeadlineColor = (deadline) => {
    if (!deadline) return 'secondary';
    
    if (isFileOverdue(deadline)) {
      return 'danger';
    }
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diff = deadlineDate - now;
    const hoursRemaining = diff / (1000 * 60 * 60);
    
    if (hoursRemaining < 24) {
      return 'warning';
    } else if (hoursRemaining < 72) {
      return 'primary';
    } else {
      return 'success';
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header sticky-header">
          <h1 className="page-title">Sent Files</h1>
          <p className="page-subtitle">Files you have sent to other departments</p>
        </div>
        <div className="content-card">
          <div className="content-card-body">
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading sent files...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header sticky-header">
        <h1 className="page-title">Sent Files</h1>
        <p className="page-subtitle">Files you have forwarded to other departments or released to employees</p>
      </div>

      {/* Search */}
      <div className="content-card sticky-search">
        <div className="content-card-body">
          <div className="row">
            <div className="col-6">
              <input
                type="text"
                className="form-control"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-6 d-flex align-items-center">
              <span className="text-muted fs-sm">
                {filteredFiles.length} of {sentFiles.length} files
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="content-card">
        <div className="content-card-header">
          <h3 className="card-title">Files Sent by {user?.name}</h3>
          <div className="d-flex gap-2">
            <span className="badge badge-primary">
              {sentFiles.filter(f => f.type === 'forwarded').length} Forwarded
            </span>
            <span className="badge badge-success">
              {sentFiles.filter(f => f.type === 'released').length} Released
            </span>
          </div>
        </div>
        <div className="content-card-body p-0 scrollable-files-list">
          {filteredFiles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📤</div>
              <div className="empty-state-title">No sent files found</div>
              <div className="empty-state-text">
                {sentFiles.length === 0 
                  ? "You haven't sent any files yet." 
                  : "No files match your search criteria."
                }
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>File</th>
                    <th>Action</th>
                    <th>Sent To</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Deadline</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => {
                    const deadlineInfo = file.deadline ? formatDeadline(file.deadline) : null;
                    return (
                      <tr key={file._id || file.fileCode}>
                        <td>
                          <div className="fw-bold">{new Date(file.sentAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                        </td>
                        <td>
                          <div className="fw-bold">{file.fileCode}</div>
                          <div className="text-muted fs-xs">
                            {allFiles.find(f => f.code === file.fileCode)?.title || 'Unknown File'}
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${file.type === 'forwarded' ? 'primary' : 'success'}`}>
                            {file.action}
                          </span>
                        </td>
                        <td>
                          <div className="fw-bold">{file.recipientDepartment}</div>
                          {file.originalRecipientName ? (
                            <div className="text-muted fs-xs">Intended for: {file.originalRecipientName}</div>
                          ) : file.recipientName && (
                            <div className="text-muted fs-xs">Attn: {file.recipientName}</div>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-secondary">{file.sentThrough || 'Direct Release'}</span>
                        </td>
                        <td>
                          <span className={`badge badge-${getStatusColor(file.status)}`}>
                            {file.status}
                          </span>
                        </td>
                        <td>
                          {file.deadline && deadlineInfo ? (
                            <div>
                              <div className={`fw-bold text-${getDeadlineColor(file.deadline)}`}>
                                {deadlineInfo.fullText}
                              </div>
                              {deadlineInfo.isOverdue && (
                                <div className="text-danger fs-xs">Overdue</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">No deadline</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleViewFileDetails(file)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 