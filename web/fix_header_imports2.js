const fs = require('fs');

let c = fs.readFileSync('src/components/Header.tsx', 'utf8');
console.log('Has authFetch before:', c.includes('authFetch'));

// Try all variants
const variants = [
  ["import { clearAuth } from \"@/lib/auth\";", "import { clearAuth, authFetch } from \"@/lib/auth\";"],
  ["import { clearAuth } from '@/lib/auth';", "import { clearAuth, authFetch } from '@/lib/auth';"],
  ["import { getFileUrl } from \"@/lib/api\";", "import { getFileUrl, getApiBase } from \"@/lib/api\";"],
  ["import { getFileUrl } from '@/lib/api';", "import { getFileUrl, getApiBase } from '@/lib/api';"],
];

for (const [from, to] of variants) {
  if (c.includes(from)) {
    c = c.replace(from, to);
    console.log('Replaced:', from.substring(0,40));
  }
}

console.log('Has authFetch after:', c.includes('authFetch'));
console.log('Has getApiBase after:', c.includes('getApiBase'));

fs.writeFileSync('src/components/Header.tsx', c);
