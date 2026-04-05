const fs = require('fs');

// --- 1. Audit Log ---
function fixAudit() {
  let c = fs.readFileSync('src/app/admin/audit/page.tsx', 'utf8');
  if (!c.includes('import TablePagination')) {
    c = c.replace(
      'import Select from "@/components/Select";',
      'import Select from "@/components/Select";\nimport TablePagination from "@/components/TablePagination";'
    );
  }
  // Replace custom pagination with TablePagination
  c = c.replace(
    /<div style=\{\{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "1\.5rem", padding: "1rem", borderTop: "1px solid var\(--gray-200\)", fontSize: "0\.875rem", color: "var\(--gray-700\)" \}\}>[\s\S]+?<\/div>\s+<\/div>/,
    `<TablePagination
          total={total}
          page={currentPage}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      </div>`
  );
  // Soften the filter input style to match the new standard
  c = c.replace(
    /style=\{\{ width: "100%", maxWidth: "300px", padding: "0\.5rem 0\.75rem", borderRadius: "6px", border: "1px solid var\(--gray-300\)", fontSize: "0\.875rem", outline: "none" \}\}/,
    `style={{ 
        width: "100%", 
        maxWidth: "340px", 
        padding: "0.65rem 1rem", 
        borderRadius: "12px", 
        border: "1px solid var(--gray-200)", 
        fontSize: "0.9rem",
        outline: "none",
        background: "var(--gray-50)",
        transition: "all 0.2s"
    }}`
  );
  fs.writeFileSync('src/app/admin/audit/page.tsx', c);
  console.log('Audit fixed');
}

