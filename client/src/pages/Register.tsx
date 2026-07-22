import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import './AuthPages.css';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { register, error, loading, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!name || !email || !password || !confirmPassword) {
      setValidationError('All fields are required.');
      return;
    }

    if (name.trim().length < 2) {
      setValidationError('Name must be at least 2 characters.');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    try {
      const { redirectTo } = await register(name, email, password);
      navigate(redirectTo);
    } catch {
      // Error is handled by AuthContext
    }
  };

  return (
    <AuthLayout>
      <div className="auth-page-header">
        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">Register as a citizen to access local air quality advisories</p>
      </div>

      {(validationError || error) && (
        <div className="auth-error-alert">
          <span>⚠️</span>
          <span>{validationError || error}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">
            Full Name
          </label>
          <div className="input-wrapper">
            <input
              type="text"
              id="name"
              className="form-input"
              placeholder="Aditya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email Address
          </label>
          <div className="input-wrapper">
            <input
              type="email"
              id="email"
              className="form-input font-mono"
              placeholder="aditya@vayusense.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">
            Security Key / Password (Min 8 chars)
          </label>
          <div className="input-wrapper">
            <input
              type="password"
              id="password"
              className="form-input font-mono"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <div className="input-wrapper">
            <input
              type="password"
              id="confirmPassword"
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
              <span>Registering operator...</span>
            </>
          ) : (
            <span>Create account</span>
          )}
        </button>
      </form>

      <p className="auth-redirect-link">
        Already have an account?
        <Link to="/login">Sign in here</Link>
      </p>
    </AuthLayout>
  );
}
