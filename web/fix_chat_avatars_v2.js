const fs = require('fs');

let c = fs.readFileSync('src/components/RestChat.tsx', 'utf8');

// Use a more generic approach to replace all avatar blocks that only show initials

// 1. Message list avatars (the buttons next to bubbles)
const msgAvatarRegex = /<button type="button" className="chat-participant-avatar chat-bubble-avatar"[\s\S]+?<\/button>/g;
c = c.replace(msgAvatarRegex, (match) => {
  // We need to pass the fileId from 'sender?.profileImageFileId'
  return `<div className="chat-participant-avatar chat-bubble-avatar" style={{ position: "relative", cursor: "pointer" }}
                                onClick={() => {
                                  setProfileUserId(m.senderId);
                                  setProfileFallbackName(senderLabel);
                                }}
                              >
                                <AuthenticatedAvatar
                                  fileId={sender?.profileImageFileId}
                                  initials={initials(senderLabel)}
                                  size={40}
                                  alt={senderLabel}
                                />
                                <span className={\`chat-avatar-status \${onlineUserIds.includes(m.senderId) ? "online" : "offline"}\`} style={{ position: "absolute", bottom: 0, right: 0, border: "2px solid white" }} />
                              </div>`;
});

// 2. Chat Sidebar Details (right side)
// Private DM
c = c.replace(
  /<div className="chat-avatar">\s+{initials\(dmParticipant \? toLabel\(dmParticipant\) : activeConv\?\.title \?\? "DM"\)}\s+<span className={\`chat-avatar-status \${dmParticipant && onlineUserIds\.includes\(dmParticipant\.id\) \? "online" : "offline"}\`} \/>\s+<\/div>/,
  `<div className="chat-avatar" style={{ position: "relative" }}>
                  <AuthenticatedAvatar
                    fileId={dmParticipant?.profileImageFileId}
                    initials={initials(dmParticipant ? toLabel(dmParticipant) : activeConv?.title ?? "DM")}
                    size={44}
                  />
                  <span className={\`chat-avatar-status \${dmParticipant && onlineUserIds.includes(dmParticipant.id) ? "online" : "offline"}\`} style={{ position: "absolute", bottom: 0, right: 0, border: "2px solid white" }} />
                </div>`
);

// 3. Chat Sidebar Member List
c = c.replace(
  /<span className="chat-participant-avatar">\s+{initials\(p\.name\)}\s+<span className={\`chat-avatar-status \${p\.online \? "online" : "offline"}\`} \/>\s+<\/span>/g,
  `<span className="chat-participant-avatar" style={{ position: "relative", display: "inline-block" }}>
                    <AuthenticatedAvatar
                      fileId={(p as any).profileImageFileId}
                      initials={initials(p.name)}
                      size={32}
                      alt={p.name}
                    />
                    <span className={\`chat-avatar-status \${p.online ? "online" : "offline"}\`} style={{ position: "absolute", bottom: -2, right: -2, border: "2px solid white" }} />
                  </span>`
);

// 4. Group stack avatars in sidebar details
c = c.replace(
  /<span key={\`\${name}-\${idx}\`} className="chat-avatar-group-chip" style=\{\{ transform: \`translateX\(\${idx \* -7}px\)\` \}\}>\s+{initials\(name\)}\s+<\/span>/g,
  `<span key={\`\${name}-\${idx}\`} className="chat-avatar-group-chip" style={{ transform: \`translateX(\${idx * -7}px)\`, position: "relative" }}>
                        <AuthenticatedAvatar
                          fileId={null} // Group members names list usually doesn't have ID easily here but initials are fine
                          initials={initials(name)}
                          size={28}
                        />
                      </span>`
);

fs.writeFileSync('src/components/RestChat.tsx', c);
console.log('SUCCESS: All RestChat avatars fixed');
