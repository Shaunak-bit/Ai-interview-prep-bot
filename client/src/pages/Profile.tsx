// client/src/pages/Profile.tsx
import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import {
  Globe, Code, Database, Coffee, FileCode, Server,
  User, BarChart2, Star, Target, CalendarCheck,
  LineChart, CheckCircle
} from 'lucide-react';
import { computeAchievements } from '../utils/achievementRules';
import './profile.css';

const availableDomains = [
  { name: 'React', icon: <Code className="domain-icon" /> },
  { name: 'Node.js', icon: <Server className="domain-icon" /> },
  { name: 'Python', icon: <FileCode className="domain-icon" /> },
  { name: 'Java', icon: <Coffee className="domain-icon" /> },
  { name: 'Data Science', icon: <Database className="domain-icon" /> },
  { name: 'Web Development', icon: <Globe className="domain-icon" /> },
  { name: 'HR & Behavioral', icon: <User className="domain-icon" /> },
];

const Profile = () => {
  const { user } = useUser();
  const [profile, setProfile] = useState({ name: '', bio: '', avatar: '', preferredDomains: [] });
  const [avatarFile, setAvatarFile] = useState<null | File>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [progress, setProgress] = useState({
    totalInterviews: 0,
    successRate: 0,
    averageScore: 0,
    practiceHours: '',
    currentStreak: 0,
  });
  const [achievements, setAchievements] = useState<Record<string, boolean>>({});
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const encodedEmail = encodeURIComponent(user.email!);
      const res = await fetch(`http://localhost:5000/api/profile/${encodedEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 404) {
        const createRes = await fetch('http://localhost:5000/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name || '',
            avatar: '',
            bio: '',
            preferredDomains: [],
          }),
        });
        if (createRes.ok) {
          const newProfile = await createRes.json();
          setProfile(newProfile);
        }
      } else if (res.ok) {
        const data = await res.json();
        setProfile({ ...data, preferredDomains: data.preferredDomains || [] });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressAndAchievements = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`http://localhost:5000/api/progress/${user.email}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const result = await res.json();
        const sessions = result.sessions || [];

        setAchievements(computeAchievements(sessions));

        const totalInterviews = sessions.length;
        const passedSessions = sessions.filter((s: any) => s.score >= 7).length;
        const successRate = totalInterviews > 0 ? Math.round((passedSessions / totalInterviews) * 100) : 0;
        const averageScore = totalInterviews > 0
          ? (sessions.reduce((sum: number, s: any) => sum + s.score, 0) / totalInterviews).toFixed(1)
          : 0;

        const totalPracticeSeconds = sessions.reduce(
          (sum: number, s: any) => sum + (s.durationSeconds || 0), 0);
        const hours = Math.floor(totalPracticeSeconds / 3600);
        const minutes = Math.floor((totalPracticeSeconds % 3600) / 60);
        const practiceHours = `${hours}h ${minutes}m`;

        const sortedSessions = [...sessions].sort(
          (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        let streak = 0;
        let lastDate: Date | null = null;
        for (const session of sortedSessions) {
          const sessionDate = new Date(session.timestamp);
          if (!lastDate) streak = 1;
          else {
            const diffDays = Math.floor((lastDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) streak++;
            else if (diffDays > 1) break;
          }
          lastDate = sessionDate;
        }

        setProgress({
          totalInterviews,
          successRate,
          averageScore,
          practiceHours,
          currentStreak: streak,
        });

        setRecentSessions(sortedSessions.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
    }
  };

  const updateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const encodedEmail = encodeURIComponent(user.email!);

      // 1️⃣ Build FormData instead of JSON
      const formData = new FormData();
      formData.append('name', profile.name);
      formData.append('bio', profile.bio);
      formData.append('preferredDomains', JSON.stringify(profile.preferredDomains));
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await fetch(`http://localhost:5000/api/profile/${encodedEmail}`, {
       method: 'PUT', 
        headers: {
          // ❗ Do NOT set Content-Type manually; let the browser do it
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        alert('Profile updated successfully!');
        setEditMode(false);
        setAvatarPreview('');
        setAvatarFile(null);
        fetchProfile();
      } else {
        const { error } = await res.json();
        alert('Update failed: ' + (error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchProfile();
      fetchProgressAndAchievements();
    }
  }, [user]);

  const handleDomainToggle = (domain: string) => {
    setProfile(prev => {
      const alreadySelected = prev.preferredDomains.includes(domain);
      const updatedDomains = alreadySelected
        ? prev.preferredDomains.filter(d => d !== domain)
        : [...prev.preferredDomains, domain];
      return { ...prev, preferredDomains: updatedDomains };
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) return <div className="profile-container">Loading profile...</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
  {(() => {
    const avatarSrc = avatarPreview || profile.avatar;
    return avatarSrc ? (
      <img src={avatarSrc} alt="Avatar" className="profile-avatar" />
    ) : (
      <div className="default-avatar">👤</div>
    );
  })()}

        <div className="profile-info">
          <h2>{profile.name}</h2>
          {!editMode && (
            <button className="edit-profile-btn" onClick={() => setEditMode(true)}>✏️ Edit Profile</button>
          )}
        </div>
      </div>

      <div className="profile-form">
        {editMode && (
          <div className="avatar-upload">
            <label>Upload New Avatar:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                }
              }}
            />
          </div>
        )}

        <label>Bio</label>
        {editMode ? (
          <textarea
            rows={3}
            value={profile.bio}
            onChange={e => setProfile({ ...profile, bio: e.target.value })}
          />
        ) : (
          <p className="bio-text">{profile.bio}</p>
        )}

        <label>Preferred Domains</label>
        {editMode ? (
          <div className="domain-checkbox-group">
            {availableDomains.map(domain => (
              <label key={domain.name} className="domain-label">
                <input
                  type="checkbox"
                  checked={(profile.preferredDomains || []).includes(domain.name)}
                  onChange={() => handleDomainToggle(domain.name)}
                />
                {domain.icon} {domain.name}
              </label>
            ))}
          </div>
        ) : (
          <div className="preferred-domains-display">
            {(profile.preferredDomains || []).map(domain => {
              const domainObj = availableDomains.find(d => d.name === domain);
              return (
                <span key={domain} className="domain-badge">
                  {domainObj?.icon} {domain}
                </span>
              );
            })}
          </div>
        )}

        {editMode && (
          <div className="profile-buttons">
            <button className="save-button" onClick={updateProfile}>Save</button>
            <button className="cancel-button" onClick={() => setEditMode(false)}>Cancel</button>
          </div>
        )}
      </div>

      <section className="achievements-section">
        <h3>Achievements</h3>
        <div className="achievement-cards">
          {Object.entries(achievements)
            .filter(([, unlocked]) => unlocked)
            .map(([key]) => {
              const titles: any = {
                firstSteps: 'First Steps',
                gettingStarted: 'Getting Started',
                excellence: 'Excellence',
                dedicated: 'Dedicated',
                versatile: 'Versatile',
                consistent: 'Consistent',
                perfect10: 'Perfect 10',
                clutchPerformer: 'Clutch Performer',
                nightOwl: 'Night Owl',
                speedDemon: 'Speed Demon',
              };
              return (
                <div key={key} className="achievement-card unlocked">
                  <CheckCircle className="checkmark-icon" />
                  <div>
                    <h4>{titles[key] || key}</h4>
                    <p>Achievement unlocked</p>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      <section className="progress-metrics">
        <h3>Progress Metrics</h3>
        <div className="progress-cards">
          <div className="progress-card"><BarChart2 className="icon" /><p className="value">{progress.totalInterviews}</p><p className="label">Total Interviews</p></div>
          <div className="progress-card"><Star className="icon" /><p className="value">{progress.successRate}%</p><p className="label">Success Rate</p></div>
          <div className="progress-card"><Target className="icon" /><p className="value">{progress.averageScore}</p><p className="label">Average Score</p></div>
          <div className="progress-card"><CalendarCheck className="icon" /><p className="value">{progress.practiceHours}</p><p className="label">Practice Hours</p></div>
          <div className="progress-card"><LineChart className="icon" /><p className="value">{progress.currentStreak}</p><p className="label">Current Streak</p></div>
        </div>
      </section>

      <section className="interview-history">
        <h3>Interview History (Last 5)</h3>
        <ul className="recent-sessions-list">
          {(recentSessions || []).map((session, index) => (
            <li key={index} className="session-item">
              <p><strong>Score:</strong> {session.score}/{session.totalQuestions}</p>
              <p><strong>Date:</strong> {new Date(session.timestamp).toLocaleString()}</p>
              <p><strong>Duration:</strong> {formatDuration(session.durationSeconds || 0)}</p>
              <p><strong>Domain:</strong> {session.domain}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Profile;