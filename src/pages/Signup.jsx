import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const departments = [
  'Administration',
  'Finance',
  'HR',
  'IT',
  'Procurement',
  'Legal',
];

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState(departments[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }
    
    try {
      const result = await signup({ name, email, password, department });
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Signup failed. Please try again.');
      }
    } catch (error) {
      setError('Signup failed. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div className="card shadow-sm p-4" style={{ minWidth: 350, maxWidth: 400 }}>
        <h1 className="h4 mb-4 fw-bold text-center">Sign Up</h1>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-control" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Department</label>
            <select 
              className="form-select" 
              value={department} 
              onChange={e => setDepartment(e.target.value)} 
              required 
              disabled={loading}
            >
              {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Confirm Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary w-100 mb-3" 
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <div className="text-center">
          <span>Already have an account? </span>
          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
} 