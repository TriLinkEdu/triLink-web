const fs = require('fs');

function fixAudit() {
  let c = fs.readFileSync('src/app/admin/audit/page.tsx', 'utf8');
  if (!c.includes('import TablePagination')) {
    c = c.replace(
      'import Select from "@/components/Select";',
      'import Select from "@/components/Select";\nimport TablePagination from "@/components/TablePagination";'
    );
  }
  c = c.replace(
    /<div style=\{\{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "1\.5rem", padding: "1rem", borderTop: "1px solid var\(--gray-200\)", fontSize: "0\.875rem", color: "var\(--gray-700\)" \}\}>[\s\S]+?<\/div>\s+<\/div>/,
    '<TablePagination\n          total={total}\n          page={currentPage}\n          rowsPerPage={rowsPerPage}\n          onPageChange={setPage}\n          onRowsPerPageChange={setRowsPerPage}\n        />\n      </div>'
  );
  c = c.replace(
    /style=\{\{ width: "100%", maxWidth: "300px", padding: "0\.5rem 0\.75rem", borderRadius: "6px", border: "1px solid var\(--gray-300\)", fontSize: "0\.875rem", outline: "none" \}\}/,
    'style={{\n        width: "100%",\n        maxWidth: "340px",\n        padding: "0.65rem 1rem",\n        borderRadius: "12px",\n        border: "1px solid var(--gray-200)",\n        fontSize: "0.9rem",\n        outline: "none",\n        background: "var(--gray-50)",\n        transition: "all 0.2s"\n    }}'
  );
  fs.writeFileSync('src/app/admin/audit/page.tsx', c);
  console.log('Audit fixed');
}

function fixParents() {
  let c = fs.readFileSync('src/app/admin/parents/page.tsx', 'utf8');
  if (!c.includes('import TablePagination')) {
    c = c.replace('import Select from "@/components/Select";', 'import Select from "@/components/Select";\nimport TablePagination from "@/components/TablePagination";');
  }
  if (!c.includes('const [page, setPage] = useState')) {
    c = c.replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(true);\n  const [page, setPage] = useState(0);\n  const [rowsPerPage, setRowsPerPage] = useState(10);\n  const [filterText, setFilterText] = useState("");');
  }
  const logic = '\n  const filteredLinks = links.filter(l => {\n    if (!filterText.trim()) return true;\n    const q = filterText.toLowerCase();\n    const p = parentMap.get(l.parentId);\n    const s = studentMap.get(l.studentId);\n    const pn = p ? `${p.firstName} ${p.lastName}`.toLowerCase() : "";\n    const sn = s ? `${s.firstName} ${s.lastName}`.toLowerCase() : "";\n    return pn.includes(q) || sn.includes(q) || l.relationship.toLowerCase().includes(q);\n  });\n  const total = filteredLinks.length;\n  const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);\n  const currentPage = Math.min(page, maxPage);\n  const startIdx = currentPage * rowsPerPage;\n  const endIdx = Math.min(startIdx + rowsPerPage, total);\n  const visibleRows = filteredLinks.slice(startIdx, endIdx);\n';
  if (!c.includes('const visibleRows')) {
      c = c.replace('if (loading && !parents.length', logic + '\n\n  if (loading && !parents.length');
  }
  const searchUI = '<div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--gray-100)", display: "flex", alignItems: "center", gap: "1rem" }}>\n          <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>\n            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />\n            <input\n              value={filterText}\n              onChange={(e) => { setFilterText(e.target.value); setPage(0); }}\n              placeholder="Filter links..."\n              style={{\n                  width: "100%",\n                  padding: "0.65rem 1rem 0.65rem 2.5rem",\n                  borderRadius: "12px",\n                  border: "1px solid var(--gray-200)",\n                  fontSize: "0.9rem",\n                  outline: "none",\n                  background: "var(--gray-50)"\n              }}\n            />\n          </div>\n        </div>';
  c = c.replace('Existing links\n        </h3>\n        <div className="table-wrapper">', 'Existing links\n        </h3>\n        ' + searchUI + '\n        <div className="table-wrapper">');
  c = c.replace('<div className="card parents-panel">', '<div className="card" style={{ padding: 0, overflow: "hidden" }}>');
  c = c.replace('links.map((l) => {', 'visibleRows.map((l) => {');
  c = c.replace('</table>\n        </div>\n      </div>', '</table>\n        </div>\n        <TablePagination\n          total={total}\n          page={currentPage}\n          rowsPerPage={rowsPerPage}\n          onPageChange={setPage}\n          onRowsPerPageChange={setRowsPerPage}\n        />\n      </div>');
  fs.writeFileSync('src/app/admin/parents/page.tsx', c);
  console.log('Parents fixed');
}

