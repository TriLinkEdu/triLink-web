"use client";
import { ToastState } from "@/hooks/useRealtimeNotifications";

interface RealtimeToastProps {
    toast: ToastState | null;
    onClose: () => void;
}

export default function RealtimeToast({ toast, onClose }: RealtimeToastProps) {
    if (!toast) return null;

    return (
        <div style={{
            position: "fixed", top: "1rem", right: "1rem", zIndex: 1100,
            padding: "1rem 1.25rem", borderRadius: "12px", background: "#fff",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)", border: "1.5px solid var(--gray-100)",
            display: "flex", alignItems: "center", gap: "0.75rem", minWidth: "300px",
            animation: "slideIn 0.3s ease-out forwards"
        }}>
            <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: toast.type === 'chat' ? "var(--primary-50)" : toast.type === 'announcement' ? "var(--warning-50)" : "var(--success-50)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
                {toast.type === 'chat' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                ) : toast.type === 'announcement' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success-600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                )}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.1rem" }}>
                    {toast.type || 'Notification'}
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--gray-800)", lineHeight: 1.4 }}>
                    {toast.msg}
                </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", padding: "0.25rem" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateX(120%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
