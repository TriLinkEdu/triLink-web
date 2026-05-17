"use client";

/**
 * Portal selector — 1:1 port of the TRILINK kit's `<PortalSelector/>`
 * (`shell.jsx` lines 7–78). Visual structure, copy, and class names match
 * the kit verbatim; the only adaptation is `onPick` routing through
 * Next.js (`/<role>/login`) instead of the kit's in-memory role state.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/kit";

const ROLES = [
    {
        id: "student",
        title: "Student",
        desc: "Coursework, exams, and your AI-tailored study path.",
        icon: "cap" as const,
    },
    {
        id: "teacher",
        title: "Teacher",
        desc: "Classes, grading, broadcasts, live exam proctoring.",
        icon: "edit" as const,
    },
    {
        id: "admin",
        title: "Admin",
        desc: "Structure, enrollment, audit & feedback workflows.",
        icon: "shield" as const,
    },
    {
        id: "parent",
        title: "Parent",
        desc: "Your child's grades, attendance, and announcements.",
        icon: "family" as const,
    },
] as const;

export default function PortalSelectorPage() {
    const router = useRouter();
    const onPick = (id: (typeof ROLES)[number]["id"]) => {
        router.push(`/${id}/login`);
    };

    return (
        <div className="portal">
            {/* Top nav */}
            <div className="portal__nav">
                <div className="portal__nav-brand">
                    <div className="portal__nav-logo">
                        <Icon name="cap" size={13} />
                    </div>
                    <div className="portal__nav-name">TriLink</div>
                    <span className="portal__nav-status">All systems operational</span>
                </div>
                <nav className="portal__nav-meta" aria-label="Footer-style top nav">
                    <Link href="/docs">Docs</Link>
                    <Link href="/changelog">Changelog</Link>
                    <Link href="/status">Status</Link>
                    <Link href="/student/login">Sign in</Link>
                </nav>
            </div>

            <main className="portal__inner">
                <div className="portal__chip">
                    <span className="portal__chip-tag">v4.0</span>
                    Now with Curriculum Co-pilot
                </div>

                <h1 className="portal__title">
                    Welcome to <span className="serif">TriLink.</span>
                </h1>
                <p className="portal__sub">
                    One platform for the whole school — built for the era of AI tutors, real-time
                    proctoring, and parents who actually want to <em>see</em> what&rsquo;s happening.
                </p>

                <div className="portal__label">Choose your portal</div>
                <div className="portal__grid">
                    {ROLES.map((r) => (
                        <button
                            key={r.id}
                            type="button"
                            className="portal__card"
                            data-role={r.id}
                            onClick={() => onPick(r.id)}
                        >
                            <div className="portal__card-icon">
                                <Icon name={r.icon} size={18} />
                            </div>
                            <div>
                                <div className="portal__card-title">{r.title}</div>
                                <p className="portal__card-desc">{r.desc}</p>
                            </div>
                            <span className="portal__card-cta">
                                Continue <Icon name="arrowRight" size={12} />
                            </span>
                        </button>
                    ))}
                </div>

                <div className="portal__foot">
                    <span className="portal__foot__item">
                        <Icon name="shield" /> SOC 2 Type II
                    </span>
                    <span className="portal__foot__item">
                        <Icon name="lock" /> SSO · SCIM
                    </span>
                    <span className="portal__foot__item">
                        <Icon name="globe" /> 480+ schools
                    </span>
                    <span style={{ marginLeft: "auto" }}>Learn smarter, grow faster.</span>
                </div>
            </main>
        </div>
    );
}
