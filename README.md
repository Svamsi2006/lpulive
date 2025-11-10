# LPU Live - Real-Time Chat Application

## 🎓 Overview
LPU Live is a university-based real-time chat platform that uses **Registration Numbers** instead of phone numbers for identification.

## 🚀 Features
- **Registration Number Authentication**: Username and password are initially the same
- **Change Password**: Users can update their password in settings
- **Real-time Messaging**: Socket.IO powered chat with delivery and read receipts
- **Message Persistence**: All chats and messages stored in database
- **File Uploads**: Send images, documents (PDF, DOC, DOCX), and more
- **Read Receipts**: Blue ticks for read messages, white ticks for delivered
- **Online Status**: See who's online in real-time
- **Typing Indicators**: Know when someone is typing
- **Recent Chats**: All conversations saved and highlighted
- **Orange Theme**: University-branded color scheme
- **Dark Mode**: Toggle between light and dark themes
- **Personal & Group Chats**: Connect with students and groups
- **Announcements**: University-wide updates

## 📋 Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

## ▶️ Running the Application

### Quick Start (Windows):
```bash
powershell -ExecutionPolicy Bypass -File start-servers.ps1
```

### Option 1: Run both servers together
```bash
npm start
```

### Option 2: Run servers separately

Terminal 1 - Backend Server:
```bash
npm run server
```

Terminal 2 - Frontend Development Server:
```bash
npm run dev
```

**Note:** Make sure MongoDB is running if you want persistent storage. If MongoDB is not available, the app will use in-memory storage.

## 🔐 Login Instructions

### First Time Login:
- **Username**: Your Registration Number (e.g., `12306253`)
- **Password**: Same as your Registration Number (e.g., `12306253`)

### Example Credentials:
| Username | Password | Name |
|----------|----------|------|
| 12306253 | 12306253 | Rikhil Taneja |
| 12300581 | 12300581 | Sweety Biju |
| 12309731 | 12309731 | Andrew A |

## 🔧 Change Password

1. Login with your credentials
2. Click the **Settings (⚙️)** icon in the header
3. Select **"Change Password"**
4. Enter:
   - Current Password
   - New Password (min 6 characters)
   - Confirm New Password
5. Click **"Change Password"**

## 🌐 Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Change password (requires token)

### Users
- `GET /api/users/:regNumber` - Get user by registration number (requires token)

## 🎨 Theme
The application uses an **Orange Theme** with:
- Primary: `#ea580c`
- Secondary: `#fb923c`
- Light/Dark mode toggle available

## 📱 Features Walkthrough

1. **Login**: Enter registration number as both username and password
2. **Dashboard**: View university groups, personal chats, and announcements
3. **Start Chat**: Enter another user's registration number to chat
4. **Send Messages**: Real-time messaging with timestamps
5. **Change Password**: Update from default password
6. **Theme Toggle**: Switch between light/dark modes

## 🔒 Security
- JWT-based authentication
- Bcrypt password hashing
- Token-based API protection
- Secure password change functionality

## 📦 Tech Stack
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Real-time**: Socket.IO
- **Auth**: JWT + Bcrypt

## 🐛 Troubleshooting

### Server won't start:
```bash
# Make sure ports 3000 and 5000 are available
# Kill any existing processes on these ports
```

### Login issues:
- Ensure backend server is running
- Check console for error messages
- Verify registration number exists in student_data.json

## 📝 Notes
- All student data is loaded from `student_data.json`
- Passwords are securely hashed
- First-time users must use registration number as password
- Users can change password after first login
