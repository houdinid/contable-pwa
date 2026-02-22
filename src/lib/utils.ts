export function toTitleCase(str: string): string {
    if (!str) return "";
    return str
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
}

export function cleanEmail(str: string): string {
    if (!str) return "";
    return str.toLowerCase().replace(/\s+/g, "").trim();
}

export function cleanText(str: string): string {
    if (!str) return "";
    return str.replace(/\s+/g, " ").trim();
}

export function toLowerCaseAll(str: string): string {
    if (!str) return "";
    return str.toLowerCase().replace(/\s+/g, " ").trim();
}
