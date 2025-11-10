// Simple CSV-based Backend for LPU Live
// No MongoDB, No Complex Database - Just Simple CSV Files!

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

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

// File paths
const DATA_DIR = path.join(__dirname, '../data');
const CHATS_FILE = path.join(DATA_DIR, 'chats.csv');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.csv');
const USERS_FILE = path.join(DATA_DIR, 'users.csv');
const GROUPS_FILE = path.join(DATA_DIR, 'groups.csv');
const UNIVERSITY_GROUPS_FILE = path.join(DATA_DIR, 'university_groups.csv');
const ANNOUNCEMENTS_FILE = path.join(DATA_DIR, 'announcements.csv');

// Admin configuration
const ADMIN_REG_NUMBER = '12309972';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log('📦 Loading dependencies...');
console.log('✅ Dependencies loaded');

// Helper: Read CSV file
function readCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  if (lines.length <= 1) return [];
  
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
}

// Helper: Write CSV file
function writeCSV(filePath, headers, data) {
  const rows = [headers.join(',')];
  data.forEach(item => {
    const values = headers.map(h => (item[h] || '').toString().replace(/,/g, ';'));
    rows.push(values.join(','));
  });
  fs.writeFileSync(filePath, rows.join('\n'));
}

// Helper: Append to CSV
function appendToCSV(filePath, headers, item) {
  const values = headers.map(h => (item[h] || '').toString().replace(/,/g, ';'));
  fs.appendFileSync(filePath, '\n' + values.join(','));
}

// Middleware
console.log('⚙️  Setting up middleware...');
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
console.log('✅ Middleware configured');

// Load student data
console.log('📚 Loading student data...');
const studentsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../student_data.json'), 'utf-8')
);
console.log(`✅ Loaded ${studentsData.length} students`);

// Initialize users CSV if empty
const existingUsers = readCSV(USERS_FILE);
if (existingUsers.length === 0) {
  console.log('🔐 Initializing user credentials...');
  const userHeaders = ['regNumber', 'password', 'hasChangedPassword', 'lastSeen'];
  const userData = studentsData.map(student => ({
    regNumber: student['Registration Number'],
    password: student['Registration Number'], // Plain text initially
    hasChangedPassword: 'false',
    lastSeen: ''
  }));
  writeCSV(USERS_FILE, userHeaders, userData);
  console.log(`✅ Initialized ${userData.length} users`);
}

// File upload configuration
console.log('📁 Configuring file upload...');
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

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|mp4|mp3/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Invalid file type!');
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

// Authentication middleware
console.log('🛡️  Setting up authentication...');
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired. Please login again.' });
      }
      return res.status(403).json({ error: 'Invalid token.' });
    }
    req.user = user;
    next();
  });
};

