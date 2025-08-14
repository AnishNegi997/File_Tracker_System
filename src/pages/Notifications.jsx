import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationsAPI } from '../services/apiService';

const notificationTypes = [
  { value: '', label: 'All Types' },
  { value: 'file_created', label: 'File Created' },
  { value: 'file_received', label: 'File Received' },
  { value: 'file_forwarded', label: 'File Forwarded' },
  { value: 'file_completed', label: 'File Completed' },
  { value: 'file_urgent', label: 'Urgent File' },
  { value: 'system', label: 'System' },
  { value: 'user_management', label: 'User Management' },
  { value: 'forward_status', label: 'Forward Status' }
];

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchNotifications();
  }, [filterType, showUnreadOnly, currentPage]);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        unreadOnly: showUnreadOnly,
        type: filterType
      };
      
      const response = await notificationsAPI.getAll(params);
      setNotifications(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      setError('Failed to fetch notifications: ' + error.message);
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(notifications.map(notification => 
        notification._id === id 
          ? { ...notification, isRead: true, readAt: new Date() }
          : notification
      ));
      fetchUnreadCount();
    } catch (error) {
      setError('Failed to mark notification as read: ' + error.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(notifications.map(notification => ({
        ...notification,
        isRead: true,
        readAt: new Date()
      })));
      setUnreadCount(0);
    } catch (error) {
      setError('Failed to mark all notifications as read: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await notificationsAPI.delete(id);
        setNotifications(notifications.filter(notification => notification._id !== id));
        fetchUnreadCount();
      } catch (error) {
        setError('Failed to delete notification: ' + error.message);
      }
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'file_created': '📄',
      'file_received': '📥',
      'file_forwarded': '📤',
      'file_completed': '✅',
      'file_urgent': '🚨',
      'system': '⚙️',
      'user_management': '👥',
      'forward_status': '📋'
    };
    return icons[type] || '📢';
  };

  const getNotificationBadge = (type) => {
    const badgeColors = {
      'file_created': 'primary',
      'file_received': 'success',
      'file_forwarded': 'info',
      'file_completed': 'success',
      'file_urgent': 'danger',
      'system': 'secondary',
      'user_management': 'warning',
      'forward_status': 'info'
    };
    return badgeColors[type] || 'secondary';
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && notifications.length === 0) {
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
    <div className="container-fluid py-4" style={{ maxWidth: 800 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 fw-bold">Notifications</h1>
        <div className="d-flex gap-2">
          {unreadCount > 0 && (
            <span className="badge bg-danger align-self-center">
              {unreadCount} unread
            </span>
          )}
          {unreadCount > 0 && (
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={handleMarkAllAsRead}
            >
              Mark All Read
            </button>
          )}
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
          <div className="col-md-4">
            <label className="form-label">Filter by Type</label>
            <select
              className="form-select"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
            >
              {notificationTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={showUnreadOnly ? 'unread' : 'all'}
              onChange={(e) => {
                setShowUnreadOnly(e.target.value === 'unread');
                setCurrentPage(1);
              }}
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
            </select>
          </div>
          <div className="col-md-4 d-flex align-items-end">
            <button 
              className="btn btn-outline-secondary w-100"
              onClick={() => {
                setFilterType('');
                setShowUnreadOnly(false);
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card shadow-sm">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-secondary">
            <div className="mb-3">
              <i className="bi bi-bell" style={{ fontSize: '3rem' }}></i>
            </div>
            <h5>No notifications found</h5>
            <p>You're all caught up! Check back later for new notifications.</p>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {notifications.map((notification) => (
              <div 
                key={notification._id} 
                className={`list-group-item list-group-item-action ${!notification.isRead ? 'bg-light' : ''}`}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="d-flex align-items-start flex-grow-1">
                    <div className="me-3 mt-1">
                      <span style={{ fontSize: '1.5rem' }}>
                        {notification.icon || getNotificationIcon(notification.type)}
                      </span>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <h6 className="mb-0 fw-bold">{notification.title}</h6>
                        {!notification.isRead && (
                          <span className="badge bg-primary">New</span>
                        )}
                        <span className={`badge bg-${getNotificationBadge(notification.type)}`}>
                          {notification.type.replace('_', ' ')}
                        </span>
                        {notification.isUrgent && (
                          <span className="badge bg-danger">Urgent</span>
                        )}
                      </div>
                      <p className="mb-1 text-muted">{notification.message}</p>
                      <small className="text-muted">
                        {formatTimeAgo(notification.createdAt)}
                      </small>
                    </div>
                  </div>
                  <div className="d-flex gap-1">
                    {!notification.isRead && (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleMarkAsRead(notification._id)}
                        title="Mark as read"
                      >
                        <i className="bi bi-check"></i>
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(notification._id)}
                      title="Delete notification"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <nav>
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
} 