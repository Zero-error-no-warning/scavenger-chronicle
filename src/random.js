export function random(state) {
  let x = state.rng >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  state.rng = x >>> 0;
  return state.rng / 4294967296;
}
export const pick = (state, values) => values[Math.floor(random(state) * values.length)];
export function shuffled(state, values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random(state) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export const round = n => Math.round(n * 10) / 10;
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
