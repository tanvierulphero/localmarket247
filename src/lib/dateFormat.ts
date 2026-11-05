/**
 * Formats any date string or Date object into Day > Month > Year (DD/MM/YYYY) format.
 * Examples:
 * - "2026-11-05" -> "05/11/2026"
 * - "2026-10-02T16:22:55.493Z" -> "02/10/2026"
 * - "05/11/2026" -> "05/11/2026"
 */
export function formatDateDMY(
  dateInput?: string | Date | null,
  fallback: string = ''
): string {
  if (!dateInput) return fallback;

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return fallback;
    const dd = String(dateInput.getDate()).padStart(2, '0');
    const mm = String(dateInput.getMonth() + 1).padStart(2, '0');
    const yyyy = dateInput.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  const raw = String(dateInput).trim();
  if (!raw || raw === '--' || raw === '-') return raw || fallback;

  // Match YYYY-MM-DD or YYYY/MM/DD (with optional time suffix)
  const isoMatch = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const yyyy = isoMatch[1];
    const mm = isoMatch[2].padStart(2, '0');
    const dd = isoMatch[3].padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
  }

  // Match DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const first = parseInt(dmyMatch[1], 10);
    const second = parseInt(dmyMatch[2], 10);
    const yyyy = dmyMatch[3];
    // If first > 12, it is definitely DD/MM/YYYY
    if (first > 12) {
      return `${String(first).padStart(2, '0')}/${String(second).padStart(2, '0')}/${yyyy}`;
    }
    // If second > 12, it was MM/DD/YYYY -> convert to DD/MM/YYYY
    if (second > 12) {
      return `${String(second).padStart(2, '0')}/${String(first).padStart(2, '0')}/${yyyy}`;
    }
    return `${String(first).padStart(2, '0')}/${String(second).padStart(2, '0')}/${yyyy}`;
  }

  // Fallback to Date parsing
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    const dd = String(parsed.getDate()).padStart(2, '0');
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const yyyy = parsed.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  return raw;
}
