"use client";
import { useEffect, useState } from "react";
import {
    BookOpen,
    Copy as CopyIcon,
    GraduationCap,
    Users,
    type LucideIcon,
} from "lucide-react";
import { apiPath, getApiBase } from "@/lib/api";
import { authFetch, getAccessToken } from "@/lib/auth";
import { listUsers, type PublicUser } from "@/lib/admin-api";
import { useToastStore } from "@/store/toastStore";
import {
    Icon as KitIcon,
    KField,
    KitErrorBanner,
    KitInput,
    KitSegmented,
    KitSelect,
    KitSpinner,
    PageHead as KitPageHead,
    Pill,
} from "@/components/kit";

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
    linkedStudentId: string;
    relationship: string;
    childName?: string;
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
    linkedStudentId?: string;
    relationship?: string;
}

interface SuccessInfo {
    firstName: string;
    lastName: string;
    email: string;
    role: RegistrationType;
    tempPassword: string;
    registrationEmailSent: boolean;
}

const ROLE_META: Record<RegistrationType, { icon: LucideIcon; label: string }> = {
    student: { icon: GraduationCap, label: "Student" },
    teacher: { icon: BookOpen, label: "Teacher" },
    parent: { icon: Users, label: "Parent" },
};

export default function AdminRegistration() {
    const [regType, setRegType] = useState<RegistrationType>("student");
    const [loading, setLoading] = useState(false);
    const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});
    const { showToast } = useToastStore();
    const [emailStatus, setEmailStatus] = useState<"idle" | "sent" | "failed" | "skipped">("idle");
    const [studentOptions, setStudentOptions] = useState<PublicUser[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [copied, setCopied] = useState(false);

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
        linkedStudentId: "",
        relationship: "Father",
    });

    useEffect(() => {
        if (regType !== "parent") return;
        let c = false;
        setLoadingStudents(true);
        (async () => {
            try {
                const studs = await listUsers("student");
                if (!c) {
                    setStudentOptions(studs);
                    setFormData((fd) => ({
                        ...fd,
                        linkedStudentId: fd.linkedStudentId || studs[0]?.id || "",
                    }));
                }
            } catch {
                if (!c) setStudentOptions([]);
            } finally {
                if (!c) setLoadingStudents(false);
            }
        })();
        return () => {
            c = true;
        };
    }, [regType]);

    const validateEmail = (email: string): boolean =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const normalizePhone = (phone: string): string => phone.trim().replace(/[\s\-().]/g, "");

    const validatePhone = (phone: string): boolean => {
        const n = normalizePhone(phone);
        return /^\+?[1-9]\d{8,14}$/.test(n);
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!validateEmail(formData.email)) newErrors.email = "Invalid email format";
        if (!formData.phone.trim()) newErrors.phone = "Phone is required";
        else if (!validatePhone(formData.phone)) {
            newErrors.phone = "Use 9–15 digits, optional + country code";
        }

        if (regType === "student") {
            if (!formData.grade) newErrors.grade = "Grade is required";
            if (!formData.section) newErrors.section = "Section is required";
        } else if (regType === "teacher") {
            if (!formData.subject.trim()) newErrors.subject = "Subject is required";
            if (!formData.department.trim()) newErrors.department = "Department is required";
        } else if (regType === "parent") {
            if (!formData.linkedStudentId) newErrors.linkedStudentId = "Select a student to link";
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
            phone: normalizePhone(formData.phone),
        };

        if (regType === "student") {
            return {
                type: "student",
                ...baseData,
                grade: formData.grade,
                section: formData.section,
            } as StudentFormData;
        } else if (regType === "teacher") {
            return {
                type: "teacher",
                ...baseData,
                subject: formData.subject.trim(),
                department: formData.department.trim(),
            } as TeacherFormData;
        } else if (regType === "parent") {
            const sel = studentOptions.find((s) => s.id === formData.linkedStudentId);
            const childName = sel ? `${sel.firstName} ${sel.lastName}`.trim() : undefined;
            return {
                type: "parent",
                ...baseData,
                linkedStudentId: formData.linkedStudentId,
                relationship: formData.relationship,
                childName,
            } as ParentFormData;
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessInfo(null);
        setErrorMessage("");
        setEmailStatus("idle");

        if (!validateForm()) {
            setErrorMessage("Please check the form for missing or invalid fields.");
            return;
        }

        setLoading(true);

        try {
            const submitData = prepareSubmitData();
            if (!submitData) throw new Error("Invalid form data");

            const registrationPayload: Record<string, unknown> = { ...submitData };

            const accessToken = getAccessToken();
            if (!accessToken) throw new Error("Admin session expired. Please log in again.");

            const response = await authFetch(`${getApiBase()}${apiPath.register}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registrationPayload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message || `Registration failed with status ${response.status}`,
                );
            }

            const result = await response.json();
            const tempPwd: string = result.tempPassword ?? "—";
            const registrationEmailSent = Boolean(result.registrationEmailSent);

            const info: SuccessInfo = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                role: regType,
                tempPassword: tempPwd,
                registrationEmailSent,
            };

            setSuccessInfo(info);
            setEmailStatus(registrationEmailSent ? "sent" : "skipped");
            showToast(
                `${regType.charAt(0).toUpperCase() + regType.slice(1)} registered successfully.`,
                "success",
                true,
            );

            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                grade: "Grade 9",
                section: "A",
                subject: "",
                department: "",
                childName: "",
                linkedStudentId: studentOptions[0]?.id ?? "",
                relationship: "Father",
            });
            setErrors({});
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "An unexpected error occurred.",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
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
    const RoleIcon = meta.icon;

    return (
        <div className="kit-page" data-role="admin">
            <KitPageHead
                meta={
                    <>
                        <span className="role-dot" />
                        Onboarding
                        <span className="dot-sep">·</span>
                        Admin-only flow
                    </>
                }
                title="Registration"
                sub="Register students, teachers, and parents with role-specific data."
                actions={<Pill kind="neutral">Admin-only</Pill>}
            />

            {/* ── Role segmented control ── */}
            <div style={{ marginBottom: 14 }}>
                <KitSegmented<RegistrationType>
                    options={(["student", "teacher", "parent"] as const).map((t) => {
                        const RoleI = ROLE_META[t].icon;
                        return {
                            value: t,
                            label: ROLE_META[t].label,
                            icon: <RoleI size={14} strokeWidth={1.8} />,
                        };
                    })}
                    value={regType}
                    onChange={(v) => handleTypeChange(v)}
                />
            </div>

            {/* ── Success Card ── */}
            {successInfo && (
                <div className="k-card" style={{ padding: 0, marginBottom: 16, overflow: "hidden" }}>
                    <div
                        className="k-card__head"
                        style={{ alignItems: "center" }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div
                                aria-hidden
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    background: "var(--color-success-soft)",
                                    color: "var(--color-success)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <KitIcon name="check" size={16} />
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 500,
                                        color: "var(--ink-3)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        marginBottom: 1,
                                    }}
                                >
                                    Registration successful
                                </div>
                                <div className="k-card__title" style={{ marginTop: 0 }}>
                                    {successInfo.firstName} {successInfo.lastName}
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn-kit btn-kit-ghost"
                            aria-label="Dismiss"
                            onClick={() => setSuccessInfo(null)}
                            style={{ height: 26, width: 26, padding: 0, fontSize: 16, lineHeight: 1 }}
                        >
                            ×
                        </button>
                    </div>
                    <div
                        className="k-card__body"
                        style={{ display: "grid", gap: 14, padding: 16 }}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 10,
                            }}
                        >
                            <InfoRow label="Email" value={successInfo.email} />
                            <InfoRow
                                label="Role"
                                value={
                                    <Pill kind="neutral">{ROLE_META[successInfo.role].label}</Pill>
                                }
                            />
                        </div>

                        {/* Credentials box */}
                        <div
                            style={{
                                background: "var(--color-surface-2)",
                                border: "1px dashed var(--color-hairline)",
                                borderRadius: 10,
                                padding: 14,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 500,
                                    color: "var(--ink-3)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    marginBottom: 8,
                                }}
                            >
                                Temporary password
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <code
                                    style={{
                                        flex: 1,
                                        fontSize: 18,
                                        fontWeight: 500,
                                        letterSpacing: "0.08em",
                                        color: "var(--ink)",
                                        background: "var(--color-surface)",
                                        padding: "8px 12px",
                                        borderRadius: 7,
                                        border: "1px solid var(--color-hairline)",
                                        fontFamily: "var(--font-mono)",
                                    }}
                                >
                                    {successInfo.tempPassword}
                                </code>
                                <button
                                    type="button"
                                    className={
                                        copied
                                            ? "btn-kit btn-kit-success"
                                            : "btn-kit btn-kit-ghost"
                                    }
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(
                                                successInfo.tempPassword,
                                            );
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 1500);
                                        } catch {
                                            /* ignore */
                                        }
                                    }}
                                >
                                    {copied ? (
                                        <KitIcon name="check" size={13} />
                                    ) : (
                                        <CopyIcon size={13} strokeWidth={1.8} />
                                    )}
                                    {copied ? "Copied" : "Copy"}
                                </button>
                            </div>
                            <div
                                style={{
                                    marginTop: 10,
                                    fontSize: 11.5,
                                    color: "var(--color-warning)",
                                    background: "var(--color-warning-soft)",
                                    border: "1px solid rgba(196,53,84,0.18)",
                                    padding: "6px 10px",
                                    borderRadius: 6,
                                }}
                            >
                                The user must change this password on first login.
                            </div>
                        </div>

                        {/* Email status */}
                        {emailStatus !== "idle" && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 8,
                                    padding: "10px 12px",
                                    borderRadius: 8,
                                    background:
                                        emailStatus === "sent"
                                            ? "var(--color-success-soft)"
                                            : emailStatus === "failed"
                                                ? "var(--color-danger-soft)"
                                                : "var(--color-warning-soft)",
                                    border: `1px solid ${
                                        emailStatus === "sent"
                                            ? "rgba(13,138,95,0.22)"
                                            : emailStatus === "failed"
                                                ? "rgba(196,53,84,0.22)"
                                                : "rgba(196,53,84,0.18)"
                                    }`,
                                    color:
                                        emailStatus === "sent"
                                            ? "var(--color-success)"
                                            : emailStatus === "failed"
                                                ? "var(--color-danger)"
                                                : "var(--color-warning)",
                                    fontSize: 12.5,
                                    lineHeight: 1.5,
                                }}
                            >
                                <span
                                    aria-hidden
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 999,
                                        background: "currentColor",
                                        marginTop: 7,
                                        flexShrink: 0,
                                    }}
                                />
                                <div>
                                    {emailStatus === "sent" && (
                                        <>
                                            Confirmation email sent to{" "}
                                            <strong style={{ fontWeight: 500 }}>
                                                {successInfo.email}
                                            </strong>
                                        </>
                                    )}
                                    {emailStatus === "failed" && (
                                        <>
                                            Email delivery failed — check SMTP settings in{" "}
                                            <code style={{ fontFamily: "var(--font-mono)" }}>
                                                .env.local
                                            </code>
                                            .
                                        </>
                                    )}
                                    {emailStatus === "skipped" && (
                                        <>
                                            No email was sent. Configure{" "}
                                            <code style={{ fontFamily: "var(--font-mono)" }}>
                                                SMTP_HOST
                                            </code>{" "}
                                            on the API server so new users receive their temporary
                                            password by email.
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Error banner ── */}
            {errorMessage && <KitErrorBanner message={errorMessage} />}

            {/* ── Form ── */}
            <div className="k-card">
                <div className="k-card__head">
                    <div className="k-card__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <RoleIcon size={15} strokeWidth={1.8} />
                        Register a new {meta.label.toLowerCase()}
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="k-card__body" noValidate>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                            marginBottom: 16,
                        }}
                    >
                        <KField label="First name" required error={errors.firstName}>
                            <KitInput
                                id="firstName"
                                placeholder="First name"
                                value={formData.firstName}
                                onChange={(e) => handleInputChange("firstName", e.target.value)}
                                disabled={loading}
                                invalid={!!errors.firstName}
                            />
                        </KField>

                        <KField label="Last name" required error={errors.lastName}>
                            <KitInput
                                id="lastName"
                                placeholder="Last name"
                                value={formData.lastName}
                                onChange={(e) => handleInputChange("lastName", e.target.value)}
                                disabled={loading}
                                invalid={!!errors.lastName}
                            />
                        </KField>

                        <KField label="Email" required error={errors.email}>
                            <KitInput
                                id="email"
                                type="email"
                                placeholder="email@school.edu"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                disabled={loading}
                                invalid={!!errors.email}
                            />
                        </KField>

                        <KField label="Phone" required error={errors.phone}>
                            <KitInput
                                id="phone"
                                placeholder="+251 …"
                                value={formData.phone}
                                onChange={(e) => handleInputChange("phone", e.target.value)}
                                disabled={loading}
                                invalid={!!errors.phone}
                            />
                        </KField>

                        {regType === "student" && (
                            <>
                                <KField label="Grade" required error={errors.grade}>
                                    <KitSelect
                                        id="grade"
                                        value={formData.grade}
                                        onChange={(e) => handleInputChange("grade", e.target.value)}
                                        disabled={loading}
                                        invalid={!!errors.grade}
                                    >
                                        <option>Grade 9</option>
                                        <option>Grade 10</option>
                                        <option>Grade 11</option>
                                        <option>Grade 12</option>
                                    </KitSelect>
                                </KField>

                                <KField label="Section" required error={errors.section}>
                                    <KitSelect
                                        id="section"
                                        value={formData.section}
                                        onChange={(e) => handleInputChange("section", e.target.value)}
                                        disabled={loading}
                                        invalid={!!errors.section}
                                    >
                                        <option>A</option>
                                        <option>B</option>
                                        <option>C</option>
                                    </KitSelect>
                                </KField>
                            </>
                        )}

                        {regType === "teacher" && (
                            <>
                                <KField label="Subject" required error={errors.subject}>
                                    <KitInput
                                        id="subject"
                                        placeholder="Mathematics"
                                        value={formData.subject}
                                        onChange={(e) => handleInputChange("subject", e.target.value)}
                                        disabled={loading}
                                        invalid={!!errors.subject}
                                    />
                                </KField>

                                <KField label="Department" required error={errors.department}>
                                    <KitInput
                                        id="department"
                                        placeholder="Science"
                                        value={formData.department}
                                        onChange={(e) =>
                                            handleInputChange("department", e.target.value)
                                        }
                                        disabled={loading}
                                        invalid={!!errors.department}
                                    />
                                </KField>
                            </>
                        )}

                        {regType === "parent" && (
                            <>
                                <KField
                                    label="Link to student"
                                    required
                                    error={errors.linkedStudentId}
                                    hint="Backend requires a student UUID, not name-only matching."
                                >
                                    <KitSelect
                                        id="linkedStudentId"
                                        value={formData.linkedStudentId}
                                        onChange={(e) =>
                                            handleInputChange("linkedStudentId", e.target.value)
                                        }
                                        disabled={
                                            loading || loadingStudents || studentOptions.length === 0
                                        }
                                        invalid={!!errors.linkedStudentId}
                                    >
                                        {loadingStudents ? (
                                            <option value="">Loading students…</option>
                                        ) : studentOptions.length === 0 ? (
                                            <option value="">No students — register one first</option>
                                        ) : (
                                            studentOptions.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.firstName} {s.lastName} · {s.email}
                                                </option>
                                            ))
                                        )}
                                    </KitSelect>
                                </KField>

                                <KField label="Relationship" required error={errors.relationship}>
                                    <KitSelect
                                        id="relationship"
                                        value={formData.relationship}
                                        onChange={(e) =>
                                            handleInputChange("relationship", e.target.value)
                                        }
                                        disabled={loading}
                                        invalid={!!errors.relationship}
                                    >
                                        <option>Father</option>
                                        <option>Mother</option>
                                        <option>Guardian</option>
                                    </KitSelect>
                                </KField>
                            </>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn-kit btn-kit-primary"
                        disabled={loading}
                        style={{ minWidth: 180, justifyContent: "center" }}
                    >
                        {loading ? (
                            <>
                                <KitSpinner size={12} />
                                Registering…
                            </>
                        ) : (
                            <>
                                <RoleIcon size={13} strokeWidth={1.8} />
                                Register {meta.label.toLowerCase()}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div
            style={{
                padding: "10px 12px",
                background: "var(--color-surface-2)",
                borderRadius: 8,
                border: "1px solid var(--color-hairline)",
            }}
        >
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--ink-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 4,
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: 13,
                    fontWeight: 400,
                    color: "var(--ink)",
                    lineHeight: 1.4,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                }}
            >
                {value}
            </div>
        </div>
    );
}
