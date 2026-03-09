// Safety guard for Next.js/Turbopack bug: codeFrameColumns passes -1 to
// String.repeat when formatting issues from files with invalid source positions.
export function register() {
    const original = String.prototype.repeat;
    String.prototype.repeat = function (count: number) {
        if (count < 0) return "";
        return original.call(this, count);
    };
}
