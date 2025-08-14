import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllFiles, releaseFile } from '../services/dataService';
import { getDepartmentEmployees } from '../services/apiService';

export default function AllFiles() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [releasingFile, setReleasingFile] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoading(true);
        const allFiles = await getAllFiles();
        
        let filteredFiles = allFiles;
        
        // Filter by department if user is not superadmin
        if (user?.role === 'admin') {
          filteredFiles = allFiles.filter(f => f.department === user.department);
        }
        
        setFiles(filteredFiles);
      } catch (error) {
        console.error('Error loading files:', error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadFiles();
    }
  }, [user]);

  useEffect(() => {
    const loadEmployees = async () => {
      if (user?.role === 'admin' && user?.department) {
        try {
          const employeesData = await getDepartmentEmployees(user.department);
          setEmployees(employeesData.data || []);
        } catch (error) {
          console.error('Error loading employees:', error);
          setEmployees([]);
        }
      }
    };

    loadEmployees();
  }, [user]);

  const handleReleaseFile = async () => {
    try {
      const releaseData = {
        assignedTo: selectedEmployee,
        remarks: `Released to ${selectedEmployee} by ${user.name}`
      };
      
      const result = await releaseFile(releasingFile._id || releasingFile.id, releaseData);
      
      setSuccessMsg(`File successfully released to ${selectedEmployee}!`);
      setReleasingFile(null);
      setSelectedEmployee('');
      
      // Reload files
      const allFiles = await getAllFiles();
      let filteredFiles = allFiles;
      if (user?.role === 'admin') {
        filteredFiles = allFiles.filter(f => f.department === user.department);
      }
      setFiles(filteredFiles);
    } catch (error) {
      console.error('Error releasing file:', error);
      setSuccessMsg('Error releasing file. Please try again.');
    }
    
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleRowClick = (file) => {
    navigate('/file-details', { state: { file } });
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = !searchTerm || 
      file.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.requisitioner?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !filterDepartment || file.department === filterDepartment;
    const matchesStatus = !filterStatus || file.status === filterStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = [...new Set(files.map(f => f.department))];
  const statuses = [...new Set(files.map(f => f.status))];

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <h1 className="h3 mb-4 fw-bold">All Files</h1>
        <div className="card shadow-sm p-4">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading files...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 mb-4 fw-bold">All Files</h1>
      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      
      {/* Filters */}
      <div className="card shadow-sm p-4 mb-4">
        <div className="row g-3">
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => {
                setSearchTerm('');
                setFilterDepartment('');
                setFilterStatus('');
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm p-4 table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>File ID</th>
              <th>Title</th>
              <th>Department</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Current Holder</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-secondary">No files found.</td></tr>
            ) : (
              filteredFiles.map(file => (
                <tr key={file.id} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(file)}>
                  <td>{file.code || file.fileId}</td>
                  <td>{file.title}</td>
                  <td>{file.department}</td>
                  <td>
                    <span className={`badge bg-${file.priority === 'Urgent' || file.priority === 'Critical' ? 'danger' : 'primary'}`}>
                      {file.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge bg-${
                      file.status === 'Released' ? 'success' :
                      file.status === 'Received' ? 'info' :
                      file.status === 'Created' ? 'secondary' :
                      file.status === 'Complete' ? 'success' :
                      'warning'
                    }`}>
                      {file.status}
                    </span>
                  </td>
                  <td>{file.currentHolder || 'Not assigned'}</td>
                  <td>{file.createdBy}</td>
                  <td onClick={e => e.stopPropagation()}>
                    {(user?.role === 'admin' || user?.role === 'superadmin') && 
                     file.status === 'Created' && (
                      <button 
                        className="btn btn-sm btn-outline-success me-2" 
                        onClick={() => setReleasingFile(file)}
                        title="Release file to user"
                      >
                        📤 Release
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-outline-primary" 
                      onClick={() => navigate('/send-forward', { 
                        state: { 
                          file: {
                            code: file.code || file.fileId,
                            title: file.title,
                            department: file.department,
                            status: file.status,
                            priority: file.priority,
                            type: file.type || 'Physical',
                            currentHolder: file.assignedTo || file.currentHolder
                          }
                        } 
                      })}
                      title="Send/Forward file"
                    >
                      📤 Forward
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Release File Modal */}
      {releasingFile && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Release File to Employee</h5>
                <button type="button" className="btn-close" onClick={() => setReleasingFile(null)}></button>
              </div>
              <div className="modal-body">
                <p><strong>File:</strong> {releasingFile.code} - {releasingFile.title}</p>
                <div className="mb-3">
                  <label className="form-label">Select Employee <span className="text-danger">*</span></label>
                  <select 
                    className="form-select" 
                    value={selectedEmployee} 
                    onChange={e => setSelectedEmployee(e.target.value)} 
                    required
                  >
                    <option value="">Choose an employee...</option>
                    {employees.map(employee => (
                      <option key={employee._id} value={employee.name}>
                        {employee.name} ({employee.email})
                      </option>
                    ))}
                  </select>
                  <div className="form-text">Select the employee who should receive this file</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setReleasingFile(null)}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={handleReleaseFile} 
                  disabled={!selectedEmployee}
                >
                  Release File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 