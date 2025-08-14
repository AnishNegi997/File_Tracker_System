import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function EmailTest() {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const testEmailConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/email/test-connection', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter a test email address');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          to: testEmail,
          template: 'fileForwarded',
          data: {
            fileCode: 'THDC-F-2024-0001',
            fileTitle: 'Test File - Email Notification',
            priority: 'Urgent',
            department: 'IT',
            sentBy: user.name,
            recipientName: 'Test Recipient',
            sentThrough: 'Email',
            sentAt: new Date().toISOString(),
            remarks: 'This is a test email to verify the notification system is working correctly.'
          }
        })
      });
      
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          Access denied. Only administrators can test email functionality.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 mb-4 fw-bold">Email Notification Test</h1>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Test Email Connection</h5>
            </div>
            <div className="card-body">
              <p className="text-muted">
                Test if the email server connection is working properly.
              </p>
              <button 
                className="btn btn-primary" 
                onClick={testEmailConnection}
                disabled={loading}
              >
                {loading ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Send Test Email</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Test Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter email address to send test to"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <button 
                className="btn btn-success" 
                onClick={sendTestEmail}
                disabled={loading || !testEmail}
              >
                {loading ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {testResult && (
        <div className="mt-4">
          <div className={`alert alert-${testResult.success ? 'success' : 'danger'}`}>
            <h6>{testResult.success ? '✅ Success' : '❌ Error'}</h6>
            <p className="mb-1">{testResult.message || testResult.error}</p>
            {testResult.config && (
              <div className="mt-2">
                <small className="text-muted">
                  <strong>Configuration:</strong><br />
                  Host: {testResult.config.host}<br />
                  Port: {testResult.config.port}<br />
                  User: {testResult.config.user}<br />
                  Notifications Enabled: {testResult.config.notificationsEnabled ? 'Yes' : 'No'}
                </small>
              </div>
            )}
            {testResult.messageId && (
              <div className="mt-2">
                <small className="text-muted">
                  <strong>Message ID:</strong> {testResult.messageId}
                </small>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="card shadow-sm">
          <div className="card-header">
            <h5 className="mb-0">Email Notification Features</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6>Automatic Email Triggers:</h6>
                <ul>
                  <li>📤 File Forwarded → Email to recipient</li>
                  <li>📋 File Released → Email to employee</li>
                  <li>📥 File Received → Email to admin</li>
                  <li>✅ File Completed → Email to stakeholders</li>
                </ul>
              </div>
              <div className="col-md-6">
                <h6>Email Content Includes:</h6>
                <ul>
                  <li>File code and title</li>
                  <li>Priority level (color-coded)</li>
                  <li>Department information</li>
                  <li>Deadline (if applicable)</li>
                  <li>Sender/recipient details</li>
                  <li>Timestamps and remarks</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-3">
              <h6>Setup Instructions:</h6>
              <ol>
                <li>Update <code>backend/config.env</code> with your email settings</li>
                <li>For Gmail: Enable 2FA and generate app password</li>
                <li>Set <code>ENABLE_EMAIL_NOTIFICATIONS=true</code></li>
                <li>Test the connection using the button above</li>
                <li>Send a test email to verify everything works</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