// ============================================
// ROUTES
// ============================================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Read users from CSV
    const users = readCSV(USERS_FILE);
    const user = users.find(u => u.regNumber === username);

    if (!user) {
      return res.status(404).json({ error: 'Registration number not found.' });
    }

    // Check password
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid password.' });
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

    res.json({
      success: true,
      token,
      user: {
        regNumber: username,
        name: userData['Name'],
        fatherName: userData["Father's Name"],
        branch: userData['Branch'],
        gender: userData['Gender'],
        state: userData['State'],
        hasChangedPassword: user.hasChangedPassword === 'true'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change Password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const username = req.user.username;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Update user in CSV
    const users = readCSV(USERS_FILE);
    const userIndex = users.findIndex(u => u.regNumber === username);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users[userIndex].password = newPassword;
    users[userIndex].hasChangedPassword = 'true';

    const headers = ['regNumber', 'password', 'hasChangedPassword', 'lastSeen'];
    writeCSV(USERS_FILE, headers, users);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
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

    res.json({
      regNumber: userData['Registration Number'],
      name: userData['Name'],
      fatherName: userData["Father's Name"],
      branch: userData['Branch'],
      gender: userData['Gender'],
      state: userData['State']
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or get chat
app.post('/api/chats/create', authenticateToken, (req, res) => {
  try {
    const { participants } = req.body;
    const currentUser = req.user.username;

    if (!participants || participants.length !== 2) {
      return res.status(400).json({ error: 'Two participants required' });
    }

    // Read existing chats
    const chats = readCSV(CHATS_FILE);
    
    // Check if chat already exists
    const existingChat = chats.find(chat => 
      (chat.participant1 === participants[0] && chat.participant2 === participants[1]) ||
      (chat.participant1 === participants[1] && chat.participant2 === participants[0])
    );

    if (existingChat) {
      return res.json({ chatId: existingChat.chatId });
    }

    // Create new chat
    const chatId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const newChat = {
      chatId,
      participant1: participants[0],
      participant2: participants[1],
      lastMessage: '',
      lastSender: '',
      lastTimestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const headers = ['chatId', 'participant1', 'participant2', 'lastMessage', 'lastSender', 'lastTimestamp', 'updatedAt'];
    appendToCSV(CHATS_FILE, headers, newChat);

    res.json({ chatId });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's chats
app.get('/api/chats', authenticateToken, (req, res) => {
  try {
    const currentUser = req.user.username;
    const chats = readCSV(CHATS_FILE);

    const userChats = chats
      .filter(chat => 
        chat.participant1 === currentUser || chat.participant2 === currentUser
      )
      .map(chat => {
        const otherUser = chat.participant1 === currentUser ? chat.participant2 : chat.participant1;
        const otherUserData = studentsData.find(s => s['Registration Number'] === otherUser);
        
        // Get sender's name for last message
        const lastSenderData = studentsData.find(s => s['Registration Number'] === chat.lastSender);
        const lastSenderName = lastSenderData ? lastSenderData['Name'] : chat.lastSender;

        // Count unread messages
        const messages = readCSV(MESSAGES_FILE);
        const unreadCount = messages.filter(m => 
          m.chatId === chat.chatId && 
          m.receiver === currentUser && 
          m.read === 'false'
        ).length;

        return {
          _id: chat.chatId,
          chatId: chat.chatId,
          participant: otherUser,
          participants: [chat.participant1, chat.participant2],
          participantData: {
            regNumber: otherUser,
            registrationNumber: otherUser,
            name: otherUserData ? otherUserData['Name'] : 'Unknown User',
            branch: otherUserData ? otherUserData['Branch'] : ''
          },
          otherUser: {
            regNumber: otherUser,
            name: otherUserData ? otherUserData['Name'] : 'Unknown User',
            branch: otherUserData ? otherUserData['Branch'] : ''
          },
          lastMessage: {
            text: chat.lastMessage,
            senderName: lastSenderName,
            sender: chat.lastSender,
            timestamp: chat.lastTimestamp
          },
          unreadCount,
          updatedAt: chat.updatedAt
        };
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json(userChats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages for a chat
app.get('/api/messages/:chatId', authenticateToken, (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = readCSV(MESSAGES_FILE);

    const chatMessages = messages
      .filter(m => m.chatId === chatId)
      .map(m => ({
        _id: m.messageId,
        chatId: m.chatId,
        sender: m.sender,
        receiver: m.receiver,
        text: m.text,
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        fileType: m.fileType,
        timestamp: m.timestamp,
        delivered: m.delivered === 'true',
        read: m.read === 'true',
        readAt: m.readAt
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json(chatMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message
app.post('/api/messages', authenticateToken, (req, res) => {
  try {
    const { chatId, receiver, text, fileUrl, fileName, fileType } = req.body;
    const sender = req.user.username;

    const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();

    const newMessage = {
      messageId,
      chatId,
      sender,
      receiver,
      text: text || '',
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileType: fileType || '',
      timestamp,
      delivered: 'false',
      read: 'false',
      readAt: ''
    };

    const messageHeaders = ['messageId', 'chatId', 'sender', 'receiver', 'text', 'fileUrl', 'fileName', 'fileType', 'timestamp', 'delivered', 'read', 'readAt'];
    appendToCSV(MESSAGES_FILE, messageHeaders, newMessage);

    // Update chat's last message
    const chats = readCSV(CHATS_FILE);
    const chatIndex = chats.findIndex(c => c.chatId === chatId);
    if (chatIndex !== -1) {
      chats[chatIndex].lastMessage = text || fileName || 'File';
      chats[chatIndex].lastSender = sender;
      chats[chatIndex].lastTimestamp = timestamp;
      chats[chatIndex].updatedAt = timestamp;

      const chatHeaders = ['chatId', 'participant1', 'participant2', 'lastMessage', 'lastSender', 'lastTimestamp', 'updatedAt'];
      writeCSV(CHATS_FILE, chatHeaders, chats);
    }

    // Emit via Socket.IO
    io.to(receiver).emit('receive-message', {
      ...newMessage,
      _id: messageId,
      delivered: false,
      read: false
    });

    res.json({
      _id: messageId,
      ...newMessage,
      delivered: false,
      read: false
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark message as delivered
app.post('/api/messages/:messageId/delivered', authenticateToken, (req, res) => {
  try {
    const { messageId } = req.params;
    const messages = readCSV(MESSAGES_FILE);
    const messageIndex = messages.findIndex(m => m.messageId === messageId);

    if (messageIndex !== -1) {
      messages[messageIndex].delivered = 'true';
      const headers = ['messageId', 'chatId', 'sender', 'receiver', 'text', 'fileUrl', 'fileName', 'fileType', 'timestamp', 'delivered', 'read', 'readAt'];
      writeCSV(MESSAGES_FILE, headers, messages);

      // Emit to sender
      io.to(messages[messageIndex].sender).emit('message-delivered', { messageId });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mark delivered error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark message as read
app.post('/api/messages/:messageId/read', authenticateToken, (req, res) => {
  try {
    const { messageId } = req.params;
    const messages = readCSV(MESSAGES_FILE);
    const messageIndex = messages.findIndex(m => m.messageId === messageId);

    if (messageIndex !== -1) {
      messages[messageIndex].read = 'true';
      messages[messageIndex].readAt = new Date().toISOString();
      const headers = ['messageId', 'chatId', 'sender', 'receiver', 'text', 'fileUrl', 'fileName', 'fileType', 'timestamp', 'delivered', 'read', 'readAt'];
      writeCSV(MESSAGES_FILE, headers, messages);

      // Emit to sender
      io.to(messages[messageIndex].sender).emit('message-read', { messageId });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload file
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// ============================================
// GROUP ROUTES
// ============================================

// Create a new group
app.post('/api/groups/create', authenticateToken, (req, res) => {
  try {
    const { groupName, members } = req.body;
    const createdBy = req.user.regNumber;

    if (!groupName || !members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Group name and members are required' });
    }

    // Add creator to members if not already included
    const allMembers = [...new Set([createdBy, ...members])];

    // Generate group ID
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

    // Read existing groups
    const groups = readCSV(GROUPS_FILE);

    // Create new group
    const newGroup = {
      groupId,
      groupName,
      createdBy,
      members: allMembers.join('|'), // Use | as separator
      createdAt,
      lastMessage: '',
      lastSender: '',
      lastTimestamp: ''
    };

    // Initialize CSV if empty
    if (groups.length === 0) {
      const headers = ['groupId', 'groupName', 'createdBy', 'members', 'createdAt', 'lastMessage', 'lastSender', 'lastTimestamp'];
      writeCSV(GROUPS_FILE, headers, [newGroup]);
    } else {
      const headers = ['groupId', 'groupName', 'createdBy', 'members', 'createdAt', 'lastMessage', 'lastSender', 'lastTimestamp'];
      appendToCSV(GROUPS_FILE, headers, newGroup);
    }

    console.log('✅ Group created:', groupId);
    res.json({ groupId, ...newGroup, members: allMembers });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get all groups for a user
app.get('/api/groups', authenticateToken, (req, res) => {
  try {
    const regNumber = req.user.regNumber;
    const groups = readCSV(GROUPS_FILE);

    // Filter groups where user is a member
    const userGroups = groups.filter(group => {
      const members = group.members.split('|');
      return members.includes(regNumber);
    });

    // Enhance groups with member details
    const enhancedGroups = userGroups.map(group => {
      const memberIds = group.members.split('|');
      const memberDetails = memberIds.map(memberId => {
        const memberData = studentsData.find(
          student => student['Registration Number'] === memberId
        );
        return {
          regNumber: memberId,
          name: memberData ? memberData['Name'] : 'Unknown User'
        };
      });

      return {
        ...group,
        members: memberIds,
        memberDetails,
        isGroup: true
      };
    });

    res.json(enhancedGroups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get group details
app.get('/api/groups/:groupId', authenticateToken, (req, res) => {
  try {
    const { groupId } = req.params;
    const regNumber = req.user.regNumber;
    const groups = readCSV(GROUPS_FILE);

    const group = groups.find(g => g.groupId === groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const memberIds = group.members.split('|');
    
    // Check if user is a member
    if (!memberIds.includes(regNumber)) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // Get member details
    const memberDetails = memberIds.map(memberId => {
      const memberData = studentsData.find(
        student => student['Registration Number'] === memberId
      );
      return {
        regNumber: memberId,
        name: memberData ? memberData['Name'] : 'Unknown User'
      };
    });

    res.json({
      ...group,
      members: memberIds,
      memberDetails,
      isGroup: true
    });
  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({ error: 'Failed to fetch group details' });
  }
});

// Add members to group
app.post('/api/groups/:groupId/add-members', authenticateToken, (req, res) => {
  try {
    const { groupId } = req.params;
    const { members } = req.body;
    const regNumber = req.user.regNumber;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Members array is required' });
    }

    const groups = readCSV(GROUPS_FILE);
    const groupIndex = groups.findIndex(g => g.groupId === groupId);

    if (groupIndex === -1) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = groups[groupIndex];

    // Check if user is admin
    if (group.createdBy !== regNumber) {
      return res.status(403).json({ error: 'Only group admin can add members' });
    }

    // Add new members
    const existingMembers = group.members.split('|');
    const updatedMembers = [...new Set([...existingMembers, ...members])];
    group.members = updatedMembers.join('|');

    // Update CSV
    const headers = ['groupId', 'groupName', 'createdBy', 'members', 'createdAt', 'lastMessage', 'lastSender', 'lastTimestamp'];
    writeCSV(GROUPS_FILE, headers, groups);

    console.log('✅ Members added to group:', groupId);
    res.json({ success: true, members: updatedMembers });
  } catch (error) {
    console.error('Add members error:', error);
    res.status(500).json({ error: 'Failed to add members' });
  }
});

// Get group messages
app.get('/api/groups/:groupId/messages', authenticateToken, (req, res) => {
  try {
    const { groupId } = req.params;
    const regNumber = req.user.regNumber;

    // Check if user is a member
    const groups = readCSV(GROUPS_FILE);
    const group = groups.find(g => g.groupId === groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const memberIds = group.members.split('|');
    if (!memberIds.includes(regNumber)) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // Get all messages for this group
    const messages = readCSV(MESSAGES_FILE);
    const groupMessages = messages.filter(msg => msg.chatId === groupId);

    // Enhance messages with sender names
    const enhancedMessages = groupMessages.map(msg => {
      const senderData = studentsData.find(
        student => student['Registration Number'] === msg.sender
      );
      return {
        ...msg,
        senderName: senderData ? senderData['Name'] : 'Unknown User'
      };
    });

    res.json(enhancedMessages);
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ error: 'Failed to fetch group messages' });
  }
});

// Send message to group
app.post('/api/groups/:groupId/messages', authenticateToken, (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, fileUrl, fileName, fileType } = req.body;
    const sender = req.user.regNumber;

    // Check if user is a member
    const groups = readCSV(GROUPS_FILE);
    const groupIndex = groups.findIndex(g => g.groupId === groupId);

    if (groupIndex === -1) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = groups[groupIndex];
    const memberIds = group.members.split('|');

    if (!memberIds.includes(sender)) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // Create message
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const newMessage = {
      messageId,
      chatId: groupId,
      sender,
      receiver: 'group', // Mark as group message
      text: text || '',
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileType: fileType || '',
      timestamp,
      delivered: 'true',
      read: 'false',
      readAt: ''
    };

    // Add message to CSV
    const messages = readCSV(MESSAGES_FILE);
    if (messages.length === 0) {
      const headers = ['messageId', 'chatId', 'sender', 'receiver', 'text', 'fileUrl', 'fileName', 'fileType', 'timestamp', 'delivered', 'read', 'readAt'];
      writeCSV(MESSAGES_FILE, headers, [newMessage]);
    } else {
      const headers = ['messageId', 'chatId', 'sender', 'receiver', 'text', 'fileUrl', 'fileName', 'fileType', 'timestamp', 'delivered', 'read', 'readAt'];
      appendToCSV(MESSAGES_FILE, headers, newMessage);
    }

    // Update group's last message
    group.lastMessage = text || (fileName ? `📎 ${fileName}` : '');
    group.lastSender = sender;
    group.lastTimestamp = timestamp;

    const headers = ['groupId', 'groupName', 'createdBy', 'members', 'createdAt', 'lastMessage', 'lastSender', 'lastTimestamp'];
    writeCSV(GROUPS_FILE, headers, groups);

    // Get sender name
    const senderData = studentsData.find(
      student => student['Registration Number'] === sender
    );

    const enhancedMessage = {
      ...newMessage,
      senderName: senderData ? senderData['Name'] : 'Unknown User'
    };

    console.log('✅ Group message sent:', messageId);
    res.json(enhancedMessage);
  } catch (error) {
    console.error('Send group message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============================================
// UNIVERSITY GROUPS (ADMIN ONLY)
// ============================================

// Get all university groups
app.get('/api/groups/university', authenticateToken, (req, res) => {
  try {
    const regNumber = req.user.regNumber;
    const groups = readCSV(UNIVERSITY_GROUPS_FILE);

    // Filter groups where user is a member
    const userGroups = groups.filter(group => {
      const members = group.members.split('|');
      return members.includes(regNumber);
    });

    // Enhance groups with member details
    const enhancedGroups = userGroups.map(group => {
      const memberIds = group.members.split('|');
      const memberDetails = memberIds.map(memberId => {
        const memberData = studentsData.find(
          student => student['Registration Number'] === memberId
        );
        return {
          regNumber: memberId,
          name: memberData ? memberData['Name'] : 'Unknown User'
        };
      });

      return {
        ...group,
        members: memberIds,
        memberDetails,
        isGroup: true,
        isUniversityGroup: true
      };
    });

    res.json(enhancedGroups);
  } catch (error) {
    console.error('Get university groups error:', error);
    res.status(500).json({ error: 'Failed to fetch university groups' });
  }
});

// Create university group (admin only)
app.post('/api/groups/university/create', authenticateToken, (req, res) => {
  try {
    const { groupName, members } = req.body;
    const createdBy = req.user.regNumber;

    // Check if user is admin
    if (createdBy !== ADMIN_REG_NUMBER) {
      return res.status(403).json({ error: 'Only admin can create university groups' });
    }

    if (!groupName || !members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Group name and members are required' });
    }

    // Add creator to members if not already included
    const allMembers = [...new Set([createdBy, ...members])];

    // Generate group ID
    const groupId = `unigroup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

    // Read existing groups
    const groups = readCSV(UNIVERSITY_GROUPS_FILE);

    // Create new group
    const newGroup = {
      groupId,
      groupName,
      createdBy,
      members: allMembers.join('|'),
      createdAt,
      lastMessage: '',
      lastSender: '',
      lastTimestamp: ''
    };

    // Initialize CSV if empty
    if (groups.length === 0) {
      const headers = ['groupId', 'groupName', 'createdBy', 'members', 'createdAt', 'lastMessage', 'lastSender', 'lastTimestamp'];
      writeCSV(UNIVERSITY_GROUPS_FILE, headers, [newGroup]);
    } else {
      const headers = ['groupId', 'groupName', 'createdBy', 'members', 'createdAt', 'lastMessage', 'lastSender', 'lastTimestamp'];
      appendToCSV(UNIVERSITY_GROUPS_FILE, headers, newGroup);
    }

    console.log('✅ University group created:', groupId);
    res.json({ groupId, ...newGroup, members: allMembers });
  } catch (error) {
    console.error('Create university group error:', error);
    res.status(500).json({ error: 'Failed to create university group' });
  }
});

// ============================================
// ANNOUNCEMENTS
// ============================================

// Get all announcements
app.get('/api/announcements', authenticateToken, (req, res) => {
  try {
    const announcements = readCSV(ANNOUNCEMENTS_FILE);
    
    // Return in reverse order (newest first)
    res.json(announcements.reverse());
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Post announcement (admin only)
app.post('/api/announcements', authenticateToken, (req, res) => {
  try {
    const { text } = req.body;
    const authorRegNumber = req.user.regNumber;

    // Check if user is admin
    if (authorRegNumber !== ADMIN_REG_NUMBER) {
      return res.status(403).json({ error: 'Only admin can post announcements' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Announcement text is required' });
    }

    // Get author name
    const authorData = studentsData.find(
      student => student['Registration Number'] === authorRegNumber
    );
    const authorName = authorData ? authorData['Name'] : 'Admin';

    // Generate announcement ID
    const id = `announce_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

    const newAnnouncement = {
      id,
      text: text.trim(),
      authorName,
      authorRegNumber,
      createdAt
    };

    // Read existing announcements
    const announcements = readCSV(ANNOUNCEMENTS_FILE);

    // Initialize CSV if empty
    if (announcements.length === 0) {
      const headers = ['id', 'text', 'authorName', 'authorRegNumber', 'createdAt'];
      writeCSV(ANNOUNCEMENTS_FILE, headers, [newAnnouncement]);
    } else {
      const headers = ['id', 'text', 'authorName', 'authorRegNumber', 'createdAt'];
      appendToCSV(ANNOUNCEMENTS_FILE, headers, newAnnouncement);
    }

    console.log('✅ Announcement posted:', id);
    res.json(newAnnouncement);
  } catch (error) {
    console.error('Post announcement error:', error);
    res.status(500).json({ error: 'Failed to post announcement' });
  }
});

// ============================================
// SOCKET.IO
// ============================================

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  socket.on('user-online', (regNumber) => {
    onlineUsers.set(regNumber, socket.id);
    socket.join(regNumber);
    io.emit('user-status', { regNumber, online: true });
    console.log(`✅ ${regNumber} is online`);
  });

  socket.on('send-message', (messageData) => {
    const receiverSocketId = onlineUsers.get(messageData.receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive-message', messageData);
    }
  });

  socket.on('send-group-message', (messageData) => {
    // Send message to all group members except sender
    const { members, ...message } = messageData;
    if (members && Array.isArray(members)) {
      members.forEach(memberRegNumber => {
        if (memberRegNumber !== message.sender) {
          const memberSocketId = onlineUsers.get(memberRegNumber);
          if (memberSocketId) {
            io.to(memberSocketId).emit('receive-message', message);
          }
        }
      });
    }
  });

  socket.on('typing', ({ chatId, sender, receiver }) => {
    const receiverSocketId = onlineUsers.get(receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user-typing', { chatId, sender });
    }
  });

  socket.on('stop-typing', ({ chatId, sender, receiver }) => {
    const receiverSocketId = onlineUsers.get(receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user-stop-typing', { chatId, sender });
    }
  });

  socket.on('message-read-receipt', ({ messageId, sender }) => {
    const senderSocketId = onlineUsers.get(sender);
    if (senderSocketId) {
      io.to(senderSocketId).emit('message-read', { messageId });
    }
  });

  socket.on('disconnect', () => {
    for (const [regNumber, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(regNumber);
        io.emit('user-status', { regNumber, online: false });
        console.log(`❌ ${regNumber} went offline`);
        break;
      }
    }
    console.log('👤 User disconnected:', socket.id);
  });
});

// Start server
console.log(`🚀 Starting server on port ${PORT}...`);
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`👥 ${studentsData.length} students loaded`);
  console.log(`📁 Using CSV file storage in: ${DATA_DIR}`);
  console.log(`🎯 Ready to accept connections`);
});
