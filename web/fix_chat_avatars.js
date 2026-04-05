const fs = require('fs');

let c = fs.readFileSync('src/components/RestChat.tsx', 'utf8');

// 1. Import AuthenticatedAvatar
if (!c.includes('import AuthenticatedAvatar')) {
  c = c.replace(
    'import Select from "@/components/Select";',
    'import Select from "@/components/Select";\nimport AuthenticatedAvatar from "@/components/AuthenticatedAvatar";'
  );
}

// 2. Fix Conversation List Avatars (lines 677-680 approx)
// We need to pass the fileId if it's a private chat
c = c.replace(
  /<div className="chat-conv-avatar" aria-hidden="true">[\s\S]+?<\/div>/g,
  (match) => {
    // This is inside filteredConvs.map(c => ...)
    // Label is initials(labelName)
    return `<div className="chat-conv-avatar" aria-hidden="true" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <AuthenticatedAvatar
                            fileId={isPrivate && primaryUser ? primaryUser.profileImageFileId : null}
                            initials={initials(labelName)}
                            size={40}
                            alt={labelName}
                          />
                          <span className={\`chat-avatar-status \${threadOnline ? "online" : "offline"}\`} style={{ position: "absolute", bottom: 0, right: 0, border: "2px solid white" }} />
                        </div>`;
  }
);

// 3. Fix Active Chat Head Avatar (lines 707-712 approx)
c = c.replace(
  /<div className="chat-avatar" style=\{\{ width: 44, height: 44, fontSize: "1\.1rem" \}\}>[\s\S]+?<\/div>/g,
  (match) => {
    return `<div className="chat-avatar" style={{ width: 44, height: 44, position: "relative" }}>
                  <AuthenticatedAvatar
                    fileId={activeConv?.type === "private" && dmParticipant ? dmParticipant.profileImageFileId : null}
                    initials={initials(activeConv?.type === "private" && dmParticipant ? toLabel(dmParticipant) : activeConv?.title ?? "Chat")}
                    size={44}
                  />
                  {activeConv?.type === "private" && dmParticipant && (
                    <span className={\`chat-avatar-status \${onlineUserIds.includes(dmParticipant.id) ? "online" : "offline"}\`} style={{ position: "absolute", bottom: 0, right: 0, border: "2px solid white" }} />
                  )}
                </div>`;
  }
);

// 4. Fix Message List Avatars (usually around 850)
// Search for initials(senderName)
c = c.replace(
  /<div className="chat-msg-avatar">[\s\S]+?<\/div>/g,
  (match) => {
    return `<div className="chat-msg-avatar">
                        <AuthenticatedAvatar
                          fileId={sender?.profileImageFileId}
                          initials={initials(senderName)}
                          size={32}
                          alt={senderName}
                        />
                      </div>`;
  }
);

// 5. Fix Participant Detail Modal Avatar (usually around 1050)
c = c.replace(
  /<div className="avatar avatar-initials avatar-xl" style=\{\{ fontSize: "1\.6rem", marginBottom: "1rem" \}\}>[\s\S]+?<\/div>/g,
  (match) => {
    // Inside profileUser block
    return `<div style={{ marginBottom: "1rem" }}>
              <AuthenticatedAvatar
                fileId={profileUser.profileImageFileId}
                initials={initials(profileFallbackName)}
                size={80}
              />
            </div>`;
  }
);

fs.writeFileSync('src/components/RestChat.tsx', c);
console.log('SUCCESS: RestChat avatars fixed');
