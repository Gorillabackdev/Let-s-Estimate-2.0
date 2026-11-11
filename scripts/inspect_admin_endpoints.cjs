// scripts/inspect_admin_endpoints.cjs
const fs = require('fs');
const b = fs.readFileSync('public/assets/index-BmB3tbOJ.js', 'utf8');

const regex = /["'`]\/api\/admin\/[^"'`]+["'`]/g;
const matches = b.match(regex) || [];
const unique = Array.from(new Set(matches.map(m => m.slice(1, -1)))).sort();
console.log('Unique admin endpoints:', unique);

// Also search for admin component or view name in bundle
let adminIdx = b.indexOf('admin');
while (adminIdx !== -1) {
  const snippet = b.slice(Math.max(0, adminIdx - 100), Math.min(b.length, adminIdx + 200));
  if (snippet.includes('api/admin')) {
    console.log('Context:', snippet);
  }
  adminIdx = b.indexOf('admin', adminIdx + 5);
}
