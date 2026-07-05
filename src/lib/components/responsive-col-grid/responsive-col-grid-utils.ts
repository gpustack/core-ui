export function colSpanFromColumns(columns: number | undefined): number {
  if (!columns || columns < 1) {
    return 24;
  }
  return Math.floor(24 / columns);
}
