import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface QuestionResult {
    id: number;
    order: number;
    type: "mcq" | "truefalse" | "fillin";
    text: string;
    options?: string[];
    correctAnswer: string;
    studentAnswer: string;
}

export interface SubmittedExamResult {
    examId: number;
    examTitle: string;
    examCourse: string;
    examType: string;
    totalQuestions: number;
    timeSpent: number;
    tabViolations: number;
    questions: QuestionResult[];
}

export interface TeacherGrade {
    studentName: string;
    quizTitle: string;
    subject: string;
    score: number;
    grade: string;
    comment: string;
    sentAt: string;
    assessments?: { id: number; name: string; type: string; maxMark: number; result: number }[];
}

export interface PublishedExamQuestion {
    id: number;
    order: number;
    type: "mcq";
    text: string;
    options: string[];
    correctAnswer: string;
}

export interface PublishedExam {
    id: number;
    course: string;
    type: "Quiz" | "Test" | "Midterm" | "Final";
    title: string;
    classGroup: string;
    duration: number;
    totalQuestions: number;
    mode: "published" | "scheduled";
    opensAt: string;
    publishedAt: string;
    questions: PublishedExamQuestion[];
}

export interface CompletedExam {
    examId: number;
    score: number;
    completedAt: string;
}

interface ExamStore {
    result: SubmittedExamResult | null;
    setResult: (result: SubmittedExamResult) => void;
    clearResult: () => void;
    teacherGrades: TeacherGrade[];
    sendGrade: (g: TeacherGrade) => void;
    publishedExams: PublishedExam[];
    publishExam: (exam: PublishedExam) => void;
    completedExams: CompletedExam[];
    markExamCompleted: (payload: CompletedExam) => void;
}

export const useExamStore = create<ExamStore>()(
    persist(
        (set) => ({
            result: null,
            setResult: (result) => set({ result }),
            clearResult: () => set({ result: null }),
            teacherGrades: [],
            sendGrade: (g) => set(s => ({
                teacherGrades: [
                    ...s.teacherGrades.filter(x => !(x.studentName === g.studentName && x.quizTitle === g.quizTitle)),
                    g,
                ],
            })),
            publishedExams: [],
            publishExam: (exam) =>
                set((s) => ({
                    publishedExams: [
                        exam,
                        ...s.publishedExams.filter((x) => !(x.title === exam.title && x.classGroup === exam.classGroup)),
                    ],
                })),
            completedExams: [],
            markExamCompleted: (payload) =>
                set((s) => ({
                    completedExams: [
                        payload,
                        ...s.completedExams.filter((x) => x.examId !== payload.examId),
                    ],
                })),
        }),
        { name: "trilink-exam-v1" }
    )
);
