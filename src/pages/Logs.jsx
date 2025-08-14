import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllFileMovements, getAllFiles, formatDeadline, isFileOverdue } from '../services/dataService';

export default function Logs() {
  const { user } = useAuth();
  const [movements, setMovements] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterDeadline, setFilterDeadline] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [allMovements, allFilesData] = await Promise.all([
          getAllFileMovements(),
          getAllFiles()
        ]);
        setMovements(allMovements);
        setAllFiles(allFilesData);
      } catch (error) {
        console.error('Error loading logs:', error);
        setMovements([]);
        setAllFiles([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getFilteredMovements = () => {
    let filtered = movements;

    if (searchTerm) {
      filtered = filtered.filter(movement =>
        movement.fileId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        allFiles.find(f => f.code === movement.fileId)?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.remarks.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterAction) {
      filtered = filtered.filter(movement => movement.action === filterAction);
    }

    if (filterDepartment) {
      filtered = filtered.filter(movement => {
        const file = allFiles.find(f => f.code === movement.fileId);
        return file && file.department === filterDepartment;
      });
    }

    if (filterDeadline) {
      filtered = filtered.filter(movement => {
        if (!movement.deadline) return false;
        switch (filterDeadline) {
          case 'overdue':
            return isFileOverdue(movement.deadline);
          case 'due-soon':
            const deadlineDate = new Date(movement.deadline);
            const now = new Date();
            const diff = deadlineDate - now;
            const hoursRemaining = diff / (1000 * 60 * 60);
            return diff > 0 && hoursRemaining < 24;
          case 'due-today':
            const today = new Date();
            const deadline = new Date(movement.deadline);
            return deadline.toDateString() === today.toDateString();
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'Created': return 'success';
      case 'Received': return 'primary';
      case 'Forwarded': return 'warning';
      case 'Sent': return 'info';
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

  const filteredMovements = getFilteredMovements();

  if (loading) {
    return (
      <div>
        <div className="page-header sticky-header">
          <h1 className="page-title">File Movement Logs</h1>
          <p className="page-subtitle">Complete history of file movements and actions</p>
        </div>
        <div className="content-card">
          <div className="content-card-body">
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading logs...</p>
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
        <h1 className="page-title">File Movement Logs</h1>
        <p className="page-subtitle">Track all file movements and actions</p>
      </div>

      {/* Filters */}
      <div className="content-card sticky-search">
        <div className="content-card-body">
          <div className="row">
            <div className="col-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-2">
              <select
                className="form-select"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              >
                <option value="">All Actions</option>
                <option value="Created">Created</option>
                <option value="Received">Received</option>
                <option value="Forwarded">Forwarded</option>
                <option value="Sent">Sent</option>
                <option value="Returned">Returned</option>
              </select>
            </div>
            <div className="col-2">
              <select
                className="form-select"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="">All Departments</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="IT">IT</option>
                <option value="Administration">Administration</option>
                <option value="Procurement">Procurement</option>
                <option value="Legal">Legal</option>
              </select>
            </div>
            <div className="col-2">
              <select
                className="form-select"
                value={filterDeadline}
                onChange={(e) => setFilterDeadline(e.target.value)}
              >
                <option value="">All Deadlines</option>
                <option value="overdue">Overdue</option>
                <option value="due-soon">Due Soon (24h)</option>
                <option value="due-today">Due Today</option>
              </select>
            </div>
            <div className="col-3 d-flex align-items-center">
              <span className="text-muted fs-sm">
                {filteredMovements.length} file movements
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Movements List */}
      <div className="content-card">
        <div className="content-card-header">
          <h3 className="card-title">File Movements</h3>
        </div>
        <div className="content-card-body p-0 scrollable-files-list">
          {filteredMovements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No movements found</div>
              <div className="empty-state-text">
                {movements.length === 0 
                  ? "No file movements recorded yet." 
                  : "No movements match your search criteria."
                }
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Department</th>
                    <th>Action</th>
                    <th>User</th>
                    <th>Date/Time</th>
                    <th>Remarks</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map((movement, idx) => {
                    const file = allFiles.find(f => f.code === movement.fileId);
                    const deadlineInfo = movement.deadline ? formatDeadline(movement.deadline) : null;
                    return (
                      <tr key={idx}>
                        <td>{movement.fileId}</td>
                        <td>{file?.department || '-'}</td>
                        <td>
                          <span className={`badge badge-${getActionColor(movement.action)}`}>{movement.action}</span>
                        </td>
                        <td>{movement.user}</td>
                        <td>{movement.datetime}</td>
                        <td>{movement.remarks}</td>
                        <td>
                          {movement.deadline ? (
                            <span className={`badge badge-${getDeadlineColor(movement.deadline)}`}>{deadlineInfo.fullText}</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
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