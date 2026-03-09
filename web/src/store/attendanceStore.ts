import { create } from "zustand";

export type AttendanceStatus = "present" | "absent" | "excused";

export interface StudentRecord {
    name: string;
    id: string;
}

export interface ClassInfo {
    id: string;
    name: string;
    teacher: string;
    room: string;
}

export interface AttendanceEntry {
    studentId: string;
    studentName: string;
    status: AttendanceStatus;
    excuseNote?: string;
}

export interface AttendanceSession {
    id: string;
    className: string;
    date: string;
    teacherName: string;
    entries: AttendanceEntry[];
    submittedAt: string;
    locked: boolean;
    unlockGranted: boolean;
}

export interface SubmittedRecord {
    id: string;
    sessionId: string;
    studentName: string;
    studentId: string;
    className: string;
    date: string;
    teacherName: string;
    status: AttendanceStatus;
    excuseNote?: string;
    corrected: boolean;
    correctedStatus?: AttendanceStatus;
    correctionReason?: string;
    correctedBy?: string;
}

const DEFAULT_CLASSES: ClassInfo[] = [
    { id: "cls-1", name: "Grade 9-A",  teacher: "Mr. Bekele",  room: "Room 101" },
    { id: "cls-2", name: "Grade 9-B",  teacher: "Ms. Tigist",  room: "Room 102" },
    { id: "cls-3", name: "Grade 10-A", teacher: "Mr. Yonas",   room: "Room 201" },
    { id: "cls-4", name: "Grade 10-B", teacher: "Ms. Helen",   room: "Room 202" },
    { id: "cls-5", name: "Grade 11-A", teacher: "Mr. Solomon", room: "Room 301" },
    { id: "cls-6", name: "Grade 11-B", teacher: "Mr. Solomon", room: "Room 302" },
    { id: "cls-7", name: "Grade 12-A", teacher: "Mr. Solomon", room: "Room 401" },
    { id: "cls-8", name: "Grade 12-B", teacher: "Mr. Solomon", room: "Room 402" },
];

const DEFAULT_STUDENTS: Record<string, StudentRecord[]> = {
    "Grade 11-A": [
        { name: "Abebe Kebede",    id: "STU-042" },
        { name: "Kalkidan Assefa", id: "STU-015" },
        { name: "Yohannes Belay",  id: "STU-028" },
        { name: "Meron Girma",     id: "STU-033" },
        { name: "Samuel Dereje",   id: "STU-019" },
        { name: "Hana Tadesse",    id: "STU-051" },
        { name: "Dawit Mulugeta",  id: "STU-007" },
        { name: "Fatima Hassan",   id: "STU-044" },
        { name: "Lidya Solomon",   id: "STU-062" },
        { name: "Temesgen Alemu",  id: "STU-011" },
    ],
    "Grade 11-B": [
        { name: "Birtukan Mamo",    id: "STU-005" },
        { name: "Eyob Haile",       id: "STU-023" },
        { name: "Selamawit Bekele", id: "STU-031" },
        { name: "Natnael Tesfaye",  id: "STU-038" },
        { name: "Ruth Girma",       id: "STU-047" },
        { name: "Frehiwot Alemu",   id: "STU-053" },
        { name: "Binyam Taye",      id: "STU-061" },
        { name: "Meseret Hailu",    id: "STU-069" },
    ],
    "Grade 12-A": [
        { name: "Dawit Zewde",      id: "STU-008" },
        { name: "Tigist Bekele",    id: "STU-017" },
        { name: "Henok Alemu",      id: "STU-025" },
        { name: "Amina Hassan",     id: "STU-036" },
        { name: "Yared Solomon",    id: "STU-043" },
        { name: "Miriam Tesfaye",   id: "STU-055" },
        { name: "Belayneh Abebe",   id: "STU-064" },
        { name: "Tsehay Mulatu",    id: "STU-071" },
    ],
    "Grade 12-B": [
        { name: "Abel Girma",       id: "STU-003" },
        { name: "Sara Tesfaye",     id: "STU-014" },
        { name: "Mikias Haile",     id: "STU-029" },
        { name: "Mekdes Belay",     id: "STU-037" },
        { name: "Tesfaye Alemu",    id: "STU-048" },
        { name: "Worknesh Bekele",  id: "STU-056" },
        { name: "Haile Selassie",   id: "STU-065" },
        { name: "Bruk Tadesse",     id: "STU-073" },
    ],
};

