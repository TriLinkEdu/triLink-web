const fs = require('fs');

let c = fs.readFileSync('src/app/admin/students/page.tsx', 'utf8');

// 1. Imports
if (!c.includes('import TablePagination')) {
  c = c.replace(
    'import { type PublicUser, listUsers } from "@/lib/admin-api";',
    'import { type PublicUser, listUsers } from "@/lib/admin-api";\nimport TablePagination from "@/components/TablePagination";'
  );
}

// 2. State
if (!c.includes('const [page, setPage] = useState')) {
  c = c.replace(
    'const [loading, setLoading] = useState(true);',
    'const [loading, setLoading] = useState(true);\n  const [page, setPage] = useState(0);\n  const [rowsPerPage, setRowsPerPage] = useState(10);'
  );
}

// 3. Logic - we keep loading for search, but also filter locally for what's fetched
const studentPaginationLogic = `
  const total = rows.length;
  const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);
  const currentPage = Math.min(page, maxPage);
  const startIdx = currentPage * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, total);
  const visibleRows = rows.slice(startIdx, endIdx);
`;

if (!c.includes('const total = rows.length;')) {
    c = c.replace(
        'if (loading && rows.length === 0) {',
        `${studentPaginationLogic}\n\n  if (loading && rows.length === 0) {`
    );
}

// 4. Update the Search Bar UI (Find where the table starts)
// Looking at original file, it probably has no search bar at first. Let's check view_file.
// Wait, I didn't see the table in my first load of students. Let's check line 100+

const searchBarHTML = `<div className="card" style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--gray-100)", borderBottomLeftRadius: 0, borderBottomRightRadius: 0, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search students directory..."
            style={{ 
                width: "100%", 
                padding: "0.65rem 1rem 0.65rem 2.5rem", 
                borderRadius: "12px", 
                border: "1px solid var(--gray-200)", 
                fontSize: "0.9rem",
                outline: "none",
                background: "var(--gray-50)",
                transition: "all 0.2s"
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--primary-300)", e.currentTarget.style.background = "#fff", e.currentTarget.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.06)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--gray-200)", e.currentTarget.style.background = "var(--gray-50)", e.currentTarget.style.boxShadow = "none")}
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={load} style={{ height: "40px", borderRadius: "12px" }}>
                Search
            </button>
        </div>
      </div>`;

// Check where the card starts
c = c.replace(
    /<div className="card">[\s\S]+?<div className="table-wrapper">/,
    `<div className="card" style={{ padding: 0, overflow: "hidden" }}>\n      ${searchBarHTML}\n      <div className="table-wrapper">`
);

// 5. Update Table body to use visibleRows
c = c.replace(
    'rows.map((s) => (',
    'visibleRows.map((s) => ('
);

// 6. Pagination
c = c.replace(
    '</table>\n        </div>\n      </div>',
    `</table>
        </div>
        <TablePagination
          total={total}
          page={currentPage}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      </div>`
);

fs.writeFileSync('src/app/admin/students/page.tsx', c);
console.log('SUCCESS: Admin Students upgraded with pagination and premium filtering');
