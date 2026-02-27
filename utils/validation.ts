export function parsePositiveNumber(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(',', '.');
  const value = parseFloat(normalized);

  if (Number.isNaN(value) || value <= 0) {
    return null;
  }

  return value;
}

export function formatDateFr(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

