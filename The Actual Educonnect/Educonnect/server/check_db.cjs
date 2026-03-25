const Database = require('better-sqlite3');
const db = new Database('./educonnect.db');
console.log('Students in DB:', db.prepare('SELECT count(*) as c FROM dataset_students').get().c);
