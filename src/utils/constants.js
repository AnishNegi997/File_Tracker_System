export const DEPARTMENTS = [
  'Administration',
  'Finance',
  'HR',
  'IT',
  'Procurement',
  'Legal',
];

export const STATUS_COLORS = {
  'Received': 'success',
  'Released': 'primary',
  'On Hold': 'warning',
  'Complete': 'secondary',
  'Forwarded': 'info',
  'In Transit': 'warning',
  'Delivered': 'success',
  'Returned': 'secondary',
};

export const FILE_IMPORTANCE_LEVELS = [
  'Routine',
  'Important',
  'Critical',
  'Emergency'
];

// Keep PRIORITIES for backward compatibility but mark as deprecated
export const PRIORITIES = [
  'Routine',
  'Important', 
  'Critical',
  'Emergency'
];

export const FILE_TYPES = [
  'Physical',
  'Digital'
];

export const SEND_METHODS = [
  'courier',
  'email',
  'hand-delivery',
  'internal-mail',
  'fax',
  'digital-transfer'
];

export const FORWARD_STATUSES = [
  'In Transit',
  'Delivered',
  'Returned',
  'Cancelled'
];

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

export const ROUTES = {
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    CREATE: '/admin/create',
    LOGS: '/admin/logs',
    TRACK: '/admin/track',
    USERS: '/admin/users',
    SETTINGS: '/admin/settings'
  },
  EMPLOYEE: {
    DASHBOARD: '/employee/dashboard',
    CREATE: '/employee/create',
    LOGS: '/employee/logs',
    TRACK: '/employee/track',
    SETTINGS: '/employee/settings'
  },
  SHARED: {
    SCANNER: '/scanner',
    BARCODE_PRINT: '/barcode-print',
    SETTINGS: '/settings'
  }
}; 