# LPU Live - Functionality Test Checklist

## 🚀 Server Status
- [x] Backend running on ${import.meta.env.PROD ? '' : 'http://localhost:5000'}
- [x] Frontend running on http://localhost:3000
- [x] 8580 students loaded
- [x] Socket.IO ready

## 🔐 Authentication Tests

### Regular User Login
- [ ] Open http://localhost:3000
- [ ] Login with any registration number (e.g., 12309973)
- [ ] Enter default password: `password123`
- [ ] Should see chat interface

### Admin Login
- [ ] Login with registration number: `12309972`
- [ ] Enter default password: `password123`
- [ ] **PIN Modal should appear**
- [ ] Enter PIN: `2006`
- [ ] Should see admin interface with extra options

## 💬 Chat Features

### Personal Chats
- [ ] Click on "Chats" in sidebar
- [ ] Search for a user by name or registration number
- [ ] Click on a user to start a chat
- [ ] Send a text message
- [ ] Send an emoji
- [ ] Upload an image (should see preview)
- [ ] Messages should appear in real-time

### Group Chats
- [ ] Click on "Groups" in sidebar
- [ ] Click "+ Create Group" button
- [ ] Enter group name
- [ ] Search and select multiple members
- [ ] Click "Create Group"
- [ ] **This should work without errors**
- [ ] Send messages in the group
- [ ] All members should receive messages

## 👨‍💼 Admin-Only Features

### University Groups (Admin Only)
- [ ] Login as admin (12309972, PIN: 2006)
- [ ] Click on "University Groups" in sidebar
- [ ] Click "+ Create University Group"
- [ ] Create a group (e.g., "CSE Department")
- [ ] Group should appear in University Groups section
- [ ] Regular users should see these groups but cannot create them

### Announcements (Admin Only)
- [ ] Login as admin
- [ ] Click on "Announcements" in sidebar
- [ ] Type an announcement message
- [ ] Click "Post Announcement"
- [ ] Announcement should appear at the top
- [ ] Regular users can see but cannot post announcements

## 🔧 UI/UX Tests

### Sidebar Navigation
- [ ] Click "Chats" - should show recent chats
- [ ] Click "Groups" - should show your groups
- [ ] Click "University Groups" - should show university groups
- [ ] Click "Announcements" - should show announcements
- [ ] Click "Report Bug" - should show bug report form

### Search Functionality
- [ ] Search bar should filter chats/users in real-time
- [ ] Should highlight matching text
- [ ] Should show "No results" when nothing matches

### Responsive Design
- [ ] Resize browser window
- [ ] UI should adapt to different screen sizes
- [ ] Mobile view should show hamburger menu

## 🐛 Known Issues to Check

### Group Creation Error (Previously Fixed)
- [ ] Create a new group
- [ ] Should NOT show "Failed to create group" error
- [ ] Group should appear in the list immediately
- [ ] Should be able to open and use the group

### React Hooks Error (Fixed)
- [ ] Open browser Developer Tools (F12)
- [ ] Go to Console tab
- [ ] Should NOT see "React hooks" errors
- [ ] Should NOT see "Cannot update a component while rendering" errors

## 📊 Data Persistence

### CSV Storage
- [ ] Send a message
- [ ] Check `data/messages.csv` - message should be saved
- [ ] Create a group
- [ ] Check `data/groups.csv` - group should be saved
- [ ] Post announcement (admin)
- [ ] Check `data/announcements.csv` - announcement should be saved

## 🔍 Browser Console Check
Open Developer Tools (F12) and check:
- [ ] No red errors in Console
- [ ] No 404 errors in Network tab
- [ ] WebSocket connection should show "connected"

## ✅ Final Verification

### Multi-User Test
1. [ ] Open browser in normal window - login as User 1
2. [ ] Open browser in incognito - login as User 2
3. [ ] Send message from User 1 to User 2
4. [ ] User 2 should receive message in real-time
5. [ ] Reply from User 2
6. [ ] User 1 should see reply instantly

### Admin Privileges Test
1. [ ] Login as regular user
2. [ ] Should NOT see "Create University Group" button
3. [ ] Should NOT see announcement post box
4. [ ] Logout and login as admin
5. [ ] Should see all admin features

---

## 🎯 Critical Tests (Must Pass)

1. **Login works for both admin and regular users**
2. **Admin PIN (2006) verification works**
3. **Group creation works without errors**
4. **Messages send and receive in real-time**
5. **Admin can create university groups**
6. **Admin can post announcements**

## 📝 How to Test

1. Open http://localhost:3000 in your browser
2. Go through each checklist item
3. Mark with `[x]` if it works
4. Note any issues you encounter

## 🆘 If Something Doesn't Work

1. Check browser console (F12) for errors
2. Check terminal output for backend errors
3. Verify both servers are running
4. Check CSV files in `data/` folder
5. Try refreshing the page
6. Try logging out and back in

---

**Date Tested**: ___________
**Tested By**: ___________
**Browser**: ___________
**Result**: PASS / FAIL
**Notes**: ___________
