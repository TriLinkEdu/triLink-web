"use client";

import { useRef, useState } from "react";

type StudentProfile = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    grade: string;
    section: string;
    dateOfBirth: string;
    studentId: string;
    guardian: string;
    country: string;
    cityState: string;
    postalCode: string;
};

const initialProfile: StudentProfile = {
    firstName: "Ahmed",
    lastName: "Hassan",
    email: "ahmed.hassan@school.edu",
    phone: "+251 912 345 678",
    grade: "Grade 11",
    section: "A",
    dateOfBirth: "2008-05-15",
    studentId: "STU-2024-001",
    guardian: "Hassan Ahmed",
    country: "Ethiopia",
    cityState: "Addis Ababa",
    postalCode: "1000",
};

function StaticField({ label, value }: { label: string; value: string }) {
    return (
        <div
            style={{
                border: "1px solid var(--gray-200)",
                background: "var(--gray-50)",
                borderRadius: "var(--radius-md)",
                padding: "0.8rem 0.95rem",
                minHeight: 68,
            }}
        >
            <div style={{ fontSize: "0.78rem", color: "var(--gray-500)", marginBottom: "0.35rem", fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--gray-900)", lineHeight: 1.35 }}>{value}</div>
        </div>
    );
}

function EditableField({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    readOnly = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    readOnly?: boolean;
}) {
    return (
        <div className="input-group">
            <label>{label}</label>
            <div className="input-field">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    style={readOnly ? { background: "var(--gray-50)", cursor: "not-allowed" } : {}}
                />
            </div>
        </div>
    );
}

export default function StudentProfilePage() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState<StudentProfile>(initialProfile);
    const [draft, setDraft] = useState<StudentProfile>(initialProfile);

    const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
    const fullName = `${profile.firstName} ${profile.lastName}`;
    const quickStats = [
        { label: "Grade", value: profile.grade },
        { label: "Section", value: profile.section },
        { label: "Student ID", value: profile.studentId },
    ];

    function startEditing() {
        setDraft(profile);
        setIsEditing(true);
    }

    function cancelEditing() {
        setDraft(profile);
        setIsEditing(false);
    }

    function saveProfile() {
        if (!draft.firstName.trim() || !draft.lastName.trim() || !draft.email.trim()) {
            window.alert("First name, last name, and email are required.");
            return;
        }

        // Call backend to save changes
        const updatePayload = {
            ...draft,
            firstName: draft.firstName.trim(),
            lastName: draft.lastName.trim(),
            email: draft.email.trim(),
            phone: draft.phone.trim(),
            dateOfBirth: draft.dateOfBirth.trim(),
            guardian: draft.guardian.trim(),
            country: draft.country.trim(),
            cityState: draft.cityState.trim(),
            postalCode: draft.postalCode.trim(),
        };

        // TODO: Implement actual API call
        // fetch(`/api/student/${profile.studentId}`, { method: "PUT", body: JSON.stringify(updatePayload) })

        setProfile(updatePayload);
        setIsEditing(false);
    }

    return (
        <div className="page-wrapper">
            <div className="page-header" style={{ marginBottom: "1rem" }}>
                <h1 className="page-title">My Profile</h1>
                {!isEditing ? (
                    <button className="btn btn-primary" onClick={startEditing}>Edit</button>
                ) : (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="btn btn-secondary" onClick={cancelEditing}>Cancel</button>
                        <button className="btn btn-primary" onClick={saveProfile}>Save Changes</button>
                    </div>
                )}
            </div>

            <div className="card">
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.9fr)", gap: "1rem", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                        <div
                            className="avatar avatar-xl avatar-initials"
                            style={{ fontSize: "1.5rem", flexShrink: 0, background: "linear-gradient(135deg, #0891b2, #0e7490)" }}
                        >
                            {initials || "S"}
                        </div>

                        <div>
                            <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--gray-900)" }}>{fullName}</h2>
                            <p style={{ color: "var(--gray-500)", fontSize: "0.95rem", marginTop: "0.2rem" }}>{profile.grade} - Section {profile.section}</p>
                            <p style={{ color: "var(--gray-400)", fontSize: "0.9rem", marginTop: "0.2rem" }}>{profile.cityState}, {profile.country}</p>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "stretch" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.65rem" }}>
                            {quickStats.map((item) => (
                                <div key={item.label} style={{ padding: "0.75rem 0.85rem", border: "1px solid var(--gray-200)", background: "#fff", borderRadius: "var(--radius-md)" }}>
                                    <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", color: "var(--gray-400)", textTransform: "uppercase" }}>{item.label}</div>
                                    <div style={{ marginTop: "0.35rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--gray-800)" }}>{item.value}</div>
                                </div>
                            ))}
                        </div>

                        {isEditing && (
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}>
                                    Upload Photo
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.8fr) minmax(280px, 1fr)", gap: "1rem", marginTop: "1rem", alignItems: "start" }}>
                <div className="card" style={{ marginTop: 0 }}>
                    <h3 className="card-title" style={{ marginBottom: "1rem" }}>Personal Information</h3>
                    {!isEditing ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.8rem" }}>
                            {[
                                { label: "First Name", value: profile.firstName },
                                { label: "Last Name", value: profile.lastName },
                                { label: "Email Address", value: profile.email },
                                { label: "Phone no", value: profile.phone },
                                { label: "Date of Birth", value: profile.dateOfBirth },
                                { label: "Guardian", value: profile.guardian },
                            ].map((item) => (
                                <StaticField key={item.label} label={item.label} value={item.value} />
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.85rem" }}>
                            <EditableField label="First Name" value={draft.firstName} onChange={(value) => setDraft((prev) => ({ ...prev, firstName: value }))} placeholder="First name" />
                            <EditableField label="Last Name" value={draft.lastName} onChange={(value) => setDraft((prev) => ({ ...prev, lastName: value }))} placeholder="Last name" />
                            <EditableField label="Email Address" type="email" value={draft.email} onChange={(value) => setDraft((prev) => ({ ...prev, email: value }))} placeholder="student@school.edu" />
                            <EditableField label="Phone no" value={draft.phone} onChange={(value) => setDraft((prev) => ({ ...prev, phone: value }))} placeholder="+251 9XX XXX XXX" />
                            <EditableField label="Date of Birth" type="date" value={draft.dateOfBirth} onChange={(value) => setDraft((prev) => ({ ...prev, dateOfBirth: value }))} />
                            <EditableField label="Guardian" value={draft.guardian} onChange={(value) => setDraft((prev) => ({ ...prev, guardian: value }))} placeholder="Guardian name" />
                        </div>
                    )}
                </div>

                <div className="card" style={{ marginTop: 0 }}>
                    <h3 className="card-title" style={{ marginBottom: "1rem" }}>Location</h3>
                    {!isEditing ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.8rem" }}>
                            {[
                                { label: "Country", value: profile.country },
                                { label: "City/State", value: profile.cityState },
                                { label: "Postal Code", value: profile.postalCode },
                            ].map((item) => (
                                <StaticField key={item.label} label={item.label} value={item.value} />
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.85rem" }}>
                            <EditableField label="Country" value={draft.country} onChange={(value) => setDraft((prev) => ({ ...prev, country: value }))} placeholder="Country" />
                            <EditableField label="City/State" value={draft.cityState} onChange={(value) => setDraft((prev) => ({ ...prev, cityState: value }))} placeholder="City or State" />
                            <EditableField label="Postal Code" value={draft.postalCode} onChange={(value) => setDraft((prev) => ({ ...prev, postalCode: value }))} placeholder="Postal code" />
                        </div>
                    )}
                </div>
            </div>

            <div className="card" style={{ marginTop: "1rem" }}>
                <h3 className="card-title" style={{ marginBottom: "1rem" }}>School Details (Read Only)</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.8rem" }}>
                    <StaticField label="Grade" value={profile.grade} />
                    <StaticField label="Section" value={profile.section} />
                    <StaticField label="Student ID" value={profile.studentId} />
                </div>
            </div>
        </div>
    );
}