const SEED_RECORDS: SubmittedRecord[] = [
    { id: "ATT-001", sessionId: "sess-1", studentName: "Abebe Kebede",    studentId: "STU-042", className: "Grade 11-A", date: "2026-03-07", teacherName: "Mr. Solomon", status: "absent",  corrected: false },
    { id: "ATT-002", sessionId: "sess-1", studentName: "Kalkidan Assefa", studentId: "STU-015", className: "Grade 11-A", date: "2026-03-07", teacherName: "Mr. Solomon", status: "present", corrected: false },
    { id: "ATT-003", sessionId: "sess-1", studentName: "Yohannes Belay",  studentId: "STU-028", className: "Grade 11-A", date: "2026-03-07", teacherName: "Mr. Solomon", status: "excused", excuseNote: "Medical appointment", corrected: false },
    { id: "ATT-004", sessionId: "sess-1", studentName: "Meron Girma",     studentId: "STU-033", className: "Grade 11-A", date: "2026-03-07", teacherName: "Mr. Solomon", status: "absent",  corrected: false },
    { id: "ATT-005", sessionId: "sess-1", studentName: "Samuel Dereje",   studentId: "STU-019", className: "Grade 11-A", date: "2026-03-07", teacherName: "Mr. Solomon", status: "present", corrected: false },
    { id: "ATT-006", sessionId: "sess-1", studentName: "Hana Tadesse",    studentId: "STU-051", className: "Grade 11-A", date: "2026-03-07", teacherName: "Mr. Solomon", status: "present", corrected: false },
    { id: "ATT-007", sessionId: "sess-1", studentName: "Dawit Mulugeta",  studentId: "STU-007", className: "Grade 11-A", date: "2026-03-07", teacherName: "Mr. Solomon", status: "present", corrected: false },
    { id: "ATT-008", sessionId: "sess-1", studentName: "Fatima Hassan",   studentId: "STU-044", className: "Grade 11-A", date: "2026-03-07", teacherName: "Mr. Solomon", status: "present", corrected: false },
    { id: "ATT-009", sessionId: "sess-1", studentName: "Lidya Solomon",   studentId: "STU-062", className: "Grade 11-A", date: "2026-03-07", teacherName: "Mr. Solomon", status: "present", corrected: false },
    { id: "ATT-010", sessionId: "sess-1", studentName: "Temesgen Alemu",  studentId: "STU-011", className: "Grade 11-A", date: "2026-03-07", teacherName: "Mr. Solomon", status: "absent",  corrected: false },
    { id: "ATT-011", sessionId: "sess-2", studentName: "Birtukan Mamo",   studentId: "STU-005", className: "Grade 11-B", date: "2026-03-07", teacherName: "Mr. Solomon", status: "present", corrected: false },
    { id: "ATT-012", sessionId: "sess-2", studentName: "Eyob Haile",      studentId: "STU-023", className: "Grade 11-B", date: "2026-03-07", teacherName: "Mr. Solomon", status: "absent",  corrected: false },
    { id: "ATT-013", sessionId: "sess-2", studentName: "Selamawit Bekele",studentId: "STU-031", className: "Grade 11-B", date: "2026-03-07", teacherName: "Mr. Solomon", status: "present", corrected: false },
    { id: "ATT-014", sessionId: "sess-3", studentName: "Dawit Zewde",     studentId: "STU-008", className: "Grade 12-A", date: "2026-03-06", teacherName: "Mr. Solomon", status: "absent",  corrected: false },
    { id: "ATT-015", sessionId: "sess-3", studentName: "Tigist Bekele",   studentId: "STU-017", className: "Grade 12-A", date: "2026-03-06", teacherName: "Mr. Solomon", status: "present", corrected: false },
    { id: "ATT-016", sessionId: "sess-3", studentName: "Henok Alemu",     studentId: "STU-025", className: "Grade 12-A", date: "2026-03-06", teacherName: "Mr. Solomon", status: "excused", excuseNote: "Family emergency", corrected: false },
    { id: "ATT-017", sessionId: "sess-4", studentName: "Abel Girma",      studentId: "STU-003", className: "Grade 12-B", date: "2026-03-06", teacherName: "Mr. Solomon", status: "absent",  corrected: false },
    { id: "ATT-018", sessionId: "sess-4", studentName: "Sara Tesfaye",    studentId: "STU-014", className: "Grade 12-B", date: "2026-03-06", teacherName: "Mr. Solomon", status: "present", corrected: false },
];

