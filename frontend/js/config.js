// Single place to point the frontend at the backend API.
//
// When the site is opened via the backend server itself (the normal way —
// see README, "npm start" opens http://localhost:4000 automatically),
// a relative path works and avoids CORS entirely.
//
// If you ever open frontend/index.html directly as a file instead (double
// click, or a separate static host), switch this to the full backend URL,
// e.g. 'http://localhost:4000/api'.
const API_BASE_URL = '/api';
