const fs = require('fs');

// 1. AdminRegistration Buffering
let reg = fs.readFileSync('src/app/admin/registration/page.tsx', 'utf8');
if (!reg.includes('if (loading && !successInfo)')) {
  // We'll show a buffer even if not loading students, just for consistency on mount if needed, 
  // but better to show it during the actual registration process as an overlay or just a big center spinner if we want.
  // The user specifically asked for "buffering" like the profile.
  reg = reg.replace(
    'return (\n        <div className="page-wrapper">',
    'if (loading && !successInfo) {\n        return (\n            <div className="page-wrapper" style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>\n                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>\n                    <div style={{ width: "36px", height: "36px", border: "3px solid var(--gray-200)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />\n                    <div style={{ color: "var(--gray-500)", fontWeight: 500 }}>Processing registration...</div>\n                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>\n                </div>\n            </div>\n        );\n    }\n\n    return (\n        <div className="page-wrapper">'
  );
}
fs.writeFileSync('src/app/admin/registration/page.tsx', reg);

// 2. AdminSettings Select Rounding
let settings = fs.readFileSync('src/app/admin/settings/page.tsx', 'utf8');
settings = settings.replace(
  'style={{ display: "block", width: "100%", maxWidth: 280, marginTop: 6, padding: "0.5rem" }}',
  'style={{ display: "block", width: "100%", maxWidth: 280, marginTop: 6, padding: "0.6rem 1rem", borderRadius: "20px", border: "1px solid var(--gray-200)", background: "var(--gray-50)" }}'
);
fs.writeFileSync('src/app/admin/settings/page.tsx', settings);

// 3. AdminAudit Select Rounding
let audit = fs.readFileSync('src/app/admin/audit/page.tsx', 'utf8');
audit = audit.replace(
  'style={{ border: "none", background: "transparent", cursor: "pointer", outline: "none", color: "var(--gray-800)", fontWeight: 500 }}',
  'style={{ border: "1px solid var(--gray-200)", background: "var(--gray-50)", cursor: "pointer", outline: "none", color: "var(--gray-800)", fontWeight: 500, padding: "0.25rem 0.75rem", borderRadius: "16px" }}'
);
fs.writeFileSync('src/app/admin/audit/page.tsx', audit);

console.log('SUCCESS: Rounding and Buffering applied');
