const MIN_LENGTH = 8;
const MAX_LENGTH = 64;

// Local, client-side portion of the OWASP C7 Level 1 password requirement check.
function checkFormatClient(username, password) {
  if (!password || password.length < MIN_LENGTH || password.length > MAX_LENGTH) {
    return `Password must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters long.`;
  }
  if (username && password.toLowerCase() === username.toLowerCase()) {
    return 'Password must not be the same as the username.';
  }
  return null;
}

// Full check: local format check, then ask the backend to check the
// 100k common-password blocklist (too large to ship to the browser).
async function validatePassword(username, password) {
  const localError = checkFormatClient(username, password);
  if (localError) return { valid: false, reason: localError };

  const res = await fetch('/api/validate-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}
