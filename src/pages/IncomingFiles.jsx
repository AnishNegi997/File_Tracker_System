import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllFiles, getFileForwards } from '../services/dataService';
import { getForwardsForAdmin, getDepartmentEmployees } from '../services/apiService';

export default function IncomingFiles() {
  const { user } = useAuth();
  const [acceptingFile, setAcceptingFile] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [incoming, setIncoming] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoading(true);
        
        let filteredFiles = [];
        
        if (user?.role === 'admin' || user?.role === 'superadmin') {
          // For admins, get forwards pending their review AND all files in their department
          if (user?.role === 'admin') {
            console.log('Loading files for admin in department:', user.department);
            
            // Get pending forwards for review (sent TO this department)
            const pendingForwards = await getForwardsForAdmin(user.department);
            const forwardsData = pendingForwards.data || [];
            console.log('Pending forwards for admin:', forwardsData);
            
            // Also get all files in their department (including those sent by others)
            const allFiles = await getAllFiles();
            console.log('All files fetched:', allFiles.length);
            const departmentFiles = allFiles.filter(f => 
              f.department === user.department && 
              f.status !== 'Created' // Exclude files that are just created
            );
            console.log('Department files filtered:', departmentFiles.length);
            
            // Also get files that have forwards sent to this department (even if file is not in this department)
            const filesWithForwards = [];
            if (forwardsData.length > 0) {
              for (const forward of forwardsData) {
                if (forward.fileCode) {
                  const fileWithForward = allFiles.find(f => f.code === forward.fileCode);
                  if (fileWithForward) {
                    filesWithForwards.push({
                      _id: fileWithForward.id || fileWithForward._id,
                      fileCode: fileWithForward.code || fileWithForward.fileId,
                      sentBy: fileWithForward.createdBy || fileWithForward.requisitioner || 'System',
                      priority: fileWithForward.priority || 'Normal',
                      status: forward.status || 'Pending Review',
                      sentAt: forward.sentAt || fileWithForward.createdAt || new Date(),
                      remarks: forward.remarks || `Forwarded to ${user.department} department`,
                      distributedTo: forward.distributedTo || 'Unassigned',
                      recipientDepartment: user.department,
                      isForward: true, // Flag to identify this is from a forward
                      originalDepartment: fileWithForward.department
                    });
                  }
                }
              }
            }
            console.log('Files with forwards:', filesWithForwards.length);
            
            // Convert department files to forward-like format for consistency
            const fileForwards = departmentFiles.map(file => ({
              _id: file.id || file._id,
              fileCode: file.code || file.fileId,
              sentBy: file.createdBy || file.requisitioner || 'System',
              priority: file.priority || 'Normal',
              status: file.status === 'Released' ? 'Pending Distribution' : file.status,
              sentAt: file.createdAt || new Date(),
              remarks: `File in ${user.department} department`,
              distributedTo: file.currentHolder || file.assignedTo || 'Unassigned',
              recipientDepartment: file.department,
              isFile: true // Flag to identify this is a file, not a forward
            }));
            
            // Combine forwards, files with forwards, and department files, removing duplicates
            const allItems = [...forwardsData, ...filesWithForwards, ...fileForwards];
            const uniqueItems = allItems.filter((item, index, self) => 
              index === self.findIndex(t => t.fileCode === item.fileCode)
            );
            
            console.log('Final combined items for admin:', uniqueItems.length);
            filteredFiles = uniqueItems;
            
            // Also load employees for this department
            try {
              const employeesData = await getDepartmentEmployees(user.department);
              setEmployees(employeesData.data || []);
            } catch (error) {
              console.error('Error loading employees:', error);
              setEmployees([]);
            }
          } else {
            // For superadmin, get all pending forwards and all files
            const allForwards = await getForwardsForAdmin('all');
            const forwardsData = allForwards.data || [];
            
            const allFiles = await getAllFiles();
            const fileForwards = allFiles.filter(f => f.status !== 'Created').map(file => ({
              _id: file.id || file._id,
              fileCode: file.code || file.fileId,
              sentBy: file.createdBy || file.requisitioner || 'System',
              priority: file.priority || 'Normal',
              status: file.status === 'Released' ? 'Pending Distribution' : file.status,
              sentAt: file.createdAt || new Date(),
              remarks: `File in ${file.department} department`,
              distributedTo: file.currentHolder || file.assignedTo || 'Unassigned',
              recipientDepartment: file.department,
              isFile: true
            }));
            
            const allItems = [...forwardsData, ...fileForwards];
            const uniqueItems = allItems.filter((item, index, self) => 
              index === self.findIndex(t => t.fileCode === item.fileCode)
            );
            
            filteredFiles = uniqueItems;
          }
        } else if (user?.role === 'user') {
          // For regular users, get forwards that are distributed to them
          try {
            const allForwards = await getFileForwards();
            filteredFiles = allForwards.filter(forward => 
              forward.distributedTo === user.name && 
              forward.status === 'Distributed to Employee'
            );
            
            // Also include files that are directly assigned to them
            const allFiles = await getAllFiles();
            const directlyAssignedFiles = allFiles.filter(f => 
              (f.currentHolder === user.name || f.assignedTo === user.name) &&
              (f.status === 'Released' || f.status === 'Received' || f.status === 'received')
            );
            
            // Convert files to forward-like format for consistency
            const fileForwards = directlyAssignedFiles.map(file => ({
              _id: file.id || file._id,
              fileCode: file.code || file.fileId,
              sentBy: file.createdBy || 'System',
              priority: file.priority || 'Normal',
              status: 'Direct Assignment',
              sentAt: file.createdAt || new Date(),
              remarks: `File directly assigned to ${user.name}`,
              distributedTo: user.name,
              recipientDepartment: file.department
            }));
            
            filteredFiles = [...filteredFiles, ...fileForwards];
          } catch (error) {
            console.error('Error loading forwards for user:', error);
            filteredFiles = [];
          }
        }
        
        setIncoming(filteredFiles);
      } catch (error) {
        console.error('Error loading incoming files:', error);
        setIncoming([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadFiles();
    }
  }, [user]);

  const handleDistribute = async (forward) => {
    try {
      const response = await fetch(`http://localhost:5000/api/forwards/${forward._id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          distributedTo: selectedEmployee,
          adminRemarks: `Distributed to ${selectedEmployee}`
        })
      });

      if (response.ok) {
        setSuccessMsg('File successfully distributed to employee!');
        setAcceptingFile(null);
        setSelectedEmployee('');
        // Reload the incoming files
        const loadFiles = async () => {
          try {
            setLoading(true);
            if (user?.role === 'admin') {
              // Get pending forwards for review
              const pendingForwards = await getForwardsForAdmin(user.department);
              const forwardsData = pendingForwards.data || [];
              
              // Also get all files in their department (including those sent by others)
              const allFiles = await getAllFiles();
              const departmentFiles = allFiles.filter(f => 
                f.department === user.department && 
                f.status !== 'Created' // Exclude files that are just created
              );
              
              // Also get files that have forwards sent to this department (even if file is not in this department)
              const filesWithForwards = [];
              if (forwardsData.length > 0) {
                for (const forward of forwardsData) {
                  if (forward.fileCode) {
                    const fileWithForward = allFiles.find(f => f.code === forward.fileCode);
                    if (fileWithForward) {
                      filesWithForwards.push({
                        _id: fileWithForward.id || fileWithForward._id,
                        fileCode: fileWithForward.code || fileWithForward.fileId,
                        sentBy: fileWithForward.createdBy || fileWithForward.requisitioner || 'System',
                        priority: fileWithForward.priority || 'Normal',
                        status: forward.status || 'Pending Review',
                        sentAt: forward.sentAt || fileWithForward.createdAt || new Date(),
                        remarks: forward.remarks || `Forwarded to ${user.department} department`,
                        distributedTo: forward.distributedTo || 'Unassigned',
                        recipientDepartment: user.department,
                        isForward: true,
                        originalDepartment: fileWithForward.department
                      });
                    }
                  }
                }
              }
              
              // Convert department files to forward-like format for consistency
              const fileForwards = departmentFiles.map(file => ({
                _id: file.id || file._id,
                fileCode: file.code || file.fileId,
                sentBy: file.createdBy || file.requisitioner || 'System',
                priority: file.priority || 'Normal',
                status: file.status === 'Released' ? 'Pending Distribution' : file.status,
                sentAt: file.createdAt || new Date(),
                remarks: `File in ${user.department} department`,
                distributedTo: file.currentHolder || file.assignedTo || 'Unassigned',
                recipientDepartment: file.department,
                isFile: true
              }));
              
              // Combine forwards, files with forwards, and department files, removing duplicates
              const allItems = [...forwardsData, ...filesWithForwards, ...fileForwards];
              const uniqueItems = allItems.filter((item, index, self) => 
                index === self.findIndex(t => t.fileCode === item.fileCode)
              );
              
              setIncoming(uniqueItems);
            }
          } catch (error) {
            console.error('Error reloading files:', error);
          } finally {
            setLoading(false);
          }
        };
        loadFiles();
      } else {
        const errorData = await response.json();
        setSuccessMsg(`Error: ${errorData.error || 'Failed to distribute file'}`);
      }
    } catch (error) {
      console.error('Error distributing file:', error);
      setSuccessMsg('Error distributing file. Please try again.');
    }
    
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleReceiveFile = async (forward) => {
    try {
      const response = await fetch(`http://localhost:5000/api/forwards/${forward._id}/receive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setSuccessMsg('File marked as received successfully! It will now appear in your Received Files. You can view it in the Received Files page.');
        
        // Reload the incoming files properly
        const loadFiles = async () => {
          try {
            setLoading(true);
            
            let filteredFiles = [];
            
            if (user?.role === 'admin' || user?.role === 'superadmin') {
              // For admins, get forwards pending their review AND all files in their department
              if (user?.role === 'admin') {
                // Get pending forwards for review
                const pendingForwards = await getForwardsForAdmin(user.department);
                const forwardsData = pendingForwards.data || [];
                
                // Also get all files in their department (including those sent by others)
                const allFiles = await getAllFiles();
                const departmentFiles = allFiles.filter(f => 
                  f.department === user.department && 
                  f.status !== 'Created' // Exclude files that are just created
                );
                
                // Also get files that have forwards sent to this department (even if file is not in this department)
                const filesWithForwards = [];
                if (forwardsData.length > 0) {
                  for (const forward of forwardsData) {
                    if (forward.fileCode) {
                      const fileWithForward = allFiles.find(f => f.code === forward.fileCode);
                      if (fileWithForward) {
                        filesWithForwards.push({
                          _id: fileWithForward.id || fileWithForward._id,
                          fileCode: fileWithForward.code || fileWithForward.fileId,
                          sentBy: fileWithForward.createdBy || fileWithForward.requisitioner || 'System',
                          priority: fileWithForward.priority || 'Normal',
                          status: forward.status || 'Pending Review',
                          sentAt: forward.sentAt || fileWithForward.createdAt || new Date(),
                          remarks: forward.remarks || `Forwarded to ${user.department} department`,
                          distributedTo: forward.distributedTo || 'Unassigned',
                          recipientDepartment: user.department,
                          isForward: true,
                          originalDepartment: fileWithForward.department
                        });
                      }
                    }
                  }
                }
                
                // Convert department files to forward-like format for consistency
                const fileForwards = departmentFiles.map(file => ({
                  _id: file.id || file._id,
                  fileCode: file.code || file.fileId,
                  sentBy: file.createdBy || file.requisitioner || 'System',
                  priority: file.priority || 'Normal',
                  status: file.status === 'Released' ? 'Pending Distribution' : file.status,
                  sentAt: file.createdAt || new Date(),
                  remarks: `File in ${user.department} department`,
                  distributedTo: file.currentHolder || file.assignedTo || 'Unassigned',
                  recipientDepartment: file.department,
                  isFile: true
                }));
                
                // Combine forwards, files with forwards, and department files, removing duplicates
                const allItems = [...forwardsData, ...filesWithForwards, ...fileForwards];
                const uniqueItems = allItems.filter((item, index, self) => 
                  index === self.findIndex(t => t.fileCode === item.fileCode)
                );
                
                filteredFiles = uniqueItems;
              } else {
                // For superadmin, get all pending forwards and all files
                const allForwards = await getForwardsForAdmin('all');
                const forwardsData = allForwards.data || [];
                
                const allFiles = await getAllFiles();
                const fileForwards = allFiles.filter(f => f.status !== 'Created').map(file => ({
                  _id: file.id || file._id,
                  fileCode: file.code || file.fileId,
                  sentBy: file.createdBy || file.requisitioner || 'System',
                  priority: file.priority || 'Normal',
                  status: file.status === 'Released' ? 'Pending Distribution' : file.status,
                  sentAt: file.createdAt || new Date(),
                  remarks: `File in ${user.department} department`,
                  distributedTo: file.currentHolder || file.assignedTo || 'Unassigned',
                  recipientDepartment: file.department,
                  isFile: true
                }));
                
                const allItems = [...forwardsData, ...fileForwards];
                const uniqueItems = allItems.filter((item, index, self) => 
                  index === self.findIndex(t => t.fileCode === item.fileCode)
                );
                
                filteredFiles = uniqueItems;
              }
            } else if (user?.role === 'user') {
              // For regular users, get forwards that are distributed to them
              try {
                const allForwards = await getFileForwards();
                filteredFiles = allForwards.filter(forward => 
                  forward.distributedTo === user.name && 
                  forward.status === 'Distributed to Employee'
                );
                
                // Also include files that are directly assigned to them
                const allFiles = await getAllFiles();
                const directlyAssignedFiles = allFiles.filter(f => 
                  (f.currentHolder === user.name || f.assignedTo === user.name) &&
                  (f.status === 'Released' || f.status === 'Received' || f.status === 'received')
                );
                
                // Convert files to forward-like format for consistency
                const fileForwards = directlyAssignedFiles.map(file => ({
                  _id: file.id || file._id,
                  fileCode: file.code || file.fileId,
                  sentBy: file.createdBy || 'System',
                  priority: file.priority || 'Normal',
                  status: 'Direct Assignment',
                  sentAt: file.createdAt || new Date(),
                  remarks: `File directly assigned to ${user.name}`,
                  distributedTo: user.name,
                  recipientDepartment: file.department
                }));
                
                filteredFiles = [...filteredFiles, ...fileForwards];
              } catch (error) {
                console.error('Error loading forwards for user:', error);
                filteredFiles = [];
              }
            }
            
            setIncoming(filteredFiles);
          } catch (error) {
            console.error('Error reloading files:', error);
            setIncoming([]);
          } finally {
            setLoading(false);
          }
        };
        
        loadFiles();
      } else {
        const errorData = await response.json();
        setSuccessMsg(`Error: ${errorData.error || 'Failed to receive file'}`);
      }
    } catch (error) {
      console.error('Error receiving file:', error);
      setSuccessMsg('Error receiving file. Please try again.');
    }
    
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <h1 className="h3 mb-4 fw-bold">Incoming Files</h1>
        <div className="card shadow-sm p-4">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading incoming files...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 mb-4 fw-bold">Incoming Files</h1>
      {successMsg && (
        <div className="alert alert-success d-flex justify-content-between align-items-center">
          <span>{successMsg}</span>
          {successMsg.includes('Received Files') && (
            <button 
              className="btn btn-sm btn-outline-success" 
              onClick={() => navigate('/received-files')}
            >
              View Received Files
            </button>
          )}
        </div>
      )}
      <div className="card shadow-sm p-4 table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>File Code</th>
              <th>Sent By</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Current Holder</th>
              <th>Department</th>
              <th>Sent At</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {incoming.length === 0 ? (
              <tr><td colSpan={9} className="text-center text-secondary">
                {user?.role === 'user' 
                  ? 'No incoming files found. Files will appear here once they are distributed to you.'
                  : 'No incoming files found. Files will appear here once they are forwarded to your department.'
                }
              </td></tr>
            ) : (
              incoming.map(forward => (
                <tr key={forward._id}>
                  <td>
                    <div className="fw-bold">{forward.fileCode}</div>
                    <div className="text-muted fs-xs">File Code</div>
                  </td>
                  <td>{forward.sentBy}</td>
                  <td>
                    <span className={`badge bg-${forward.priority === 'Urgent' || forward.priority === 'Critical' ? 'danger' : 'primary'}`}>
                      {forward.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge bg-${
                      forward.status === 'Pending Admin Review' ? 'warning' :
                      forward.status === 'Admin Approved' ? 'info' :
                      forward.status === 'Distributed to Employee' ? 'primary' :
                      forward.status === 'Direct Assignment' ? 'success' :
                      forward.status === 'Pending Distribution' ? 'info' :
                      forward.status === 'Completed' ? 'success' :
                      'secondary'
                    }`}>
                      {forward.status}
                    </span>
                  </td>
                  <td>
                    <span className="text-muted">
                      {forward.distributedTo || 'Unassigned'}
                    </span>
                  </td>
                  <td>
                    <span className="text-muted">
                      {forward.recipientDepartment || forward.department || 'N/A'}
                    </span>
                    {forward.originalDepartment && forward.originalDepartment !== forward.recipientDepartment && (
                      <div className="text-muted fs-xs">
                        From: {forward.originalDepartment}
                      </div>
                    )}
                  </td>
                  <td>{new Date(forward.sentAt).toLocaleDateString()}</td>
                  <td>{forward.remarks || 'No remarks'}</td>
                  <td>
                    {user?.role === 'admin' && forward.status === 'Pending Admin Review' && (
                      <button className="btn btn-sm btn-primary" onClick={() => setAcceptingFile(forward)}>
                        Review & Distribute
                      </button>
                    )}
                    {user?.role === 'user' && forward.status === 'Distributed to Employee' && (
                      <button className="btn btn-sm btn-success" onClick={() => handleReceiveFile(forward)}>
                        📥 Receive File
                      </button>
                    )}
                    {user?.role === 'admin' && forward.status === 'Pending Distribution' && !forward.isFile && (
                      <button className="btn btn-sm btn-info" onClick={() => setAcceptingFile(forward)}>
                        Distribute
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
                 {/* Distribution Modal */}
         {acceptingFile && (
           <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
             <div className="modal-dialog modal-dialog-centered">
               <div className="modal-content">
                 <div className="modal-header">
                   <h5 className="modal-title">Distribute File to Employee</h5>
                   <button type="button" className="btn-close" onClick={() => setAcceptingFile(null)}></button>
                 </div>
                 <div className="modal-body">
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
                   <button type="button" className="btn btn-secondary" onClick={() => setAcceptingFile(null)}>Cancel</button>
                   <button 
                     type="button" 
                     className="btn btn-primary" 
                     onClick={() => handleDistribute(acceptingFile)} 
                     disabled={!selectedEmployee}
                   >
                     Distribute File
                   </button>
                 </div>
               </div>
             </div>
           </div>
         )}
      </div>
    </div>
  );
} 