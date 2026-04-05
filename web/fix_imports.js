const fs = require('fs');
const path = require('path');

function walk(d) {
  fs.readdirSync(d, { withFileTypes: true }).forEach(f => {
    const p = path.join(d, f.name);
    if (f.isDirectory()) {
      if (f.name !== 'node_modules' && f.name !== '.next') walk(p);
    } else if (p.endsWith('.tsx')) {
      try {
        let c = fs.readFileSync(p, 'utf8');
        let newC = c.replace(/import\s*\{\s*import Select from "@\/components\/Select";/g, 'import Select from "@/components/Select";\nimport {');
        if (c !== newC) {
          fs.writeFileSync(p, newC);
          console.log('Fixed ', p);
        }
      } catch (e) {
        console.error(e);
      }
    }
  });
}

walk('src');
