# 🎯 LPU Live - Complete CSV Backend System

## ✅ WHAT'S FIXED

### 1. **"Two participants required" Error** - FIXED! ✓
   - **Problem**: Frontend was sending single `participant` instead of array
   - **Solution**: Now sends `participants: [currentUser, otherUser]`
   - **Location**: `src/components/Sidebar.jsx` line ~100

### 2. **Send Button Not Working** - FIXED! ✓
   - **Problem**: Wrong endpoint `/api/messages/send` (doesn't exist)
   - **Solution**: Changed to correct endpoint `/api/messages`
   - **Location**: `src/components/ChatWindow.jsx` line ~110

### 3. **File Upload Not Working** - FIXED! ✓
   - **Problem**: Wrong endpoint and flow
   - **Solution**: First upload to `/api/upload`, then send message with file info
   - **Location**: `src/components/ChatWindow.jsx` line ~160

---

## 📁 CSV BACKEND - HOW IT WORKS

All data is stored in **3 simple CSV files** in the `data/` folder:

### 1️⃣ **users.csv** - User Authentication & Passwords
```csv
regNumber,password,hasChangedPassword,lastSeen
12306253,12306253,false,
12300581,newPass123,true,2025-10-22T15:30:00Z
```

**When does it update?**
- ✅ **On first server start**: Creates entries for all 8,580 students
- ✅ **When user changes password**: Updates password & sets `hasChangedPassword=true`
- ✅ **When user logs in**: Can update `lastSeen` timestamp

**How to manually edit?**
1. Open `data/users.csv` in Excel
2. Find the registration number
3. Change the password column
4. Save the file
5. User can now login with new password!

---

### 2️⃣ **chats.csv** - All Conversations
```csv
chatId,participant1,participant2,lastMessage,lastSender,lastTimestamp,updatedAt
chat_1729599234_abc123,12306253,12300581,Hello there!,12306253,2025-10-22T10:30:00Z,2025-10-22T10:30:00Z
```

**When does it update?**
- ✅ **When you click "Start Chat"**: Creates new chat entry
- ✅ **When message is sent**: Updates `lastMessage`, `lastSender`, `lastTimestamp`
- ✅ **Automatically**: Sorts by `updatedAt` to show recent chats first

**How to view in Excel?**
1. Open `data/chats.csv`
2. You'll see all active conversations
3. Can delete rows to remove chats
4. Can see who talked to whom

---

### 3️⃣ **messages.csv** - Every Message Ever Sent
```csv
messageId,chatId,sender,receiver,text,fileUrl,fileName,fileType,timestamp,delivered,read,readAt
msg_1729599234_xyz,chat_1729599234_abc123,12306253,12300581,Hello!,,,text/plain,2025-10-22T10:30:00Z,true,false,
msg_1729599240_def,chat_1729599234_abc123,12306253,12300581,,/uploads/image.jpg,image.jpg,image/jpeg,2025-10-22T10:31:00Z,true,true,2025-10-22T10:32:00Z
```

**When does it update?**
- ✅ **Every time you send a message**: New row added instantly
- ✅ **When message is delivered**: `delivered` changes from `false` to `true`
- ✅ **When message is read**: `read=true` and `readAt` is set
- ✅ **When you upload a file**: Stores file path, name, and type

**How to view conversation history?**
1. Open `data/messages.csv` in Excel
2. Filter by `chatId` to see specific conversation
3. Filter by `sender` or `receiver` to see user's messages
4. Sort by `timestamp` to see chronological order

---

## 🔄 REAL-TIME DATA FLOW

### When You Send a Message:

```
1. Type message → Click Send
2. Frontend: POST to /api/messages
3. Backend: Appends new row to messages.csv
4. Backend: Updates last message in chats.csv
5. Backend: Sends via Socket.IO to receiver
6. Both users see message instantly
7. CSV files are updated on disk
```

### When You Change Password:

```
1. Click Settings → Enter new password
2. Frontend: POST to /api/auth/change-password
3. Backend: Reads users.csv
4. Backend: Finds your row
5. Backend: Updates password field
6. Backend: Sets hasChangedPassword=true
7. Backend: Writes entire file back
8. Next login uses new password
```

### When You Start a Chat:

```
1. Enter registration number → Click Start Chat
2. Frontend: GET /api/users/12300581
3. Backend: Validates user exists in student_data.json
4. Frontend: POST /api/chats/create with [you, them]
5. Backend: Checks if chat exists in chats.csv
6. Backend: If not, appends new chat row
7. Backend: Returns chatId
8. Chat window opens
```

---

## 📊 HOW TO VIEW/EDIT DATA

### Method 1: Excel (Recommended)
```
1. Navigate to: C:\Users\vamsi\Desktop\lpulive\data\
2. Double-click any .csv file
3. Opens in Excel with columns
4. Edit data as needed
5. Save (keep CSV format)
6. Changes take effect immediately
```

### Method 2: Notepad/VS Code
```
1. Open .csv file in text editor
2. Each line = one record
3. Commas separate fields
4. Edit carefully (don't break format)
5. Save file
6. Reload browser to see changes
```

### Method 3: Programmatically
The backend provides helper functions:
- `readCSV(filePath)` - Read all rows as objects
- `writeCSV(filePath, headers, data)` - Overwrite file
- `appendToCSV(filePath, headers, item)` - Add new row

---

## 🎯 TESTING THE FIXES

### Test 1: Start a Chat
```
1. Login with: 12306253 / 12306253
2. Click ➕ "Start New Chat"
3. Enter: 12300581
4. Click "Start Chat"
5. ✅ Should open chat window (not "Two participants" error)
6. Check data/chats.csv - new row should appear!
```

### Test 2: Send a Message
```
1. In chat window, type: "Hello!"
2. Press Enter or click Send button
3. ✅ Message should appear in chat
4. Check data/messages.csv - new row with your message!
5. Check data/chats.csv - lastMessage updated to "Hello!"
```

### Test 3: Upload a File
```
1. Click 📎 attachment icon
2. Select an image or PDF
3. ✅ File should upload and show in chat
4. Check data/messages.csv - row with fileUrl filled
5. Check uploads/ folder - file is saved there
```

### Test 4: Change Password
```
1. Click ⚙️ Settings icon
2. Enter new password: "mynewpass123"
3. Click "Change Password"
4. ✅ Success message appears
5. Open data/users.csv in Excel
6. Find your registration number
7. Password column should show "mynewpass123"
8. hasChangedPassword should be "true"
9. Logout and login with new password
```

### Test 5: View Data in Excel
```
1. Open File Explorer
2. Go to: C:\Users\vamsi\Desktop\lpulive\data\
3. Double-click users.csv
4. ✅ See all 8,580 users with passwords
5. Double-click chats.csv
6. ✅ See all conversations you started
7. Double-click messages.csv
8. ✅ See every message sent
```

---

## 🚀 RESTART SERVERS (If Needed)

If you need to restart everything:

### Option 1: Use the script
```powershell
cd C:\Users\vamsi\Desktop\lpulive
.\start-servers.ps1
```

### Option 2: Manual start
```powershell
# Terminal 1 - Backend
cd C:\Users\vamsi\Desktop\lpulive
node server/server-simple.js

# Terminal 2 - Frontend (new window)
cd C:\Users\vamsi\Desktop\lpulive
npm run dev
```

---

## 📝 SUMMARY OF CHANGES

| Issue | Status | File Changed | Line |
|-------|--------|--------------|------|
| "Two participants required" error | ✅ FIXED | Sidebar.jsx | ~100 |
| Send button not working | ✅ FIXED | ChatWindow.jsx | ~110 |
| File upload not working | ✅ FIXED | ChatWindow.jsx | ~160 |
| Password change updates CSV | ✅ WORKING | server-simple.js | ~220 |
| Messages stored in CSV | ✅ WORKING | server-simple.js | ~400 |
| Chats stored in CSV | ✅ WORKING | server-simple.js | ~330 |

---

## 💡 ADVANTAGES OF CSV BACKEND

✅ **No MongoDB needed** - Works on any computer
✅ **No installation** - No database setup required
✅ **Easy to view** - Open in Excel anytime
✅ **Easy to edit** - Change data directly in Excel
✅ **Easy to backup** - Just copy the data/ folder
✅ **Easy to understand** - See exactly what's stored
✅ **Perfect for learning** - Students can see the data structure
✅ **Portable** - Move the project to any computer

---

## 🎓 FOR STUDENTS

This CSV approach is **educational** because:
- You can see how data is structured
- You can manually edit and test edge cases
- No complex database queries to learn
- Direct access to see what happens
- Easy to debug issues
- Learn file I/O and data management

---

## 🔒 SECURITY NOTE

⚠️ **Important**: Passwords are stored in **plain text** in `users.csv`

- ✅ Good for: Development, learning, small projects
- ❌ Not for: Production systems with real users

For production, add password hashing:
```javascript
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(password, 10);
```

---

## 🎉 YOU'RE ALL SET!

Everything is now stored in CSV files and fully functional:
- ✅ Login/Authentication → `users.csv`
- ✅ Password changes → `users.csv` 
- ✅ Chats → `chats.csv`
- ✅ Messages → `messages.csv`
- ✅ Files → `uploads/` folder

**Start chatting and watch the CSV files update in real-time!** 🚀
