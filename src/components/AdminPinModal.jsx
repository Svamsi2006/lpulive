import { useState } from 'react';
import './AdminPinModal.css';

function AdminPinModal({ isOpen, onVerify, onCancel, adminName }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    onVerify(pin);
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
    setError('');
  };

  const handleCancel = () => {
    setPin('');
    setError('');
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="admin-pin-overlay">
      <div className="admin-pin-modal">
        <div className="admin-pin-header">
          <div className="admin-shield">🛡️</div>
          <h2>Admin Verification</h2>
          <p className="admin-welcome">Welcome, {adminName}</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-pin-body">
          <div className="form-group">
            <label>Enter 4-Digit PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength="4"
              value={pin}
              onChange={handlePinChange}
              placeholder="••••"
              className="pin-input"
              autoFocus
            />
            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="pin-dots">
            {[0, 1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`pin-dot ${pin.length > i ? 'filled' : ''}`}
              />
            ))}
          </div>

          <div className="admin-pin-footer">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-verify"
              disabled={pin.length !== 4}
            >
              Verify PIN
            </button>
          </div>
        </form>

        <div className="admin-note">
          <span className="note-icon">ℹ️</span>
          <span>Admin access provides special privileges for managing groups and announcements</span>
        </div>
      </div>
    </div>
  );
}

export default AdminPinModal;
