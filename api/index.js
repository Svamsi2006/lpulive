// Vercel Serverless API Handler
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'lpu-live-secret-key-2025';
const ADMIN_REG_NUMBER = '12309972';

// Middleware
app.use(cors());
app.use(express.json());

// Helper functions for CSV operations
function readCSV(filePath) {
  try {
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
  } catch (error) {
    console.error('Error reading CSV:', error);
    return [];
  }
}

function writeCSV(filePath, headers, data) {
  const rows = [headers.join(',')];
  data.forEach(item => {
    const values = headers.map(h => (item[h] || '').toString().replace(/,/g, ';'));
    rows.push(values.join(','));
  });
  fs.writeFileSync(filePath, rows.join('\n'));
}

function appendToCSV(filePath, headers, item) {
  const values = headers.map(h => (item[h] || '').toString().replace(/,/g, ';'));
  fs.appendFileSync(filePath, '\n' + values.join(','));
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = { username: user.username, regNumber: user.username };
    next();
  });
};

// File paths - using /tmp for Vercel serverless
const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(__dirname, '../data');
const CHATS_FILE = path.join(DATA_DIR, 'chats.csv');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.csv');
const USERS_FILE = path.join(DATA_DIR, 'users.csv');
const GROUPS_FILE = path.join(DATA_DIR, 'groups.csv');
const UNIVERSITY_GROUPS_FILE = path.join(DATA_DIR, 'university_groups.csv');
const ANNOUNCEMENTS_FILE = path.join(DATA_DIR, 'announcements.csv');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load student data
let studentsData = [];
try {
  const studentDataPath = path.join(__dirname, '../student_data.json');
  if (fs.existsSync(studentDataPath)) {
    studentsData = JSON.parse(fs.readFileSync(studentDataPath, 'utf-8'));
  }
} catch (error) {
  console.error('Error loading student data:', error);
}

// Initialize CSV files
[USERS_FILE, CHATS_FILE, MESSAGES_FILE, GROUPS_FILE, UNIVERSITY_GROUPS_FILE, ANNOUNCEMENTS_FILE].forEach(file => {
  if (!fs.existsSync(file)) {
    const headers = {
      [USERS_FILE]: ['regNumber', 'password', 'hasChangedPassword'],
      [CHATS_FILE]: ['chatId', 'user1', 'user2', 'lastMessage', 'lastTimestamp', 'unreadCount'],
      [MESSAGES_FILE]: ['messageId', 'chatId', 'sender', 'content', 'timestamp', 'type', 'fileUrl'],
      [GROUPS_FILE]: ['groupId', 'groupName', 'createdBy', 'members', 'createdAt', 'lastMessage', 'lastSender', 'lastTimestamp'],
      [UNIVERSITY_GROUPS_FILE]: ['groupId', 'groupName', 'createdBy', 'members', 'createdAt', 'lastMessage', 'lastSender', 'lastTimestamp'],
      [ANNOUNCEMENTS_FILE]: ['announcementId', 'message', 'postedBy', 'timestamp']
    };
    fs.writeFileSync(file, headers[file].join(',') + '\n');
  }
});

// Routes

// Health check
app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'LPU Live API',
    students: studentsData.length,
    timestamp: new Date().toISOString()
  });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const users = readCSV(USERS_FILE);
    let user = users.find(u => u.regNumber === username);

    if (!user) {
      user = {
        regNumber: username,
        password: 'password123',
        hasChangedPassword: 'false'
      };
      const headers = ['regNumber', 'password', 'hasChangedPassword'];
      appendToCSV(USERS_FILE, headers, user);
    }

    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userData = studentsData.find(
      s => s['Registration Number'] === username
    );

    if (!userData) {
      return res.status(404).json({ error: 'User data not found' });
    }

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

