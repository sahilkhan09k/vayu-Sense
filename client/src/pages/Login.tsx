import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import './AuthPages.css';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const { login, error, loading, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!email || !password) {
      setValidationError('Please fill in all fields.');
      return;
    }

    try {
      const { redirectTo } = await login(email, password);
      navigate(redirectTo);
    } catch {
      // Error is handled by AuthContext
    }
  };

  return (
    <AuthLayout>
      <div className="auth-page-header">
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Sign in to access your AQI command terminal</p>
      </div>

      {(validationError || error) && (
        <div className="auth-error-alert">
          <span>⚠️</span>
          <span>{validationError || error}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email Address
          </label>
          <div className="input-wrapper">
            <input
              type="email"
              id="email"
              className="form-input font-mono"
              placeholder="operator@vayusense.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">
            Security Key / Password
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

        <div className="form-options">
          <label className="remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
            />
            <span>Remember session</span>
          </label>
          <a href="#forgot" style={{ fontSize: '12px' }} onClick={(e) => e.preventDefault()}>
            Reset Key
          </a>
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? (
            <>
              <div className="loading-spinner"></div>
              <span>Verifying credentials...</span>
            </>
          ) : (
            <span>Authenticate terminal</span>
          )}
        </button>
      </form>

      <p className="auth-redirect-link">
        New here?
        <Link to="/register">Create a citizen account</Link>
      </p>
    </AuthLayout>
  );
}
