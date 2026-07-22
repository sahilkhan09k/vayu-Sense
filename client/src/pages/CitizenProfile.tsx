/**
 * CitizenProfile.tsx — Page 12
 * Health profile setup for personalized AQI advisories.
 * Saved to localStorage — no server required.
 */
import { useState, useEffect } from 'react';
import { CitizenLayout } from '../components/citizen/CitizenLayout';
import { CheckCircle2, User, Heart, Baby, Users } from 'lucide-react';
import './CitizenProfile.css';

const AGE_GROUPS = [
  { id: 'Child', label: 'Child', sub: 'Under 14', icon: Baby },
  { id: 'Adult', label: 'Adult', sub: '14–60 years', icon: User },
  { id: 'Senior', label: 'Senior', sub: '60+ years', icon: Users },
];

const SENSITIVITIES = [
  { id: 'Normal', label: 'No Conditions', desc: 'Healthy individual', color: '#10b981' },
  { id: 'Asthma', label: 'Asthma', desc: 'Respiratory sensitivity', color: '#f59e0b' },
  { id: 'Heart Condition', label: 'Heart Condition', desc: 'Cardiovascular sensitivity', color: '#ef4444' },
  { id: 'Pregnant', label: 'Pregnant', desc: 'Enhanced protection needed', color: '#8b5cf6' },
  { id: 'Elderly Lungs', label: 'Elderly Lungs', desc: 'Age-related sensitivity', color: '#f97316' },
];

const CITIES = ['Mumbai', 'Delhi', 'Bengaluru'];

interface Profile {
  ageGroup: string;
  sensitivity: string;
  city: string;
  name: string;
}

export function CitizenProfile() {
  const [profile, setProfile] = useState<Profile>({
    ageGroup: 'Adult',
    sensitivity: 'Normal',
    city: 'Mumbai',
    name: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('citizenProfile');
    if (stored) {
      try { setProfile(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('citizenProfile', JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <CitizenLayout title="My Profile">
      <div className="profile-intro">
        <h1 className="profile-heading">Health Profile</h1>
        <p className="profile-sub">Personalize your AQI advisories based on your health needs.</p>
      </div>

      {/* Name */}
      <div className="profile-card">
        <label className="profile-label">Display Name</label>
        <input
          className="profile-input"
          type="text"
          placeholder="Your name…"
          value={profile.name}
          onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
        />
      </div>

      {/* City */}
      <div className="profile-card">
        <label className="profile-label">Your City</label>
        <div className="profile-city-row">
          {CITIES.map((c) => (
            <button
              key={c}
              className={`profile-city-btn ${profile.city === c ? 'profile-city-btn--active' : ''}`}
              onClick={() => setProfile((p) => ({ ...p, city: c }))}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Age Group */}
      <div className="profile-card">
        <label className="profile-label">Age Group</label>
        <div className="profile-age-grid">
          {AGE_GROUPS.map(({ id, label, sub, icon: Icon }) => (
            <button
              key={id}
              className={`profile-age-btn ${profile.ageGroup === id ? 'profile-age-btn--active' : ''}`}
              onClick={() => setProfile((p) => ({ ...p, ageGroup: id }))}
            >
              <Icon size={22} />
              <span className="profile-age-label">{label}</span>
              <span className="profile-age-sub">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sensitivity */}
      <div className="profile-card">
        <label className="profile-label">Health Sensitivity</label>
        <div className="profile-sensitivity-list">
          {SENSITIVITIES.map(({ id, label, desc, color }) => (
            <button
              key={id}
              className={`profile-sens-row ${profile.sensitivity === id ? 'profile-sens-row--active' : ''}`}
              style={profile.sensitivity === id ? { borderColor: color, background: `${color}10` } : {}}
              onClick={() => setProfile((p) => ({ ...p, sensitivity: id }))}
            >
              <div className="profile-sens-dot" style={{ background: color }} />
              <div className="profile-sens-text">
                <span className="profile-sens-label">{label}</span>
                <span className="profile-sens-desc">{desc}</span>
              </div>
              {profile.sensitivity === id && (
                <CheckCircle2 size={16} style={{ color, flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        className={`profile-save-btn ${saved ? 'profile-save-btn--saved' : ''}`}
        onClick={handleSave}
      >
        {saved ? (
          <>
            <CheckCircle2 size={18} />
            Profile Saved!
          </>
        ) : (
          <>
            <Heart size={18} />
            Save Health Profile
          </>
        )}
      </button>

      {/* Current Summary */}
      <div className="profile-summary">
        <p className="profile-summary-title">Current Profile</p>
        <div className="profile-summary-chips">
          <span className="profile-chip">{profile.city}</span>
          <span className="profile-chip">{profile.ageGroup}</span>
          <span className="profile-chip">{profile.sensitivity}</span>
        </div>
      </div>
    </CitizenLayout>
  );
}
