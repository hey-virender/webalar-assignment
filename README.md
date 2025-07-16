# 🚀 Webalar - Real-time Collaborative Task Management System

A sophisticated task management application with **real-time collaboration** and **intelligent conflict resolution**, built with modern web technologies.

![Project Status](https://img.shields.io/badge/status-active-brightgreen.svg)
![Node.js](https://img.shields.io/badge/node.js-v18+-blue.svg)
![React](https://img.shields.io/badge/react-v19+-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)


[Deployed Link](https://webalar-assignment-six.vercel.app) | [Video Link](https://drive.google.com/file/d/1icqEpDTUlfaxZQYPOso59sHwOWfWi_FM/view?usp=drive_link)

**While checking deployed version there can be a slight delay in loading task, logs or signing in so please be patient. This is due to render auto shutdown feature due to long inactivity**

### Logic_Document.md is present in the repository

## ✨ Key Features

### 🔄 **Real-time Collaboration**

- **Live Updates**: See task changes instantly across all connected users
- **Active Editor Tracking**: Know who's currently editing which tasks
- **WebSocket Communication**: Powered by Socket.IO for real-time synchronization
- **Session Management**: Smart editing session handling with automatic cleanup

### ⚠️ **Advanced Conflict Resolution** (Main Feature)

Our intelligent conflict detection system prevents data loss when multiple users edit the same task:

- **Version-based Conflict Detection**: Each task has a version number that increments with every change
- **Intelligent Analysis**: Compares current task state vs. proposed changes field-by-field
- **Multiple Resolution Options**:
  - **Keep My Changes**: Overwrite with your modifications
  - **Discard My Changes**: Keep the latest version from other users
  - **Field-level Details**: View exactly what conflicts exist between versions
- **Real-time Notifications**: Instant conflict alerts with detailed comparison views
- **Seamless Recovery**: No data loss - all changes are preserved until resolution

### 📋 **Comprehensive Task Management**

- **Complete CRUD Operations**: Create, read, update, and delete tasks
- **Status Tracking**: Todo → In Progress → Completed workflow
- **Priority Management**: Low, Medium, High priority levels
- **Smart Assignment**: Automatic load balancing algorithm for fair task distribution
- **Drag & Drop Interface**: Intuitive task status changes via drag and drop
- **Rich Task Details**: Title, description, assignee, priority, and timestamps

### 🔐 **Secure Authentication System**

- **JWT-based Authentication**: Secure token-based auth with HTTP-only cookies
- **Session Management**: Automatic token refresh and session persistence
- **Protected Routes**: Role-based access control throughout the application
- **Secure Logout**: Complete session cleanup with socket disconnection

### 📊 **Audit Trail & Activity Logging**

- **Complete Task History**: Every change is logged with timestamps and user details
- **Activity Tracking**: Monitor user actions across the system
- **Change Snapshots**: Before/after state tracking for all modifications
- **Smart Assignment Logs**: Track both manual and automatic task assignments

### 🎨 **Modern User Experience**

- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Notifications**: Instant feedback for all user actions
- **Loading States**: Smooth UX with proper loading indicators
- **Error Handling**: Comprehensive error management with user-friendly messages
- **Modern UI Components**: Clean, accessible interface built with CSS modules

## 🛠️ Technology Stack

### Backend

- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO for WebSocket communication
- **Authentication**: JWT with bcrypt password hashing
- **Session**: HTTP-only cookies with CORS support

### Frontend

- **Framework**: React 19 with modern hooks
- **Build Tool**: Vite for fast development and building
- **State Management**: Zustand with persistence
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router v7
- **Styling**: CSS Modules for component-scoped styles
- **Icons**: Lucide React icon library

## 🚀 Quick Start Guide

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download here](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **npm** or **yarn** (comes with Node.js)

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd webalar
```

### 2. Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Environment Configuration

Create a `.env.local` file in the `backend` directory with the following variables:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/webalar
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/webalar

# Server Configuration



# JWT Security
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Cookie Configuration (Optional)
COOKIE_SECURE=false
COOKIE_DOMAIN=localhost
```

#### Start the Backend Server

```bash
npm start
```

The backend server will start on `http://localhost:5000`

### 3. Frontend Setup

#### Install Dependencies

```bash
cd ../frontend
npm install
```

#### Environment Configuration

Create a `.env` file in the `frontend` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_FRONTEND_URL=http://localhost:5173
```

#### Start the Frontend Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🔧 Detailed Configuration

### MongoDB Setup Options

#### Option 1: Local MongoDB

1. Install MongoDB Community Edition
2. Start MongoDB service:

   ```bash
   # On macOS
   brew services start mongodb-community

   # On Ubuntu
   sudo systemctl start mongod

   # On Windows
   net start MongoDB
   ```

3. Use connection string: `mongodb://localhost:27017/webalar`

#### Option 2: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create database user and get connection string
4. Whitelist your IP address
5. Use connection string: `mongodb+srv://username:password@cluster.mongodb.net/webalar`

### Production Environment Variables

For production deployment, update your environment variables:

```env
# Backend (.env.local)
NODE_ENV=production
MONGO_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret-very-long-and-random
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com


# Frontend (.env.production)
VITE_API_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
VITE_FRONTEND_URL=https://your-frontend-domain.com
```

## 🎯 How to Use

### 1. **User Registration & Login**

- Navigate to `/register` to create a new account
- Use `/login` to access your account
- Passwords are securely hashed using bcrypt

### 2. **Creating Tasks**

- Click "Create Task" from the dashboard
- Fill in title, description, priority, and optionally assign to a user
- Tasks are immediately visible to all connected users

### 3. **Managing Tasks**

- **Status Updates**: Drag tasks between columns (Todo, In Progress, Completed)
- **Edit Tasks**: Click on any task to modify details
- **Smart Assignment**: Use the "Smart Assign" feature for automatic load balancing
- **Delete Tasks**: Remove tasks with confirmation prompts

### 4. **Real-time Collaboration**

- Multiple users can work simultaneously
- See who's currently editing tasks in real-time
- Receive instant notifications when tasks are updated

### 5. **Handling Conflicts**

When conflicts occur during simultaneous editing:

1. **Conflict Detection**: System automatically detects version mismatches
2. **Conflict Notification**: Clear alert showing conflicting changes
3. **Resolution Options**: Choose to keep your changes, discard them, or view detailed differences
4. **Safe Resolution**: No data is lost during conflict resolution

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Task Endpoints

- `GET /api/task` - Get all tasks
- `GET /api/task/:id` - Get specific task
- `POST /api/task` - Create new task
- `PUT /api/task/:id` - Update task
- `DELETE /api/task/:id` - Delete task
- `PATCH /api/task/:id/smart-assign` - Smart assignment

### User Endpoints

- `GET /api/user` - Get all users

### Logging Endpoints

- `GET /api/logs/:taskId` - Get task history
- `GET /api/logs/user/:userId` - Get user activity

### WebSocket Events

- `startEditingTask` - Begin editing session
- `endEditingTask` - End editing session
- `updateTaskWithConflictCheck` - Update with conflict detection
- `resolveConflict` - Resolve detected conflicts

## 🔍 Troubleshooting

### Common Issues

#### Backend won't start

- ✅ Check MongoDB connection
- ✅ Verify `.env.local` file exists and has correct values
- ✅ Ensure port 5000 is not in use

#### Frontend can't connect to backend

- ✅ Verify backend is running on port 5000
- ✅ Check CORS configuration
- ✅ Confirm `.env` file has correct API URLs

#### WebSocket connection issues

- ✅ Check firewall settings
- ✅ Verify Socket.IO URLs in environment variables
- ✅ Ensure cookies are enabled in browser

#### Conflict resolution not working

- ✅ Confirm WebSocket connection is active
- ✅ Check browser console for JavaScript errors
- ✅ Verify task versioning in database

### Logs and Debugging

#### Backend Logs

```bash
cd backend
npm start
# Watch for connection logs and error messages
```

#### Frontend Debugging

- Open browser developer tools
- Check Console tab for errors
- Monitor Network tab for API calls
- Verify WebSocket connection in Network tab

## 🚀 Deployment Guide

### Backend Deployment (Node.js hosting)

1. Choose a hosting platform (Heroku, Railway, DigitalOcean, etc.)
2. Set environment variables in hosting platform
3. Deploy with build command: `npm install`
4. Start command: `node server.js`

### Frontend Deployment (Static hosting)

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy `dist` folder to static hosting (Vercel, Netlify, etc.)
3. Configure environment variables in hosting platform

### Database Deployment

- Use MongoDB Atlas for cloud database
- Or deploy MongoDB on VPS/cloud server
- Update MONGO_URI in production environment

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Add comments for complex logic, especially in conflict resolution
- Test real-time features with multiple browser tabs
- Ensure conflict scenarios are properly handled

## 📝 License

This project is licensed under the ISC License - see the package.json files for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed information:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node.js version, browser)
   - Error messages and logs

---

## 🌟 Special Features Spotlight

### **Conflict Resolution System**

This is the standout feature of Webalar. Unlike basic task management tools, our system:

- Prevents data loss during simultaneous edits
- Provides intelligent conflict analysis
- Offers multiple resolution strategies
- Maintains complete audit trails of all changes

### **Real-time Collaboration**

Experience seamless teamwork with:

- Instant task updates across all connected devices
- Live indicators of who's editing what
- Real-time notifications and alerts

### **Smart Assignment Algorithm**

Our load-balancing algorithm automatically:

- Analyzes current task distribution
- Assigns tasks to users with the lightest workload
- Considers both active and pending tasks

---

**Happy Task Managing! 🎉**
