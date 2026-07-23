const express = require('express');
const path = require('node:path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'appdb',
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || 'apppass',
  database: process.env.DB_NAME || 'appdb',
});

const app = express();
app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// OWASP Top 10 2024 Proactive Controls C7 - Level 1 password requirements:
// minimum length, no forced composition rules, checked against a common-password list.
const MIN_LENGTH = 8;
const MAX_LENGTH = 64;

function checkFormat(username, password) {
  if (!password || password.length < MIN_LENGTH || password.length > MAX_LENGTH) {
    return `Password must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters long.`;
  }
  if (username && password.toLowerCase() === username.toLowerCase()) {
    return 'Password must not be the same as the username.';
  }
  return null;
}

async function isCommonPassword(password) {
  const result = await pool.query(
    'SELECT 1 FROM common_passwords WHERE password = $1 LIMIT 1',
    [password.toLowerCase()]
  );
  return result.rowCount > 0;
}

// Backend function to verify the password (Q4.3) - also used by the /api endpoint
// that the frontend calls (Q4.2), so the rule is defined once.
async function validatePassword(username, password) {
  const formatError = checkFormat(username, password);
  if (formatError) return { valid: false, reason: formatError };
  if (await isCommonPassword(password)) {
    return { valid: false, reason: 'Password is one of the 100k most common passwords. Choose another.' };
  }
  return { valid: true };
}

app.post('/api/validate-password', async (req, res) => {
  const { username = '', password = '' } = req.body;
  const result = await validatePassword(username, password);
  res.json(result);
});

app.post('/signup', async (req, res) => {
  const { username = '', password = '' } = req.body;
  const result = await validatePassword(username, password);

  if (!result.valid) {
    // Q4.7: does not meet requirements -> remain at home page
    return res.redirect('/index.html?error=' + encodeURIComponent(result.reason));
  }

  // Q4.9: log username + creation time only, never the password
  await pool.query('INSERT INTO "2402725" (username, created_at) VALUES ($1, NOW())', [username]);

  // Q4.8: meets requirements -> go to Welcome page showing password + logout
  res.redirect(`/welcome.html?user=${encodeURIComponent(username)}&pwd=${encodeURIComponent(password)}`);
});

app.get('/health', (req, res) => res.send('ok'));

module.exports = app;
