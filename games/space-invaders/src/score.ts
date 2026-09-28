/** Formats a score with four digits, like the original display: 120 becomes "0120". */
export const formatScore = (score: number): string => String(score).padStart(4, '0');
