import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, UserPlus, Building2 } from 'lucide-react';
import './CityAuthoritiesPanel.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';

const CITY_OPTIONS = ['Mumbai', 'Delhi', 'Bengaluru'] as const;

interface CityAuthority {
  id: string;
  name: string;
  email: string;
  city: string;
  state: string | null;
  tempPasswordChanged: boolean;
  createdAt: string;
}

interface GeneratedCredentials {
  email: string;
  tempPassword: string;
  name: string;
  city: string;
}

export function CityAuthoritiesPanel() {
  const [authorities, setAuthorities] = useState<CityAuthority[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState<string>(CITY_OPTIONS[0]);

  const [generatedCreds, setGeneratedCreds] = useState<GeneratedCredentials | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchAuthorities = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`${API_BASE}/auth/city-authorities`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load city authorities');
      const data = await res.json();
      setAuthorities(data.authorities);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load city authorities');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchAuthorities();
  }, [fetchAuthorities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/auth/create-city-authority`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, city }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create city authority');

      setGeneratedCreds({
        email: data.user.email,
        tempPassword: data.tempPassword,
        name: data.user.name,
        city: data.user.city,
      });

      setName('');
      setEmail('');
      setCity(CITY_OPTIONS[0]);
      await fetchAuthorities();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create city authority');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!generatedCreds) return;
    const text = `VayuSense City Authority Credentials\n\nName: ${generatedCreds.name}\nCity: ${generatedCreds.city}\nEmail: ${generatedCreds.email}\nTemporary Password: ${generatedCreds.tempPassword}\n\nThe city authority must change this password on first login.`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="city-auth-panel">
      <div className="city-auth-panel__header">
        <div className="city-auth-panel__title-row">
          <Building2 size={18} className="city-auth-panel__icon" />
          <div>
            <h2 className="city-auth-panel__title">City Authorities</h2>
            <p className="city-auth-panel__subtitle">
              Generate credentials for city-level administrators. Share them manually — shown once.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="city-auth-panel__error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {generatedCreds && (
        <div className="city-auth-panel__creds-card">
          <div className="city-auth-panel__creds-header">
            <span className="city-auth-panel__creds-badge">Credentials generated</span>
            <button type="button" className="city-auth-panel__dismiss" onClick={() => setGeneratedCreds(null)}>
              Dismiss
            </button>
          </div>
          <p className="city-auth-panel__creds-warning">
            Copy these credentials now. The temporary password will not be shown again.
          </p>
          <dl className="city-auth-panel__creds-list">
            <div><dt>Name</dt><dd>{generatedCreds.name}</dd></div>
            <div><dt>City</dt><dd>{generatedCreds.city}</dd></div>
            <div><dt>Email</dt><dd className="font-mono">{generatedCreds.email}</dd></div>
            <div><dt>Temp password</dt><dd className="font-mono city-auth-panel__password">{generatedCreds.tempPassword}</dd></div>
          </dl>
          <button type="button" className="city-auth-panel__copy-btn" onClick={handleCopyCredentials}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy credentials'}
          </button>
        </div>
      )}

      <form className="city-auth-panel__form" onSubmit={handleSubmit}>
        <div className="city-auth-panel__form-grid">
          <div className="city-auth-panel__field">
            <label htmlFor="ca-name">Authority name</label>
            <input
              id="ca-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rajesh Kumar"
              required
              minLength={2}
              disabled={submitting}
            />
          </div>
          <div className="city-auth-panel__field">
            <label htmlFor="ca-email">Email</label>
            <input
              id="ca-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rajesh@mumbai.gov.in"
              required
              disabled={submitting}
              className="font-mono"
            />
          </div>
          <div className="city-auth-panel__field">
            <label htmlFor="ca-city">City</label>
            <select
              id="ca-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={submitting}
            >
              {CITY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" className="city-auth-panel__submit" disabled={submitting}>
          {submitting ? (
            <>
              <div className="loading-spinner" />
              Generating credentials…
            </>
          ) : (
            <>
              <UserPlus size={16} />
              Generate city authority
            </>
          )}
        </button>
      </form>

      <div className="city-auth-panel__table-wrap">
        <h3 className="city-auth-panel__table-title">Existing city authorities</h3>
        {loadingList ? (
          <p className="city-auth-panel__empty">Loading…</p>
        ) : authorities.length === 0 ? (
          <p className="city-auth-panel__empty">No city authorities created yet.</p>
        ) : (
          <table className="city-auth-panel__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>City</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {authorities.map((auth) => (
                <tr key={auth.id}>
                  <td>{auth.name}</td>
                  <td className="font-mono">{auth.email}</td>
                  <td>{auth.city}</td>
                  <td>
                    <span className={`city-auth-panel__status ${auth.tempPasswordChanged ? 'city-auth-panel__status--active' : 'city-auth-panel__status--pending'}`}>
                      {auth.tempPasswordChanged ? 'Active' : 'Pending password change'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