function fixFeedback() {
  let c = fs.readFileSync('src/app/admin/feedback/page.tsx', 'utf8');
  if (!c.includes('import TablePagination')) {
    c = c.replace('import Select from "@/components/Select";', 'import { Search } from "lucide-react";\nimport Select from "@/components/Select";\nimport TablePagination from "@/components/TablePagination";');
  }
  if (!c.includes('const [page, setPage] = useState')) {
    c = c.replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(true);\n  const [page, setPage] = useState(0);\n  const [rowsPerPage, setRowsPerPage] = useState(10);\n  const [filterText, setFilterText] = useState("");');
  }
  const logic = '\n  const filtered = rows.filter(t => {\n    if (!filterText.trim()) return true;\n    const q = filterText.toLowerCase();\n    const u = byId.get(t.authorId);\n    const author = u ? `${u.firstName} ${u.lastName}`.toLowerCase() : "";\n    return author.includes(q) || t.message.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.status.toLowerCase().includes(q);\n  });\n  const total = filtered.length;\n  const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);\n  const currentPage = Math.min(page, maxPage);\n  const startIdx = currentPage * rowsPerPage;\n  const endIdx = Math.min(startIdx + rowsPerPage, total);\n  const visibleRows = filtered.slice(startIdx, endIdx);\n';
  if (!c.includes('const visibleRows')) {
      c = c.replace('const byId', logic + '\n\n  const byId');
  }
  const searchUI = '<div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--gray-100)", display: "flex", alignItems: "center", gap: "1rem" }}>\n          <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>\n            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />\n            <input\n              value={filterText}\n              onChange={(e) => { setFilterText(e.target.value); setPage(0); }}\n              placeholder="Filter feedback..."\n              style={{\n                  width: "100%",\n                  padding: "0.65rem 1rem 0.65rem 2.5rem",\n                  borderRadius: "12px",\n                  border: "1px solid var(--gray-200)",\n                  fontSize: "0.9rem",\n                  outline: "none",\n                  background: "var(--gray-50)"\n              }}\n            />\n          </div>\n        </div>';
  c = c.replace('<div className="card">', '<div className="card" style={{ padding: 0, overflow: "hidden" }}>\n        ' + searchUI);
  c = c.replace('rows.map((t) => {', 'visibleRows.map((t) => {');
  c = c.replace('</table>\n        </div>\n      </div>', '</table>\n        </div>\n        <TablePagination\n          total={total}\n          page={currentPage}\n          rowsPerPage={rowsPerPage}\n          onPageChange={setPage}\n          onRowsPerPageChange={setRowsPerPage}\n        />\n      </div>');
  fs.writeFileSync('src/app/admin/feedback/page.tsx', c);
  console.log('Feedback fixed');
}

function fixClasses() {
  let c = fs.readFileSync('src/app/admin/classes/page.tsx', 'utf8');
  if (!c.includes('import TablePagination')) {
    c = c.replace('import Select from "@/components/Select";', 'import { Search } from "lucide-react";\nimport Select from "@/components/Select";\nimport TablePagination from "@/components/TablePagination";');
  }
  if (!c.includes('const [page, setPage] = useState')) {
    c = c.replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(true);\n  const [page, setPage] = useState(0);\n  const [rowsPerPage, setRowsPerPage] = useState(10);\n  const [filterText, setFilterText] = useState("");');
  }
  const logic = '\n  const filteredOfferings = offerings.filter(o => {\n    if (!filterText.trim()) return true;\n    const q = filterText.toLowerCase();\n    const label = labelOffering(o, gMap, sMap, subMap).toLowerCase();\n    const teacher = tMap.get(o.teacherId);\n    const tn = teacher ? `${teacher.firstName} ${teacher.lastName}`.toLowerCase() : "";\n    return label.includes(q) || tn.includes(q);\n  });\n  const total = filteredOfferings.length;\n  const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);\n  const currentPage = Math.min(page, maxPage);\n  const startIdx = currentPage * rowsPerPage;\n  const endIdx = Math.min(startIdx + rowsPerPage, total);\n  const visibleRows = filteredOfferings.slice(startIdx, endIdx);\n';
  if (!c.includes('const visibleRows')) {
      c = c.replace('const showT', logic + '\n\n  const showT');
  }
  const searchUI = '<div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--gray-100)", display: "flex", alignItems: "center", gap: "1rem" }}>\n          <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>\n            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />\n            <input\n              value={filterText}\n              onChange={(e) => { setFilterText(e.target.value); setPage(0); }}\n              placeholder="Filter classes..."\n              style={{\n                  width: "100%",\n                  padding: "0.65rem 1rem 0.65rem 2.5rem",\n                  borderRadius: "12px",\n                  border: "1px solid var(--gray-200)",\n                  fontSize: "0.9rem",\n                  outline: "none",\n                  background: "var(--gray-50)"\n              }}\n            />\n          </div>\n        </div>';
  c = c.replace('<div className="card" style={{ marginTop: "1rem" }}>', '<div className="card" style={{ marginTop: "1rem", padding: 0, overflow: "hidden" }}>\n        ' + searchUI);
  c = c.replace('offerings.map((o) => {', 'visibleRows.map((o) => {');
  c = c.replace('</table>\n        </div>\n      </div>', '</table>\n        </div>\n        <TablePagination\n          total={total}\n          page={currentPage}\n          rowsPerPage={rowsPerPage}\n          onPageChange={setPage}\n          onRowsPerPageChange={setRowsPerPage}\n        />\n      </div>');
  fs.writeFileSync('src/app/admin/classes/page.tsx', c);
  console.log('Classes fixed');
}

fixAudit(); fixParents(); fixFeedback(); fixClasses();
