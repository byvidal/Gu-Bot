const express = require('express');
const session = require('express-session');
const path = require('path');
const { db } = require('../database/db');

function startAdminServer(bot) {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use('/public', express.static(path.join(__dirname, '..', 'public')));

  app.use(session({
    secret: process.env.SESSION_SECRET || 'change-this-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 6
    }
  }));

  function requireAuth(req, res, next) {
    if (!req.session.admin) return res.redirect('/admin/login');
    next();
  }

  app.get('/admin/login', (req, res) => {
    res.render('login', { error: null });
  });

  app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (
      username === process.env.ADMIN_USER &&
      password === process.env.ADMIN_PASSWORD
    ) {
      req.session.admin = username;
      return res.redirect('/admin');
    }

    res.render('login', { error: 'Usuario o contraseña incorrectos' });
  });

  app.get('/admin/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/admin/login'));
  });

  app.get('/admin', requireAuth, (req, res) => {
    const totalUsers = db.prepare('SELECT COUNT(*) as total FROM users').get().total;
    const totalMessages = db.prepare('SELECT COUNT(*) as total FROM messages').get().total;
    const latestUsers = db.prepare('SELECT * FROM users ORDER BY last_seen DESC LIMIT 5').all();
    const latestMessages = db.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT 8').all();

    res.render('dashboard', {
      totalUsers,
      totalMessages,
      latestUsers,
      latestMessages
    });
  });

  app.get('/admin/users', requireAuth, (req, res) => {
    const users = db.prepare('SELECT * FROM users ORDER BY last_seen DESC').all();
    res.render('users', { users });
  });

  app.get('/admin/messages', requireAuth, (req, res) => {
    const messages = db.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT 200').all();
    res.render('messages', { messages });
  });

  app.get('/admin/broadcast', requireAuth, (req, res) => {
    res.render('broadcast', { result: null });
  });

  app.post('/admin/broadcast', requireAuth, async (req, res) => {
    const { message } = req.body;
    const users = db.prepare('SELECT id FROM users').all();

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await bot.telegram.sendMessage(user.id, message);
        sent++;
      } catch {
        failed++;
      }
    }

    res.render('broadcast', {
      result: `Enviados: ${sent} | Fallidos: ${failed}`
    });
  });

  app.post('/admin/send/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;

    try {
      await bot.telegram.sendMessage(id, message);
      res.redirect('/admin/users');
    } catch (error) {
      res.send('Error enviando mensaje: ' + error.message);
    }
  });

  app.listen(PORT, () => {
    console.log(`Panel admin: http://localhost:${PORT}/admin`);
  });
}

module.exports = { startAdminServer };