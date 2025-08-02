import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Code,
  Database,
  Coffee,
  FileCode,
  Server,
  User,
  ChevronRight,
  MessageSquare,
  BarChart2,
  Play,
  LogOut,
  Sparkles
} from 'lucide-react';
import './InterviewCoach.css';

const domains = [
  { name: 'Web Development', icon: <Globe className="domain-icon" /> },
  { name: 'React', icon: <Code className="domain-icon" /> },
  { name: 'Data Science', icon: <Database className="domain-icon" /> },
  { name: 'Java', icon: <Coffee className="domain-icon" /> },
  { name: 'Python', icon: <FileCode className="domain-icon" /> },
  { name: 'Node.js', icon: <Server className="domain-icon" /> },
  { name: 'HR & Behavioral', icon: <User className="domain-icon" /> },
  { name: 'General Programming', icon: <ChevronRight className="domain-icon" /> },
];

const InterviewCoach: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState('General Programming');
  const navigate = useNavigate();

  return (
    <>
      <header className="page-header">
        <div>
          <h1>AI Interview Coach</h1>
          <p>Practice interviews with domain-specific questions and get AI-powered feedback</p>
        </div>
        <div className="user-info">
          <p>Welcome, SHAUNAK KUNDU!</p>
          <p className="email">bananikundu22@gmail.com</p>
        </div>
      </header>

      <div className="interview-coach">
        <aside className="sidebar">
          <h2>Select Domain</h2>
          <nav>
            {domains.map((domain) => (
              <button
                key={domain.name}
                onClick={() => setSelectedDomain(domain.name)}
                className={`domain-button ${selectedDomain === domain.name ? 'selected' : ''}`}
              >
                {domain.icon}
                {domain.name}
              </button>
            ))}
          </nav>

          <section className="actions-section-below-sidebar">
            <h3>Actions</h3>

            <button className="interview-chat-button" onClick={() => navigate('/chat')}>
              <MessageSquare className="action-icon" />
              Interview Chat
            </button>

            <button className="progress-dashboard-button" onClick={() => navigate('/dashboard')}>
              <BarChart2 className="action-icon" />
              Progress Dashboard
            </button>

            <button className="start-button" onClick={() => navigate('/start')}>
              <Play className="action-icon" />
              Start Interview
            </button>

            <button className="signout-button">
              <LogOut className="action-icon" />
              Sign Out
            </button>
          </section>
        </aside>

        <main className="main-content">
          <section className="welcome-section">
            <Sparkles size={32} strokeWidth={2} />
            <h2>Welcome to the AI Interview Coach!</h2>
            <p>Select a domain and start practicing interview questions. Get real-time feedback and improve your skills.</p>
            <div className="tip-box">
              💡 Tip: Choose a domain that matches your career goals for the most relevant practice questions.
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default InterviewCoach;
