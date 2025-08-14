# Digital File Tracker

A comprehensive role-based digital file tracking system built with React and Vite. This application provides secure file management with distinct user roles and department-based access control.

## Features

### Role-Based Access Control
- **Super Admin**: Full system access, user management, and file oversight
- **Department Admin**: Department-specific file management and user administration
- **Employee**: File creation, sending, and receiving within assigned permissions

### Core Functionality
- 📁 **File Management**: Create, send, receive, and track files
- 👥 **User Management**: Add, edit, and manage employees with role assignments
- 🏢 **Department Management**: Organize users and files by departments
- 📊 **Dashboard**: Role-specific overviews and analytics
- 🔍 **File Tracking**: Search and track file movement with detailed timelines
- 📋 **Audit Logs**: Comprehensive activity tracking and reporting

### Key Pages
- **Dashboard**: Role-specific overview and quick actions
- **My Files**: Personal file management with sorting and filtering
- **Received Files**: Incoming files with forwarding capabilities
- **Sent Files**: Outgoing files with status tracking
- **All Files**: Admin-only comprehensive file view
- **User Management**: Employee administration (Admin/Super Admin)
- **Track**: File search and movement tracking
- **Create File**: New file creation with barcode generation

## Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Bootstrap 5 + Bootstrap Icons
- **Routing**: React Router DOM
- **Barcode**: JSBarcode for file identification
- **Build Tool**: Vite for fast development and building

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd file_tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
file_tracker/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── context/       # React context providers
│   └── App.jsx        # Main application component
├── public/            # Static assets
├── backend/           # Backend API (to be implemented)
└── docs/             # Documentation files
```

## Role-Based Features

### Super Admin
- Full system access
- User and department management
- View all files across departments
- System configuration and settings

### Department Admin
- Manage department users
- View department-specific files
- File approval and routing
- Department analytics

### Employee
- Create and send files
- Receive and forward files
- Track personal file history
- Update profile information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.
