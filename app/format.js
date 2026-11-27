// Money and date formatting — one place, so every page prints the same.
export function money(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function money0(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}
export function pct(n) {
  return Math.round(n * 100) + '%';
}
export function shortDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
export function longDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
export function round2(n) {
  return Math.round(n * 100) / 100;
}