const SEED_SESSIONS: AttendanceSession[] = [
    { id: "sess-1", className: "Grade 11-A", date: "2026-03-07", teacherName: "Mr. Solomon", entries: [], submittedAt: "2026-03-07T08:45:00", locked: true, unlockGranted: false },
    { id: "sess-2", className: "Grade 11-B", date: "2026-03-07", teacherName: "Mr. Solomon", entries: [], submittedAt: "2026-03-07T09:30:00", locked: true, unlockGranted: false },
    { id: "sess-3", className: "Grade 12-A", date: "2026-03-06", teacherName: "Mr. Solomon", entries: [], submittedAt: "2026-03-06T10:15:00", locked: true, unlockGranted: false },
    { id: "sess-4", className: "Grade 12-B", date: "2026-03-06", teacherName: "Mr. Solomon", entries: [], submittedAt: "2026-03-06T11:00:00", locked: true, unlockGranted: false },
];

interface AttendanceStore {
    classes: ClassInfo[];
    studentsByClass: Record<string, StudentRecord[]>;
    sessions: AttendanceSession[];
    records: SubmittedRecord[];
    addClass: (c: Omit<ClassInfo, "id">) => void;
    submitSession: (params: { className: string; date: string; teacherName: string; entries: AttendanceEntry[] }) => void;
    unlockSession: (sessionId: string) => void;
    correctRecord: (recordId: string, status: AttendanceStatus, reason: string) => void;
    revertRecord: (recordId: string) => void;
}

export const useAttendanceStore = create<AttendanceStore>((set) => ({
    classes: DEFAULT_CLASSES,
    studentsByClass: DEFAULT_STUDENTS,
    sessions: SEED_SESSIONS,
    records: SEED_RECORDS,

    addClass: (c) =>
        set((state) => ({
            classes: [...state.classes, { ...c, id: `cls-${Date.now()}` }],
            studentsByClass: { ...state.studentsByClass, [c.name]: [] },
        })),

    submitSession: ({ className, date, teacherName, entries }) =>
        set((state) => {
            const existing = state.sessions.find(s => s.className === className && s.date === date);
            const sessionId = existing?.id ?? `sess-${Date.now()}`;
            const newSession: AttendanceSession = {
                id: sessionId,
                className,
                date,
                teacherName,
                entries,
                submittedAt: new Date().toISOString(),
                locked: true,
                unlockGranted: false,
            };
            const sessions = existing
                ? state.sessions.map(s => s.id === existing.id ? newSession : s)
                : [...state.sessions, newSession];

            const kept = state.records.filter(r => !(r.className === className && r.date === date));
            const newRecords: SubmittedRecord[] = entries.map((e, i) => ({
                id: `${sessionId}-r${i}`,
                sessionId,
                studentName: e.studentName,
                studentId: e.studentId,
                className,
                date,
                teacherName,
                status: e.status,
                excuseNote: e.excuseNote,
                corrected: false,
            }));
            return { sessions, records: [...kept, ...newRecords] };
        }),

    unlockSession: (sessionId) =>
        set((state) => ({
            sessions: state.sessions.map(s => s.id === sessionId ? { ...s, unlockGranted: true } : s),
        })),

    correctRecord: (recordId, status, reason) =>
        set((state) => ({
            records: state.records.map(r =>
                r.id === recordId
                    ? { ...r, corrected: true, correctedStatus: status, correctionReason: reason, correctedBy: "Admin User" }
                    : r
            ),
        })),

    revertRecord: (recordId) =>
        set((state) => ({
            records: state.records.map(r =>
                r.id === recordId
                    ? { ...r, corrected: false, correctedStatus: undefined, correctionReason: undefined, correctedBy: undefined }
                    : r
            ),
        })),
}));
