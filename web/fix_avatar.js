const fs = require('fs');

let content = fs.readFileSync('src/components/RestChat.tsx', 'utf8');

const target = `                          {isPrivate ? (
                            <>
                              <span className="chat-avatar-text">{initials(labelName)}</span>
                              <span className={\`chat-avatar-status \${threadOnline ? "online" : "offline"}\`} />
                            </>
                          ) : (
                            <>
                              <span className="chat-conv-avatar-stack">
                                {threadAvatars.map((name, idx) => (
                                  <span key={\`\${name}-\${idx}\`} className="chat-conv-avatar-stack-item" style={{ transform: \`translateX(\${idx * -6}px)\` }}>
                                    {initials(name)}
                                  </span>
                                ))}
                              </span>
                              <span className={\`chat-avatar-status \${threadOnline ? "online" : "offline"}\`} />
                            </>
                          )}`;

const replacement = `                          <>
                            <span className="chat-avatar-text">{initials(labelName)}</span>
                            <span className={\`chat-avatar-status \${threadOnline ? "online" : "offline"}\`} />
                          </>`;

// Account for potential Windows \\r\\n
const normalizedContent = content.replace(/\\r\\n/g, '\\n');
const normalizedTarget = target.replace(/\\r\\n/g, '\\n');

if (normalizedContent.includes(normalizedTarget)) {
  const newContent = normalizedContent.replace(normalizedTarget, replacement);
  fs.writeFileSync('src/components/RestChat.tsx', newContent);
  console.log('Replaced successfully');
} else {
  console.log('Target not found');
}
