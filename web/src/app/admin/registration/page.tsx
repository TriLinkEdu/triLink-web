"use client";
import { useState } from "react";

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
    userId?: string;
    username?: string;
    tempPassword?: string;
    hasVerified?: boolean;
    createdAt?: string;
}

interface TeacherFormData extends BaseFormData {
    type: "teacher";
    subject: string;
    department: string;
    userId?: string;
    username?: string;
    tempPassword?: string;
    hasVerified?: boolean;
    createdAt?: string;
}

interface ParentFormData extends BaseFormData {
    type: "parent";
    childName: string;
    relationship: string;
    userId?: string;
    username?: string;
    tempPassword?: string;
    hasVerified?: boolean;
    createdAt?: string;
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

export default function AdminRegistration() {
    const [regType, setRegType] = useState<RegistrationType>("student");
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});

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

    const validateEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validatePhone = (phone: string): boolean => {
        return /^[+]?[\d\s\-()]*$/.test(phone) && phone.replace(/\D/g, "").length >= 10;
    };

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
            return {
                type: "parent",
                ...baseData,
                childName: formData.childName.trim(),
                relationship: formData.relationship,
            } as ParentFormData;
        }
        return null;
    };

    const generateTemporaryCredentials = (): { username: string; tempPassword: string } => {
        // Generate temporary credentials based on email
        const username = formData.email.split("@")[0];
        const tempPassword = Math.random().toString(36).slice(-8).toUpperCase() + Math.random().toString(36).slice(-2);
        return { username, tempPassword };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage("");
        setErrorMessage("");

        if (!validateForm()) {
            setErrorMessage("Please fix the errors above");
            return;
        }

        setLoading(true);

        try {
            const submitData = prepareSubmitData();
            if (!submitData) throw new Error("Invalid form data");

            // Generate credentials for the new user
            const credentials = generateTemporaryCredentials();

            const registrationPayload = {
                ...submitData,
                userId: `${regType.charAt(0)}-${Date.now()}`, // Unique ID
                username: credentials.username,
                tempPassword: credentials.tempPassword,
                hasVerified: false,
                createdAt: new Date().toISOString(),
            };

            // Call backend API
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(registrationPayload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Registration failed with status ${response.status}`);
            }

            const result = await response.json();

            // Show success with credentials info
            setSuccessMessage(
                `✓ ${regType.charAt(0).toUpperCase() + regType.slice(1)} registered successfully! ` +
                `An email with login credentials (Username: ${credentials.username}) has been sent to ${formData.email.toLowerCase()}`
            );

            // Reset form
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
                relationship: "Father",
            });
            setErrors({});
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
        // Clear error for this field when user starts typing
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined,
            }));
        }
    };

    const handleTypeChange = (type: RegistrationType) => {
        setRegType(type);
        setErrors({});
        setSuccessMessage("");
        setErrorMessage("");
    };

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Registration</h1>
                    <p className="page-subtitle">Register students, teachers, and parents</p>
                </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {(["student", "teacher", "parent"] as const).map(t => (
                    <button
                        key={t}
                        className={`btn ${regType === t ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => handleTypeChange(t)}
                        disabled={loading}
                    >
                        {t === "student" ? "🎓" : t === "teacher" ? "📚" : "👨‍👩‍👧"} {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            {successMessage && (
                <div style={{
                    padding: "1rem",
                    marginBottom: "1rem",
                    background: "#d4edda",
                    border: "1px solid #c3e6cb",
                    borderRadius: "var(--radius-md)",
                    color: "#155724",
                }}>
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div style={{
                    padding: "1rem",
                    marginBottom: "1rem",
                    background: "#f8d7da",
                    border: "1px solid #f5c6cb",
                    borderRadius: "var(--radius-md)",
                    color: "#721c24",
                }}>
                    {errorMessage}
                </div>
            )}

            <div className="card">
                <h3 className="card-title" style={{ marginBottom: "1.25rem" }}>
                    Register New {regType.charAt(0).toUpperCase() + regType.slice(1)}
                </h3>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                        <div className="input-group">
                            <label htmlFor="firstName">
                                First Name <span style={{ color: "var(--red-500)" }}>*</span>
                            </label>
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
                            <label htmlFor="lastName">
                                Last Name <span style={{ color: "var(--red-500)" }}>*</span>
                            </label>
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
                            <label htmlFor="email">
                                Email <span style={{ color: "var(--red-500)" }}>*</span>
                            </label>
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
                            <label htmlFor="phone">
                                Phone <span style={{ color: "var(--red-500)" }}>*</span>
                            </label>
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
                                    <label htmlFor="grade">
                                        Grade <span style={{ color: "var(--red-500)" }}>*</span>
                                    </label>
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
                                    <label htmlFor="section">
                                        Section <span style={{ color: "var(--red-500)" }}>*</span>
                                    </label>
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
                                    <label htmlFor="subject">
                                        Subject <span style={{ color: "var(--red-500)" }}>*</span>
                                    </label>
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
                                    <label htmlFor="department">
                                        Department <span style={{ color: "var(--red-500)" }}>*</span>
                                    </label>
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
                                    <label htmlFor="childName">
                                        Child&apos;s Name <span style={{ color: "var(--red-500)" }}>*</span>
                                    </label>
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
                                    <label htmlFor="relationship">
                                        Relationship <span style={{ color: "var(--red-500)" }}>*</span>
                                    </label>
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

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? "Registering..." : `Register ${regType.charAt(0).toUpperCase() + regType.slice(1)}`}
                    </button>
                </form>
            </div>
        </div>
    );
}
