import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useStudy } from '../contexts/StudyContext'
import { useNLP } from '../contexts/NLPContext'
import { learningFields } from '../data/quizData'
import Navigation from '../components/Navigation'
import { fetchStudyPlan } from '../api/studyPlanApi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import '../styles/Dashboard.css'

function Dashboard() {
  const { user } = useAuth()
  const { sessionTimer, isTimerRunning, accumulatedSeconds, pausedByInactivity, stopStudySession } = useStudy()
  const { topics } = useNLP()
  const navigate = useNavigate()
  const [recommendations, setRecommendations] = useState([])
  const [studyPlan, setStudyPlan] = useState({ schedule: [], suggestions: [], generatedAt: null })

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  useEffect(() => {
    // Load recommendations
    const loadRecommendations = async () => {
      try {
        const { loadDataset, getDatasetUsers } = await import('../utils/datasetLoader')
        const { getRecommendations } = await import('../utils/recommendationEngine')
        
        await loadDataset()
        const allUsers = [
          ...getDatasetUsers(),
          ...JSON.parse(localStorage.getItem('EduConnect_users') || '[]')
        ]
        
        const recs = getRecommendations(user, allUsers, 3)
        setRecommendations(recs)
      } catch (error) {
        console.error('Error loading recommendations:', error)
      }
    }
    
    if (user) {
      loadRecommendations()
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchStudyPlan(user).then(setStudyPlan).catch(() => setStudyPlan({ schedule: [], suggestions: [], generatedAt: null }))
  }, [user])

  if (!user) return null

  const stats = user.studyStats || {
    totalHours: 0,
    weeklyHours: [0, 0, 0, 0, 0, 0, 0],
    sessionsCompleted: 0,
    studyProgress: 0,
    quizzesPassed: 0
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const today = new Date()
  const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1 // Monday = 0, Sunday = 6
  const weeklyData = weekDays.map((day, index) => ({
    name: day,
    hours: stats.weeklyHours[index] || 0,
    isToday: index === currentDayIndex
  }))

  const progressData = [
    { name: 'Completed', value: stats.studyProgress },
    { name: 'Remaining', value: 100 - stats.studyProgress }
  ]

  const COLORS = ['#FF6B35', '#FFD93D', '#4ECDC4', '#FF8C61', '#6EDDD6']

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const thisWeekTotal = stats.weeklyHours.reduce((a, b) => a + b, 0)
  const hasStudyData = thisWeekTotal > 0 || stats.sessionsCompleted > 0
  const maxWeeklyHours = Math.max(...(stats.weeklyHours || [0]), 3)

  const statCards = [
    {
      title: 'Total Study Hours',
      value: `${stats.totalHours.toFixed(1)}h`,
      subtitle: 'All time',
      color: '#FF6B35',
      bgColor: '#FFE5DD',
      clickable: true,
      route: '/analytics'
    },
    {
      title: 'Sessions Completed',
      value: stats.sessionsCompleted,
      subtitle: 'Study sessions',
      color: '#10B981',
      bgColor: '#D1FAE5',
      clickable: false
    },
    {
      title: 'Fields Assessed',
      value: `${Object.values(stats.fieldProgress || {}).filter(p => p.proficiency).length} / ${learningFields.length}`,
      subtitle: 'Proficiency from final tests',
      color: '#764ba2',
      bgColor: '#EDE9FE',
      clickable: true,
      route: '/resources'
    },
    {
      title: 'Study Progress',
      value: `${stats.studyProgress}%`,
      subtitle: 'Weekly goal: 20h',
      color: '#4ECDC4',
      bgColor: '#D1F5F3',
      clickable: true,
      route: '/analytics'
    },
    {
      title: 'This Week',
      value: `${thisWeekTotal.toFixed(1)}h`,
      subtitle: 'Weekly hours',
      color: '#FFD93D',
      bgColor: '#FFF9E6',
      clickable: true,
      route: '/analytics'
    }
  ]

  return (
    <div className="dashboard-container">
      <Navigation />
      <main id="main-content" role="main" className="dashboard-content" tabIndex={-1} aria-label="Dashboard content">
        <motion.div
          className="dashboard-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1>Welcome back, {user.firstName}! 👋</h1>
            <p>Here's your study overview</p>
            {user.university && (
              <p className="dashboard-programme">
                {user.university}
                {user.degreeProgram && (
                  <>
                    {' · '}
                    <span>{user.degreeProgram}</span>
                  </>
                )}
              </p>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="stats-grid">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              className={`stat-card ${card.clickable ? 'clickable' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={card.clickable ? { scale: 1.02, y: -4 } : {}}
              onClick={card.clickable ? () => navigate(card.route) : undefined}
              style={{ 
                '--card-color': card.color,
                '--card-bg': card.bgColor
              }}
            >
              <div className="stat-content">
                <h3>{card.title}</h3>
                <p className="stat-value">{card.value}</p>
                {card.subtitle && <p className="stat-subtitle">{card.subtitle}</p>}
                {card.clickable && (
                  <span className="stat-link">View details →</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Study Plan – schedule + improvement suggestions (learns from your stats) */}
        {(studyPlan.schedule?.length > 0 || studyPlan.suggestions?.length > 0) && (
          <motion.div
            className="study-plan-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <h2>Your Study Plan</h2>
            <p className="study-plan-hint">Personalised from your profile and quiz progress; we keep adjusting as you use the app.</p>
            <div className="study-plan-grid">
              {studyPlan.schedule?.length > 0 && (
                <div className="study-plan-card schedule-card">
                  <h3>This week</h3>
                  <ul className="study-plan-schedule-list">
                    {studyPlan.schedule.slice(0, 7).map((day, i) => (
                      <li key={day.day}>
                        <span className="schedule-day">{day.day}</span>
                        <span className="schedule-focus">{day.focus}</span>
                        {day.suggestedHours > 0 && <span className="schedule-hours">~{day.suggestedHours}h</span>}
                        {day.alreadyLogged > 0 && <span className="schedule-logged">+{day.alreadyLogged}h logged</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {studyPlan.suggestions?.length > 0 && (
                <div className="study-plan-card suggestions-card">
                  <h3>Suggestions</h3>
                  <ul className="study-plan-suggestions-list">
                    {studyPlan.suggestions.slice(0, 5).map((s, i) => (
                      <li key={i} className={`suggestion-type-${s.type || 'info'}`}>
                        {s.message}
                        {s.fieldId && (
                          <button type="button" className="suggestion-action" onClick={() => navigate('/resources')}>
                            Resources →
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Study session prompt – timer starts only when user taps a resource */}
        {!isTimerRunning && (
          <motion.div
            className="session-timer-card start-studying-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="timer-header">
              <h3>Study Session</h3>
            </div>
            <div className="timer-display">
              {pausedByInactivity && (
                <p className="timer-paused-msg">Timer paused after 5 minutes of inactivity.</p>
              )}
              {accumulatedSeconds > 0 && (
                <p className="timer-resume-label">Session time: {formatTime(accumulatedSeconds)}</p>
              )}
              <p className="timer-instruction">
                {accumulatedSeconds > 0 && pausedByInactivity
                  ? 'Tap a resource to resume studying'
                  : 'Tap a resource in Learning Resources to start studying'}
              </p>
              <button
                className="timer-instruction-btn"
                onClick={() => navigate('/resources')}
              >
                Go to Resources →
              </button>
            </div>
          </motion.div>
        )}

        {/* Active Study Session Timer – shown when timer is running (started by tapping a resource) */}
        {isTimerRunning && (
          <motion.div
            className="session-timer-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="timer-header">
              <h3>Active Study Session</h3>
              <button
                className="timer-stop-btn"
                onClick={stopStudySession}
              >
                Stop Session
              </button>
            </div>
            <div className="timer-display">
              <span className="timer-time">{formatTime(sessionTimer)}</span>
              <p className="timer-label">Time spent studying (pauses after 5 min inactive)</p>
              <p className="timer-progress-note">
                {sessionTimer >= 300
                  ? '✓ Progress will be logged to your stats'
                  : `${formatTime(300 - sessionTimer)} more to log progress (min 5 min)`}
              </p>
            </div>
          </motion.div>
        )}

        {/* Charts Section */}
        <div className="charts-grid">
          <motion.div
            className="chart-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2>Weekly Study Hours</h2>
            {!hasStudyData && (
              <p className="chart-empty-text">Study 5+ min and stop a session to log hours</p>
            )}
            <ResponsiveContainer width="100%" height={300} key={`dash-bar-${thisWeekTotal}`}>
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" tick={{ fill: '#6B7280' }} />
                <YAxis stroke="#6B7280" tick={{ fill: '#6B7280' }} domain={[0, maxWeeklyHours]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="hours" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={600}>
                  {weeklyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isToday ? '#764ba2' : '#FF6B35'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>
              <span style={{ color: '#764ba2', fontWeight: 600 }}>Today</span> highlighted
            </p>
          </motion.div>

          <motion.div
            className="chart-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2>Study Progress</h2>
            {!hasStudyData && (
              <p className="chart-empty-text">Log study time to see progress toward 20h goal</p>
            )}
            <ResponsiveContainer width="100%" height={300} key={`dash-pie-${stats.studyProgress}`}>
              <PieChart>
                <Pie
                  data={progressData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive
                  animationDuration={600}
                >
                  {progressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Quick Access Cards */}
        <motion.div
          className="quick-access-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2>Quick Access</h2>
          <div className="quick-access-grid">
            <motion.div
              className="quick-access-card resources"
              onClick={() => navigate('/resources')}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <h3>Learning Resources</h3>
              <p>
                {user?.courseArea === 'Law'
                  ? 'Explore curated materials for Law, legal writing, and more'
                  : user?.courseArea === 'Business & Management'
                    ? 'Explore curated materials for Business, accounting, and more'
                    : 'Explore curated materials for AI, ML, Data Science, and more'}
              </p>
              <span className="quick-access-link">Explore →</span>
            </motion.div>
            <motion.div
              className="quick-access-card groups"
              onClick={() => navigate('/groups')}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <h3>Study Groups</h3>
              <p>Join groups automatically created based on your interests</p>
              <span className="quick-access-link">View Groups →</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Background NLP Topics – auto-analyzed from feedback & chat */}
        {topics.length > 0 && (
          <motion.div
            className="nlp-topics-widget"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
          >
            <div className="section-header">
              <h2>Topics from Feedback & Chats</h2>
              <span className="nlp-widget-hint">(analyzed in background)</span>
            </div>
            <div className="topics-compact-list">
              {topics.slice(0, 4).map((t) => (
                <div key={t.topic_id} className="topic-compact-card">
                  <span className="topic-compact-title">Topic {t.topic_id}</span>
                  <span className="topic-compact-count">{t.count} docs</span>
                  <div className="topic-compact-keywords">
                    {t.keywords?.slice(0, 5).map((kw, i) => (
                      <span key={i} className="keyword-tag-compact">{kw}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top Recommendations Preview */}
        {recommendations.length > 0 && (
          <motion.div
            className="recommendations-preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="section-header">
              <h2>Recommended Study Partners</h2>
              <button 
                className="view-more-btn"
                onClick={() => navigate('/recommendations')}
              >
                View More →
              </button>
            </div>
            <div className="recommendations-grid">
              {recommendations.slice(0, 3).map((rec, index) => (
                <motion.div
                  key={rec.id}
                  className="recommendation-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  onClick={() => navigate(`/profile/${rec.id}`)}
                >
                  <div className="rec-avatar">
                    {rec.firstName?.[0]}{rec.lastName?.[0]}
                  </div>
                  <h3>{rec.firstName} {rec.lastName}</h3>
                  <p className="rec-university">{rec.university || 'Student'}</p>
                  <div className="rec-match-score">
                    <span className="match-label">Match Score</span>
                    <span className="match-value">{rec.matchScore}%</span>
                  </div>
                  {rec.csInterests && (
                    <div className="rec-interests">
                      {rec.csInterests.split(',').slice(0, 2).map((interest, i) => (
                        <span key={i} className="interest-tag">
                          {interest.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}

export default Dashboard

