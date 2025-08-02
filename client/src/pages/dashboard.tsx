// client/src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  Globe, Code, Database, Coffee, FileCode, Server, User, ChevronRight,
  BarChart2, Star, Target, BadgeCheck, CalendarCheck, Award, LineChart,
  Play, LogOut, CheckCircle, Moon, Zap, ShieldCheck, Search
} from 'lucide-react';
import {
  LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { computeAchievements } from '../utils/achievementRules';
import './dashboard.css';

const domains = [
  { name: 'Web Development', icon: <Globe className="domain-icon" />, slug: 'web-development' },
  { name: 'React', icon: <Code className="domain-icon" />, slug: 'react' },
  { name: 'Data Science', icon: <Database className="domain-icon" />, slug: 'data-science' },
  { name: 'Java', icon: <Coffee className="domain-icon" />, slug: 'java' },
  { name: 'Python', icon: <FileCode className="domain-icon" />, slug: 'python' },
  { name: 'Node.js', icon: <Server className="domain-icon" />, slug: 'node-js' },
  { name: 'HR & Behavioral', icon: <User className="domain-icon" />, slug: 'hr-behavioral' },
  { name: 'General Programming', icon: <ChevronRight className="domain-icon" />, slug: 'general-programming' },
];

const Dashboard: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState(domains[0]);
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [progress, setProgress] = useState({
    totalQuestions: 0,
    averageScore: 0,
    bestScore: 0,
    totalSessions: 0,
  });

  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<Record<string, boolean>>({});

  // 🔍 Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const fetchProgress = async () => {
    const token = localStorage.getItem('token');
    if (!token || !user?.email) return;

    try {
      const response = await fetch(`http://localhost:5000/api/progress/${user.email}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('🔍 Sessions fetched:', data.sessions);

      const sessions = data.sessions || [];
      const domainSessions = sessions.filter((s: any) => s.domain === selectedDomain.slug);

      const totalSessions = domainSessions.length;
      const totalQuestions = domainSessions.reduce((sum: number, s: any) => sum + s.totalQuestions, 0);
      const totalScore = domainSessions.reduce((sum: number, s: any) => sum + s.score, 0);
      const bestScore = domainSessions.reduce((max: number, s: any) => Math.max(max, s.score), 0);
      const averageScore = totalSessions > 0 ? totalScore / totalSessions : 0;

      setProgress({
        totalQuestions,
        averageScore: parseFloat(averageScore.toFixed(1)),
        bestScore,
        totalSessions,
      });

      const sortedSessions = [...domainSessions].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setRecentSessions(sortedSessions.slice(-5));

      const dataForChart = sortedSessions.slice(-10).map((session) => {
        const date = new Date(session.timestamp);
        const formattedDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        return {
          name: formattedDate,
          percentage: parseFloat(((session.score / session.totalQuestions) * 100).toFixed(1)),
        };
      });

      setChartData(dataForChart);
      setAchievements(computeAchievements(sessions));
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [selectedDomain, user]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/signup');
  };

  const formatDate = (timestamp: string) => new Date(timestamp).toLocaleString();

  // 🔍 Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const tier1Achievements = [
    { key: 'firstSteps', icon: <Target className="icon" />, title: 'First Steps', desc: 'Complete your first interview' },
    { key: 'gettingStarted', icon: <BarChart2 className="icon" />, title: 'Getting Started', desc: 'Answer 10 questions' },
    { key: 'excellence', icon: <BadgeCheck className="icon" />, title: 'Excellence', desc: 'Score 8+ in a session' },
    { key: 'dedicated', icon: <CalendarCheck className="icon" />, title: 'Dedicated', desc: 'Complete 5 sessions' },
    { key: 'versatile', icon: <Award className="icon" />, title: 'Versatile', desc: 'Practice 3 different domains' },
    { key: 'consistent', icon: <LineChart className="icon" />, title: 'Consistent', desc: 'Maintain 7+ average score' },
  ];

  const tier2Achievements = [
    { key: 'clutchPerformer', icon: <ShieldCheck className="icon" />, title: 'Clutch Performer', desc: 'Score 9+ in last 3 sessions' },
    { key: 'perfect10', icon: <Zap className="icon" />, title: 'Perfect 10', desc: 'Score 10/10 in a session' },
    { key: 'nightOwl', icon: <Moon className="icon" />, title: 'Night Owl', desc: 'Complete interview at night' },
  ];

  const isTier1Completed = tier1Achievements.every(a => achievements[a.key]);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>User Progress Dashboard</h1>
          <p>Track your interview performance and improvement over time</p>
        </div>

        <div className="user-info-dropdown">
          <div className="user-summary" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <User size={24} className="user-icon" />
            <div className="user-text">
              <p>Welcome, {user?.name || 'User'}!</p>
              <p className="email">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          {dropdownOpen && (
            <div className="dropdown-menu">
              <button onClick={() => navigate('/profile')} className="dropdown-item">
                ✏️ Edit Profile
              </button>
              <button onClick={handleSignOut} className="dropdown-item">
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="dashboard-container">
        <aside className="sidebar">
          <h2>Select Domain</h2>
          <nav>
            {domains.map((domain) => (
              <button
                key={domain.name}
                onClick={() => setSelectedDomain(domain)}
                className={`domain-button ${selectedDomain.name === domain.name ? 'selected' : ''}`}
              >
                {domain.icon}
                {domain.name}
              </button>
            ))}
          </nav>

          <section className="actions-section-below-sidebar">
            <h3>Actions</h3>
            <button className="progress-dashboard-button" onClick={() => navigate('/dashboard')}>
              <BarChart2 className="action-icon" /> Progress Dashboard
            </button>
            <button className="start-button" onClick={() => navigate('/start')}>
              <Play className="action-icon" /> Start Interview
            </button>
            <button className="signout-button" onClick={handleSignOut}>
              <LogOut className="action-icon" /> Sign Out
            </button>
          </section>
        </aside>

        <main className="main-content">
          <section
            className="dashboard-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <h2>Progress Dashboard</h2>
              <p>Tracking domain: {selectedDomain.name}</p>
            </div>

            {/* Search bar moved here */}
            <div className="search-bar-dashboard">
              {/* <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              /> */}
              {/* <button onClick={handleSearch} className="search-btn">
                <Search size={18} />
              </button> */}

              {searchResults.length > 0 && (
                <div className="search-results-dropdown">
                  {searchResults.map((u) => (
                    <div key={u.username} className="search-result-item">
                      <img src={u.avatarUrl} alt="avatar" className="avatar-thumb" />
                      <div>
                        <p>{u.username}</p>
                        <p className="text-sm text-gray-400">{u.bio}</p>
                      </div>
                      <button onClick={() => navigate(`/profile/${u.username}`)} className="view-btn">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="progress-cards">
            <div className="progress-card">
              <BarChart2 className="icon total-questions-icon" />
              <p className="value">{progress.totalQuestions}</p>
              <p className="label">Total Questions</p>
            </div>
            <div className="progress-card">
              <LineChart className="icon average-score-icon" />
              <p className="value highlight">{progress.averageScore}/10</p>
              <p className="label">Average Score</p>
            </div>
            <div className="progress-card">
              <Star className="icon best-score-icon" />
              <p className="value highlight">{progress.bestScore}/10</p>
              <p className="label">Best Score</p>
            </div>
            <div className="progress-card">
              <CalendarCheck className="icon total-sessions-icon" />
              <p className="value">{progress.totalSessions}</p>
              <p className="label">Total Sessions</p>
            </div>
          </section>

          <section className="dashboard-details">
            <div className="recent-sessions">
              <h3>Recent Sessions (Last 5)</h3>
              <ul className="recent-sessions-list">
                {recentSessions.map((session, index) => (
                  <li key={index} className="session-item">
                    <p>
                      <strong>Score:</strong> {session.score}/{session.totalQuestions}
                    </p>
                    <p>
                      <strong>Date:</strong> {formatDate(session.timestamp)}
                    </p>
                    <p>
                      <strong>Time Taken:</strong> {formatDuration(session.durationSeconds || 0)}
                    </p>
                    {session.summaryFeedback && (
                      <div className="feedback-summary">
                        <p>
                          <strong>Feedback:</strong> {session.summaryFeedback}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="domain-performance">
              <h3>Domain Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ReLineChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#cbd5e0" />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="#cbd5e0" />
                  <Tooltip
                    contentStyle={{
                      background: '#4c1d95',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                    }}
                    labelStyle={{ color: '#a78bfa' }}
                    formatter={(value: any) => `${value}%`}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    name="% Score"
                    stroke="#a78bfa"
                    strokeWidth={3}
                    dot={{ r: 6, stroke: '#a78bfa', strokeWidth: 2, fill: '#4c1d95' }}
                    activeDot={{ r: 8 }}
                  />
                </ReLineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="achievement-cards">
            {tier1Achievements.map((a) => (
              <div key={a.key} className={`achievement-card ${achievements[a.key] ? 'unlocked' : 'locked'}`}>
                {achievements[a.key] && <CheckCircle className="checkmark-icon" />}
                {a.icon}
                <div>
                  <h4>{a.title}</h4>
                  <p>{a.desc}</p>
                </div>
              </div>
            ))}

            {isTier1Completed &&
              tier2Achievements.map((a) => (
                <div key={a.key} className={`achievement-card ${achievements[a.key] ? 'unlocked' : 'locked'}`}>
                  {achievements[a.key] && <CheckCircle className="checkmark-icon" />}
                  {a.icon}
                  <div>
                    <h4>{a.title}</h4>
                    <p>{a.desc}</p>
                  </div>
                </div>
              ))}
          </section>
        </main>
      </div>
    </>
  );
};

export default Dashboard;