const fs = require('fs');

let c = fs.readFileSync('src/app/parent/profile/page.tsx', 'utf8');

// 1. Imports
c = c.replace(
  'import { useRef, useState } from "react";\nimport Select from "@/components/Select";',
  'import { useRef, useState, useEffect } from "react";\nimport Select from "@/components/Select";\nimport { useCurrentUser } from "@/lib/useCurrentUser";\nimport AuthenticatedAvatar from "@/components/AuthenticatedAvatar";'
);

// 2. Hydration logic
if (!c.includes('useCurrentUser("parent")')) {
  c = c.replace(
    'const [draft, setDraft] = useState<ParentProfile>(initialProfile);',
    'const [draft, setDraft] = useState<ParentProfile>(initialProfile);\n    const user = useCurrentUser("parent");\n\n    useEffect(() => {\n        if (user && user.email) {\n            const next = {\n                ...profile,\n                firstName: user.firstName || profile.firstName,\n                lastName: user.lastName || profile.lastName,\n                email: user.email || profile.email,\n                relationship: user.relationship || profile.relationship,\n                childName: user.childName || profile.childName,\n                childGrade: user.grade || profile.childGrade,\n                childSection: user.section || profile.childSection,\n            };\n            setProfile(next);\n            if (!isEditing) setDraft(next);\n        }\n    }, [user, isEditing]);'
  );
}

// 3. Avatar replacement
const avatarBlock = `<div
                            className="avatar avatar-xl avatar-initials"
                            style={{ fontSize: "1.5rem", flexShrink: 0, background: "linear-gradient(135deg, #9333ea, #7e22ce)" }}
                        >
                            {initials || "P"}
                        </div>`;
if (c.includes(avatarBlock)) {
    c = c.replace(avatarBlock, `<AuthenticatedAvatar
                            fileId={user.profileImageFileId}
                            initials={initials || "P"}
                            size={110}
                            alt={user.fullName || "User"}
                            style={{ border: "4px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                        />`);
} else {
    // try fallback substring match
    c = c.replace(/<div\n\s+className="avatar avatar-xl avatar-initials"[\s\S]+?{initials \|\| "P"}\n\s+<\/div>/, `<AuthenticatedAvatar
                            fileId={user.profileImageFileId}
                            initials={initials || "P"}
                            size={110}
                            alt={user.fullName || "User"}
                            style={{ border: "4px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                        />`);
}

fs.writeFileSync('src/app/parent/profile/page.tsx', c);
console.log('SUCCESS: ParentProfile fixed');
