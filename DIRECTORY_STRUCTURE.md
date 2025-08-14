# Directory Structure - Role-Based Organization

The application now follows a role-based directory structure where admin and employee pages are separated for better organization and security.

## 📁 Directory Structure

```
fileTracker/
├── src/
│   ├── components/
│   │   ├── AdminSidebar.jsx          # Admin-specific navigation
│   │   ├── EmployeeSidebar.jsx       # Employee-specific navigation
│   │   ├── Sidebar.jsx               # Legacy sidebar (can be removed)
│   │   └── Barcode.jsx               # Shared barcode component
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx           # Authentication and role management
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx             # Unified dashboard for all roles
│   │   ├── CreateFile.jsx            # File creation with role-based access
│   │   ├── Logs.jsx                  # File logs with role-based filtering
│   │   ├── Track.jsx                 # File tracking with role-based access
│   │   │
│   │   ├── Login.jsx                 # Shared authentication
│   │   ├── Signup.jsx                # Shared registration
│   │   ├── BarcodeScanner.jsx        # Shared barcode scanning
│   │   ├── BarcodePrint.jsx          # Shared barcode printing
│   │   └── Settings.jsx              # Shared settings
│   │
│   ├── services/
│   │   └── dataService.js            # Mock data with role-based filtering
│   │
│   └── App.jsx                       # Main app with role-based routing
```

## 🔐 Role-Based Access Control

### Admin Users (`role: 'admin'`)
- **Access**: All departments and files
- **Navigation**: `/admin/*` routes
- **Sidebar**: AdminSidebar with admin-specific options
- **Features**:
  - View all department statistics
  - Create files for any department
  - See logs from all departments
  - Track files from all departments
  - User management (placeholder)
  - System settings (placeholder)

### Employee Users (`role: 'user'`)
- **Access**: Only their assigned department
- **Navigation**: `/employee/*` routes
- **Sidebar**: EmployeeSidebar with department-specific options
- **Features**:
  - View department-specific statistics
  - Create files only for their department
  - See logs only from their department
  - Track files only from their department

## 🛣️ Routing Structure

### Unified Routes
```
/dashboard          → Dashboard (role-based content)
/create             → CreateFile (role-based access)
/logs               → Logs (role-based filtering)
/track              → Track (role-based access)
```

### Shared Routes
```
/scanner           → BarcodeScanner (both roles)
/barcode-print     → BarcodePrint (both roles)
/settings          → Settings (both roles)
```

## 🔄 Automatic Redirects

- **Root (`/`)**: Redirects to appropriate dashboard based on role
- **Legacy routes**: Automatically redirect to role-appropriate pages
- **Unauthorized access**: Redirects to appropriate dashboard

## 🎨 UI Differences

### Admin Interface
- Crown icon (👑) in sidebar
- "Administrator" badge
- "Full System Access" indicator
- Department filter dropdowns
- All-department statistics
- Admin-specific navigation items

### Employee Interface
- User icon (👤) in sidebar
- Department name display
- "Department Access" indicator
- Department-specific data only
- Simplified navigation

## 🧪 Testing the Structure

### Test Admin User
```
Email: diana@company.com
Password: any password
Role: admin
Access: All departments
```

### Test Employee Users
```
HR: alice@company.com
Finance: bob@company.com  
IT: charlie@company.com
Role: user
Access: Department-specific only
```

## 🔧 Benefits of This Structure

1. **Clear Separation**: Admin and employee functionality are clearly separated
2. **Security**: Role-based access control at the routing level
3. **Maintainability**: Easy to add new admin or employee features
4. **Scalability**: Can easily add more roles (manager, supervisor, etc.)
5. **User Experience**: Different interfaces optimized for each role
6. **Code Organization**: Related functionality grouped together

## 🚀 Future Enhancements

- Add manager role with department oversight
- Create department-specific admin roles
- Add audit logging for admin actions
- Implement user management pages
- Add system administration features 