export interface LinhaImpressao {
  texto: string;
  negrito?: boolean;
  centralizado?: boolean;
}

function textoParaBytes(texto: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < texto.length; i++) {
    bytes.push(texto.charCodeAt(i) & 0xff);
  }
  return bytes;
}

export function montarBytesImpressao(linhas: (string | LinhaImpressao)[]): Uint8Array {
  const bytes: number[] = [];

  // ESC @ — inicializa a impressora
  bytes.push(0x1b, 0x40);

  for (const linha of linhas) {
    const item: LinhaImpressao = typeof linha === "string" ? { texto: linha } : linha;

    if (item.centralizado) bytes.push(0x1b, 0x61, 0x01); // ESC a 1 — centraliza
    if (item.negrito) bytes.push(0x1b, 0x45, 0x01); // ESC E 1 — negrito ligado

    bytes.push(...textoParaBytes(item.texto));

    if (item.negrito) bytes.push(0x1b, 0x45, 0x00); // ESC E 0 — negrito desligado
    if (item.centralizado) bytes.push(0x1b, 0x61, 0x00); // ESC a 0 — volta pra esquerda

    bytes.push(0x0a); // \n — quebra de linha
  }

  bytes.push(0x1b, 0x64, 0x04); // ESC d 4 — avança 4 linhas (espaço extra pra rasgar com folga)

  return new Uint8Array(bytes);
}

export async function imprimirNaRede(bytes: Uint8Array): Promise<{ sucesso: boolean; mensagem: string }> {
  const ip = localStorage.getItem("ipPonteImpressao");

  if (!ip) {
    return { sucesso: false, mensagem: "Configure o IP da impressora primeiro, em 'Config. Impressora'." };
  }

  try {
const resposta = await fetch(`https://${ip}:5005/imprimir`, {
  method: "POST",
  headers: { "Content-Type": "application/octet-stream" },
  body: new Blob([bytes as unknown as ArrayBuffer]),
    });

    if (!resposta.ok) {
      const erro = await resposta.text();
      return { sucesso: false, mensagem: `Erro ao imprimir: ${erro}` };
    }

    return { sucesso: true, mensagem: "Enviado para a impressora com sucesso!" };
  } catch (erro) {
    console.error(erro);
    return { sucesso: false, mensagem: "Não foi possível conectar na impressora. Confirme se a Ponte está rodando." };
  }
}