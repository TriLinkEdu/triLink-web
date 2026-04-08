import { authFetch } from "./auth";
import { getApiBase } from "./api";

function url(path: string) {
  return `${getApiBase()}${path.startsWith("/") ? path : `/${path}`}`;
}

function errMessage(body: unknown): string {
  if (body && typeof body === "object" && "message" in body) {
    const m = (body as { message: unknown }).message;
    if (Array.isArray(m)) return m.map(String).join(", ");
    if (typeof m === "string") return m;
  }
  return "Request failed";
}

export async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (init?.body != null && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return authFetch(url(path), { ...init, headers });
}

export async function adminJson<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await adminFetch(path, init);
  const text = await r.text();
  const data = text ? JSON.parse(text) : null;
  if (!r.ok) throw new Error(errMessage(data));
  return data as T;
}

// --- Types (minimal; API returns camelCase from Nest/TypeORM) ---

export type PublicUser = {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  profileImageFileId?: string | null;
  grade?: string | null;
  section?: string | null;
  subject?: string | null;
  department?: string | null;
  childName?: string | null;
  relationship?: string | null;
  mustChangePassword?: boolean;
  createdAt?: string;
};

export type AcademicYear = {
  id: string;
  label: string;
  isActive?: boolean;
  isArchived?: boolean;
  startDate?: string;
  endDate?: string;
  terms?: TermRow[];
};

export type TermRow = {
  id: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
};

export type Grade = { id: string; name: string; orderIndex?: number };
export type Section = { id: string; name: string };
export type Subject = { id: string; name: string; code?: string | null };

export type ClassOffering = {
  id: string;
  academicYearId: string;
  gradeId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  name?: string | null;
  /** Set by API list endpoints when grade/section/subject rows exist */
  gradeName?: string | null;
  sectionName?: string | null;
  subjectName?: string | null;
  displayName?: string;
  createdAt?: string;
};

export type Enrollment = {
  id: string;
  studentId: string;
  classOfferingId: string;
  academicYearId: string;
  status: string;
};

export type ParentLink = {
  id: string;
  parentId: string;
  studentId: string;
  relationship: string;
  isPrimary?: boolean;
};

export type Announcement = {
  id: string;
  academicYearId: string;
  title: string;
  body: string;
  audience: string;
  classOfferingId?: string | null;
  authorId: string;
  createdAt: string;
};

export type FeedbackTicket = {
  id: string;
  /** Null when ticket is anonymous (admin list hides real author id). */
  authorId: string | null;
  isAnonymous?: boolean;
  category: string;
  message: string;
  status: string;
  assigneeId?: string | null;
  createdAt: string;
};

export type Conversation = {
  id: string;
  type: string;
  title: string;
  classOfferingId?: string | null;
  parentVisible?: boolean;
  createdById: string;
  updatedAt?: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
};

export type AttendanceSession = { id: string; classOfferingId: string; date: string; takenById: string };
export type AttendanceMark = { id: string; sessionId: string; studentId: string; status: string; note?: string | null };

export async function patchMe(body: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImageFileId?: string;
  experience?: string;
  officeRoom?: string;
  country?: string;
  cityState?: string;
  postalCode?: string;
  department?: string;
  homeroomClass?: string;
}): Promise<any> {
  return adminJson<any>("/api/users/me", { method: "PATCH", body: JSON.stringify(body) });
}

export type CalendarEventRecord = {
  id: string;
  academicYearId: string;
  title: string;
  date: string;
  time?: string | null;
  type: string;
  description?: string | null;
  classOfferingId?: string | null;
  createdById?: string;
};

// --- API ---

export async function getActiveAcademicYear(): Promise<AcademicYear | null> {
  const r = await adminJson<{ data: AcademicYear | null }>("/api/academic-years/active", { method: "GET" });
  return r.data ?? null;
}

