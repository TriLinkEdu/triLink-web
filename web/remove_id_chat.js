const fs = require('fs');
let c = fs.readFileSync('src/components/RestChat.tsx', 'utf8');

const target = /<div style={{ gridColumn: "1 \/ -1" }}>\s*<span>User ID<\/span>\s*<strong>{selectedProfile\.id}<\/strong>\s*<\/div>/g;
const newC = c.replace(target, '');
if (newC !== c) {
    fs.writeFileSync('src/components/RestChat.tsx', newC);
    console.log('SUCCESS: Removed User ID from RestChat.tsx');
} else {
    // try literal match if regex fails
    const lines = c.split('\n');
    const filtered = lines.filter(l => !l.includes('<span>User ID</span>') && !l.includes('{selectedProfile.id}'));
    if (filtered.length < lines.length) {
        fs.writeFileSync('src/components/RestChat.tsx', filtered.join('\n'));
        console.log('SUCCESS: Filtered User ID lines from RestChat.tsx');
    } else {
        console.log('ERROR: Pattern not found in RestChat.tsx');
    }
}
