import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const mockAuditLog = [
  { action: 'Login', user: 'Super Admin', timestamp: '2025-07-07 09:00', details: 'Logged in from web' },
  { action: 'Create File', user: 'IT Admin', timestamp: '2025-07-07 10:00', details: 'File THDC-F-2025-0012' },
  { action: 'Approve File', user: 'HR Admin', timestamp: '2025-07-07 11:00', details: 'File THDC-F-2025-0013' },
  { action: 'Delete User', user: 'Super Admin', timestamp: '2025-07-07 12:00', details: 'User user@company.com' },
];

export default function AuditLog() {
  const { user } = useAuth();
  if (!(user?.role === 'superadmin' || user?.role === 'auditor')) return <div className="container py-4"><div className="alert alert-danger">Access denied.</div></div>;

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 mb-4 fw-bold">Audit Log</h1>
      <div className="card shadow-sm p-4">
        <table className="table table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>Action</th>
              <th>User</th>
              <th>Timestamp</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {mockAuditLog.map((log, idx) => (
              <tr key={idx}>
                <td>{log.action}</td>
                <td>{log.user}</td>
                <td>{log.timestamp}</td>
                <td>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 