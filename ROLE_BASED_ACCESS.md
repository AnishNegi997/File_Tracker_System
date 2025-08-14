# Role-Based Access Control System

This Digital File Tracker now implements department-based access control where users can only see files related to their department.

## How It Works

### User Roles
- **Regular Users**: Can only see files from their assigned department
- **Administrators**: Can see files from all departments

### Department Access
- HR Department users can only see HR files
- Finance Department users can only see Finance files
- IT Department users can only see IT files
- And so on...

## Testing the System

### Pre-configured Test Users

You can login with these test accounts:

1. **HR User**
   - Email: `alice@company.com`
   - Password: `any password`
   - Department: HR
   - Can see: HR files only

2. **Finance User**
   - Email: `bob@company.com`
   - Password: `any password`
   - Department: Finance
   - Can see: Finance files only

3. **IT User**
   - Email: `charlie@company.com`
   - Password: `any password`
   - Department: IT
   - Can see: IT files only

4. **Administrator**
   - Email: `diana@company.com`
   - Password: `any password`
   - Department: Administration
   - Role: Admin
   - Can see: All files from all departments

5. **Super Administrator**
   - Email: `super@admin.com`
   - Password: `any password`
   - Department: All
   - Role: Super Admin
   - Can see: All files from all departments + System insights

### Testing Steps

1. **Login as HR User**
   - Use `alice@company.com` with any password
   - Navigate to Dashboard - you'll see HR-specific stats
   - Go to Logs - you'll only see HR files
   - Go to Track - you'll only see HR files in the dropdown

2. **Login as Finance User**
   - Use `bob@company.com` with any password
   - Navigate to Dashboard - you'll see Finance-specific stats
   - Go to Logs - you'll only see Finance files
   - Go to Track - you'll only see Finance files in the dropdown

3. **Login as Administrator**
   - Use `diana@company.com` with any password
   - Navigate to Dashboard - you'll see all department stats and department overview
   - Go to Logs - you'll see files from all departments
   - Go to Track - you'll see files from all departments in the dropdown
   - Create File - you can select any department

4. **Login as Super Administrator**
   - Use `super@admin.com` with any password
   - Navigate to Dashboard - you'll see system-wide stats (6 widgets: 4 in first row, 2 in second row), department overview, and system insights
   - Go to Logs - you'll see files from all departments
   - Go to Track - you'll see files from all departments in the dropdown
   - Go to Dept Files - you can view files by department with dropdown filter
   - Create File - you can select any department
   - Additional features: System health monitoring, active users, response time metrics

4. **Create New Account**
   - Go to Signup page
   - Create account with any department
   - Login and verify you only see files from your department

### Features Implemented

✅ **Authentication System**
- Login/Signup with department assignment
- Session persistence using localStorage
- Protected routes

✅ **Department-Based Data Filtering**
- Dashboard shows department-specific statistics
- Logs page shows only department files
- Track page shows only department files
- Create File auto-sets user's department (admin can change)

✅ **Admin Override**
- Administrators can see all departments
- Admin users get special indicators
- Admin can create files for any department

✅ **UI Enhancements**
- Department name shown in page titles
- User info displayed in sidebar
- Admin badge for administrators
- Department-specific placeholders and messages

### Mock Data Available

The system includes mock data for:
- **HR**: 3 files (Leave Application, Salary Revision, Employee Onboarding)
- **Finance**: 3 files (Budget Approval, Expense Reimbursement, Purchase Order)
- **IT**: 3 files (Software License, Hardware Purchase, System Maintenance)
- **Administration**: 2 files (Office Space, Facility Maintenance)
- **Procurement**: 2 files (Vendor Contract, Supplier Evaluation)
- **Legal**: 2 files (Contract Review, Compliance Documentation)

### File Movement Tracking

Some files have movement history that can be viewed in the Track page:
- HR files have movement history
- Finance files have movement history  
- IT files have movement history

## Technical Implementation

- **Context API**: Used for global state management
- **Mock Data Service**: Provides department-filtered data
- **Protected Routes**: Automatic redirect to login if not authenticated
- **Local Storage**: Persists user session
- **Role-based UI**: Different interfaces for users vs admins 
- **Role-based UI**: Different interfaces for users vs admins 