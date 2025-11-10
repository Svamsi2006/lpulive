# Group Chat Feature - User Guide

## 🎉 New Group Chat Feature Added!

You can now create groups and chat with multiple people at once, just like WhatsApp groups!

---

## ✨ Features

### 1. **Create Groups**
- Create custom groups with any name
- Add multiple members using their registration numbers
- The creator automatically becomes the group admin

### 2. **Group Admin Privileges**
- Only the group creator (admin) can add new members
- Admin status is displayed in group details

### 3. **Group Messaging**
- Send text messages to all group members
- Upload and share files (images, PDFs, documents)
- Real-time message delivery to all online members
- See who sent each message (sender name displayed)

### 4. **Group Information**
- View total number of members
- See all member names in the header
- Track last message and timestamp

---

## 📖 How to Use

### **Step 1: Access Personal Groups**
1. Open the application at http://localhost:3000
2. Login with your registration number
3. Click on **"Personal Groups"** in the left sidebar

### **Step 2: Create a New Group**
1. Click the **"➕ Create New Group"** button (purple gradient button)
2. A modal will open with the following:
   - **Group Name Input**: Enter your desired group name (e.g., "Project Team Alpha")
   - **Member Search**: Search for users by:
     - Name (e.g., "Sweety")
     - Registration Number (e.g., "12306253")
     - Section (e.g., "K23CP")

### **Step 3: Add Members**
1. Type in the search box to find users
2. Click on users to select them (checkbox will be checked)
3. Selected members appear as blue tags above the search
4. Click the "×" on a tag to remove that member
5. Add at least 1 member to proceed

### **Step 4: Create the Group**
1. Once you've entered a group name and selected members
2. Click the **"Create Group"** button
3. The group will appear in your Personal Groups list
4. All members will see this group when they log in

### **Step 5: Start Chatting**
1. Click on any group from your list
2. The chat window will open showing:
   - Group name in the header
   - Number of members (e.g., "5 members")
   - Preview of member names
3. Type your message and press Enter or click Send
4. Your message will be delivered to all group members
5. Each message shows the sender's name (except your own messages)

---

## 🧪 Testing the Group Feature

### **Test Scenario 1: Create and Message in a Group**
1. **User A (12306253)** logs in
2. Creates a group "Test Group 1"
3. Adds **User B (12309977)** and **User C (12304567)**
4. Sends message: "Hello team!"
5. **User B** logs in and should see:
   - "Test Group 1" in Personal Groups
   - "Hello team!" message from User A
6. **User B** replies: "Hi there!"
7. **User A** should see the reply in real-time

### **Test Scenario 2: Multiple Groups**
1. Create multiple groups with different members
2. Send messages in each group
3. Verify messages appear only in their respective groups
4. Check that member lists are correct for each group

### **Test Scenario 3: Admin Functions**
1. **Admin** creates a group
2. **Admin** can add new members later (future feature)
3. **Non-admin** members can only send messages

---

## 📂 Backend Storage

Groups are stored in: `data/groups.csv`

**CSV Structure:**
```
groupId,groupName,createdBy,members,createdAt,lastMessage,lastSender,lastTimestamp
```

**Example Row:**
```
group_1730073600000_abc123xyz,My Study Group,12306253,12306253|12309977|12304567,2025-10-28T10:00:00.000Z,Hello everyone!,12306253,2025-10-28T10:05:00.000Z
```

**Group Messages** are stored in: `data/messages.csv`
- Same structure as personal messages
- `chatId` field contains the `groupId`
- `receiver` field is set to "group"

---

## 🔑 API Endpoints

### **Create Group**
```
POST /api/groups/create
Authorization: Bearer <token>
Body: {
  "groupName": "My Group",
  "members": ["12309977", "12304567"]
}
```

### **Get User's Groups**
```
GET /api/groups
Authorization: Bearer <token>
```

### **Get Group Details**
```
GET /api/groups/:groupId
Authorization: Bearer <token>
```

### **Add Members to Group**
```
POST /api/groups/:groupId/add-members
Authorization: Bearer <token>
Body: {
  "members": ["12308888", "12309999"]
}
Note: Only admin can add members
```

### **Get Group Messages**
```
GET /api/groups/:groupId/messages
Authorization: Bearer <token>
```

### **Send Group Message**
```
POST /api/groups/:groupId/messages
Authorization: Bearer <token>
Body: {
  "text": "Hello group!",
  "fileUrl": "", // optional
  "fileName": "", // optional
  "fileType": "" // optional
}
```

---

## 🎨 UI Components

### **GroupModal.jsx**
- Beautiful modal for creating groups
- Real-time search and filtering
- Multi-select with visual feedback
- Selected members shown as tags

### **Sidebar Updates**
- "Create New Group" button with gradient style
- Groups list with member count
- Last message preview with sender name
- Empty state for no groups

### **ChatWindow Updates**
- Group header shows member count and names
- Sender name displayed on each message (in groups)
- Supports both personal and group chats
- Different message endpoints for groups vs personal

---

## 🚀 Real-time Features

### **Socket.IO Events**

**Send Group Message:**
```javascript
socket.emit('send-group-message', {
  messageId: 'msg_123',
  groupId: 'group_456',
  sender: '12306253',
  text: 'Hello!',
  members: ['12309977', '12304567'], // all members
  timestamp: '2025-10-28T10:00:00.000Z'
})
```

**Receive Group Message:**
```javascript
socket.on('receive-message', (message) => {
  // Message delivered to all online group members
  // except the sender
})
```

---

## ✅ Checklist for Testing

- [ ] Login as User A
- [ ] Navigate to Personal Groups
- [ ] Click "Create New Group"
- [ ] Search and select 2-3 members
- [ ] Enter group name and create
- [ ] Send a message in the group
- [ ] Login as User B (one of the members)
- [ ] Verify group appears in their Personal Groups
- [ ] Verify User B can see User A's message
- [ ] Send a reply from User B
- [ ] Verify User A receives the reply in real-time
- [ ] Test file uploads in group
- [ ] Create multiple groups and test isolation

---

## 🐛 Troubleshooting

### **Group not showing up for members**
- Make sure the member is logged in and on Personal Groups tab
- Refresh the page
- Check that member was added during group creation

### **Messages not sending**
- Verify backend server is running on port 5000
- Check browser console for errors
- Ensure you're logged in with valid token

### **Members can't see messages**
- Check Socket.IO connection (green dot = online)
- Verify member is part of the group
- Check network tab for API responses

---

## 📝 Notes

1. **Group creator is always the admin** - Admin privileges are determined by the `createdBy` field
2. **Members array uses pipe separator** - In CSV: `12306253|12309977|12304567`
3. **Group messages have receiver="group"** - This distinguishes them from personal messages
4. **Real-time delivery only for online members** - Offline members will see messages when they log in
5. **Member names are fetched from student_data.json** - Ensure registration numbers exist in the database

---

## 🎯 Future Enhancements

- [ ] Add member removal (admin only)
- [ ] Leave group option
- [ ] Group icons/avatars
- [ ] Group description
- [ ] Mute notifications
- [ ] Pin important messages
- [ ] Reply to specific messages
- [ ] Message reactions
- [ ] Group info page with all members

---

**Enjoy your new group chat feature! 🎉**
