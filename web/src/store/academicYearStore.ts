import { create } from "zustand";
import { persist } from "zustand/middleware";

export const ACADEMIC_YEARS = [
    "2021/2022",
    "2022/2023",
    "2023/2024",
    "2024/2025"
];

interface AcademicYearStore {
    years: string[];
    currentSystemYear: string;
    adminSelectedYear: string;
    setAdminSelectedYear: (year: string) => void;
    setCurrentSystemYear: (year: string) => void;
    addYear: (year: string) => void;
}

export const useAcademicYearStore = create<AcademicYearStore>()(
    persist(
        (set) => ({
            years: ACADEMIC_YEARS,
            currentSystemYear: "2024/2025",
            adminSelectedYear: "2024/2025",
            
            setAdminSelectedYear: (year) => set({ adminSelectedYear: year }),
            setCurrentSystemYear: (year) => set((state) => ({ 
                currentSystemYear: year, 
                // Optionally move admin to the new year as well to avoid confusion
                adminSelectedYear: year 
            })),
            addYear: (year) => set((state) => {
                if (state.years.includes(year)) return state;
                return { years: [...state.years, year] };
            }),
        }),
        { name: "trilink-academic-year-v1" }
    )
);