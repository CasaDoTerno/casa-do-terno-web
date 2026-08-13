export function ehAdmin(): boolean {
  return localStorage.getItem("papel") === "Admin";
}

export function temModulo(chave: string): boolean {
  const modulos = localStorage.getItem("modulosPermitidos") ?? "";
  return modulos.split(",").map((m) => m.trim()).includes(chave);
}