export function pct(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`;
}

export function fmtN(n: number) {
  return new Intl.NumberFormat("ja-JP").format(n);
}

export function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
