"use client";
import { useState } from "react";
import Link from "next/link";

interface HeaderProps {
    userName: string;
    userRole: string;
    userInitials: string;
    userProfileHref?: string;
}

export default function Header({ userName, userRole, userInitials, userProfileHref }: HeaderProps) {
    const [searchFocused, setSearchFocused] = useState(false);

    const userBlock = (
        <div className="header-user">
            <div className="header-user-info">
                <div className="header-user-name">{userName}</div>
                <div className="header-user-role">{userRole}</div>
            </div>
            <div className="avatar avatar-initials" style={{ width: 36, height: 36, fontSize: "0.8rem" }}>
                {userInitials}
            </div>
        </div>
    );

    return (
        <header className="top-header">
            <div className="header-search">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                    type="text"
                    placeholder="Search anything..."
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                />
            </div>

            <div className="header-actions">
                <button className="header-icon-btn" title="Notifications">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span className="notification-dot"></span>
                </button>

                <button className="header-icon-btn" title="Messages">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                </button>

                {userProfileHref ? <Link href={userProfileHref}>{userBlock}</Link> : userBlock}
            </div>
        </header>
    );
}
