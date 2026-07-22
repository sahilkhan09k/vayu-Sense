import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import './AuthPages.css';

export function ChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const { changePassword, error, loading, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!newPassword || !confirmPassword) {
      setValidationError('Please fill in all fields.');
      return;
    }

    if (newPassword.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    try {
      const { redirectTo } = await changePassword(newPassword);
      navigate(redirectTo);
    } catch {
      // Error handled by AuthContext
    }
  };

  return (
    <AuthLayout>
      <div className="auth-page-header">
        <h2 className="auth-title">Update Key Credentials</h2>
        <p className="auth-subtitle">Initialize your authority account by changing your temporary key.</p>
      </div>

      {(validationError || error) && (
        <div className="auth-error-alert">
          <span>⚠️</span>
          <span>{validationError || error}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="new-password">
            New Security Key / Password (Min 8 chars)
          </label>
          <div className="input-wrapper">
            <input
              type="password"
              id="new-password"
              className="form-input font-mono"
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="confirm-password">
            Confirm Password
          </label>
          <div className="input-wrapper">
            <input
              type="password"
              id="confirm-password"
              className="form-input font-mono"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? (
            <>
              <div className="loading-spinner"></div>
              <span>Securing account keys...</span>
            </>
          ) : (
            <span>Update Credentials</span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
