// Add error handlers at the top
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('📦 Loading dependencies...');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
console.log('✅ Dependencies loaded');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = 5000;
const JWT_SECRET = 'lpu-live-secret-key-2025';

// Try MongoDB Connection, fallback to in-memory storage
let useDatabase = false;

console.log('🔌 Attempting MongoDB connection...');
mongoose.connect('mongodb://localhost:27017/lpulive', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 3000
}).then(() => {
  console.log('📦 Connected to MongoDB');
  useDatabase = true;
}).catch((err) => {
  console.log('⚠️  MongoDB not available:', err.message);
  console.log('📝 Using in-memory storage');
  useDatabase = false;
});

console.log('🏗️  Defining MongoDB Schemas...');
// MongoDB Schemas
const ChatSchema = new mongoose.Schema({
  participants: [String], // Array of registration numbers
  lastMessage: {
    text: String,
    sender: String,
    timestamp: Date,
    fileUrl: String,
    fileName: String,
    fileType: String
  },
  updatedAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  chatId: String,
  sender: String,
  receiver: String,
  text: String,
  fileUrl: String,
  fileName: String,
  fileType: String,
  timestamp: { type: Date, default: Date.now },
  delivered: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  readAt: Date
});

console.log('📋 Creating mongoose models...');
const Chat = mongoose.model('Chat', ChatSchema);
const Message = mongoose.model('Message', MessageSchema);
console.log('✅ Models created');

// In-memory storage as fallback
const inMemoryChats = new Map();
const inMemoryMessages = new Map();

console.log('📁 Configuring file upload...');
// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|mp4|mp3/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Invalid file type!');
    }
  }
});

console.log('⚙️  Setting up middleware...');
// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
console.log('✅ Middleware configured');

console.log('📚 Loading student data...');
// Load student data
const studentsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../student_data.json'), 'utf-8')
);
console.log(`✅ Loaded ${studentsData.length} students`);

// In-memory user credentials storage (in production, use a database)
const userCredentials = new Map();

console.log('🔐 Initializing user credentials...');
// Initialize credentials for all students (username = password = registration number)
// Note: We'll hash passwords on-demand to avoid startup memory issues
studentsData.forEach(student => {
  const regNumber = student['Registration Number'];
  userCredentials.set(regNumber, {
    username: regNumber,
    password: regNumber, // Store plaintext, will hash on first login
    hasChangedPassword: false
  });
});
console.log(`✅ Initialized credentials for ${userCredentials.size} users`);

console.log('🛡️  Setting up authentication middleware...');
// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    res.status(403).json({ error: 'Invalid token. Please login again.' });
  }
};

