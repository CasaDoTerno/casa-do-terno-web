export interface LinhaImpressao {
  texto: string;
  negrito?: boolean;
  centralizado?: boolean;
}
export async function carregarLogoComoBytesEscPos(
  caminhoImagem: string,
  larguraPontos: number = 300
): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const alturaPontos = Math.round((img.height / img.width) * larguraPontos);

      const canvas = document.createElement("canvas");
      canvas.width = larguraPontos;
      canvas.height = alturaPontos;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Não foi possível criar o canvas."));
        return;
      }

      // fundo branco (importante se a logo tiver transparência)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, larguraPontos, alturaPontos);
      ctx.drawImage(img, 0, 0, larguraPontos, alturaPontos);

      const dados = ctx.getImageData(0, 0, larguraPontos, alturaPontos).data;

      const bytesPorLinha = Math.ceil(larguraPontos / 8);
      const bitmap: number[] = new Array(bytesPorLinha * alturaPontos).fill(0);

      for (let y = 0; y < alturaPontos; y++) {
        for (let x = 0; x < larguraPontos; x++) {
          const indice = (y * larguraPontos + x) * 4;
          const r = dados[indice];
          const g = dados[indice + 1];
          const b = dados[indice + 2];
          const luminancia = r * 0.299 + g * 0.587 + b * 0.114;
          const preto = luminancia < 128;

          if (preto) {
            const byteIndex = y * bytesPorLinha + Math.floor(x / 8);
            const bitIndex = 7 - (x % 8);
            bitmap[byteIndex] |= 1 << bitIndex;
          }
        }
      }

      const bytesPorLinhaL = bytesPorLinha & 0xff;
      const bytesPorLinhaH = (bytesPorLinha >> 8) & 0xff;
      const alturaL = alturaPontos & 0xff;
      const alturaH = (alturaPontos >> 8) & 0xff;

      // GS v 0 — comando de imagem raster: modo, largura(2 bytes), altura(2 bytes), dados
      const comando = [
        0x1d, 0x76, 0x30, 0x00,
        bytesPorLinhaL, bytesPorLinhaH,
        alturaL, alturaH,
        ...bitmap,
      ];
      resolve(comando);
    };

    img.onerror = () => reject(new Error("Não foi possível carregar a imagem do logo."));
    img.src = caminhoImagem;
  });
}


function textoParaBytes(texto: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < texto.length; i++) {
    bytes.push(texto.charCodeAt(i) & 0xff);
  }
  return bytes;
}

export async function montarBytesImpressao(
  linhas: (string | LinhaImpressao)[],
  incluirLogo: boolean = true
): Promise<Uint8Array> {
  const bytes: number[] = [];

  // ESC @ — inicializa a impressora
  bytes.push(0x1b, 0x40);

  if (incluirLogo) {
    try {
      const logoBytes = await carregarLogoComoBytesEscPos("../assets/logo.png", 300);
      bytes.push(0x1b, 0x61, 0x01); // centraliza
      bytes.push(...logoBytes);
      bytes.push(0x0a, 0x0a);
      bytes.push(0x1b, 0x61, 0x00); // volta pra esquerda
    } catch (erro) {
      console.error("Não foi possível carregar o logo, seguindo sem ela:", erro);
    }
  }

  for (const linha of linhas) {
    const item: LinhaImpressao = typeof linha === "string" ? { texto: linha } : linha;

    if (item.centralizado) bytes.push(0x1b, 0x61, 0x01); // ESC a 1 — centraliza
    if (item.negrito) bytes.push(0x1b, 0x45, 0x01); // ESC E 1 — negrito ligado

    bytes.push(...textoParaBytes(item.texto));

    if (item.negrito) bytes.push(0x1b, 0x45, 0x00); // ESC E 0 — negrito desligado
    if (item.centralizado) bytes.push(0x1b, 0x61, 0x00); // ESC a 0 — volta pra esquerda

    bytes.push(0x0a); // \n — quebra de linha
  }

  bytes.push(0x1b, 0x64, 0x12); // ESC d 1 — avança 1 linha
 

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