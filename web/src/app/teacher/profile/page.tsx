"use client";

import { useRef, useState, useEffect } from "react";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { getApiBase, getFileUrl } from "@/lib/api";
import AuthenticatedAvatar from "@/components/AuthenticatedAvatar";

type TeacherProfile = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    subject: string;
    department: string;
    homeroomClass: string;
    experience: string;
    country: string;
    cityState: string;
    postalCode: string;
    officeRoom: string;
};

const initialProfile: TeacherProfile = {
    firstName: "Solomon",
    lastName: "Tesfaye",
    email: "solomon@school.edu",
    phone: "+251 912 345 678",
    subject: "Mathematics",
    department: "Mathematics",
    homeroomClass: "Grade 11-A",
    experience: "8 Years Experience",
    country: "Ethiopia",
    cityState: "Addis Ababa",
    postalCode: "1000",
    officeRoom: "Block B, Room 12",
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
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
}) {
    return (
        <div className="input-group">
            <label>{label}</label>
            <div className="input-field">
                <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
            </div>
        </div>
    );
}

export default function TeacherProfilePage() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const user = useCurrentUser("teacher");
    const [profile, setProfile] = useState<TeacherProfile>(initialProfile);
    const [draft, setDraft] = useState<TeacherProfile>(initialProfile);

    // Hydrate profile correctly avoiding SSR mismatch
    useEffect(() => {
        if (user && user.email) {
            const nextProfile = {
                ...profile,
                firstName: user.firstName || profile.firstName,
                lastName: user.lastName || profile.lastName,
                email: user.email || profile.email,
                subject: user.subject || profile.subject,
                department: user.department || profile.department,
            };
            setProfile(nextProfile);
            if (!isEditing) {
                setDraft(nextProfile);
            }
        }
    }, [user, isEditing]);

    const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
    const fullName = `${profile.firstName} ${profile.lastName}`;
    const quickStats = [
        { label: "Department", value: profile.department },
        { label: "Homeroom", value: profile.homeroomClass },
        { label: "Office", value: profile.officeRoom },
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

        setProfile({
            ...draft,
            firstName: draft.firstName.trim(),
            lastName: draft.lastName.trim(),
            email: draft.email.trim(),
        });
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
                        <AuthenticatedAvatar
                            fileId={user.profileImageFileId}
                            initials={initials || "T"}
                            size={110}
                            alt={user.fullName || "User"}
                            style={{ border: "4px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                        />

                        <div>
                            <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--gray-900)" }}>{fullName}</h2>
                            <p style={{ color: "var(--gray-500)", fontSize: "0.95rem", marginTop: "0.2rem" }}>{profile.subject} Teacher</p>
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
                                { label: "Subject", value: profile.subject },
                                { label: "Experience", value: profile.experience },
                            ].map((item) => (
                                <StaticField key={item.label} label={item.label} value={item.value} />
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.85rem" }}>
                            <EditableField label="First Name" value={draft.firstName} onChange={(value) => setDraft((prev) => ({ ...prev, firstName: value }))} placeholder="First name" />
                            <EditableField label="Last Name" value={draft.lastName} onChange={(value) => setDraft((prev) => ({ ...prev, lastName: value }))} placeholder="Last name" />
                            <EditableField label="Email Address" type="email" value={draft.email} onChange={(value) => setDraft((prev) => ({ ...prev, email: value }))} placeholder="teacher@school.edu" />
                            <EditableField label="Phone no" value={draft.phone} onChange={(value) => setDraft((prev) => ({ ...prev, phone: value }))} placeholder="+251 9XX XXX XXX" />
                            <EditableField label="Subject" value={draft.subject} onChange={(value) => setDraft((prev) => ({ ...prev, subject: value }))} placeholder="Mathematics" />
                            <EditableField label="Experience" value={draft.experience} onChange={(value) => setDraft((prev) => ({ ...prev, experience: value }))} placeholder="Years of experience" />
                        </div>
                    )}
                </div>

                <div className="card" style={{ marginTop: 0 }}>
                    <h3 className="card-title" style={{ marginBottom: "1rem" }}>School Details</h3>
                    {!isEditing ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.8rem" }}>
                            {[
                                { label: "Department", value: profile.department },
                                { label: "Homeroom Class", value: profile.homeroomClass },
                                { label: "Country", value: profile.country },
                                { label: "City / State", value: profile.cityState },
                                { label: "Postal Code", value: profile.postalCode },
                                { label: "Office Room", value: profile.officeRoom },
                            ].map((item) => (
                                <StaticField key={item.label} label={item.label} value={item.value} />
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.85rem" }}>
                            <EditableField label="Department" value={draft.department} onChange={(value) => setDraft((prev) => ({ ...prev, department: value }))} placeholder="Mathematics" />
                            <EditableField label="Homeroom Class" value={draft.homeroomClass} onChange={(value) => setDraft((prev) => ({ ...prev, homeroomClass: value }))} placeholder="Grade 11-A" />
                            <EditableField label="Country" value={draft.country} onChange={(value) => setDraft((prev) => ({ ...prev, country: value }))} placeholder="Country" />
                            <EditableField label="City / State" value={draft.cityState} onChange={(value) => setDraft((prev) => ({ ...prev, cityState: value }))} placeholder="City / State" />
                            <EditableField label="Postal Code" value={draft.postalCode} onChange={(value) => setDraft((prev) => ({ ...prev, postalCode: value }))} placeholder="Postal code" />
                            <EditableField label="Office Room" value={draft.officeRoom} onChange={(value) => setDraft((prev) => ({ ...prev, officeRoom: value }))} placeholder="Office room" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
