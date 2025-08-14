import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function MyProfile() {
  const { user } = useAuth();
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [contact, setContact] = useState('123-456-7890');
  const [location, setLocation] = useState('New York Office');
  const [bio, setBio] = useState('Experienced HR manager passionate about people and process.');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef();

  // Mock data for demonstration
  const name = user?.name || 'John Smith';
  const email = user?.email || 'john.smith@office.com';
  const department = user?.department || 'HR';
  const userId = 'EMP-1024';
  const manager = 'Jane Doe';
  const lastLogin = '2024-06-01 09:15 (New York, NY)';
  const orgChartUrl = '#'; // Replace with real link if available
  const recentActivity = [
    { action: 'Sent file "Q2_Report.pdf" to Finance', date: '2024-05-30' },
    { action: 'Updated profile picture', date: '2024-05-28' },
    { action: 'Logged in', date: '2024-05-27' },
  ];

  const handleSave = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatar(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ maxWidth: 700 }}>
      <h1 className="h3 mb-4 fw-bold">My Profile</h1>
      {success && <div className="alert alert-success">Profile updated!</div>}
      <div className="card shadow-sm p-4 mb-4">
        <h5 className="mb-3">Profile Information</h5>
        <div className="d-flex align-items-center mb-3">
          <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-3 position-relative" style={{ width: 72, height: 72, fontSize: 36, color: '#fff', overflow: 'hidden' }}>
            {avatar ? (
              <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              '👤'
            )}
            <button
              type="button"
              className="btn btn-sm btn-light position-absolute bottom-0 end-0 p-1 border"
              style={{ fontSize: 14 }}
              onClick={() => fileInputRef.current.click()}
              title="Upload Avatar"
            >
              <span role="img" aria-label="upload">📷</span>
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <div className="fw-bold fs-5">{name}</div>
            <div className="text-secondary small">{email}</div>
            <div className="text-secondary small">{department}</div>
          </div>
        </div>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">User ID</label>
            <input type="text" className="form-control" value={userId} readOnly />
          </div>
          <div className="col-md-6">
            <label className="form-label">Manager/Supervisor</label>
            <input type="text" className="form-control" value={manager} readOnly />
          </div>
          <div className="col-md-6">
            <label className="form-label">Last Login</label>
            <input type="text" className="form-control" value={lastLogin} readOnly />
          </div>
          <div className="col-md-6">
            <label className="form-label">Location/Office</label>
            <input type="text" className="form-control" value={location} readOnly />
            <div className="form-text">This information will be fetched from the backend in the future.</div>
          </div>
          <div className="col-md-6">
            <label className="form-label">Contact Number</label>
            <input type="text" className="form-control" value={contact} readOnly />
            <div className="form-text">To update your contact number, please contact your department admin or IT.</div>
          </div>
          <div className="col-md-6">
            <label className="form-label">About/Bio</label>
            <textarea className="form-control" value={bio} onChange={e => setBio(e.target.value)} rows={2} />
          </div>
        </div>
        <div className="mt-3">
          <a href={orgChartUrl} className="btn btn-outline-primary btn-sm me-2" target="_blank" rel="noopener noreferrer">
            View Org Chart
          </a>
          <button type="submit" className="btn btn-primary btn-sm" onClick={handleSave} style={{ minWidth: 100 }}>
            Save Changes
          </button>
        </div>
      </div>
      {/* Recent Activity Section */}
      <div className="card shadow-sm p-4 mb-4">
        <h5 className="mb-3">Recent Activity</h5>
        <ul className="list-group list-group-flush">
          {recentActivity.map((item, idx) => (
            <li key={idx} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
              <span>{item.action}</span>
              <span className="text-muted small">{item.date}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 