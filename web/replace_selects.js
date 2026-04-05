const fs = require('fs');
const path = require('path');

function walk(d) {
  fs.readdirSync(d, { withFileTypes: true }).forEach(f => {
    const p = path.join(d, f.name);
    if (f.isDirectory()) {
      if (f.name !== 'node_modules' && f.name !== '.next') walk(p);
    } else if (p.endsWith('.tsx') && p !== path.join('src', 'components', 'Select.tsx')) {
      try {
        let c = fs.readFileSync(p, 'utf8');
        if (c.includes('<select') && !c.includes('Select from "@/components/Select"')) {
          c = c.replace(/<select/g, '<Select').replace(/<\/select>/g, '</Select>');
          const lines = c.split('\n');
          let idx = -1;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
              idx = i;
            }
          }
          if (idx !== -1) {
            lines.splice(idx + 1, 0, 'import Select from "@/components/Select";');
          } else {
            lines.unshift('import Select from "@/components/Select";');
          }
          fs.writeFileSync(p, lines.join('\n'));
          console.log('Updated ' + p);
        }
      } catch (e) {
        console.error('Error on ', p, e);
      }
    }
  });
}

walk('src');
