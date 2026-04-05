const fs = require('fs');

try {
  let c = fs.readFileSync('src/components/RestChat.tsx', 'utf8');
  c = c.replace(/<div className="chat-conv-avatar" aria-hidden="true">[\s\S]*?<\/div>/, `<div className="chat-conv-avatar" aria-hidden="true">\n  <span className="chat-avatar-text">{initials(labelName)}</span>\n  <span className={\`chat-avatar-status \${threadOnline ? "online" : "offline"}\`} />\n</div>`);
  fs.writeFileSync('src/components/RestChat.tsx', c);
  console.log('Replaced');
} catch (e) {
  console.error("Error:", e);
}
