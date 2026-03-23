"use client";
import { useState } from "react";
import { authFetch, getAccessToken } from "../../../lib/auth";

type RegistrationType = "student" | "teacher" | "parent";

interface BaseFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

interface StudentFormData extends BaseFormData {
    type: "student";
    grade: string;
    section: string;
}

interface TeacherFormData extends BaseFormData {
    type: "teacher";
    subject: string;
    department: string;
}

interface ParentFormData extends BaseFormData {
    type: "parent";
    childName: string;
    relationship: string;
}

type FormData = StudentFormData | TeacherFormData | ParentFormData;

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    grade?: string;
    section?: string;
    subject?: string;
    department?: string;
    childName?: string;
    relationship?: string;
}

interface SuccessInfo {
    firstName: string;
    lastName: string;
    email: string;
    role: RegistrationType;
    tempPassword: string;
    emailSent: boolean;
}

const ROLE_META = {
    student: { icon: "🎓", color: "#4f46e5", light: "#eef2ff", label: "Student" },
    teacher: { icon: "📚", color: "#0891b2", light: "#ecfeff", label: "Teacher" },
    parent:  { icon: "👨‍👩‍👧", color: "#7c3aed", light: "#f5f3ff", label: "Parent" },
};

export default function AdminRegistration() {
    const [regType, setRegType] = useState<RegistrationType>("student");
    const [loading, setLoading] = useState(false);
    const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});
    const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        grade: "Grade 9",
        section: "A",
        subject: "",
        department: "",
        childName: "",
        relationship: "Father",
    });

    const validateEmail = (email: string): boolean =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const validatePhone = (phone: string): boolean =>
        /^[+]?[\d\s\-()]*$/.test(phone) && phone.replace(/\D/g, "").length >= 10;

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!validateEmail(formData.email)) newErrors.email = "Invalid email format";
        if (!formData.phone.trim()) newErrors.phone = "Phone is required";
        else if (!validatePhone(formData.phone)) newErrors.phone = "Invalid phone format";

        if (regType === "student") {
            if (!formData.grade) newErrors.grade = "Grade is required";
            if (!formData.section) newErrors.section = "Section is required";
        } else if (regType === "teacher") {
            if (!formData.subject.trim()) newErrors.subject = "Subject is required";
            if (!formData.department.trim()) newErrors.department = "Department is required";
        } else if (regType === "parent") {
            if (!formData.childName.trim()) newErrors.childName = "Child's name is required";
            if (!formData.relationship) newErrors.relationship = "Relationship is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const prepareSubmitData = (): FormData | null => {
        const baseData = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
        };

        if (regType === "student") {
            return { type: "student", ...baseData, grade: formData.grade, section: formData.section } as StudentFormData;
        } else if (regType === "teacher") {
            return { type: "teacher", ...baseData, subject: formData.subject.trim(), department: formData.department.trim() } as TeacherFormData;
        } else if (regType === "parent") {
            return { type: "parent", ...baseData, childName: formData.childName.trim(), relationship: formData.relationship } as ParentFormData;
        }
        return null;
    };

    const sendRegistrationEmail = async (info: SuccessInfo) => {
        setEmailStatus("sending");
        try {
            const emailPayload: Record<string, string> = {
                to: info.email,
                firstName: info.firstName,
                lastName: info.lastName,
                role: info.role,
                tempPassword: info.tempPassword,
            };

            // Add role-specific fields
            if (info.role === "student") {
                emailPayload.grade = formData.grade;
                emailPayload.section = formData.section;
            } else if (info.role === "teacher") {
                emailPayload.subject = formData.subject;
                emailPayload.department = formData.department;
            } else if (info.role === "parent") {
                emailPayload.childName = formData.childName;
                emailPayload.relationship = formData.relationship;
            }

            const res = await fetch("/api/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(emailPayload),
            });

            if (!res.ok) throw new Error("Email send failed");
            setEmailStatus("sent");
        } catch {
            setEmailStatus("failed");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessInfo(null);
        setErrorMessage("");
        setEmailStatus("idle");

        if (!validateForm()) {
            setErrorMessage("Please fix the errors above");
            return;
        }

        setLoading(true);

        try {
            const submitData = prepareSubmitData();
            if (!submitData) throw new Error("Invalid form data");

            const registrationPayload: Record<string, unknown> = { ...submitData };

            const accessToken = getAccessToken();
            if (!accessToken) throw new Error("Admin session expired. Please log in again.");

            const response = await authFetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:4000"}/api/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify(registrationPayload),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Registration failed with status ${response.status}`);
            }

            const result = await response.json();
            const tempPwd: string = result.tempPassword ?? "—";

            const info: SuccessInfo = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                role: regType,
                tempPassword: tempPwd,
                emailSent: false,
            };

            setSuccessInfo(info);

            // Reset form
            setFormData({
                firstName: "", lastName: "", email: "", phone: "",
                grade: "Grade 9", section: "A",
                subject: "", department: "",
                childName: "", relationship: "Father",
            });
            setErrors({});

            // Fire email
            await sendRegistrationEmail(info);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleTypeChange = (type: RegistrationType) => {
        setRegType(type);
        setErrors({});
        setSuccessInfo(null);
        setErrorMessage("");
        setEmailStatus("idle");
    };

    const meta = ROLE_META[regType];

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Registration</h1>
                    <p className="page-subtitle">Register students, teachers, and parents</p>
                </div>
            </div>

            {/* Role tabs */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {(["student", "teacher", "parent"] as const).map(t => (
                    <button
                        key={t}
                        className={`btn ${regType === t ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => handleTypeChange(t)}
                        disabled={loading}
                    >
                        {ROLE_META[t].icon} {ROLE_META[t].label}
                    </button>
                ))}
            </div>

            {/* ── Success Card ── */}
            {successInfo && (
                <div style={{
                    marginBottom: "1.5rem",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
                    border: `1.5px solid ${ROLE_META[successInfo.role].color}33`,
                    background: "#fff",
                }}>
                    {/* Card header */}
                    <div style={{
                        background: `linear-gradient(135deg, ${ROLE_META[successInfo.role].color}, ${ROLE_META[successInfo.role].color}cc)`,
                        padding: "20px 28px",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                    }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: "50%",
                            background: "rgba(255,255,255,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 24,
                        }}>
                            ✓
                        </div>
                        <div>
                            <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                                Registration Successful
                            </p>
                            <p style={{ margin: "2px 0 0", color: "#fff", fontSize: 20, fontWeight: 800 }}>
                                {successInfo.firstName} {successInfo.lastName}
                            </p>
                        </div>
                        <div style={{ marginLeft: "auto", fontSize: 40 }}>
                            {ROLE_META[successInfo.role].icon}
                        </div>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: "24px 28px" }}>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                            marginBottom: "20px",
                        }}>
                            <InfoRow label="Email" value={successInfo.email} />
                            <InfoRow label="Role" value={
                                <span style={{
                                    background: ROLE_META[successInfo.role].light,
                                    color: ROLE_META[successInfo.role].color,
                                    padding: "2px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                                }}>{ROLE_META[successInfo.role].label}</span>
                            } />
                        </div>

                        {/* Credentials box */}
                        <div style={{
                            background: `linear-gradient(135deg, ${ROLE_META[successInfo.role].color}10, ${ROLE_META[successInfo.role].color}05)`,
                            border: `2px dashed ${ROLE_META[successInfo.role].color}44`,
                            borderRadius: 12,
                            padding: "18px 22px",
                            marginBottom: "16px",
                        }}>
                            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase" }}>
                                Temporary Password
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <code style={{
                                    fontSize: 26, fontWeight: 800, letterSpacing: 6,
                                    color: ROLE_META[successInfo.role].color,
                                    background: "#fff",
                                    padding: "8px 20px", borderRadius: 8,
                                    border: `1.5px solid ${ROLE_META[successInfo.role].color}30`,
                                    fontFamily: "monospace",
                                }}>
                                    {successInfo.tempPassword}
                                </code>
                                <button
                                    onClick={() => navigator.clipboard.writeText(successInfo.tempPassword)}
                                    title="Copy password"
                                    style={{
                                        padding: "8px 14px", borderRadius: 8,
                                        background: ROLE_META[successInfo.role].light,
                                        color: ROLE_META[successInfo.role].color,
                                        border: `1px solid ${ROLE_META[successInfo.role].color}33`,
                                        cursor: "pointer", fontWeight: 600, fontSize: 13,
                                    }}
                                >
                                    📋 Copy
                                </button>
                            </div>
                            <p style={{ margin: "10px 0 0", fontSize: 12, color: "#92400e", background: "#fffbeb", padding: "8px 12px", borderRadius: 6, border: "1px solid #fde68a" }}>
                                ⚠️ The user must change this password on first login.
                            </p>
                        </div>

                        {/* Email status */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "12px 16px", borderRadius: 10,
                            background: emailStatus === "sent" ? "#f0fdf4" : emailStatus === "failed" ? "#fff5f5" : "#f8fafc",
                            border: `1px solid ${emailStatus === "sent" ? "#86efac" : emailStatus === "failed" ? "#fca5a5" : "#e2e8f0"}`,
                        }}>
                            {emailStatus === "sending" && (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite", color: "#64748b" }}>
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" fill="none" />
                                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                                    </svg>
                                    <span style={{ fontSize: 14, color: "#475569" }}>Sending confirmation email to <strong>{successInfo.email}</strong>…</span>
                                </>
                            )}
                            {emailStatus === "sent" && (
                                <>
                                    <span style={{ fontSize: 18 }}>✅</span>
                                    <span style={{ fontSize: 14, color: "#166534" }}>Confirmation email sent to <strong>{successInfo.email}</strong></span>
                                </>
                            )}
                            {emailStatus === "failed" && (
                                <>
                                    <span style={{ fontSize: 18 }}>⚠️</span>
                                    <span style={{ fontSize: 14, color: "#991b1b" }}>Email delivery failed — check SMTP settings in <code>.env.local</code></span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Error message */}
            {errorMessage && (
                <div style={{
                    padding: "1rem", marginBottom: "1rem",
                    background: "#fff5f5", border: "1px solid #fca5a5",
                    borderRadius: "var(--radius-md)", color: "#991b1b",
                }}>
                    {errorMessage}
                </div>
            )}

            {/* ── Form ── */}
            <div className="card">
                <h3 className="card-title" style={{ marginBottom: "1.25rem" }}>
                    {meta.icon} Register New {meta.label}
                </h3>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                        <div className="input-group">
                            <label htmlFor="firstName">First Name <span style={{ color: "var(--red-500)" }}>*</span></label>
                            <div className="input-field">
                                <input
                                    id="firstName"
                                    placeholder="First name"
                                    value={formData.firstName}
                                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                                    disabled={loading}
                                    style={errors.firstName ? { borderColor: "var(--red-500)" } : {}}
                                />
                            </div>
                            {errors.firstName && <p style={{ color: "var(--red-500)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.firstName}</p>}
                        </div>

                        <div className="input-group">
                            <label htmlFor="lastName">Last Name <span style={{ color: "var(--red-500)" }}>*</span></label>
                            <div className="input-field">
                                <input
                                    id="lastName"
                                    placeholder="Last name"
                                    value={formData.lastName}
                                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                                    disabled={loading}
                                    style={errors.lastName ? { borderColor: "var(--red-500)" } : {}}
                                />
                            </div>
                            {errors.lastName && <p style={{ color: "var(--red-500)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.lastName}</p>}
                        </div>

                        <div className="input-group">
                            <label htmlFor="email">Email <span style={{ color: "var(--red-500)" }}>*</span></label>
                            <div className="input-field">
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="email@school.edu"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    disabled={loading}
                                    style={errors.email ? { borderColor: "var(--red-500)" } : {}}
                                />
                            </div>
                            {errors.email && <p style={{ color: "var(--red-500)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.email}</p>}
                        </div>

                        <div className="input-group">
                            <label htmlFor="phone">Phone <span style={{ color: "var(--red-500)" }}>*</span></label>
                            <div className="input-field">
                                <input
                                    id="phone"
                                    placeholder="+251 ..."
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange("phone", e.target.value)}
                                    disabled={loading}
                                    style={errors.phone ? { borderColor: "var(--red-500)" } : {}}
                                />
                            </div>
                            {errors.phone && <p style={{ color: "var(--red-500)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.phone}</p>}
                        </div>

                        {regType === "student" && (
                            <>
                                <div className="input-group">
                                    <label htmlFor="grade">Grade <span style={{ color: "var(--red-500)" }}>*</span></label>
                                    <select
                                        id="grade"
                                        value={formData.grade}
                                        onChange={(e) => handleInputChange("grade", e.target.value)}
                                        disabled={loading}
                                        style={{
                                            padding: "0.75rem",
                                            background: "var(--gray-50)",
                                            border: `1.5px solid ${errors.grade ? "var(--red-500)" : "var(--gray-200)"}`,
                                            borderRadius: "var(--radius-md)",
                                            fontFamily: "inherit",
                                        }}
                                    >
                                        <option>Grade 9</option>
                                        <option>Grade 10</option>
                                        <option>Grade 11</option>
                                        <option>Grade 12</option>
                                    </select>
                                    {errors.grade && <p style={{ color: "var(--red-500)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.grade}</p>}
                                </div>

                                <div className="input-group">
                                    <label htmlFor="section">Section <span style={{ color: "var(--red-500)" }}>*</span></label>
                                    <select
                                        id="section"
                                        value={formData.section}
                                        onChange={(e) => handleInputChange("section", e.target.value)}
                                        disabled={loading}
                                        style={{
                                            padding: "0.75rem",
                                            background: "var(--gray-50)",
                                            border: `1.5px solid ${errors.section ? "var(--red-500)" : "var(--gray-200)"}`,
                                            borderRadius: "var(--radius-md)",
                                            fontFamily: "inherit",
                                        }}
                                    >
                                        <option>A</option>
                                        <option>B</option>
                                        <option>C</option>
                                    </select>
                                    {errors.section && <p style={{ color: "var(--red-500)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.section}</p>}
                                </div>
                            </>
                        )}

                        {regType === "teacher" && (
                            <>
                                <div className="input-group">
                                    <label htmlFor="subject">Subject <span style={{ color: "var(--red-500)" }}>*</span></label>
                                    <div className="input-field">
                                        <input
                                            id="subject"
                                            placeholder="Mathematics"
                                            value={formData.subject}
                                            onChange={(e) => handleInputChange("subject", e.target.value)}
                                            disabled={loading}
                                            style={errors.subject ? { borderColor: "var(--red-500)" } : {}}
                                        />
                                    </div>
                                    {errors.subject && <p style={{ color: "var(--red-500)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.subject}</p>}
                                </div>

                                <div className="input-group">
                                    <label htmlFor="department">Department <span style={{ color: "var(--red-500)" }}>*</span></label>
                                    <div className="input-field">
                                        <input
                                            id="department"
                                            placeholder="Science"
                                            value={formData.department}
                                            onChange={(e) => handleInputChange("department", e.target.value)}
                                            disabled={loading}
                                            style={errors.department ? { borderColor: "var(--red-500)" } : {}}
                                        />
                                    </div>
                                    {errors.department && <p style={{ color: "var(--red-500)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.department}</p>}
                                </div>
                            </>
                        )}

                        {regType === "parent" && (
                            <>
                                <div className="input-group">
                                    <label htmlFor="childName">Child&apos;s Name <span style={{ color: "var(--red-500)" }}>*</span></label>
                                    <div className="input-field">
                                        <input
                                            id="childName"
                                            placeholder="Student full name"
                                            value={formData.childName}
                                            onChange={(e) => handleInputChange("childName", e.target.value)}
                                            disabled={loading}
                                            style={errors.childName ? { borderColor: "var(--red-500)" } : {}}
                                        />
                                    </div>
                                    {errors.childName && <p style={{ color: "var(--red-500)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.childName}</p>}
                                </div>

                                <div className="input-group">
                                    <label htmlFor="relationship">Relationship <span style={{ color: "var(--red-500)" }}>*</span></label>
                                    <select
                                        id="relationship"
                                        value={formData.relationship}
                                        onChange={(e) => handleInputChange("relationship", e.target.value)}
                                        disabled={loading}
                                        style={{
                                            padding: "0.75rem",
                                            background: "var(--gray-50)",
                                            border: `1.5px solid ${errors.relationship ? "var(--red-500)" : "var(--gray-200)"}`,
                                            borderRadius: "var(--radius-md)",
                                            fontFamily: "inherit",
                                        }}
                                    >
                                        <option>Father</option>
                                        <option>Mother</option>
                                        <option>Guardian</option>
                                    </select>
                                    {errors.relationship && <p style={{ color: "var(--red-500)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{errors.relationship}</p>}
                                </div>
                            </>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 180 }}>
                        {loading ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
                                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none" />
                                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
                                </svg>
                                Registering…
                            </span>
                        ) : `${meta.icon} Register ${meta.label}`}
                    </button>
                </form>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div style={{
            padding: "10px 14px",
            background: "#f8fafc",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
        }}>
            <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.8, textTransform: "uppercase" }}>{label}</p>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{value}</div>
        </div>
    );
}