// Routes

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if user exists in credentials
    const userCred = userCredentials.get(username);
    if (!userCred) {
      return res.status(404).json({ error: 'Registration number not found. Please check and try again.' });
    }

    // Verify password (handle both hashed and plaintext for migration)
    let validPassword = false;
    if (userCred.password.startsWith('$2')) {
      // Already hashed
      validPassword = await bcrypt.compare(password, userCred.password);
    } else {
      // Plaintext - check and hash it
      if (password === userCred.password) {
        validPassword = true;
        // Hash it for next time
        userCred.password = await bcrypt.hash(password, 10);
        userCredentials.set(username, userCred);
      }
    }
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password. Please try again.' });
    }

    // Find user data
    const userData = studentsData.find(
      student => student['Registration Number'] === username
    );

    if (!userData) {
      return res.status(404).json({ error: 'User data not found' });
    }

    // Create token
    const token = jwt.sign(
      { username: username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Prepare user object
    const user = {
      registrationNumber: userData['Registration Number'],
      name: userData.Name,
      fatherName: userData["Father's Name"],
      branch: userData.Branch,
      gender: userData.Gender,
      state: userData.State,
      hasChangedPassword: userCred.hasChangedPassword
    };

    res.json({
      success: true,
      token,
      user
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Change password endpoint
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const username = req.user.username;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const userCred = userCredentials.get(username);
    if (!userCred) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, userCred.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    userCredentials.set(username, {
      ...userCred,
      password: hashedPassword,
      hasChangedPassword: true
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error during password change' });
  }
});

// Get user by registration number
app.get('/api/users/:regNumber', authenticateToken, (req, res) => {
  try {
    const { regNumber } = req.params;

    const userData = studentsData.find(
      student => student['Registration Number'] === regNumber
    );

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = {
      registrationNumber: userData['Registration Number'],
      name: userData.Name,
      fatherName: userData["Father's Name"],
      branch: userData.Branch,
      gender: userData.Gender,
      state: userData.State,
    };

    res.json(user);

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get or create chat between two users
app.post('/api/chats/create', authenticateToken, async (req, res) => {
  try {
    const { participant } = req.body;
    const currentUser = req.user.username;

    if (!participant) {
      return res.status(400).json({ error: 'Participant required' });
    }

    const participants = [currentUser, participant].sort();
    const chatId = participants.join('_');

    let chat = await Chat.findOne({ participants });

    if (!chat) {
      chat = new Chat({
        participants,
        _id: chatId
      });
      await chat.save();
    }

    res.json({ chatId, participants });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all chats for a user
app.get('/api/chats', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;

    const chats = await Chat.find({
      participants: username
    }).sort({ updatedAt: -1 });

    // Populate chat details with user info
    const chatsWithDetails = await Promise.all(chats.map(async (chat) => {
      const otherUser = chat.participants.find(p => p !== username);
      const userData = studentsData.find(
        student => student['Registration Number'] === otherUser
      );

      // Get unread count
      const unreadCount = await Message.countDocuments({
        chatId: chat._id,
        receiver: username,
        read: false
      });

      return {
        chatId: chat._id,
        participant: otherUser,
        participantData: userData ? {
          registrationNumber: userData['Registration Number'],
          name: userData.Name,
          branch: userData.Branch,
          gender: userData.Gender,
          state: userData.State,
        } : null,
        lastMessage: chat.lastMessage,
        unreadCount,
        updatedAt: chat.updatedAt
      };
    }));

    res.json(chatsWithDetails);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages for a chat
app.get('/api/messages/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const username = req.user.username;

    const messages = await Message.find({ chatId }).sort({ timestamp: 1 });

    // Mark messages as delivered
    await Message.updateMany(
      { chatId, receiver: username, delivered: false },
      { delivered: true }
    );

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message
app.post('/api/messages/send', authenticateToken, async (req, res) => {
  try {
    const { chatId, receiver, text } = req.body;
    const sender = req.user.username;

    const message = new Message({
      chatId,
      sender,
      receiver,
      text,
      timestamp: new Date()
    });

    await message.save();

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: {
        text,
        sender,
        timestamp: message.timestamp
      },
      updatedAt: new Date()
    });

    // Emit via socket
    const recipientSocketId = activeUsers.get(receiver);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive-message', message);
    }

    res.json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload file and send message
app.post('/api/messages/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { chatId, receiver } = req.body;
    const sender = req.user.username;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileName = req.file.originalname;
    const fileType = req.file.mimetype;

    const message = new Message({
      chatId,
      sender,
      receiver,
      text: '',
      fileUrl,
      fileName,
      fileType,
      timestamp: new Date()
    });

    await message.save();

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: {
        text: `📎 ${fileName}`,
        sender,
        timestamp: message.timestamp,
        fileUrl,
        fileName,
        fileType
      },
      updatedAt: new Date()
    });

    // Emit via socket
    const recipientSocketId = activeUsers.get(receiver);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive-message', message);
    }

    res.json(message);
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark messages as read
app.post('/api/messages/read', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.body;
    const username = req.user.username;

    const result = await Message.updateMany(
      { chatId, receiver: username, read: false },
      { read: true, readAt: new Date() }
    );

    // Notify sender via socket
    const messages = await Message.find({ chatId, receiver: username });
    messages.forEach(msg => {
      const senderSocketId = activeUsers.get(msg.sender);
      if (senderSocketId) {
        io.to(senderSocketId).emit('messages-read', { chatId, messageIds: [msg._id] });
      }
    });

    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Socket.IO for real-time messaging
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  socket.on('user-online', (username) => {
    activeUsers.set(username, socket.id);
    console.log('✅ User online:', username);
    io.emit('user-status', { username, status: 'online' });
  });

  socket.on('send-message', async (data) => {
    try {
      const { chatId, to, message } = data;
      const recipientSocketId = activeUsers.get(to);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive-message', message);
        
        // Mark as delivered
        if (message._id) {
          await Message.findByIdAndUpdate(message._id, { delivered: true });
        }
      }
      
      // Send confirmation to sender
      socket.emit('message-sent', message);
    } catch (error) {
      console.error('Send message error:', error);
    }
  });

  socket.on('typing', (data) => {
    const { to, isTyping } = data;
    const recipientSocketId = activeUsers.get(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('user-typing', data);
    }
  });

  socket.on('message-read', async (data) => {
    try {
      const { chatId, messageId, reader } = data;
      
      if (messageId) {
        await Message.findByIdAndUpdate(messageId, { 
          read: true, 
          readAt: new Date() 
        });
      }

      // Notify sender
      const message = await Message.findById(messageId);
      if (message) {
        const senderSocketId = activeUsers.get(message.sender);
        if (senderSocketId) {
          io.to(senderSocketId).emit('message-read-receipt', { 
            messageId, 
            chatId,
            readAt: new Date() 
          });
        }
      }
    } catch (error) {
      console.error('Message read error:', error);
    }
  });

  socket.on('disconnect', () => {
    let disconnectedUser = null;
    activeUsers.forEach((socketId, username) => {
      if (socketId === socket.id) {
        disconnectedUser = username;
        activeUsers.delete(username);
      }
    });
    
    if (disconnectedUser) {
      console.log('❌ User offline:', disconnectedUser);
      io.emit('user-status', { username: disconnectedUser, status: 'offline' });
    }
    
    console.log('👤 User disconnected:', socket.id);
  });
});

console.log(`🚀 Starting server on port ${PORT}...`);
// Start server
try {
  server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO server ready`);
    console.log(`👥 ${studentsData.length} students loaded`);
    console.log(`🎯 Ready to accept connections`);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  console.error(error.stack);
  process.exit(1);
}
