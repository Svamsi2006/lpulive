# LPU Live - Quick Start Guide

## 🚀 Both Servers Are Running!

### Current Status
✅ **Backend Server**: Running on `http://localhost:5000`
✅ **Frontend Server**: Running on `http://localhost:3000` or `http://localhost:3001`
✅ **Authentication**: Working with JWT tokens
✅ **Storage**: Using in-memory storage (MongoDB fallback)

---

## 📝 How to Use

### 1. Login to the Application
1. Open your browser and go to: `http://localhost:3000`
2. You'll see the **LPU Live** login screen with the orange theme
3. Enter your credentials:
   - **Username**: Your registration number (e.g., `12306253`)
   - **Password**: Same as your registration number for first login (e.g., `12306253`)

### 2. Start a Chat
1. After logging in, you'll see the **Sidebar** with your name
2. Click the **"Start New Chat"** button (➕ icon)
3. Enter another student's **registration number** (e.g., `12300581`)
4. Click **"Start Chat"**
5. The chat window will open!

### 3. Send Messages
1. Type your message in the input box at the bottom
2. Press **Enter** or click the **Send** button (paper plane icon)
3. Watch for read receipts:
   - **✓** Single tick = Sent
   - **✓✓** White double tick = Delivered
   - **✓✓** Blue double tick = Read

### 4. Upload Files
1. Click the **📎 attachment icon** in the chat window
2. Select a file (images, PDFs, documents up to 10MB)
3. The file will be uploaded and shared in the chat

### 5. Change Your Password
1. Click the **⚙️ Settings** icon in the header
2. Enter your new password (minimum 6 characters)
3. Click **"Change Password"**
4. From next login, use the new password

---

## 🧪 Test Accounts

Here are some registration numbers you can use for testing:

| Registration Number | Name |
|---------------------|------|
| 12306253 | First test user |
| 12300581 | Second test user |
| 12300001 | Third test user |

*Note: All accounts initially use their registration number as the password*

---

## 🔧 Troubleshooting

### "Invalid token" Error
- **Cause**: Token expired (24-hour validity)
- **Solution**: Logout and login again

### Backend Not Responding
- Check if the backend server window is still open
- Look for the message: "✅ Server running on http://localhost:5000"
- If not running, execute: `node server/server.js`

### Frontend Not Loading
- Check if the frontend server window is still open
- Look for the message showing the local URL
- If not running, execute: `npm run dev`

### Chat Not Opening
- Make sure you enter a valid **registration number**
- The user must exist in the `student_data.json` file
- Both users must be logged in for real-time features

---

## 📂 Project Structure

```
lpulive/
├── server/
│   └── server.js           # Backend API + Socket.IO
├── src/
│   ├── components/
│   │   ├── Login.jsx       # Login screen
│   │   ├── Sidebar.jsx     # Chat list
│   │   ├── ChatWindow.jsx  # Message interface
│   │   └── Header.jsx      # Top navigation
│   └── context/
│       └── SocketContext.jsx # Real-time connection
├── uploads/                 # File storage
├── student_data.json        # User database (8,580 students)
└── start-servers.ps1        # Launch script
```

---

## 🎨 Features Implemented

✅ **Authentication**: JWT-based login with registration numbers
✅ **Real-time Messaging**: Socket.IO for instant delivery
✅ **Read Receipts**: WhatsApp-style tick indicators
✅ **File Uploads**: Share images, PDFs, documents
✅ **Online Status**: See who's online (green dot)
✅ **Typing Indicators**: See when someone is typing
✅ **Message Persistence**: Chats stored in memory
✅ **Password Change**: Update your password anytime
✅ **Orange Theme**: University branding colors
✅ **Responsive Design**: Works on all screen sizes

---

## 🚪 How to Stop Servers

1. Go to the terminal windows (backend and frontend)
2. Press **Ctrl + C** in each window
3. Or simply close the windows

---

## 🎯 Next Steps

1. **Login** with your registration number
2. **Start a chat** with another student
3. **Send messages** and see the read receipts
4. **Upload a file** to test the feature
5. **Open multiple browsers** to test real-time sync

Enjoy using **LPU Live**! 🎓💬
