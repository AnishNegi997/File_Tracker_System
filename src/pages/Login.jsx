import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(true);
      setTimeout(() => setError(false), 2000);
    } else {
      try {
        const result = await login(email, password);
        if (result.success) {
          navigate('/dashboard');
        } else {
          setError(true);
          setTimeout(() => setError(false), 2000);
        }
      } catch (error) {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">📁</div>
          <h1 className="auth-title">File Tracker</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            Invalid email or password
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-control" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="Enter your email"
              required 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Enter your password"
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary w-100">
            Sign In
          </button>
        </form>

        <div className="auth-footer">
          <span className="text-muted">Don't have an account? </span>
          <Link to="/signup" className="text-primary">Sign up</Link>
        </div>
      </div>

      <style>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9fafb;
          padding: 1rem;
        }

        .auth-card {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          padding: 2rem;
          width: 100%;
          max-width: 400px;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .auth-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .auth-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .auth-subtitle {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .auth-form {
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .auth-footer {
          text-align: center;
          font-size: 0.875rem;
        }

        .alert {
          padding: 0.75rem;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .alert-danger {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
      `}</style>
    </div>
  );
} 