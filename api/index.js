// MongoDB-based Serverless API for Vercel
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'lpu-live-secret-key-2025';
const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_REG_NUMBER = '12309972';

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// MongoDB connection with caching
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('lpulive');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
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

// Load student data (embedded or from JSON)
let studentsData = [];
try {
  const fs = require('fs');
  const path = require('path');
  const studentDataPath = path.join(__dirname, '../student_data.json');
  if (fs.existsSync(studentDataPath)) {
    studentsData = JSON.parse(fs.readFileSync(studentDataPath, 'utf-8'));
  }
} catch (error) {
  console.error('Error loading student data:', error);
}

// ==================== AUTH ROUTES ====================

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const { db } = await connectToDatabase();
    const users = db.collection('users');

    // Check if user exists in database
    let userCred = await users.findOne({ registrationNumber: username });

    if (!userCred) {
      // First time login - create user
      const userData = studentsData.find(
        student => student['Registration Number'] === username
      );

      if (!userData) {
        return res.status(404).json({ error: 'Registration number not found' });
      }

      // Create user with hashed password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      userCred = {
        registrationNumber: username,
        password: hashedPassword,
        name: userData.Name,
        fatherName: userData["Father's Name"],
        branch: userData.Branch,
        gender: userData.Gender,
        state: userData.State,
        section: userData.Section,
        cgpa: userData.CGPA,
        hasChangedPassword: false,
        createdAt: new Date()
      };

      await users.insertOne(userCred);
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, userCred.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Create token
    const token = jwt.sign(
      { username: username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Prepare user object
    const user = {
      registrationNumber: userCred.registrationNumber,
      name: userCred.name,
      fatherName: userCred.fatherName,
      branch: userCred.branch,
      gender: userCred.gender,
      state: userCred.state,
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

    const { db } = await connectToDatabase();
    const users = db.collection('users');

    const userCred = await users.findOne({ registrationNumber: username });

    if (!userCred) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, userCred.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await users.updateOne(
      { registrationNumber: username },
      { 
        $set: { 
          password: hashedPassword,
          hasChangedPassword: true,
          passwordChangedAt: new Date()
        }
      }
    );

    res.json({ success: true, message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== CHAT ROUTES ====================

// Get user's chats
app.get('/api/chats', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const { db } = await connectToDatabase();
    const chats = db.collection('chats');

    const userChats = await chats.find({
      participants: username
    }).sort({ updatedAt: -1 }).toArray();

    // Populate participant data
    const enrichedChats = userChats.map(chat => {
      const otherParticipant = chat.participants.find(p => p !== username);
      const userData = studentsData.find(s => s['Registration Number'] === otherParticipant);
      
      return {
        chatId: chat._id.toString(),
        participantData: userData ? {
          registrationNumber: userData['Registration Number'],
          name: userData.Name,
          branch: userData.Branch
        } : null,
        lastMessage: chat.lastMessage || {},
        unreadCount: 0, // TODO: Implement unread count
        updatedAt: chat.updatedAt
      };
    });

    res.json(enrichedChats);

  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or get chat
app.post('/api/chats/create', authenticateToken, async (req, res) => {
  try {
    const { participants } = req.body;
    const username = req.user.username;

    if (!participants || participants.length !== 2) {
      return res.status(400).json({ error: 'Invalid participants' });
    }

    const { db } = await connectToDatabase();
    const chats = db.collection('chats');

    // Check if chat already exists
    let chat = await chats.findOne({
      participants: { $all: participants }
    });

    if (!chat) {
      // Create new chat
      chat = {
        participants,
        lastMessage: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await chats.insertOne(chat);
      chat._id = result.insertedId;
    }

    res.json({ chatId: chat._id.toString() });

  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== MESSAGE ROUTES ====================

// Get messages for a chat
app.get('/api/messages/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { db } = await connectToDatabase();
    const messages = db.collection('messages');

    const chatMessages = await messages.find({ chatId })
      .sort({ timestamp: 1 })
      .toArray();

    res.json(chatMessages);

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId, receiver, text, fileUrl, fileName, fileType, fileData } = req.body;
    const sender = req.user.username;

    const { db } = await connectToDatabase();
    const messages = db.collection('messages');
    const chats = db.collection('chats');

    const message = {
      chatId,
      sender,
      receiver,
      text: text || '',
      fileUrl: fileUrl || null,
      fileData: fileData || null, // Store base64 data
      fileName: fileName || null,
      fileType: fileType || null,
      timestamp: new Date(),
      delivered: false,
      read: false
    };

    const result = await messages.insertOne(message);

    // Add the generated ID to the message object
    message._id = result.insertedId;
    message.messageId = result.insertedId.toString();

    // Update chat's last message
    await chats.updateOne(
      { _id: new ObjectId(chatId) },
      { 
        $set: { 
          lastMessage: {
            text: text || fileName || 'File',
            sender,
            timestamp: message.timestamp
          },
          updatedAt: new Date()
        }
      }
    );

    res.json(message);

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark messages as read
app.post('/api/messages/read', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.body;
    const username = req.user.username;

    const { db } = await connectToDatabase();
    const messages = db.collection('messages');

    await messages.updateMany(
      { 
        chatId,
        receiver: username,
        read: false
      },
      { 
        $set: { 
          read: true,
          readAt: new Date()
        }
      }
    );

    res.json({ success: true });

  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== GROUP ROUTES ====================

// Get user's groups
app.get('/api/groups', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const { db } = await connectToDatabase();
    const groups = db.collection('groups');

    const userGroups = await groups.find({
      members: username
    }).sort({ updatedAt: -1 }).toArray();

    res.json(userGroups);

  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create group
app.post('/api/groups/create', authenticateToken, async (req, res) => {
  try {
    const { groupName, members } = req.body;
    const creator = req.user.username;

    const { db } = await connectToDatabase();
    const groups = db.collection('groups');

    const group = {
      groupName,
      members: [creator, ...members],
      creator,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null
    };

    const result = await groups.insertOne(group);

    res.json({ 
      success: true, 
      groupId: result.insertedId.toString(),
      group 
    });

  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get university groups
app.get('/api/groups/university', authenticateToken, async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const universityGroups = db.collection('university_groups');

    const groups = await universityGroups.find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json(groups);

  } catch (error) {
    console.error('Get university groups error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create university group (admin only)
app.post('/api/groups/university/create', authenticateToken, async (req, res) => {
  try {
    const { groupName, members } = req.body;
    const creator = req.user.username;

    console.log('🏛️ University group creation attempt:', { creator, groupName, members });

    // Check if user is admin
    if (creator !== ADMIN_REG_NUMBER) {
      console.log('❌ Not admin:', creator, 'Expected:', ADMIN_REG_NUMBER);
      return res.status(403).json({ error: 'Only admins can create university groups' });
    }

    if (!groupName || !groupName.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    if (!members || members.length === 0) {
      return res.status(400).json({ error: 'At least one member is required' });
    }

    const { db } = await connectToDatabase();
    const universityGroups = db.collection('university_groups');

    const group = {
      groupName: groupName.trim(),
      members: members || [],
      creator,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null,
      isUniversityGroup: true
    };

    const result = await universityGroups.insertOne(group);

    console.log('✅ University group created:', result.insertedId.toString());

    res.json({ 
      success: true, 
      groupId: result.insertedId.toString(),
      group: {
        ...group,
        _id: result.insertedId
      }
    });

  } catch (error) {
    console.error('❌ Create university group error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ==================== GROUP MESSAGE ROUTES ====================

// Get group messages
app.get('/api/groups/:groupId/messages', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { db } = await connectToDatabase();
    
    // Check both regular and university groups
    const groups = db.collection('groups');
    const universityGroups = db.collection('university_groups');
    
    let group = await groups.findOne({ _id: new ObjectId(groupId) });
    if (!group) {
      group = await universityGroups.findOne({ _id: new ObjectId(groupId) });
    }
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const messages = db.collection('group_messages');
    const groupMessages = await messages.find({ groupId })
      .sort({ timestamp: 1 })
      .toArray();

    res.json(groupMessages);

  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send group message
app.post('/api/groups/:groupId/messages', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, fileUrl, fileName, fileType, fileData } = req.body;
    const sender = req.user.username;

    const { db } = await connectToDatabase();
    
    // Check both regular and university groups
    const groups = db.collection('groups');
    const universityGroups = db.collection('university_groups');
    
    let group = await groups.findOne({ _id: new ObjectId(groupId) });
    let isUniversityGroup = false;
    
    if (!group) {
      group = await universityGroups.findOne({ _id: new ObjectId(groupId) });
      isUniversityGroup = true;
    }
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Verify user is a member
    if (!group.members.includes(sender)) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const messages = db.collection('group_messages');
    
    const message = {
      groupId,
      sender,
      text: text || '',
      fileUrl: fileUrl || null,
      fileData: fileData || null, // Store base64 data
      fileName: fileName || null,
      fileType: fileType || null,
      timestamp: new Date(),
      delivered: true,
      read: false
    };

    const result = await messages.insertOne(message);
    message._id = result.insertedId;
    message.messageId = result.insertedId.toString();

    // Update group's last message
    const collection = isUniversityGroup ? universityGroups : groups;
    await collection.updateOne(
      { _id: new ObjectId(groupId) },
      { 
        $set: { 
          lastMessage: {
            text: text || fileName || 'File',
            sender,
            timestamp: message.timestamp
          },
          updatedAt: new Date()
        }
      }
    );

    res.json(message);

  } catch (error) {
    console.error('Send group message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== ANNOUNCEMENT ROUTES ====================

// Get announcements
app.get('/api/announcements', authenticateToken, async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const announcements = db.collection('announcements');

    const allAnnouncements = await announcements.find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json(allAnnouncements);

  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create announcement (admin only)
app.post('/api/announcements', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const creator = req.user.username;

    // Check if user is admin
    if (creator !== ADMIN_REG_NUMBER) {
      return res.status(403).json({ error: 'Only admins can create announcements' });
    }

    const { db } = await connectToDatabase();
    const announcements = db.collection('announcements');

    const announcement = {
      text,
      authorName: 'Admin',
      authorRegNumber: creator,
      createdAt: new Date()
    };

    const result = await announcements.insertOne(announcement);

    res.json({ 
      success: true, 
      announcementId: result.insertedId.toString(),
      announcement 
    });

  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== USER ROUTES ====================

// Get user by registration number
app.get('/api/users/:regNumber', authenticateToken, async (req, res) => {
  try {
    const { regNumber } = req.params;
    
    const userData = studentsData.find(
      student => student['Registration Number'] === regNumber
    );

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      registrationNumber: userData['Registration Number'],
      name: userData.Name,
      fatherName: userData["Father's Name"],
      branch: userData.Branch,
      gender: userData.Gender,
      state: userData.State,
      section: userData.Section,
      cgpa: userData.CGPA
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export for Vercel serverless
module.exports = app;
