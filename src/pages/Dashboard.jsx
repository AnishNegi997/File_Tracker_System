import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllFiles, getDashboardStats } from '../services/dataService';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    received: 0,
    sent: 0,
    completed: 0
  });
  const [departmentStats, setDepartmentStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all files based on user role
        const allFiles = await getAllFiles();
        
        // Filter files based on user role
        let filteredFiles = allFiles;
        if (user?.role === 'admin') {
          // Admin sees only their department's files
          filteredFiles = allFiles.filter(f => f.department === user.department);
        } else if (user?.role === 'user') {
          // User sees only files assigned to them or created by them
          filteredFiles = allFiles.filter(f => 
            f.currentHolder === user.name || 
            f.assignedTo === user.name ||
            f.createdBy === user.name ||
            f.requisitioner === user.name
          );
        }
        // Superadmin sees all files (no filtering needed)
        
        setFiles(filteredFiles);
        
        // Calculate stats
        const calculatedStats = {
          total: filteredFiles.length,
          received: filteredFiles.filter(f => f.status === 'Received').length,
          sent: filteredFiles.filter(f => f.status === 'Sent' || f.status === 'Created').length,
          completed: filteredFiles.filter(f => f.status === 'Completed' || f.status === 'Complete').length,
        };
        setStats(calculatedStats);
        
        // Calculate department stats
        const deptStats = filteredFiles.reduce((acc, file) => {
          acc[file.department] = (acc[file.department] || 0) + 1;
          return acc;
        }, {});
        setDepartmentStats(deptStats);
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setFiles([]);
        setStats({ total: 0, received: 0, sent: 0, completed: 0 });
        setDepartmentStats({});
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleRowClick = (file) => {
    // Ensure the file object has all necessary fields for FileDetails
    const completeFile = {
      ...file,
      code: file.code || file.fileId || file._id,
      fileId: file.fileId || file.code || file._id,
      title: file.title || 'Untitled',
      department: file.department || 'Unknown',
      status: file.status || 'Unknown',
      currentHolder: file.currentHolder || file.assignedTo || 'Unknown',
      priority: file.priority || 'Normal',
      type: file.type || 'General',
      createdBy: file.createdBy || 'Unknown',
      createdAt: file.createdAt || file.datetime || new Date().toISOString(),
      requisitioner: file.requisitioner || file.createdBy || 'Unknown',
      datetime: file.datetime || file.createdAt || new Date().toISOString(),
      remarks: file.remarks || '',
      assignedTo: file.assignedTo || file.currentHolder || 'Unknown'
    };
    
    navigate('/file-details', { state: { file: completeFile } });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Received': return 'primary';
      case 'Sent': return 'warning';
      case 'Created': return 'info';
      case 'Completed': 
      case 'Complete': return 'success';
      case 'On Hold': return 'warning';
      case 'Released': return 'info';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Page Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="dashboard-title">
              {user?.role === 'superadmin' ? 'System Dashboard' : 
               user?.role === 'admin' ? `${user?.department} Dashboard` : 
               'Dashboard'}
            </h1>
            <p className="dashboard-subtitle">
              Welcome back, {user?.name}
              {user?.role === 'admin' && ` - ${user?.department} Administrator`}
              {user?.role === 'superadmin' && ' - System Administrator'}
            </p>
          </div>
          <button className="create-file-btn" onClick={() => navigate('/create')}>
            <span className="btn-icon">➕</span>
            <span className="btn-text">Create File</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Files</div>
          </div>
        </div>
        <div className="stat-card stat-card-info">
          <div className="stat-icon">📥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.received}</div>
            <div className="stat-label">Received</div>
          </div>
        </div>
        <div className="stat-card stat-card-warning">
          <div className="stat-icon">📤</div>
          <div className="stat-content">
            <div className="stat-number">{stats.sent}</div>
            <div className="stat-label">Sent</div>
          </div>
        </div>
        <div className="stat-card stat-card-success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        {user?.role === 'superadmin' && (
          <>
            <div className="stat-card stat-card-secondary">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-number">{Object.keys(departmentStats).length}</div>
                <div className="stat-label">Departments</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Department Overview (Admin & Super Admin) */}
      {(user?.role === 'admin' || user?.role === 'superadmin') && (
        <div className="department-overview">
          <div className="section-header">
            <h3 className="section-title">Department Overview</h3>
            <div className="section-subtitle">File distribution across departments</div>
          </div>
          <div className="department-grid">
            {(user?.role === 'superadmin' ? Object.keys(departmentStats) : [user?.department]).map(dep => (
              <div className="department-card" key={dep}>
                <div className="department-icon">🏢</div>
                <div className="department-name">{dep}</div>
                <div className="department-count">{departmentStats[dep] || 0}</div>
                <div className="department-label">files</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Insights (Super Admin Only) */}
      {user?.role === 'superadmin' && (
        <div className="system-insights">
          <div className="section-header">
            <h3 className="section-title">System Insights</h3>
            <div className="section-subtitle">Key metrics and system status</div>
          </div>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon">📊</div>
              <div className="insight-content">
                <div className="insight-title">Active Users</div>
                <div className="insight-value">24</div>
                <div className="insight-description">Currently online</div>
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-icon">⚡</div>
              <div className="insight-content">
                <div className="insight-title">Response Time</div>
                <div className="insight-value">45ms</div>
                <div className="insight-description">Average load time</div>
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-icon">🛡️</div>
              <div className="insight-content">
                <div className="insight-title">Security</div>
                <div className="insight-value">Secure</div>
                <div className="insight-description">All systems operational</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Files */}
      <div className="recent-files-section">
        <div className="section-header">
          <h3 className="section-title">Recent Files</h3>
          <div className="section-subtitle">Latest file activities and updates</div>
        </div>
        <div className="files-container">
          {files.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <div className="empty-title">No files found</div>
              <div className="empty-text">Start by creating a new file or receiving files from other departments.</div>
            </div>
          ) : (
            <div className="files-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>File ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Department</th>
                    <th>Last Action</th>
                  </tr>
                </thead>
                <tbody>
                  {files.slice(0, 8).map(file => (
                    <tr key={file._id || file.id} onClick={() => handleRowClick(file)} className="file-row">
                      <td className="file-id">{file.code || file.fileId || file._id}</td>
                      <td className="file-title">{file.title || 'Untitled'}</td>
                      <td>
                        <span className={`status-badge status-${getStatusColor(file.status)}`}>
                          {file.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="assigned-to">{file.currentHolder || file.assignedTo || 'Unassigned'}</td>
                      <td className="department">{file.department || 'Unknown'}</td>
                      <td className="last-action">
                        {file.createdAt ? 
                          `${file.status === 'Created' ? 'Created' : 'Updated'} ${new Date(file.createdAt).toLocaleDateString()}` : 
                          'No date'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 