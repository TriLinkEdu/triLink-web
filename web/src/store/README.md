# Store

Zustand global state stores for the TriLink app.

## Files

### `examStore.ts`
Holds the result of a completed exam session so it can be read by the result page after navigation.

**State:**
- `result: SubmittedExamResult | null` — populated when the student submits an exam
- `setResult(result)` — called by the exam session page just before navigating to `/student/result/[examId]`
- `clearResult()` — can be called to reset (e.g. on logout)

**Exported types:**
- `QuestionResult` — single question with correct + student answer
- `SubmittedExamResult` — full exam submission payload

## Status

| Item | Status |
|---|---|
| examStore — Zustand store created | ✅ Fixed |
| Connect exam session → result page via store | ✅ Fixed |
| Teacher real-time notification (WebSocket) | ⬜ Not yet (needs backend) |
