# Admin web — 10 integration pillars (API-only, no static product data)

Admin features are **web-only**; this app talks to the Nest API with `authFetch` via `src/lib/admin-api.ts`.

1. **Auth & shell** — JWT in `localStorage`, `GET /api/auth/me` after login, admin layout redirects non-admins to `/admin/login`. Sidebar routes match live modules.

2. **Dashboard & analytics** — `GET /api/dashboard/admin` for user/class/enrollment counts; `GET /api/analytics/admin/summary` for feedback status mix, exams, attempts, 30-day attendance marks, announcements total. No placeholder KPIs.

3. **Academic year & class offerings** — `GET /api/academic-years` (+ optional `POST .../activate`) for year selection; `GET /api/grades|sections|subjects`, `GET /api/users?role=teacher`, CRUD on `GET/POST/PATCH/DELETE /api/class-offerings` aligned with backend DTOs.

4. **Enrollments (class detail)** — `GET/POST/DELETE /api/enrollments` with `academicYearId` consistency checks enforced by the API.

5. **Directory & registration** — `GET /api/users?role=student|teacher|parent`; `POST /api/auth/register` (admin JWT). Parents use **`linkedStudentId`** + `relationship` per backend validation.

6. **Parent links** — `GET/POST/DELETE /api/parent-students` for explicit links beyond registration-time linking.

7. **Announcements** — `GET/POST/DELETE /api/announcements` with `academicYearId`, `title`, `body`, `audience` string (e.g. `all`, `teachers`). No local-only “scheduled” store.

8. **Attendance** — `GET/POST /api/attendance-sessions`, `GET/PUT .../marks`, `GET /api/reports/attendance/class/:classOfferingId`. Admin picks a class offering, manages sessions and marks for enrolled students.

9. **Feedback & audit** — `GET/PATCH /api/feedback` for ticket workflow; `GET /api/audit-logs` for a read-only compliance view.

10. **Chat, profile, school settings** — `GET/POST /api/conversations` and messages endpoints; `GET/PATCH /api/users/:id` for admin self-profile; `GET/PATCH /api/school/settings` for institution JSON; `GET/PATCH /api/me/settings` for admin user preferences JSON.

**Out of scope for this pass:** WebSocket real-time chat (REST polling/list only), PDF export buttons without a backend export route, and mobile apps.
