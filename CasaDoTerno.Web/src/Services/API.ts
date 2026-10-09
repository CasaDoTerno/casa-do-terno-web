import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// As rotas /login e /refresh ficam na raiz do servidor, sem o "/api"
const URL_RAIZ = String(import.meta.env.VITE_API_URL).replace("/api", "");

// Só estas chaves pertencem à sessão. NÃO apague o resto do localStorage:
// o "ipPonteImpressao" (impressora) precisa sobreviver ao logout.
const CHAVES_SESSAO = [
  "token",
  "refreshToken",
  "emailUsuario",
  "papel",
  "modulosPermitidos",
];

export function limparSessao() {
  CHAVES_SESSAO.forEach((chave) => localStorage.removeItem(chave));
}

function encerrarSessao(aviso: string) {
  limparSessao();
  try {
    sessionStorage.setItem("avisoLogin", aviso);
  } catch {
    // sem sessionStorage, só não mostra o aviso
  }
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Se várias telas levarem 401 ao mesmo tempo, só UMA renovação acontece.
let renovando: Promise<string> | null = null;

async function renovarToken(): Promise<string> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("sem refresh token");

  // axios "puro" de propósito: não passa pelo interceptor, então não entra em loop
  const resposta = await axios.post(`${URL_RAIZ}/refresh`, { refreshToken });

  localStorage.setItem("token", resposta.data.accessToken);
  if (resposta.data.refreshToken) {
    localStorage.setItem("refreshToken", resposta.data.refreshToken);
  }
  return resposta.data.accessToken;
}

api.interceptors.response.use(
  (resposta) => resposta,
  async (erro) => {
    const original = erro.config;
    const status = erro.response?.status;

    // só reage a 401 de requisições normais, e só tenta uma vez por requisição
    const ehRotaDeLogin = String(original?.url ?? "").includes("/login");
    if (status !== 401 || !original || original._tentouRenovar || ehRotaDeLogin) {
      return Promise.reject(erro);
    }
    original._tentouRenovar = true;

    try {
      if (!renovando) {
        renovando = renovarToken().finally(() => {
          renovando = null;
        });
      }
      const novoToken = await renovando;
      original.headers.Authorization = `Bearer ${novoToken}`;
      return api(original); // refaz a requisição que tinha falhado
    } catch {
      encerrarSessao("Sua sessão expirou. Entre de novo.");
      return Promise.reject(erro);
    }
  }
);

export default api;