// Get chats
app.get('/api/chats', authenticateToken, (req, res) => {
  try {
    const username = req.user.regNumber;
    const chats = readCSV(CHATS_FILE);
    const userChats = chats.filter(chat => 
      chat.user1 === username || chat.user2 === username
    );
    res.json(userChats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages
app.get('/api/messages/:chatId', authenticateToken, (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = readCSV(MESSAGES_FILE);
    const chatMessages = messages.filter(msg => msg.chatId === chatId);
    res.json(chatMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message
app.post('/api/messages/send', authenticateToken, (req, res) => {
  try {
    const { receiverId, content, type = 'text' } = req.body;
    const sender = req.user.regNumber;

    const chatId = [sender, receiverId].sort().join('_');
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const message = {
      messageId,
      chatId,
      sender,
      content,
      timestamp,
      type,
      fileUrl: ''
    };

    const headers = ['messageId', 'chatId', 'sender', 'content', 'timestamp', 'type', 'fileUrl'];
    appendToCSV(MESSAGES_FILE, headers, message);

    // Update or create chat
    const chats = readCSV(CHATS_FILE);
    const chatIndex = chats.findIndex(c => c.chatId === chatId);
    
    if (chatIndex >= 0) {
      chats[chatIndex].lastMessage = content.substring(0, 50);
      chats[chatIndex].lastTimestamp = timestamp;
      const chatHeaders = ['chatId', 'user1', 'user2', 'lastMessage', 'lastTimestamp', 'unreadCount'];
      writeCSV(CHATS_FILE, chatHeaders, chats);
    } else {
      const newChat = {
        chatId,
        user1: sender < receiverId ? sender : receiverId,
        user2: sender < receiverId ? receiverId : sender,
        lastMessage: content.substring(0, 50),
        lastTimestamp: timestamp,
        unreadCount: '0'
      };
      const chatHeaders = ['chatId', 'user1', 'user2', 'lastMessage', 'lastTimestamp', 'unreadCount'];
      appendToCSV(CHATS_FILE, chatHeaders, newChat);
    }

    res.json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get groups
app.get('/api/groups', authenticateToken, (req, res) => {
  try {
    const username = req.user.regNumber;
    const groups = readCSV(GROUPS_FILE);
    const userGroups = groups.filter(group => 
      group.members.includes(username)
    );
    res.json(userGroups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create group
app.post('/api/groups/create', authenticateToken, (req, res) => {
  try {
    const { groupName, members } = req.body;
    const createdBy = req.user.regNumber;

    if (!groupName || !members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Group name and members are required' });
    }

    const allMembers = [...new Set([createdBy, ...members])];
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

    const groups = readCSV(GROUPS_FILE);
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

    if (groups.length === 0) {
      const headers = ['groupId', 'groupName', 'createdBy', 'members', 'createdAt', 'lastMessage', 'lastSender', 'lastTimestamp'];
      writeCSV(GROUPS_FILE, headers, [newGroup]);
    } else {
      const headers = ['groupId', 'groupName', 'createdBy', 'members', 'createdAt', 'lastMessage', 'lastSender', 'lastTimestamp'];
      appendToCSV(GROUPS_FILE, headers, newGroup);
    }

    res.json({ groupId, ...newGroup, members: allMembers });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get university groups
app.get('/api/groups/university', authenticateToken, (req, res) => {
  try {
    const groups = readCSV(UNIVERSITY_GROUPS_FILE);
    res.json(groups);
  } catch (error) {
    console.error('Get university groups error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create university group (admin only)
app.post('/api/groups/university/create', authenticateToken, (req, res) => {
  try {
    const createdBy = req.user.regNumber;

    if (createdBy !== ADMIN_REG_NUMBER) {
      return res.status(403).json({ error: 'Only admin can create university groups' });
    }

    const { groupName, members } = req.body;

    if (!groupName || !members || !Array.isArray(members)) {
      return res.status(400).json({ error: 'Group name and members are required' });
    }

    const allMembers = [...new Set([createdBy, ...members])];
    const groupId = `ugroup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

    const groups = readCSV(UNIVERSITY_GROUPS_FILE);
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

    if (groups.length === 0) {
      const headers = ['groupId', 'groupName', 'createdBy', 'members', 'createdAt', 'lastMessage', 'lastSender', 'lastTimestamp'];
      writeCSV(UNIVERSITY_GROUPS_FILE, headers, [newGroup]);
    } else {
      const headers = ['groupId', 'groupName', 'createdBy', 'members', 'createdAt', 'lastMessage', 'lastSender', 'lastTimestamp'];
      appendToCSV(UNIVERSITY_GROUPS_FILE, headers, newGroup);
    }

    res.json({ groupId, ...newGroup, members: allMembers });
  } catch (error) {
    console.error('Create university group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get announcements
app.get('/api/announcements', authenticateToken, (req, res) => {
  try {
    const announcements = readCSV(ANNOUNCEMENTS_FILE);
    res.json(announcements);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Post announcement (admin only)
app.post('/api/announcements', authenticateToken, (req, res) => {
  try {
    const postedBy = req.user.regNumber;

    if (postedBy !== ADMIN_REG_NUMBER) {
      return res.status(403).json({ error: 'Only admin can post announcements' });
    }

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const announcementId = `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const announcement = {
      announcementId,
      message,
      postedBy,
      timestamp
    };

    const headers = ['announcementId', 'message', 'postedBy', 'timestamp'];
    appendToCSV(ANNOUNCEMENTS_FILE, headers, announcement);

    res.json({ success: true, announcement });
  } catch (error) {
    console.error('Post announcement error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users
app.get('/api/users/search', authenticateToken, (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    const query = q.toLowerCase();
    const results = studentsData.filter(student => 
      student['Name'].toLowerCase().includes(query) ||
      student['Registration Number'].toLowerCase().includes(query)
    ).slice(0, 20);

    res.json(results);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export for Vercel
module.exports = app;