// --- 2. Parents ---
function fixParents() {
  let c = fs.readFileSync('src/app/admin/parents/page.tsx', 'utf8');
  if (!c.includes('import TablePagination')) {
    c = c.replace(
      'import Select from "@/components/Select";',
      'import Select from "@/components/Select";\nimport TablePagination from "@/components/TablePagination";'
    );
  }
  if (!c.includes('const [page, setPage] = useState')) {
    c = c.replace(
      'const [loading, setLoading] = useState(true);',
      'const [loading, setLoading] = useState(true);\n  const [page, setPage] = useState(0);\n  const [rowsPerPage, setRowsPerPage] = useState(10);\n  const [filterText, setFilterText] = useState("");'
    );
  }
  const logic = `
  const filteredLinks = links.filter(l => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    const p = parentMap.get(l.parentId);
    const s = studentMap.get(l.studentId);
    const pn = p ? \`\${p.firstName} \${p.lastName}\`.toLowerCase() : "";
    const sn = s ? \`\${s.firstName} \${s.lastName}\`.toLowerCase() : "";
    return pn.includes(q) || sn.includes(q) || l.relationship.toLowerCase().includes(q);
  });
  const total = filteredLinks.length;
  const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
  const currentPage = Math.min(page, maxPage);
  const startIdx = currentPage * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, total);
  const visibleRows = filteredLinks.slice(startIdx, endIdx);
`;
  if (!c.includes('const visibleRows')) {
      c = c.replace('if (loading && !parents.length', `${logic}\n\n  if (loading && !parents.length`);
  }
  
  // Search bar
  const searchUI = `<div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--gray-100)", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
            <input
              value={filterText}
              onChange={(e) => { setFilterText(e.target.value); setPage(0); }}
              placeholder="Filter links..."
              style={{ 
                  width: "100%", 
                  padding: "0.65rem 1rem 0.65rem 2.5rem", 
                  borderRadius: "12px", 
                  border: "1px solid var(--gray-200)", 
                  fontSize: "0.9rem",
                  outline: "none",
                  background: "var(--gray-50)"
              }}
            />
          </div>
        </div>`;
        
  c = c.replace(
      'Existing links\n        </h3>\n        <div className="table-wrapper">', 
      \`Existing links\n        </h3>\n        \${searchUI}\n        <div className="table-wrapper">\`
  );
  c = c.replace('<div className="card parents-panel">', '<div className="card" style={{ padding: 0, overflow: "hidden" }}>');
  c = c.replace('links.map((l) => {', 'visibleRows.map((l) => {');
  c = c.replace(
    '</table>\n        </div>\n      </div>',
    \`</table>
        </div>
        <TablePagination
          total={total}
          page={currentPage}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      </div>\`
  );
  fs.writeFileSync('src/app/admin/parents/page.tsx', c);
  console.log('Parents fixed');
}

// --- 3. Feedback ---
function fixFeedback() {
  let c = fs.readFileSync('src/app/admin/feedback/page.tsx', 'utf8');
  if (!c.includes('import TablePagination')) {
    c = c.replace(
      'import Select from "@/components/Select";',
      'import { Search } from "lucide-react";\nimport Select from "@/components/Select";\nimport TablePagination from "@/components/TablePagination";'
    );
  }
  if (!c.includes('const [page, setPage] = useState')) {
    c = c.replace(
      'const [loading, setLoading] = useState(true);',
      'const [loading, setLoading] = useState(true);\n  const [page, setPage] = useState(0);\n  const [rowsPerPage, setRowsPerPage] = useState(10);\n  const [filterText, setFilterText] = useState("");'
    );
  }
  const logic = `
  const filtered = rows.filter(t => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    const u = byId.get(t.authorId);
    const author = u ? \`\${u.firstName} \${u.lastName}\`.toLowerCase() : "";
    return author.includes(q) || t.message.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.status.toLowerCase().includes(q);
  });
  const total = filtered.length;
  const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
  const currentPage = Math.min(page, maxPage);
  const startIdx = currentPage * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, total);
  const visibleRows = filtered.slice(startIdx, endIdx);
`;
  if (!c.includes('const visibleRows')) {
      c = c.replace('const byId', `${logic}\n\n  const byId`);
  }
  
  const searchUI = `<div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--gray-100)", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
            <input
              value={filterText}
              onChange={(e) => { setFilterText(e.target.value); setPage(0); }}
              placeholder="Filter feedback..."
              style={{ 
                  width: "100%", 
                  padding: "0.65rem 1rem 0.65rem 2.5rem", 
                  borderRadius: "12px", 
                  border: "1px solid var(--gray-200)", 
                  fontSize: "0.9rem",
                  outline: "none",
                  background: "var(--gray-50)"
              }}
            />
          </div>
        </div>`;
        
  c = c.replace('<div className="card">', \`<div className="card" style={{ padding: 0, overflow: "hidden" }}>\n        \${searchUI}\`);
  c = c.replace('rows.map((t) => {', 'visibleRows.map((t) => {');
  c = c.replace(
    '</table>\n        </div>\n      </div>',
    \`</table>
        </div>
        <TablePagination
          total={total}
          page={currentPage}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      </div>\`
  );
  fs.writeFileSync('src/app/admin/feedback/page.tsx', c);
  console.log('Feedback fixed');
}

// --- 4. Classes ---
function fixClasses() {
  let c = fs.readFileSync('src/app/admin/classes/page.tsx', 'utf8');
  if (!c.includes('import TablePagination')) {
    c = c.replace(
      'import Select from "@/components/Select";',
      'import { Search } from "lucide-react";\nimport Select from "@/components/Select";\nimport TablePagination from "@/components/TablePagination";'
    );
  }
  if (!c.includes('const [page, setPage] = useState')) {
    c = c.replace(
      'const [loading, setLoading] = useState(true);',
      'const [loading, setLoading] = useState(true);\n  const [page, setPage] = useState(0);\n  const [rowsPerPage, setRowsPerPage] = useState(10);\n  const [filterText, setFilterText] = useState("");'
    );
  }
  const logic = `
  const filteredOfferings = offerings.filter(o => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    const label = labelOffering(o, gMap, sMap, subMap).toLowerCase();
    const teacher = tMap.get(o.teacherId);
    const tn = teacher ? \`\${teacher.firstName} \${teacher.lastName}\`.toLowerCase() : "";
    return label.includes(q) || tn.includes(q);
  });
  const total = filteredOfferings.length;
  const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
  const currentPage = Math.min(page, maxPage);
  const startIdx = currentPage * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, total);
  const visibleRows = filteredOfferings.slice(startIdx, endIdx);
`;
  if (!c.includes('const visibleRows')) {
      c = c.replace('const showT', `${logic}\n\n  const showT`);
  }
  
  const searchUI = `<div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--gray-100)", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
            <input
              value={filterText}
              onChange={(e) => { setFilterText(e.target.value); setPage(0); }}
              placeholder="Filter classes..."
              style={{ 
                  width: "100%", 
                  padding: "0.65rem 1rem 0.65rem 2.5rem", 
                  borderRadius: "12px", 
                  border: "1px solid var(--gray-200)", 
                  fontSize: "0.9rem",
                  outline: "none",
                  background: "var(--gray-50)"
              }}
            />
          </div>
        </div>`;
        
  // Need to find the right container for classes table
  c = c.replace(
      '<div className="card" style={{ marginTop: "1rem" }}>', 
      \`<div className="card" style={{ marginTop: "1rem", padding: 0, overflow: "hidden" }}>\n        \${searchUI}\`
  );
  c = c.replace('offerings.map((o) => {', 'visibleRows.map((o) => {');
  c = c.replace(
    '</table>\n        </div>\n      </div>',
    \`</table>
        </div>
        <TablePagination
          total={total}
          page={currentPage}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      </div>\`
  );
  fs.writeFileSync('src/app/admin/classes/page.tsx', c);
  console.log('Classes fixed');
}

fixAudit();
fixParents();
fixFeedback();
fixClasses();
