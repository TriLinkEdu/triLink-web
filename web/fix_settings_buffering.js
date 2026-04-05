const fs = require('fs');

let c = fs.readFileSync('src/app/admin/settings/page.tsx', 'utf8');

// 1. Add state
c = c.replace(
  'const [userBlob, setUserBlob] = useState<Record<string, unknown>>({});',
  'const [userBlob, setUserBlob] = useState<Record<string, unknown>>({});\n  const [isLoading, setIsLoading] = useState(true);'
);

// 2. Set isLoading in load()
if (!c.includes('setIsLoading(true);')) {
  c = c.replace(
    'const load = async () => {\n    setErr(null);',
    'const load = async () => {\n    setIsLoading(true);\n    setErr(null);'
  );
  // Add setIsLoading(false) in finally
  c = c.replace(
    'setYears(y);\n    } catch (e) {',
    'setYears(y);\n    } catch (e) {\n      console.error(e);\n      setErr(e instanceof Error ? e.message : "Load failed");\n    } finally {\n      setIsLoading(false);\n    }'
  );
}

// 3. Add loading JSX
if (!c.includes('if (isLoading)')) {
  c = c.replace(
    'return (\n    <div className="page-wrapper">',
    'if (isLoading) {\n    return (\n      <div className="page-wrapper" style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>\n        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>\n          <div style={{ width: "36px", height: "36px", border: "3px solid var(--gray-200)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />\n          <div style={{ color: "var(--gray-500)", fontWeight: 500 }}>Loading settings...</div>\n          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>\n        </div>\n      </div>\n    );\n  }\n\n  return (\n    <div className="page-wrapper">'
  );
}

fs.writeFileSync('src/app/admin/settings/page.tsx', c);
console.log('SUCCESS: AdminSettings buffered');
