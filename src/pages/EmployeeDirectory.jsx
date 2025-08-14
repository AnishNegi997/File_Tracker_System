import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/apiService';

const departments = ['All', 'HR', 'Finance', 'IT', 'Administration', 'Procurement', 'Legal'];
const roles = ['All', 'user', 'admin', 'superadmin'];

export default function EmployeeDirectory() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterRole, setFilterRole] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Check access
  if (!(user?.role === 'superadmin' || user?.role === 'admin')) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">Access denied.</div>
      </div>
    );
  }

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setEmployees(response.data || []);
    } catch (error) {
      setError('Failed to fetch employees: ' + error.message);
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort employees
  const getFilteredAndSortedEmployees = () => {
    let filtered = employees;

    // Filter by department
    if (filterDepartment !== 'All') {
      filtered = filtered.filter(emp => emp.department === filterDepartment);
    }

    // Filter by role
    if (filterRole !== 'All') {
      filtered = filtered.filter(emp => emp.role === filterRole);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        emp.department.toLowerCase().includes(term)
      );
    }

    // Sort employees
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'department':
          aValue = a.department.toLowerCase();
          bValue = b.department.toLowerCase();
          break;
        case 'role':
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || Date.now());
          bValue = new Date(b.createdAt || Date.now());
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        if (sortBy === 'createdAt') {
          return aValue - bValue;
        }
        return aValue > bValue ? 1 : -1;
      } else {
        if (sortBy === 'createdAt') {
          return bValue - aValue;
        }
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getRoleBadge = (role) => {
    const badgeColors = {
      'superadmin': 'danger',
      'admin': 'warning',
      'user': 'secondary'
    };
    return (
      <span className={`badge bg-${badgeColors[role] || 'secondary'}`}>
        {role}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  const filteredEmployees = getFilteredAndSortedEmployees();

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 fw-bold">Employee Directory</h1>
        <div className="d-flex gap-2">
          <span className="badge bg-primary align-self-center">
            {filteredEmployees.length} employees
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Filters */}
      <div className="card shadow-sm p-4 mb-4">
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Department</label>
            <select
              className="form-select"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Role</label>
            <select
              className="form-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Sort By</label>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="department">Department</option>
              <option value="role">Role</option>
              <option value="createdAt">Date Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="card shadow-sm p-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('name')}
                >
                  Name {getSortIcon('name')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('email')}
                >
                  Email {getSortIcon('email')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('department')}
                >
                  Department {getSortIcon('department')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('role')}
                >
                  Role {getSortIcon('role')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('createdAt')}
                >
                  Date Created {getSortIcon('createdAt')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-secondary">
                    No employees found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bold">{emp.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.email}</td>
                    <td>
                      <span className="badge bg-info">{emp.department}</span>
                    </td>
                    <td>{getRoleBadge(emp.role)}</td>
                    <td>{formatDate(emp.createdAt)}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-info me-2">
                        View Details
                      </button>
                      <button className="btn btn-sm btn-outline-secondary">
                        Contact
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 