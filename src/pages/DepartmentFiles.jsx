import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllFiles } from '../services/dataService';

export default function DepartmentFiles() {
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState(user?.role === 'superadmin' ? 'All' : user?.department);
  const [selectedFile, setSelectedFile] = useState(null);
  const [transmitTo, setTransmitTo] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoading(true);
        const allFiles = await getAllFiles();
        
        const filteredFiles = user?.role === 'superadmin' 
          ? (selectedDepartment === 'All' ? allFiles : allFiles.filter(f => f.department === selectedDepartment))
          : allFiles.filter(f => f.department === user?.department);
        
        setFiles(filteredFiles);
      } catch (error) {
        console.error('Error loading department files:', error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      loadFiles();
    }
  }, [user, selectedDepartment]);

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return <div className="container py-4"><div className="alert alert-danger">Access denied.</div></div>;
  }

  const handleTransmit = (fileId) => {
    setFiles(files.map(f => f.id === fileId ? { ...f, status: 'Transmitted', assignedTo: transmitTo, history: [...f.history, { action: 'Transmitted', to: transmitTo, date: new Date().toISOString() }] } : f));
    setSelectedFile(null);
    setTransmitTo('');
  };

  const handleRowClick = (file) => {
    navigate('/file-details', { state: { file } });
  };

  const departments = ['All', 'HR', 'Finance', 'IT', 'Administration', 'Procurement', 'Legal'];

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 fw-bold">
            {user?.role === 'superadmin' ? 'System Files' : `${user?.department} Department Files`}
          </h1>
        </div>
        <div className="card shadow-sm p-4">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading department files...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 fw-bold">
          {user?.role === 'superadmin' ? 'System Files' : `${user?.department} Department Files`}
        </h1>
        {user?.role === 'superadmin' && (
          <select 
            className="form-select w-auto" 
            value={selectedDepartment} 
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        )}
      </div>
      <div className="card shadow-sm p-4 table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>File ID</th>
              <th>Title</th>
              <th>Department</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map(file => (
              <tr key={file.id} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(file)}>
                <td>{file.fileId}</td>
                <td>{file.title}</td>
                <td>{file.department}</td>
                <td>{file.assignedTo}</td>
                <td>{file.status}</td>
                <td onClick={e => e.stopPropagation()}>
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setSelectedFile(file)} title="Transmit this file" aria-label="Transmit file">
                    Transmit
                  </button>
                  {/* More actions can be added here */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Transmit Modal */}
        {selectedFile && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Transmit File</h5>
                  <button type="button" className="btn-close" onClick={() => setSelectedFile(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Transmit To (User/Dept)</label>
                    <input type="text" className="form-control" value={transmitTo} onChange={e => setTransmitTo(e.target.value)} placeholder="Enter user or department" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedFile(null)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={() => handleTransmit(selectedFile.id)} disabled={!transmitTo}>Transmit</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 