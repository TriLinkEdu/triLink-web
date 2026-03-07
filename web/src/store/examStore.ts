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

interface ExamStore {
    result: SubmittedExamResult | null;
    setResult: (result: SubmittedExamResult) => void;
    clearResult: () => void;
}

export const useExamStore = create<ExamStore>((set) => ({
    result: null,
    setResult: (result) => set({ result }),
    clearResult: () => set({ result: null }),
}));
