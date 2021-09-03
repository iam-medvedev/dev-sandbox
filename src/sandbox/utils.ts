export function debounce<T extends Function>(cb: T, wait = 100) {
  let h = 0;
  let callable = (...args: any) => {
    window.clearTimeout(h);
    h = window.setTimeout(() => cb(...args), wait);
  };
  return <T>(<any>callable);
}
