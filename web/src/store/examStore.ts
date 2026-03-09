import { create } from "zustand";

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

interface ExamStore {
    result: SubmittedExamResult | null;
    setResult: (result: SubmittedExamResult) => void;
    clearResult: () => void;
    teacherGrades: TeacherGrade[];
    sendGrade: (g: TeacherGrade) => void;
}

export const useExamStore = create<ExamStore>((set) => ({
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
}));
