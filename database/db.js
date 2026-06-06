const Database = require('better-sqlite3');

const db = new Database('bot-admin.db');

db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  is_bot INTEGER,
  language_code TEXT,
  first_seen TEXT,
  last_seen TEXT,
  message_count INTEGER DEFAULT 0
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT,
  chat_id INTEGER,
  chat_type TEXT,
  message TEXT,
  date TEXT
)
`).run();

function saveUser(user) {
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (
      id, username, first_name, last_name, is_bot, language_code, first_seen, last_seen, message_count
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET
      username = excluded.username,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      is_bot = excluded.is_bot,
      language_code = excluded.language_code,
      last_seen = excluded.last_seen,
      message_count = users.message_count + 1
  `).run(
    user.id,
    user.username || '',
    user.first_name || '',
    user.last_name || '',
    user.is_bot ? 1 : 0,
    user.language_code || '',
    now,
    now
  );
}

function saveMessage(ctx) {
  if (!ctx.from || !ctx.message?.text) return;

  db.prepare(`
    INSERT INTO messages (user_id, username, chat_id, chat_type, message, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    ctx.from.id,
    ctx.from.username || '',
    ctx.chat?.id || null,
    ctx.chat?.type || '',
    ctx.message.text,
    new Date().toISOString()
  );
}

module.exports = { db, saveUser, saveMessage };