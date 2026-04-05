export default function GlobalLoading() {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", minHeight: "50vh", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <div style={{ width: "40px", height: "40px", border: "4px solid var(--gray-100)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "global-spin 1s linear infinite" }} />
        <div style={{ color: "var(--gray-500)", fontWeight: 500, fontSize: "0.95rem" }}>Loading...</div>
      </div>
      <style>{`
        @keyframes global-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
