function hasAllRequires(latest: any, requires: string[]) {
  if (!requires.length) return true;
  if (!latest) return false;
  return requires.every((k) => latest[k] !== undefined && latest[k] !== null);
}