export async function listAcademicYears(): Promise<AcademicYear[]> {
  return adminJson<AcademicYear[]>("/api/academic-years", { method: "GET" });
}

export async function getAcademicYear(id: string): Promise<AcademicYear> {
  return adminJson<AcademicYear>(`/api/academic-years/${id}`, { method: "GET" });
}

export async function createAcademicYear(body: {
  label: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}): Promise<AcademicYear> {
  return adminJson<AcademicYear>("/api/academic-years", { method: "POST", body: JSON.stringify(body) });
}

export async function patchAcademicYear(
  id: string,
  body: { label?: string; startDate?: string; endDate?: string; isArchived?: boolean },
): Promise<AcademicYear> {
  return adminJson<AcademicYear>(`/api/academic-years/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteAcademicYear(id: string): Promise<void> {
  await adminJson<{ ok: boolean }>(`/api/academic-years/${id}`, { method: "DELETE" });
}

export async function closeAcademicYear(id: string): Promise<unknown> {
  return adminJson(`/api/academic-years/${id}/close`, { method: "POST" });
}

export async function rolloverAcademicYear(
  id: string,
  newLabel: string,
  dryRun: boolean,
): Promise<{ createdYearId?: string; offeringsCopied: number }> {
  const q = new URLSearchParams({ newLabel, dryRun: String(dryRun) });
  return adminJson(`/api/academic-years/${id}/rollover?${q}`, { method: "POST" });
}

export async function listTerms(yearId: string): Promise<TermRow[]> {
  return adminJson<TermRow[]>(`/api/academic-years/${yearId}/terms`, { method: "GET" });
}

export async function addTerm(
  yearId: string,
  body: { name: string; startDate: string; endDate: string },
): Promise<TermRow> {
  return adminJson<TermRow>(`/api/academic-years/${yearId}/terms`, { method: "POST", body: JSON.stringify(body) });
}

export async function deleteTerm(termId: string): Promise<void> {
  await adminJson<{ ok: boolean }>(`/api/academic-years/terms/${termId}`, { method: "DELETE" });
}

export async function createGrade(body: { name: string; orderIndex?: number }): Promise<Grade> {
  return adminJson<Grade>("/api/grades", { method: "POST", body: JSON.stringify(body) });
}

export async function patchGrade(id: string, body: { name?: string; orderIndex?: number }): Promise<Grade> {
  return adminJson<Grade>(`/api/grades/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteGrade(id: string): Promise<void> {
  await adminJson<{ ok: boolean }>(`/api/grades/${id}`, { method: "DELETE" });
}

export async function createSection(body: { name: string }): Promise<Section> {
  return adminJson<Section>("/api/sections", { method: "POST", body: JSON.stringify(body) });
}

export async function patchSection(id: string, body: { name: string }): Promise<Section> {
  return adminJson<Section>(`/api/sections/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteSection(id: string): Promise<void> {
  await adminJson<{ ok: boolean }>(`/api/sections/${id}`, { method: "DELETE" });
}

export async function createSubject(body: { name: string; code?: string }): Promise<Subject> {
  return adminJson<Subject>("/api/subjects", { method: "POST", body: JSON.stringify(body) });
}

export async function patchSubject(id: string, body: { name?: string; code?: string | null }): Promise<Subject> {
  return adminJson<Subject>(`/api/subjects/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteSubject(id: string): Promise<void> {
  await adminJson<{ ok: boolean }>(`/api/subjects/${id}`, { method: "DELETE" });
}

export async function listGrades(): Promise<Grade[]> {
  return adminJson<Grade[]>("/api/grades", { method: "GET" });
}

export async function listSections(): Promise<Section[]> {
  return adminJson<Section[]>("/api/sections", { method: "GET" });
}

export async function listSubjects(): Promise<Subject[]> {
  return adminJson<Subject[]>("/api/subjects", { method: "GET" });
}

export async function listClassOfferings(academicYearId: string): Promise<ClassOffering[]> {
  const q = new URLSearchParams({ academicYearId });
  return adminJson<ClassOffering[]>(`/api/class-offerings?${q}`, { method: "GET" });
}

export async function getClassOffering(id: string): Promise<ClassOffering> {
  return adminJson<ClassOffering>(`/api/class-offerings/${id}`, { method: "GET" });
}

export async function activateAcademicYear(id: string): Promise<unknown> {
  return adminJson(`/api/academic-years/${id}/activate`, { method: "POST" });
}

export async function createClassOffering(body: {
  academicYearId: string;
  gradeId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  name?: string;
}): Promise<ClassOffering> {
  return adminJson<ClassOffering>("/api/class-offerings", { method: "POST", body: JSON.stringify(body) });
}

export async function patchClassOffering(id: string, body: { teacherId?: string; name?: string | null }): Promise<ClassOffering> {
  return adminJson<ClassOffering>(`/api/class-offerings/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteClassOffering(id: string): Promise<void> {
  await adminJson<{ ok: boolean }>(`/api/class-offerings/${id}`, { method: "DELETE" });
}

export async function listUsers(role?: "student" | "teacher" | "parent" | "admin", q?: string): Promise<PublicUser[]> {
  const p = new URLSearchParams();
  if (role) p.set("role", role);
  if (q) p.set("q", q);
  const qs = p.toString();
  return adminJson<PublicUser[]>(`/api/users${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function getUser(id: string): Promise<PublicUser> {
  return adminJson<PublicUser>(`/api/users/${id}`, { method: "GET" });
}

export async function patchUser(
  id: string,
  body: Partial<Pick<PublicUser, "firstName" | "lastName" | "phone" | "profileImageFileId">>,
): Promise<PublicUser> {
  return adminJson<PublicUser>(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function uploadProfileImage(file: File): Promise<{ id: string }> {
  const fd = new FormData();
  fd.append("file", file);
  return adminJson<{ id: string }>("/api/files/upload", {
    method: "POST",
    body: fd,
  });
}

export async function listEnrollments(filters: { classOfferingId?: string; academicYearId?: string; studentId?: string }): Promise<Enrollment[]> {
  const p = new URLSearchParams();
  if (filters.classOfferingId) p.set("classOfferingId", filters.classOfferingId);
  if (filters.academicYearId) p.set("academicYearId", filters.academicYearId);
  if (filters.studentId) p.set("studentId", filters.studentId);
  return adminJson<Enrollment[]>(`/api/enrollments?${p}`, { method: "GET" });
}

export async function createEnrollment(body: { studentId: string; classOfferingId: string; academicYearId: string }): Promise<Enrollment> {
  return adminJson<Enrollment>("/api/enrollments", { method: "POST", body: JSON.stringify(body) });
}

export async function deleteEnrollment(id: string): Promise<void> {
  await adminJson<{ ok: boolean }>(`/api/enrollments/${id}`, { method: "DELETE" });
}

export async function listParentLinks(filters?: { parentId?: string; studentId?: string }): Promise<ParentLink[]> {
  const p = new URLSearchParams();
  if (filters?.parentId) p.set("parentId", filters.parentId);
  if (filters?.studentId) p.set("studentId", filters.studentId);
  const qs = p.toString();
  return adminJson<ParentLink[]>(`/api/parent-students${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function createParentLink(body: {
  parentId: string;
  studentId: string;
  relationship: string;
  isPrimary?: boolean;
}): Promise<ParentLink> {
  return adminJson<ParentLink>("/api/parent-students", { method: "POST", body: JSON.stringify(body) });
}

export async function deleteParentLink(id: string): Promise<void> {
  await adminJson<{ ok: boolean }>(`/api/parent-students/${id}`, { method: "DELETE" });
}

export async function listAnnouncements(academicYearId?: string): Promise<Announcement[]> {
  const q = academicYearId ? `?academicYearId=${encodeURIComponent(academicYearId)}` : "";
  return adminJson<Announcement[]>(`/api/announcements${q}`, { method: "GET" });
}

/** Visible announcements for the current user (student/parent filtering applied server-side). */
export async function announcementsForMe(): Promise<Announcement[]> {
  return adminJson<Announcement[]>("/api/announcements/for-me", { method: "GET" });
}

export async function teacherDashboard(): Promise<{
  myClasses: number;
  totalStudents: number;
  pendingGradingApprox: number;
  unreadNotifications: number;
  attendanceRate: number | null;
  publishedExams: number;
  recentAnnouncements: number;
}> {
  return adminJson<{
    myClasses: number;
    totalStudents: number;
    pendingGradingApprox: number;
    unreadNotifications: number;
    attendanceRate: number | null;
    publishedExams: number;
    recentAnnouncements: number;
  }>("/api/dashboard/teacher", { method: "GET" });
}

export async function studentDashboard() {
  return adminJson<{
    activeEnrollments: number;
    unreadNotifications: number;
  }>("/api/dashboard/student", { method: "GET" });
}

export async function parentDashboard() {
  return adminJson<{
    linkedChildren: number;
    unreadNotifications: number;
  }>("/api/dashboard/parent", { method: "GET" });
}

export async function listMyClassOfferings(academicYearId: string): Promise<ClassOffering[]> {
  return adminJson<ClassOffering[]>(
    `/api/class-offerings/mine?academicYearId=${encodeURIComponent(academicYearId)}`,
    { method: "GET" },
  );
}

export async function listAllClassOfferings(academicYearId: string): Promise<ClassOffering[]> {
  return adminJson<ClassOffering[]>(`/api/class-offerings?academicYearId=${encodeURIComponent(academicYearId)}`, {
    method: "GET",
  });
}

export async function listCalendarEvents(filters: {
  from?: string;
  to?: string;
  academicYearId?: string;
  classOfferingId?: string;
}): Promise<CalendarEventRecord[]> {
  const p = new URLSearchParams();
  if (filters.from) p.set("from", filters.from);
  if (filters.to) p.set("to", filters.to);
  if (filters.academicYearId) p.set("academicYearId", filters.academicYearId);
  if (filters.classOfferingId) p.set("classOfferingId", filters.classOfferingId);
  const qs = p.toString();
  return adminJson<CalendarEventRecord[]>(`/api/calendar-events${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function createCalendarEvent(body: {
  academicYearId: string;
  title: string;
  date: string;
  time?: string;
  type: string;
  description?: string;
  classOfferingId?: string;
}): Promise<CalendarEventRecord> {
  return adminJson<CalendarEventRecord>("/api/calendar-events", { method: "POST", body: JSON.stringify(body) });
}

export async function createAnnouncement(body: {
  academicYearId: string;
  title: string;
  body: string;
  audience: string;
  classOfferingId?: string;
}): Promise<Announcement> {
  return adminJson<Announcement>("/api/announcements", { method: "POST", body: JSON.stringify(body) });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await adminJson<{ ok: boolean }>(`/api/announcements/${id}`, { method: "DELETE" });
}

export async function listFeedback(): Promise<FeedbackTicket[]> {
  return adminJson<FeedbackTicket[]>("/api/feedback", { method: "GET" });
}

export async function patchFeedback(id: string, body: { status?: string; assigneeId?: string | null }): Promise<FeedbackTicket> {
  return adminJson<FeedbackTicket>(`/api/feedback/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function adminDashboard() {
  return adminJson<{
    users: { admin: number; teacher: number; student: number; parent: number; total: number };
    classes: number;
    enrollments: number;
  }>("/api/dashboard/admin", { method: "GET" });
}

export async function adminAnalytics() {
  return adminJson<{
    generatedAt: string;
    users: { admin: number; teacher: number; student: number; parent: number; total: number };
    feedbackTicketsByStatus: { status: string; count: number }[];
    exams: { publishedCount: number };
    examAttempts: { submitted: number; released: number };
    attendance: {
      marksRecordedLast30Days: number;
      presentOrLateLast30Days: number;
      presentRateLast30DaysApprox: number | null;
    };
    announcementsTotal: number;
  }>("/api/analytics/admin/summary", { method: "GET" });
}

export async function listAuditLogs(limit = 100) {
  return adminJson<unknown[]>(`/api/audit-logs?limit=${limit}`, { method: "GET" });
}

export async function listAttendanceSessions(classOfferingId: string): Promise<AttendanceSession[]> {
  return adminJson<AttendanceSession[]>(`/api/attendance-sessions?classOfferingId=${encodeURIComponent(classOfferingId)}`, {
    method: "GET",
  });
}

export async function createAttendanceSession(body: { classOfferingId: string; date: string }): Promise<AttendanceSession> {
  return adminJson<AttendanceSession>("/api/attendance-sessions", { method: "POST", body: JSON.stringify(body) });
}

export async function getSessionMarks(sessionId: string): Promise<AttendanceMark[]> {
  return adminJson<AttendanceMark[]>(`/api/attendance-sessions/${sessionId}/marks`, { method: "GET" });
}

export async function putSessionMarks(sessionId: string, marks: { studentId: string; status: string }[]): Promise<AttendanceMark[]> {
  return adminJson<AttendanceMark[]>(`/api/attendance-sessions/${sessionId}/marks`, {
    method: "PUT",
    body: JSON.stringify({ marks }),
  });
}

export async function classAttendanceReport(classOfferingId: string) {
  return adminJson<{
    classOfferingId: string;
    sessions: { sessionId: string; date: string; marks: AttendanceMark[] }[];
  }>(`/api/reports/attendance/class/${classOfferingId}`, { method: "GET" });
}

export async function listConversations(): Promise<Conversation[]> {
  return adminJson<Conversation[]>("/api/conversations", { method: "GET" });
}

export async function listMessages(conversationId: string, limit = 80): Promise<ChatMessage[]> {
  return adminJson<ChatMessage[]>(`/api/conversations/${conversationId}/messages?limit=${limit}`, { method: "GET" });
}

export async function postMessage(conversationId: string, text: string): Promise<ChatMessage> {
  return adminJson<ChatMessage>(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function createConversation(body: {
  type: string;
  title: string;
  memberIds: string[];
  classOfferingId?: string;
  parentVisible?: boolean;
}): Promise<Conversation | null> {
  return adminJson<Conversation | null>("/api/conversations", { method: "POST", body: JSON.stringify(body) });
}

export async function getUserSettings(): Promise<{ settingsJson: string | null } | Record<string, unknown>> {
  return adminJson("/api/me/settings", { method: "GET" });
}

export async function patchUserSettings(settingsJson: string): Promise<unknown> {
  return adminJson("/api/me/settings", { method: "PATCH", body: JSON.stringify({ settingsJson }) });
}

export async function getSchoolSettings(): Promise<{ settingsJson: string | null } | Record<string, unknown>> {
  return adminJson("/api/school/settings", { method: "GET" });
}

export async function patchSchoolSettings(settingsJson: string): Promise<unknown> {
  return adminJson("/api/school/settings", { method: "PATCH", body: JSON.stringify({ settingsJson }) });
}

// ── Exam Types ─────────────────────────────────────────────────────────────────

export type Exam = {
  id: string;
  title: string;
  academicYearId: string;
  classOfferingId?: string | null;
  opensAt: string;
  closesAt: string;
  durationMinutes: number;
  maxPoints: number;
  published: boolean;
  createdById: string;
  createdAt: string;
  /** Joined for students: their specific attempt for this exam */
  attempts?: Array<{
    id: string;
    studentId: string;
    startedAt: string;
    submittedAt: string | null;
    releasedAt: string | null;
    score: number | null;
  }>;
};

export type ExamQuestion = {
  id: string;
  examId: string;
  questionId: string;
  orderIndex: number;
  points: number;
};

export type Question = {
  id: string;
  type: string;
  stem: string;
  optionsJson?: string | null;
  answerKey?: string | null;
  subjectId: string;
  createdById: string;
  createdAt: string;
};

export type ExamAttemptSummary = {
  attemptId: string;
  studentId: string;
  studentEmail: string | null;
  firstName: string | null;
  lastName: string | null;
  submittedAt: string | null;
  releasedAt: string | null;
  score: number | null;
  autoScore: number | null;
  needsManualGrading: boolean;
};

export type ExamRosterStudent = {
  studentId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  status: "not_started" | "in_progress" | "submitted";
  score: number | null;
  releasedAt: string | null;
  attemptId: string | null;
  violationCount: number;
};

export type Violation = { reason: string; timestamp: string };

export type BackendNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  payloadJson?: string | null;
  readAt?: string | null;
  createdAt: string;
};

// ── Exam API ────────────────────────────────────────────────────────────────────

export async function listExams(academicYearId?: string): Promise<Exam[]> {
  const q = academicYearId ? `?academicYearId=${encodeURIComponent(academicYearId)}` : "";
  return adminJson<Exam[]>(`/api/exams${q}`, { method: "GET" });
}

export async function createExam(body: {
  title: string;
  academicYearId: string;
  classOfferingId?: string;
  opensAt: string;
  closesAt: string;
  durationMinutes: number;
  maxPoints?: number;
}): Promise<Exam> {
  return adminJson<Exam>("/api/exams", { method: "POST", body: JSON.stringify(body) });
}

export async function updateExamMaxPoints(examId: string, maxPoints: number): Promise<Exam> {
  return adminJson<Exam>(`/api/exams/${examId}`, {
    method: "PATCH",
    body: JSON.stringify({ maxPoints }),
  });
}

export async function publishExam(examId: string): Promise<Exam> {
  return adminJson<Exam>(`/api/exams/${examId}/publish`, { method: "POST" });
}

export async function listExamAttempts(
  examId: string,
): Promise<{ examId: string; attempts: ExamAttemptSummary[] }> {
  return adminJson(`/api/exams/${examId}/attempts`, { method: "GET" });
}

export async function getExamStudentRoster(
  examId: string,
): Promise<{ examId: string; classOfferingId: string | null; students: ExamRosterStudent[] }> {
  return adminJson(`/api/exams/${examId}/students`, { method: "GET" });
}

// ── Question Bank API ───────────────────────────────────────────────────────────

export async function createQuestion(body: {
  type: string;
  stem: string;
  optionsJson?: string;
  answerKey?: string;
  subjectId: string;
}): Promise<Question> {
  return adminJson<Question>("/api/questions", { method: "POST", body: JSON.stringify(body) });
}

export async function listQuestions(subjectId?: string): Promise<Question[]> {
  const q = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : "";
  return adminJson<Question[]>(`/api/questions${q}`, { method: "GET" });
}

export async function addQuestionsToExam(
  examId: string,
  items: { questionId: string; orderIndex: number; points: number }[],
): Promise<ExamQuestion[]> {
  return adminJson<ExamQuestion[]>(`/api/exams/${examId}/questions`, {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

// ── Attempt / Grading API ────────────────────────────────────────────────────────

export async function gradeAttempt(attemptId: string, score: number): Promise<unknown> {
  return adminJson(`/api/attempts/${attemptId}/grade`, {
    method: "POST",
    body: JSON.stringify({ score }),
  });
}

export async function releaseAttempt(attemptId: string): Promise<unknown> {
  return adminJson(`/api/attempts/${attemptId}/release`, { method: "POST" });
}

export async function getAttemptForGrader(attemptId: string): Promise<unknown> {
  return adminJson(`/api/attempts/${attemptId}/for-grader`, { method: "GET" });
}

// ── Violation API ─────────────────────────────────────────────────────────────────

export async function recordViolation(attemptId: string, reason: string): Promise<void> {
  await adminJson(`/api/exams/attempts/${attemptId}/violations`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

/** Called by teacher when monitoring active exams or from grading modal */
export async function getViolations(attemptId: string): Promise<Violation[]> {
  return adminJson<Violation[]>(`/api/exams/attempts/${attemptId}/violations`, { method: "GET" });
}

export async function controlExamAttempt(
  attemptId: string,
  action: "force_submit" | "warn",
  message?: string,
): Promise<{ success: boolean }> {
  return adminJson<{ success: boolean }>(`/api/exams/attempts/${attemptId}/control`, {
    method: "POST",
    body: JSON.stringify({ action, message }),
  });
}

// ── Notifications API ─────────────────────────────────────────────────────────────

export async function listNotifications(unreadOnly = false): Promise<BackendNotification[]> {
  const q = unreadOnly ? "?unreadOnly=true" : "";
  return adminJson<BackendNotification[]>(`/api/notifications${q}`, { method: "GET" });
}

export async function markNotificationRead(id: string): Promise<unknown> {
  return adminJson(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<unknown> {
  return adminJson("/api/notifications/read-all", { method: "POST" });
}

// ── Student Exam Flow API ─────────────────────────────────────────────────────

/** Returned when a student starts or resumes an attempt */
export type AttemptHandle = {
  id: string;
  examId: string;
  studentId: string;
  startedAt: string;
  submittedAt: string | null;
  answersJson: string | null;
  score: number | null;
};

/** Question as seen by a student (no answer key) */
export type ExamQuestionForStudent = {
  id: string;
  type: string;
  stem: string;
  optionsJson: string | null;
  orderIndex: number;
  points: number;
};

/** Result returned after release */
export type AttemptResult = {
  attemptId: string;
  examId: string;
  examTitle: string;
  score: number | null;
  maxPoints: number;
  submittedAt: string;
  releasedAt: string | null;
  violations: Violation[];
  questions: {
    id: string;
    stem: string;
    type: string;
    optionsJson: string | null;
    answerKey: string | null;
    studentAnswer: string | null;
    points: number;
    orderIndex: number;
  }[];
};

/** Start or resume an attempt for the current student */
export async function startExamAttempt(examId: string): Promise<AttemptHandle> {
  return adminJson<AttemptHandle>(`/api/exams/${examId}/attempts`, { method: "POST" });
}

/** Fetch questions for an exam (student view — no answer keys) */
export async function getExamQuestions(examId: string): Promise<ExamQuestionForStudent[]> {
  return adminJson<ExamQuestionForStudent[]>(`/api/exams/${examId}/questions`, { method: "GET" });
}

/** Auto-save answers JSON blob */
export async function saveAttemptAnswers(attemptId: string, answersJson: string): Promise<unknown> {
  return adminJson(`/api/attempts/${attemptId}/answers`, {
    method: "POST",
    body: JSON.stringify({ answersJson }),
  });
}

/** Submit the attempt (locks it) */
export async function submitAttempt(attemptId: string): Promise<unknown> {
  return adminJson(`/api/attempts/${attemptId}/submit`, { method: "POST" });
}

/** Get released result for the student */
export async function getAttemptResult(attemptId: string): Promise<AttemptResult> {
  return adminJson<AttemptResult>(`/api/attempts/${attemptId}/result`, { method: "GET" });
}

/** List exams visible to the current student for a given academic year */
export async function listStudentExams(academicYearId: string): Promise<Exam[]> {
  return adminJson<Exam[]>(`/api/exams?academicYearId=${academicYearId}`, { method: "GET" });
}
