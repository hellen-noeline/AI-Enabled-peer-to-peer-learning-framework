import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import Navigation from '../components/Navigation'
import { learningFields } from '../data/quizData'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts'
import '../styles/StudyAnalytics.css'

function StudyAnalytics() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('week') // 'week' or 'all-time'

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  if (!user) return null

  const stats = user.studyStats || {
    totalHours: 0,
    weeklyHours: [0, 0, 0, 0, 0, 0, 0],
    sessionsCompleted: 0,
    studyProgress: 0,
    quizCompletions: {},
    quizzesPassed: 0
  }

  const fieldProgress = stats.fieldProgress || {}
  const completedFields = Object.entries(fieldProgress).filter(([, p]) => p.proficiency).length
  const totalFields = learningFields.length

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const today = new Date()
  const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1

  const weeklyData = weekDays.map((day, index) => ({
    name: day.substring(0, 3),
    fullName: day,
    hours: stats.weeklyHours[index] || 0,
    isToday: index === currentDayIndex,
    goal: 20 / 7 // Average daily goal (20 hours / 7 days)
  }))

  const thisWeekTotal = stats.weeklyHours.reduce((a, b) => a + b, 0)
  const hasStudyData = thisWeekTotal > 0 || stats.sessionsCompleted > 0
  const maxWeeklyHours = Math.max(...(stats.weeklyHours || [0]), 3) // min 3 for visible scale when all zeros
  const weeklyGoal = 20
  const progressPercentage = stats.studyProgress
  const hoursRemaining = Math.max(0, weeklyGoal - thisWeekTotal)

  const progressData = [
    { name: 'Completed', value: progressPercentage, color: '#4ECDC4' },
    { name: 'Remaining', value: 100 - progressPercentage, color: '#E5E7EB' }
  ]

  const COLORS = ['#4ECDC4', '#E5E7EB']

  // Calculate average hours per session
  const avgHoursPerSession = stats.sessionsCompleted > 0 
    ? (stats.totalHours / stats.sessionsCompleted).toFixed(2)
    : 0

  // Calculate daily average for the week
  const daysWithData = stats.weeklyHours.filter(h => h > 0).length
  const dailyAverage = daysWithData > 0 
    ? (thisWeekTotal / daysWithData).toFixed(2)
    : 0

  // Projected weekly total based on current average
  const projectedWeeklyTotal = dailyAverage * 7

  const insights = [
    {
      title: 'Average Session Length',
      value: `${avgHoursPerSession}h`,
      description: 'Per study session'
    },
    {
      title: 'Daily Average',
      value: `${dailyAverage}h`,
      description: 'This week'
    },
    {
      title: 'Projected Weekly Total',
      value: `${projectedWeeklyTotal.toFixed(1)}h`,
      description: 'Based on current pace'
    },
    {
      title: 'Hours to Goal',
      value: `${hoursRemaining.toFixed(1)}h`,
      description: 'Remaining this week'
    }
  ]

  const getProgressColor = () => {
    if (progressPercentage >= 80) return '#10B981' // Green
    if (progressPercentage >= 50) return '#FFD93D' // Yellow
    return '#FF6B35' // Orange/Red
  }

  return (
    <div className="analytics-container">
      <Navigation />
      <div className="analytics-content">
        <motion.div
          className="analytics-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <button 
              className="back-button"
              onClick={() => navigate('/dashboard')}
            >
              ← Back to Dashboard
            </button>
            <h1>Study Analytics</h1>
            <p>Detailed insights into your study habits and progress</p>
          </div>
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              This Week
            </button>
            <button
              className={`toggle-btn ${viewMode === 'all-time' ? 'active' : ''}`}
              onClick={() => setViewMode('all-time')}
            >
              All Time
            </button>
          </div>
        </motion.div>

        {/* Main Stats Overview */}
        <div className="main-stats-grid">
          <motion.div
            className="main-stat-card total-hours"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="stat-info">
              <h3>Total Study Hours</h3>
              <p className="stat-value-large">{stats.totalHours.toFixed(1)}</p>
              <p className="stat-unit">hours</p>
              <p className="stat-description">All-time total</p>
            </div>
          </motion.div>

          <motion.div
            className="main-stat-card this-week"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="stat-info">
              <h3>This Week</h3>
              <p className="stat-value-large">{thisWeekTotal.toFixed(1)}</p>
              <p className="stat-unit">hours</p>
              <p className="stat-description">Weekly total</p>
            </div>
          </motion.div>

          <motion.div
            className="main-stat-card progress"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="stat-info">
              <h3>Study Progress</h3>
              <p className="stat-value-large">{progressPercentage}%</p>
              <p className="stat-unit">of weekly goal</p>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill"
                  style={{ 
                    width: `${Math.max(progressPercentage, progressPercentage > 0 ? 4 : 0)}%`,
                    backgroundColor: getProgressColor(),
                    transition: 'width 0.5s ease'
                  }}
                />
              </div>
              <p className="stat-description">{hoursRemaining.toFixed(1)}h remaining</p>
            </div>
          </motion.div>
        </div>

        {/* Insights Grid */}
        <div className="insights-grid">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.title}
              className="insight-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <div className="insight-content">
                <h4>{insight.title}</h4>
                <p className="insight-value">{insight.value}</p>
                <p className="insight-description">{insight.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <motion.div
            className="chart-card-large"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2>Daily Study Hours</h2>
            <p className="chart-subtitle">Hours studied each day this week</p>
            {!hasStudyData && (
              <div className="chart-empty-state">
                <p>Start studying to see your progress here</p>
                <p className="chart-empty-hint">Use Learning Resources and stop a session (min 5 min) to log hours</p>
              </div>
            )}
            <div className="chart-responsive-wrapper" style={{ height: 350, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%" key={`bar-${thisWeekTotal}`}>
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis 
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280' }}
                  domain={[0, maxWeeklyHours]}
                  label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => [`${value} hours`, 'Study Time']}
                />
                <Bar dataKey="hours" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={600}>
                  {weeklyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isToday ? '#764ba2' : '#FF6B35'} 
                    />
                  ))}
                </Bar>
                <Bar dataKey="goal" radius={[8, 8, 0, 0]} fill="#E5E7EB" opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#FF6B35' }}></div>
                <span>Study Hours</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#764ba2' }}></div>
                <span>Today</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#E5E7EB' }}></div>
                <span>Daily Goal</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="chart-card-large"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h2>Weekly Progress</h2>
            <p className="chart-subtitle">Progress toward your weekly goal of 20 hours</p>
            {!hasStudyData && (
              <div className="chart-empty-state chart-empty-inline">
                <p>0% complete — study 5+ min and stop a session to log progress</p>
              </div>
            )}
            <div className="progress-chart-container">
              <ResponsiveContainer width="100%" height={300} key={`pie-${progressPercentage}`}>
                <PieChart>
                  <Pie
                    data={progressData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => 
                      percent > 5 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                    }
                    outerRadius={120}
                    innerRadius={60}
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
              <div className="progress-center-text">
                <p className="progress-percentage">{progressPercentage}%</p>
                <p className="progress-label">Complete</p>
              </div>
            </div>
            <div className="progress-details">
              <div className="progress-detail-item">
                <span className="detail-label">Completed:</span>
                <span className="detail-value">{thisWeekTotal.toFixed(1)}h</span>
              </div>
              <div className="progress-detail-item">
                <span className="detail-label">Goal:</span>
                <span className="detail-value">{weeklyGoal}h</span>
              </div>
              <div className="progress-detail-item">
                <span className="detail-label">Remaining:</span>
                <span className="detail-value">{hoursRemaining.toFixed(1)}h</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Field Proficiency – Gauged by Final Tests */}
        <motion.div
          className="quiz-progress-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
        >
          <h2>Field Proficiency</h2>
          <p className="quiz-progress-subtitle">Final test scores gauge how well-versed you are in each field</p>
          <div className="quiz-progress-stats">
            <div className="quiz-stat-badge">
              <span className="quiz-stat-value">{completedFields}</span>
              <span className="quiz-stat-label">Fields Assessed</span>
            </div>
            <div className="quiz-stat-badge">
              <span className="quiz-stat-value">{totalFields}</span>
              <span className="quiz-stat-label">Total Fields</span>
            </div>
          </div>
          {Object.keys(fieldProgress).length > 0 && (
            <div className="quiz-completions-list">
              {Object.entries(fieldProgress).map(([fieldId, data]) => {
                const field = learningFields.find((f) => f.id === fieldId)
                return (
                  <div key={fieldId} className={`quiz-completion-item ${data.proficiency ? 'passed' : ''}`}>
                    <span className="quiz-completion-title">{field?.name || fieldId}</span>
                    <span className="quiz-completion-score">
                      {data.finalScore != null ? `${data.finalScore}%` : '—'} {data.proficiency ? `• ${data.proficiency}` : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Additional Stats */}
        <motion.div
          className="additional-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h2>Additional Statistics</h2>
          <div className="additional-stats-grid">
            <div className="additional-stat-item">
              <span className="additional-stat-label">Sessions Completed</span>
              <span className="additional-stat-value">{stats.sessionsCompleted}</span>
            </div>
            <div className="additional-stat-item">
              <span className="additional-stat-label">Fields Assessed</span>
              <span className="additional-stat-value">{completedFields} / {totalFields}</span>
            </div>
            <div className="additional-stat-item">
              <span className="additional-stat-label">Average Session Length</span>
              <span className="additional-stat-value">{avgHoursPerSession}h</span>
            </div>
            <div className="additional-stat-item">
              <span className="additional-stat-label">Days Active This Week</span>
              <span className="additional-stat-value">{daysWithData} / 7</span>
            </div>
            <div className="additional-stat-item">
              <span className="additional-stat-label">Best Day This Week</span>
              <span className="additional-stat-value">
                {weekDays[stats.weeklyHours.indexOf(Math.max(...(stats.weeklyHours || [0]))) || 0] || 'N/A'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default StudyAnalytics

