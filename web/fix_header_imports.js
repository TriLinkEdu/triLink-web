const fs = require('fs');

let c = fs.readFileSync('src/components/Header.tsx', 'utf8');

// Fix imports: add authFetch and getApiBase
c = c.replace(
  `import { clearAuth } from "@/lib/auth";\nimport { getFileUrl } from "@/lib/api";`,
  `import { clearAuth, authFetch } from "@/lib/auth";\nimport { getFileUrl, getApiBase } from "@/lib/api";`
);

// Also try with different quotes or line endings
if (!c.includes('authFetch')) {
  c = c.replace(
    "import { clearAuth } from \"@/lib/auth\";\nimport { getFileUrl } from \"@/lib/api\";",
    "import { clearAuth, authFetch } from \"@/lib/auth\";\nimport { getFileUrl, getApiBase } from \"@/lib/api\";"
  );
}

// CRLF version
if (!c.includes('authFetch')) {
  c = c.replace(
    "import { clearAuth } from \"@/lib/auth\";\r\nimport { getFileUrl } from \"@/lib/api\";",
    "import { clearAuth, authFetch } from \"@/lib/auth\";\r\nimport { getFileUrl, getApiBase } from \"@/lib/api\";"
  );
}

if (c.includes('authFetch')) {
  fs.writeFileSync('src/components/Header.tsx', c);
  console.log('SUCCESS: imports fixed');
} else {
  // Last resort: inject after the clearAuth line
  const lines = c.split('\n');
  const authIdx = lines.findIndex(l => l.includes("clearAuth") && l.includes("from"));
  if (authIdx >= 0) {
    lines[authIdx] = lines[authIdx].replace('clearAuth }', 'clearAuth, authFetch }');
    const apiIdx = lines.findIndex(l => l.includes("getFileUrl") && l.includes("from"));
    if (apiIdx >= 0) {
      lines[apiIdx] = lines[apiIdx].replace('getFileUrl }', 'getFileUrl, getApiBase }');
    }
    fs.writeFileSync('src/components/Header.tsx', lines.join('\n'));
    console.log('SUCCESS: imports fixed via line injection');
  } else {
    console.log('FAILED: could not find import line');
    process.exit(1);
  }
}
