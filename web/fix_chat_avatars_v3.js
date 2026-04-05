const fs = require('fs');

let c = fs.readFileSync('src/components/RestChat.tsx', 'utf8');

const target = `<div className="chat-avatar chat-profile-pop-avatar">{initials(selectedProfile.name)}</div>`;

if (c.includes(target)) {
  c = c.replace(
    target, 
    `<AuthenticatedAvatar
                fileId={(selectedProfile as any).profileImageFileId}
                initials={initials(selectedProfile.name)}
                size={82}
                className="chat-profile-pop-avatar"
              />`
  );
}

fs.writeFileSync('src/components/RestChat.tsx', c);
console.log('SUCCESS: Final RestChat avatar fixed');
