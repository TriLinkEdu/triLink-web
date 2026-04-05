const fs = require('fs');
let c = fs.readFileSync('src/app/admin/audit/page.tsx', 'utf8');
const searchFor = '      </div>\n      </div>\n    </div>\n  );\n}';
const replaceWith = '      </div>\n    </div>\n  );\n}';
if (c.includes(searchFor)) {
    c = c.replace(searchFor, replaceWith);
    fs.writeFileSync('src/app/admin/audit/page.tsx', c);
    console.log('SUCCESS: Fixed extra </div> in Audit page.');
} else {
    // Try with different indentation or just regex
    const newC = c.replace(/<\/div>(\s*<\/div>){2,}\s*\)\;/g, '</div>\n    </div>\n  );');
    if (newC !== c) {
        fs.writeFileSync('src/app/admin/audit/page.tsx', newC);
        console.log('SUCCESS: Fixed extra </div> with regex');
    } else {
       console.log('ERROR: Could not find matching closing div pattern.');
    }
}
