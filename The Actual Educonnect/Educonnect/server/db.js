import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'educonnect.db')

let db = null

function persist() {
  if (db) {
    try {
      const data = db.export()
      writeFileSync(dbPath, Buffer.from(data))
    } catch (e) {
      console.warn('Could not persist DB:', e.message)
    }
  }
}

/** Build named-param object for sql.js: { '@id': obj.id, '@email': obj.email, ... } */
function toNamedParams(obj) {
  const out = {}
  for (const k of Object.keys(obj)) out['@' + k] = obj[k]
  return out
}

function wrapPrepare(sql, nativePrepare, dbRef) {
  return {
    run(...params) {
      const isObj = params.length && params[0] && typeof params[0] === 'object' && !Array.isArray(params[0])
      const stmt = nativePrepare(sql)
      try {
        if (isObj) {
          stmt.bind(toNamedParams(params[0]))
        } else {
          stmt.bind(params)
        }
        stmt.step()
      } finally {
        stmt.free()
      }
      persist()
    },
    get(...params) {
      const stmt = nativePrepare(sql)
      try {
        const bindVal = params.length === 1 && Array.isArray(params[0]) ? params[0] : params
        stmt.bind(bindVal)
        return stmt.step() ? stmt.getAsObject() : null
      } finally {
        stmt.free()
      }
    },
    all(...params) {
      const stmt = nativePrepare(sql)
      try {
        const bindVal = params.length === 1 && Array.isArray(params[0]) ? params[0] : params
        stmt.bind(bindVal)
        const results = []
        while (stmt.step()) results.push(stmt.getAsObject())
        return results
      } finally {
        stmt.free()
      }
    }
  }
}

function exec(sql) {
  db.run(sql)
  persist()
}

export async function initSchema() {
  if (!db) return
  exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      phone_number TEXT,
      date_of_birth TEXT,
      gender TEXT,
      nationality TEXT,
      country_of_residence TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      university TEXT,
      degree_program TEXT,
      course_area TEXT,
      ordered_interests TEXT,
      current_gpa TEXT,
      credits_completed TEXT,
      credits_remaining TEXT,
      courses_enrolled TEXT,
      course_codes TEXT,
      course_units TEXT,
      technical_skills TEXT,
      soft_skills TEXT,
      research_interests TEXT,
      professional_interests TEXT,
      hobbies TEXT,
      cs_interests TEXT,
      strong_topics TEXT,
      weak_topics TEXT,
      preferred_learning_style TEXT,
      study_partners_preferences TEXT,
      preferred_study_hours TEXT,
      bio TEXT,
      profile_picture TEXT,
      study_stats TEXT,
      last_week_reset TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login_time TEXT,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin'))
    )
  `)
  exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email))`)
  exec(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`)
  // Migration: add role column to existing databases that don't have it
  try {
    const info = db.prepare('PRAGMA table_info(users)').all()
    if (!info.some((c) => c.name === 'role')) {
      db.run('ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT \'user\'')
      persist()
    }
  } catch (_) {}
  exec(`
    CREATE TABLE IF NOT EXISTS dataset_students (
      id TEXT PRIMARY KEY,
      source TEXT,
      registration_number TEXT,
      first_name TEXT,
      middle_name TEXT,
      last_name TEXT,
      gender TEXT,
      date_of_birth TEXT,
      nationality TEXT,
      country_of_residence TEXT,
      phone_number TEXT,
      email TEXT,
      home_address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      university TEXT,
      degree_program TEXT,
      current_gpa TEXT,
      credits_completed TEXT,
      credits_remaining TEXT,
      courses_enrolled TEXT,
      course_codes TEXT,
      course_units TEXT,
      technical_skills TEXT,
      soft_skills TEXT,
      research_interests TEXT,
      professional_interests TEXT,
      hobbies TEXT,
      preferred_learning_style TEXT,
      study_partners_preferences TEXT,
      preferred_study_hours TEXT,
      cs_interests TEXT,
      strong_computing_fields TEXT,
      weak_computing_fields TEXT,
      study_stats TEXT
    )
  `)
  // Migration: add degree_program column to existing dataset_students tables
  try {
    const infoDs = db.prepare('PRAGMA table_info(dataset_students)').all()
    if (!infoDs.some((c) => c.name === 'degree_program')) {
      db.run('ALTER TABLE dataset_students ADD COLUMN degree_program TEXT')
      persist()
    }
  } catch (_) {}
  exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      rating INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_response TEXT,
      responded_at TEXT,
      sentiment_label TEXT,
      sentiment_score REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)
  exec(`CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id)`)
  exec(`
    CREATE TABLE IF NOT EXISTS signup_suggestions (
      field_name TEXT NOT NULL,
      value TEXT NOT NULL,
      use_count INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (field_name, value)
    )
  `)
  exec(`
    CREATE TABLE IF NOT EXISTS activity_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)
  exec(`CREATE INDEX IF NOT EXISTS idx_activity_events_user_id ON activity_events(user_id)`)
  exec(`CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON activity_events(created_at)`)
  // Migration: add degree_program to users if missing
  try {
    const infoUsers = db.prepare('PRAGMA table_info(users)').all()
    if (!infoUsers.some((c) => c.name === 'degree_program')) {
      db.run('ALTER TABLE users ADD COLUMN degree_program TEXT')
      persist()
    }
    if (!infoUsers.some((c) => c.name === 'course_area')) {
      db.run('ALTER TABLE users ADD COLUMN course_area TEXT')
      persist()
    }
    if (!infoUsers.some((c) => c.name === 'ordered_interests')) {
      db.run('ALTER TABLE users ADD COLUMN ordered_interests TEXT')
      persist()
    }
  } catch (_) {}
}

export async function init() {
  const SQL = await initSqlJs()
  if (existsSync(dbPath)) {
    const buf = readFileSync(dbPath)
    db = new SQL.Database(buf)
  } else {
    db = new SQL.Database()
  }
  const nativePrepare = db.prepare.bind(db)
  db.prepare = (sql) => wrapPrepare(sql, nativePrepare, db)
  db.exec = exec
  db.transaction = (fn) => {
    db.run('BEGIN')
    try {
      fn()
      db.run('COMMIT')
    } catch (e) {
      db.run('ROLLBACK')
      throw e
    }
    persist()
  }
  await initSchema()
  persist()
  return db
}

export function getDb() {
  return db
}

export { persist }
