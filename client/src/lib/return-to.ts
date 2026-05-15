const RETURN_TO_KEY = "pollinate:returnTo";

function canUseStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.sessionStorage !== "undefined"
  );
}

export function saveReturnTo(path: string) {
  if (!canUseStorage()) return;
  window.sessionStorage.setItem(RETURN_TO_KEY, path);
}

export function consumeReturnTo() {
  if (!canUseStorage()) return null;
  const path = window.sessionStorage.getItem(RETURN_TO_KEY);
  window.sessionStorage.removeItem(RETURN_TO_KEY);
  return path?.startsWith("/") ? path : null;
}
