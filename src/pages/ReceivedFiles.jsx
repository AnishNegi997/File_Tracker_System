import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllFiles, getFilesByUser, getAllFilesForReceived } from '../services/dataService';

export default function ReceivedFiles() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoading(true);
        
        let filteredFiles = [];
        
        if (user?.role === 'user') {
          // For regular users, get files specifically assigned to them with Released/Received status
          filteredFiles = await getFilesByUser(user.name, 'Released,Received');
        } else if (user?.role === 'admin') {
          // For admins, get all files from ALL departments (not just their own)
          const allFiles = await getAllFilesForReceived();
          const allDepartmentFiles = allFiles.filter(f => 
            f.status !== 'Created' // Exclude files that are just created
          );
          
          // Also get files that have forwards sent to this department (even if file is not in this department)
          try {
            const forwardsResponse = await fetch(`http://localhost:5000/api/forwards/admin/${user.department}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            if (forwardsResponse.ok) {
              const forwardsData = await forwardsResponse.json();
              const forwards = forwardsData.data || [];
              
              const filesWithForwards = [];
              for (const forward of forwards) {
                if (forward.fileCode) {
                  const fileWithForward = allFiles.find(f => f.code === forward.fileCode);
                  if (fileWithForward) {
                    filesWithForwards.push(fileWithForward);
                  }
                }
              }
              
              // Combine all department files and files with forwards, removing duplicates
              const allFilesCombined = [...allDepartmentFiles, ...filesWithForwards];
              const uniqueFiles = allFilesCombined.filter((file, index, self) => 
                index === self.findIndex(f => f.code === file.code)
              );
              
              filteredFiles = uniqueFiles;
            } else {
              filteredFiles = allDepartmentFiles;
            }
          } catch (error) {
            console.error('Error fetching forwards for received files:', error);
            filteredFiles = allDepartmentFiles;
          }
        } else if (user?.role === 'superadmin') {
          // For superadmin, get all files except created ones
          const allFiles = await getAllFilesForReceived();
          filteredFiles = allFiles;
        }
        
        setReceived(filteredFiles);
      } catch (error) {
        console.error('Error loading received files:', error);
        setReceived([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadFiles();
    }
  }, [user]);

  const handleSendForward = (file) => {
    // Navigate to the comprehensive send/forward page
    navigate('/send-forward', { 
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
    });
  };

  const handleRowClick = (file) => {
    navigate('/file-details', { state: { file } });
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <h1 className="h3 mb-4 fw-bold">Received Files</h1>
        <div className="card shadow-sm p-4">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading received files...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 mb-4 fw-bold">Received Files</h1>
      <div className="card shadow-sm p-4 table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>File ID</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Assigned To</th>
              <th>Department</th>
              <th>Status</th>
              <th>Last Action</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {received.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-secondary">
                {user?.role === 'user' 
                  ? 'No received files found. Files will appear here once they are released to you by an admin.'
                  : 'No received files found in your department.'
                }
              </td></tr>
            ) : (
              received.map(file => (
                <tr key={file.id} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(file)}>
                  <td>{file.code || file.fileId}</td>
                  <td>{file.title}</td>
                  <td>
                    <span className={`badge bg-${file.priority === 'Urgent' || file.priority === 'Critical' ? 'danger' : 'primary'}`}>
                      {file.priority}
                    </span>
                  </td>
                  <td>{file.assignedTo || file.currentHolder || 'Not assigned'}</td>
                  <td>{file.department}</td>
                  <td>
                    <span className={`badge bg-${file.status === 'Released' ? 'success' : 'info'}`}>
                      {file.status}
                    </span>
                  </td>
                  <td>{file.lastAction || file.remarks || 'No action recorded'}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <button 
                      className="btn btn-sm btn-outline-primary" 
                      onClick={() => handleSendForward(file)} 
                      title="Send/Forward file" 
                      aria-label="Send file"
                    >
                      📤 Send/Forward
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 