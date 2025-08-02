// client/src/pages/Interview.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Code,
  Database,
  Coffee,
  FileCode,
  Server,
  User,
  ChevronRight,
  LogOut,
  Circle,
  X,
  BarChart2,
  Play,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import './Interview.css';

/* ---------- Domain Config ---------- */
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

const domainToSlug: Record<string, string> = {
  'Web Development': 'web-development',
  React: 'react',
  'Data Science': 'data-science',
  Java: 'java',
  Python: 'python',
  'Node.js': 'node-js',
  'HR & Behavioral': 'hr-behavioral',
  'General Programming': 'general-programming',
};

/* ---------- Main Component ---------- */
const Interview: React.FC = () => {
  const { user } = useUser();

  /* ---------- State ---------- */
  const [selectedDomain, setSelectedDomain] = useState('General Programming');
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [sessionAnswers, setSessionAnswers] = useState<
    { question: string; answer: string; score: number }[]
  >([]);
  const [input, setInput] = useState('');
  const [liveInterview, setLiveInterview] = useState(false);
  const [feedbacks, setFeedbacks] = useState<string[]>([]);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [finalFeedback, setFinalFeedback] = useState('');

  /* ---------- Refs ---------- */
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);

  /* ---------- Timer Effect ---------- */
  useEffect(() => {
    if (!liveInterview || !questions.length || interviewComplete) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(60);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          if (!userAnswers[currentQuestionIndex]) {
            setUserAnswers((a) => [...a, '']);
            setFeedbacks((f) => [...f, 'No answer']);
            setFeedbackMessage('You did not answer this question in time.');
            setLastAnswerCorrect(false);
            setShowFeedback(true);
            setInputDisabled(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex, liveInterview, questions, interviewComplete, userAnswers]);

  /* ---------- Start Interview ---------- */
  const startInterview = async (domainName: string) => {
    setSelectedDomain(domainName);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setUserAnswers([]);
    setSessionAnswers([]);
    setInput('');
    setLiveInterview(true);
    setInterviewComplete(false);
    setShowFeedback(false);
    setInputDisabled(false);
    setFinalFeedback('');
    startTimeRef.current = Date.now();

    try {
      const res = await fetch('http://127.0.0.1:5000/ask_dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainToSlug[domainName], level: 'easy' }),
      });
      const data = await res.json();
      if (data.questions?.length) {
        setQuestions(data.questions);
      } else {
        setLiveInterview(false);
        alert('Failed to load questions from backend.');
      }
    } catch (err) {
      console.error(err);
      setLiveInterview(false);
      alert('Error fetching questions.');
    }
  };

  /* ---------- Evaluate Answer ---------- */
  const handleSend = async () => {
    if (!input.trim() || !questions.length) return;
    setInputDisabled(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const currentQuestion = questions[currentQuestionIndex];
    const userAnswer = input.trim();

    try {
      const res = await fetch('http://127.0.0.1:5000/evaluate_dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQuestion, answer: userAnswer }),
      });
      const data = await res.json();

      const isCorrect = data.correct === true;
      if (isCorrect) setScore((s) => s + 1);

      setUserAnswers((prev) => [...prev, userAnswer]);
      setSessionAnswers((prev) => [
        ...prev,
        { question: currentQuestion, answer: userAnswer, score: data.score || 0 },
      ]);
      setFeedbacks((prev) => [...prev, isCorrect ? 'Correct' : 'Incorrect']);
      setFeedbackMessage(data.feedback || '');
      setLastAnswerCorrect(isCorrect);
      setShowFeedback(true);
    } catch (err) {
      console.error(err);
      alert('Error evaluating answer.');
      setInputDisabled(false);
    }
  };

  /* ---------- Generate Summary Feedback ---------- */
const generateFinalFeedback = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch('http://127.0.0.1:5000/summary_feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userEmail: user.email, // ✅ add this line
        domain: domainToSlug[selectedDomain],
        session: sessionAnswers.map((item, i) => ({
          question: item.question,
          answer: item.answer,
          score: item.score ?? 7,
        })),
      }),
    });

    console.log("✅ Response status:", res.status);
    const text = await res.text();
    console.log("🔍 Raw response text:", text);

    try {
      const data = JSON.parse(text);
      setFinalFeedback(res.ok ? data.summaryFeedback : "Couldn't generate feedback.");
    } catch (err) {
      console.error("❌ Failed to parse JSON:", err);
      setFinalFeedback("Invalid server response.");
    }

  } catch (error) {
    console.error('❌ Error generating summary feedback:', error);
    setFinalFeedback('Error generating feedback.');
  }
};


  /* ---------- Save Progress ---------- */
  const saveProgress = async () => {
    const token = localStorage.getItem('token');
    if (!token || startTimeRef.current === null) return;

    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      const res = await fetch('http://localhost:5000/api/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          domain: domainToSlug[selectedDomain],
          score,
          totalQuestions: questions.length,
          durationSeconds,
          feedback: finalFeedback, // Persist final feedback
        }),
      });
      const data = await res.json();
      console.log('✅ Progress saved:', data);
    } catch (err) {
      console.error('❌ Error saving progress:', err);
    }
  };

  /* ---------- Handle Next / Finish ---------- */
  const handleNext = () => {
    setShowFeedback(false);
    setInput('');
    setInputDisabled(false);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((i) => i + 1);
    } else {
      generateFinalFeedback();
      saveProgress();
      setLiveInterview(false);
      setInterviewComplete(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  /* ---------- End Interview ---------- */
  const endInterview = () => {
    if (liveInterview && !interviewComplete) saveProgress();

    setLiveInterview(false);
    setInterviewComplete(false);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setUserAnswers([]);
    setSessionAnswers([]);
    setFeedbacks([]);
    setInput('');
    setFinalFeedback('');
    if (timerRef.current) clearInterval(timerRef.current);
    startTimeRef.current = null;
  };

  /* ---------- UI ---------- */
  return (
    <>
      <header className="page-header">
        <div>
          <h1>AI Interview Coach</h1>
          <p>Practice interviews with domain-specific questions and get AI-powered feedback</p>
        </div>
        <div className="user-info">
          <p>Welcome, {user?.name || 'User'}!</p>
          <p className="email">{user?.email || 'user@example.com'}</p>
        </div>
      </header>

      <div className="interview-container">
        <aside className="sidebar">
          <h2>Select Domain</h2>
          <nav>
            {domains.map((d) => (
              <button
                key={d.name}
                onClick={() => startInterview(d.name)}
                className={`domain-button ${selectedDomain === d.name ? 'selected' : ''}`}
                disabled={liveInterview}
              >
                {d.icon}
                {d.name}
              </button>
            ))}
          </nav>

          <section className="actions-section-below-sidebar">
            <h3>Actions</h3>
            <button
              className="progress-dashboard-button"
              onClick={() => (window.location.href = '/dashboard')}
            >
              <BarChart2 className="action-icon" />
              Progress Dashboard
            </button>
            <button
              className="start-button"
              disabled={liveInterview}
              onClick={() => startInterview(selectedDomain)}
            >
              <Play className="action-icon" />
              Start Interview
            </button>
            <button
              className="signout-button"
              disabled={!liveInterview}
              onClick={endInterview}
            >
              <LogOut className="action-icon" />
              End Interview
            </button>
          </section>
        </aside>

        <main className="main-content">
          <section className="interview-chat-header">
            <h2>Interview Chat</h2>
            <p>Domain: {selectedDomain}</p>
            <div className="interview-status">
              {liveInterview ? (
                <>
                  <Circle className="live-indicator" />
                  <span className="live-text">Live Interview</span>
                  <button className="end-interview-button" onClick={endInterview}>
                    <X className="end-icon" />
                    End Interview
                  </button>
                </>
              ) : interviewComplete ? (
                <div className="interview-complete">
                  <h3>Interview Complete!</h3>
                  <p>
                    You scored {score} / {questions.length}
                  </p>
                  <ul>
                    {questions.map((q, idx) => (
                      <li key={idx}>
                        <strong>Q{idx + 1}:</strong> {q} <br />
                        <strong>Your answer:</strong> {userAnswers[idx] || 'No answer'} <br />
                        <strong>Result:</strong> {feedbacks[idx] || 'N/A'}
                      </li>
                    ))}
                  </ul>

                  {finalFeedback && (
                    <div className="feedback-summary">
                      <h3>📋 Final Interview Feedback</h3>
                      <p>{finalFeedback}</p>
                    </div>
                  )}
                </div>
              ) : (
                <span className="interview-ended-text">Interview Ended</span>
              )}
            </div>
          </section>

          <section className="chat-messages">
            {liveInterview && questions.length > 0 && (
              <>
                <div className="chat-message bot">
                  <div className="message-icon">🤖</div>
                  <div className="message-text">
                    {questions[currentQuestionIndex]}
                    <div className="question-timer">⏳ Time Left: {timeLeft}s</div>
                  </div>
                </div>
                {showFeedback && (
                  <div className={`feedback-message ${lastAnswerCorrect ? 'correct' : 'incorrect'}`}>
                    {lastAnswerCorrect ? '✔️ ' : '❌ '}
                    {feedbackMessage}
                    <button className="next-button" onClick={handleNext}>
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="chat-input-section">
            <input
              type="text"
              placeholder="Type your answer here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!liveInterview || inputDisabled}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !inputDisabled) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!liveInterview || !input.trim() || inputDisabled}
            >
              Send
            </button>
          </section>
        </main>
      </div>
    </>
  );
};

export default Interview;