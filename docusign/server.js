require('dotenv').config();
const express = require('express');
const path = require('path');

// Initialize DB (runs migrations + seed)
require('./db');

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/instances', require('./routes/instances'));
app.use('/api/signing', require('./routes/signing'));

// Serve HTML pages for client-side routing
const pages = ['login', 'dashboard', 'templates', 'create-template', 'edit-template', 'send', 'sign', 'review', 'view'];
pages.forEach((page) => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', `${page}.html`));
  });
});

// Root redirects to dashboard
app.get('/', (req, res) => res.redirect('/dashboard'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n DocuSign app running at http://localhost:${PORT}`);
  console.log(` Admin login: ${process.env.ADMIN_EMAIL || 'admin@example.com'}`);
  console.log(` Password:    ${process.env.ADMIN_PASSWORD || 'changeme123'}\n`);
});
