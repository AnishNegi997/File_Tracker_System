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
