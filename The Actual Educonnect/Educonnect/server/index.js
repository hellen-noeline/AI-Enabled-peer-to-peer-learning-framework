import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import adminRoutes from './routes/admin.js'
import datasetRoutes from './routes/dataset.js'
import feedbackRoutes from './routes/feedback.js'
import chatRoutes from './routes/chat.js'
import { init as initDb, getDb } from './db.js'
import { ensureAdmin } from './ensureAdmin.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

app.use((req, res, next) => {
  req.db = getDb()
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api', datasetRoutes)

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'EduConnect API' })
})

async function start() {
  await initDb()
  ensureAdmin()
  app.listen(PORT, () => {
    console.log(`EduConnect server running at http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
