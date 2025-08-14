# Deployment Guide

## GitHub Setup Instructions

### Method 1: Manual Upload (Recommended for first-time setup)

1. **Prepare the Project**
   - Ensure all files are in the `file_tracker` directory
   - The project is ready for upload as-is

2. **Upload to GitHub**
   - Go to your GitHub repository in a web browser
   - Click "Add file" → "Upload files"
   - Drag and drop the entire `file_tracker` folder contents
   - Add a commit message: "Initial commit: Digital File Tracker"
   - Click "Commit changes"

3. **Verify Upload**
   - Check that all files are uploaded correctly
   - Ensure the README.md displays properly

### Method 2: Using Git (After installing Git)

1. **Initialize Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Digital File Tracker"
   ```

2. **Add Remote Repository**
   ```bash
   git remote add origin <your-github-repo-url>
   git branch -M main
   git push -u origin main
   ```

## Local Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation Steps

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

4. **Access the application**
   - Open browser and go to `http://localhost:5173`
   - Use the demo credentials provided in the application

## Production Deployment

### Build the Application
```bash
npm run build
```

### Deploy Options

#### Option 1: GitHub Pages
1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json scripts:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
3. Deploy: `npm run deploy`

#### Option 2: Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy automatically on push

#### Option 3: Vercel
1. Connect your GitHub repository to Vercel
2. Framework preset: Vite
3. Deploy automatically on push

## Environment Configuration

### Development
- No additional configuration needed
- Uses mock data for demonstration

### Production
- Set up backend API endpoints
- Configure authentication
- Set up database connections
- Update API URLs in the application

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change port in vite.config.js or use `npm run dev -- --port 3001`

2. **Dependencies not found**
   - Delete node_modules and package-lock.json
   - Run `npm install` again

3. **Build errors**
   - Check for syntax errors in JSX files
   - Ensure all imports are correct
   - Verify file paths

### Support
- Check the README.md for detailed project information
- Review the role-based access documentation
- Open issues on GitHub for bugs or feature requests 