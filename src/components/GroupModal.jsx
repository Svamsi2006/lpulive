import { useState, useEffect } from 'react';
import './GroupModal.css';

function GroupModal({ isOpen, onClose, onCreateGroup, currentUser }) {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load all users from student_data.json
  useEffect(() => {
    if (isOpen) {
      fetch('/student_data.json')
        .then(res => res.json())
        .then(data => {
          // Filter out current user
          const users = data.filter(
            user => user['Registration Number'] !== currentUser
          );
          setAllUsers(users);
          setFilteredUsers(users.slice(0, 20)); // Show first 20 initially
        })
        .catch(err => console.error('Failed to load users:', err));
    }
  }, [isOpen, currentUser]);

  // Filter users based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(allUsers.slice(0, 20));
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allUsers.filter(user => 
        user['Name'].toLowerCase().includes(query) ||
        user['Registration Number'].toLowerCase().includes(query)
      ).slice(0, 20);
      setFilteredUsers(filtered);
    }
  }, [searchQuery, allUsers]);

  const handleToggleMember = (regNumber) => {
    setSelectedMembers(prev => {
      if (prev.includes(regNumber)) {
        return prev.filter(m => m !== regNumber);
      } else {
        return [...prev, regNumber];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (selectedMembers.length === 0) {
      alert('Please select at least one member');
      return;
    }

    setIsLoading(true);
    try {
      await onCreateGroup(groupName, selectedMembers);
      // Reset form
      setGroupName('');
      setSearchQuery('');
      setSelectedMembers([]);
      onClose();
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSearchQuery('');
    setSelectedMembers([]);
    onClose();
  };

  if (!isOpen) return null;

  const getSelectedUserNames = () => {
    return selectedMembers.map(regNum => {
      const user = allUsers.find(u => u['Registration Number'] === regNum);
      return user ? user['Name'] : regNum;
    });
  };

  return (
    <div className="group-modal-overlay" onClick={handleClose}>
      <div className="group-modal" onClick={(e) => e.stopPropagation()}>
        <div className="group-modal-header">
          <h2>Create New Group</h2>
          <button className="close-btn" onClick={handleClose}>&times;</button>
        </div>

        <div className="group-modal-body">
          {/* Group Name Input */}
          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="group-name-input"
            />
          </div>

          {/* Selected Members Display */}
          {selectedMembers.length > 0 && (
            <div className="selected-members">
              <label>Selected Members ({selectedMembers.length})</label>
              <div className="selected-members-list">
                {getSelectedUserNames().map((name, idx) => (
                  <span key={idx} className="selected-member-tag">
                    {name}
                    <button 
                      onClick={() => handleToggleMember(selectedMembers[idx])}
                      className="remove-member-btn"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search Users */}
          <div className="form-group">
            <label>Add Members</label>
            <input
              type="text"
              placeholder="Search by name or reg number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* User List */}
          <div className="user-list">
            {filteredUsers.map(user => {
              const regNumber = user['Registration Number'];
              const isSelected = selectedMembers.includes(regNumber);
              
              return (
                <div 
                  key={regNumber} 
                  className={`user-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleToggleMember(regNumber)}
                >
                  <div className="user-avatar">
                    {user['Name'].charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user['Name']}</div>
                    <div className="user-details">
                      {regNumber}
                    </div>
                  </div>
                  <div className="user-checkbox">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => {}}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="group-modal-footer">
          <button 
            className="btn-cancel" 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="btn-create" 
            onClick={handleCreateGroup}
            disabled={isLoading || !groupName.trim() || selectedMembers.length === 0}
          >
            {isLoading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroupModal;
