const fs = require('fs');

let c = fs.readFileSync('src/app/student/profile/page.tsx', 'utf8');

// 1. Imports
c = c.replace(
  'import { getStoredUser } from "../../../lib/auth";',
  'import { useCurrentUser } from "@/lib/useCurrentUser";\nimport AuthenticatedAvatar from "@/components/AuthenticatedAvatar";'
);

// 2. State & Hydration
if (!c.includes('useCurrentUser("student")')) {
    c = c.replace(
        'const [draft, setDraft] = useState<StudentProfile>(defaultProfile);',
        'const [draft, setDraft] = useState<StudentProfile>(defaultProfile);\n    const user = useCurrentUser("student");'
    );
    // Replace the manual hydrate with one that stays in sync
    c = c.replace(
        /useEffect\(\(\) => \{[\s\S]+?\}, \[\]\);/,
        `useEffect(() => {
        if (user && user.email) {
            setProfile((prev) => ({
                ...prev,
                firstName: user.firstName || prev.firstName,
                lastName: user.lastName || prev.lastName,
                email: user.email || prev.email,
                grade: user.grade || prev.grade,
                section: user.section || prev.section,
            }));
            if (!isEditing) {
                setDraft((prev) => ({
                    ...prev,
                    firstName: user.firstName || prev.firstName,
                    lastName: user.lastName || prev.lastName,
                    email: user.email || prev.email,
                    grade: user.grade || prev.grade,
                    section: user.section || prev.section,
                }));
            }
        }
    }, [user, isEditing]);`
    );
}

// 3. Avatar replacement
const studentAvatarBlock = `<div
                            className="avatar avatar-xl avatar-initials"
                            style={{ fontSize: "1.5rem", flexShrink: 0, background: "linear-gradient(135deg, #0891b2, #0e7490)" }}
                        >
                            {initials || "S"}
                        </div>`;
if (c.includes(studentAvatarBlock)) {
    c = c.replace(studentAvatarBlock, `<AuthenticatedAvatar
                            fileId={user.profileImageFileId}
                            initials={initials || "S"}
                            size={110}
                            alt={fullName}
                            style={{ border: "4px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                        />`);
} else {
    // regex fallback
    c = c.replace(/<div\n\s+className="avatar avatar-xl avatar-initials"[\s\S]+?{initials \|\| "S"}\n\s+<\/div>/, `<AuthenticatedAvatar
                            fileId={user.profileImageFileId}
                            initials={initials || "S"}
                            size={110}
                            alt={fullName}
                            style={{ border: "4px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                        />`);
}

fs.writeFileSync('src/app/student/profile/page.tsx', c);
console.log('SUCCESS: StudentProfile fixed');
