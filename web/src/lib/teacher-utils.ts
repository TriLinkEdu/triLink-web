import { type ClassOffering } from "./admin-api";

export function normSub(s: string) {
    return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Match class/API subject label to teacher profile (e.g. English vs English Language). */
export function subjectNameMatchesProfile(offeringOrQuestionName: string, profileSubject: string) {
    const a = normSub(offeringOrQuestionName);
    const b = normSub(profileSubject);
    if (!a || !b) return false;
    if (a === b) return true;
    return a.includes(b) || b.includes(a);
}

/**
 * Class offerings filtered to those matching the teacher's profile subject.
 * FOR STRICT SBAC: Returns an empty list if the profile has no subject.
 */
export function filterOfferingsBySubject(offerings: ClassOffering[], profileSubject: string | undefined | null) {
    if (!profileSubject?.trim()) return [];
    return offerings.filter((o) => {
        const name = o.subjectName || (o as any).subject?.name || "";
        return subjectNameMatchesProfile(name, profileSubject);
    });
}
