# 📁 Simple CSV Database System

## Why CSV Instead of MongoDB?

✅ **Easy to Edit**: Open CSV files in Excel or any text editor  
✅ **No Installation**: No need to install MongoDB or any database  
✅ **Transparent**: See exactly what data is stored  
✅ **Portable**: Just copy the `data/` folder to backup everything  
✅ **Simple**: No complex queries or database setup  

---

## 📂 Data Files Location

All data is stored in **CSV files** in the `data/` folder:

```
lpulive/
├── data/
│   ├── chats.csv       ← All chat conversations
│   ├── messages.csv    ← All messages sent
│   └── users.csv       ← User credentials and settings
├── student_data.json   ← Student information (read-only)
└── uploads/            ← Uploaded files (images, PDFs, etc.)
```

---

## 📝 CSV File Structure

### 1. **users.csv** - User Authentication
```csv
regNumber,password,hasChangedPassword,lastSeen
12306253,12306253,false,
12300581,12300581,false,
```

**Fields:**
- `regNumber`: Registration number (username)
- `password`: Plain text password (changed on first password update)
- `hasChangedPassword`: true/false - whether user changed default password
- `lastSeen`: Last activity timestamp

### 2. **chats.csv** - Chat Conversations
```csv
chatId,participant1,participant2,lastMessage,lastSender,lastTimestamp,updatedAt
chat_1234567890_abc,12306253,12300581,Hello!,12306253,2025-10-22T10:30:00Z,2025-10-22T10:30:00Z
```

**Fields:**
- `chatId`: Unique chat identifier
- `participant1`: First user's registration number
- `participant2`: Second user's registration number
- `lastMessage`: Most recent message text
- `lastSender`: Who sent the last message
- `lastTimestamp`: When the last message was sent
- `updatedAt`: Last activity in this chat

### 3. **messages.csv** - All Messages
```csv
messageId,chatId,sender,receiver,text,fileUrl,fileName,fileType,timestamp,delivered,read,readAt
msg_1234567890_xyz,chat_1234567890_abc,12306253,12300581,Hello!,,,text/plain,2025-10-22T10:30:00Z,true,false,
```

**Fields:**
- `messageId`: Unique message identifier
- `chatId`: Which chat this belongs to
- `sender`: Who sent the message
- `receiver`: Who receives the message
- `text`: Message content
- `fileUrl`: Path to uploaded file (if any)
- `fileName`: Original file name
- `fileType`: MIME type of file
- `timestamp`: When message was sent
- `delivered`: true/false - delivered to receiver
- `read`: true/false - read by receiver
- `readAt`: When message was read

---

## ✏️ How to Edit Data Manually

### Using Excel or LibreOffice Calc
1. Navigate to `C:\Users\vamsi\Desktop\lpulive\data\`
2. Right-click on any `.csv` file → **Open With** → **Excel**
3. Edit the data (add/remove/modify rows)
4. Save the file (keep CSV format)
5. Refresh your browser to see changes

### Using Notepad or VS Code
1. Open the CSV file in any text editor
2. Each line is a record, commas separate fields
3. Keep the header row (first line) intact
4. Save the file
5. Changes take effect immediately

---

## 🔍 Common Operations

### Add a New User Manually
Open `data/users.csv` and add a line:
```csv
12300999,12300999,false,
```

### Delete a Chat
1. Open `data/chats.csv`
2. Find the chat by `chatId` or participants
3. Delete that entire row
4. Also delete related messages from `data/messages.csv`

### View All Messages in a Chat
1. Open `data/messages.csv`
2. Filter by `chatId` column
3. Sort by `timestamp` to see chronological order

### Mark All Messages as Read
1. Open `data/messages.csv`
2. Find messages where `receiver` = your reg number
3. Change `read` column from `false` to `true`
4. Add current date to `readAt` column

### Backup Your Data
Just copy the entire `data/` folder to another location!

---

## 🚀 Starting the Server

The new simplified server uses CSV files instead of MongoDB:

```powershell
# Method 1: Use the startup script
.\start-servers.ps1

# Method 2: Start manually
node server/server-simple.js
```

You'll see:
```
✅ Server running on http://localhost:5000
📁 Using CSV file storage in: C:\Users\vamsi\Desktop\lpulive\data
🎯 Ready to accept connections
```

---

## 🔄 How It Works

1. **On First Start**: 
   - Server creates `data/` folder
   - Initializes `users.csv` with all students from `student_data.json`
   - Creates empty `chats.csv` and `messages.csv`

2. **When You Login**:
   - Server reads `users.csv` to verify credentials
   - Compares your password with stored value

3. **When You Send a Message**:
   - Server appends new line to `messages.csv`
   - Updates last message in `chats.csv`
   - Sends real-time update via Socket.IO

4. **When You Start a Chat**:
   - Server checks if chat exists in `chats.csv`
   - If not, creates new chat entry
   - Returns `chatId` for messaging

---

## 💡 Advantages

✅ **No Database Required**: Works on any computer  
✅ **Easy Debugging**: Open CSV and see exactly what's stored  
✅ **Quick Edits**: Change data without SQL commands  
✅ **Portable**: Copy `data/` folder = complete backup  
✅ **Transparent**: Students can see and understand the data  
✅ **Version Control**: Track changes in Git  

---

## ⚠️ Limitations

- Not suitable for **very large** datasets (100,000+ messages)
- Multiple simultaneous writes might cause conflicts
- No built-in indexing (slower searches on huge files)
- Best for **development and small deployments**

For production with many users, consider migrating to a proper database later.

---

## 🎓 Perfect for Learning!

This CSV approach is **ideal for students** because:
- You can see the data structure clearly
- Easy to experiment and test
- No complex database installation
- Learn file I/O and data management
- Understand how messaging systems work under the hood

---

## 📞 Support

If you need to reset everything:
1. Delete the `data/` folder
2. Restart the server
3. Fresh CSV files will be created automatically

Enjoy your simple, transparent backend! 🎉
