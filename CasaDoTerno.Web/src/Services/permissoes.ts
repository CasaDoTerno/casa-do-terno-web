export function ehAdmin(): boolean {
  return localStorage.getItem("papel") === "Admin";
}