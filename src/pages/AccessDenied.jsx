import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AccessDenied() {
  const navigate = useNavigate();
  return (
    <div className="container d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="card shadow-sm p-5 text-center">
        <h1 className="display-4 mb-3">🚫</h1>
        <h2 className="mb-3">Access Denied</h2>
        <p className="mb-4">You do not have permission to view this page.</p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
      </div>
    </div>
  );
} 