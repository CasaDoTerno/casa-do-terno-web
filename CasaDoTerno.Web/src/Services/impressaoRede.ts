const ESC = String.fromCharCode(0x1B);

export function negrito(texto: string): string {
  return `${ESC}\x45\x01${texto}${ESC}\x45\x00`;
}

export function centralizado(texto: string): string {
  return `${ESC}\x61\x01${texto}\n${ESC}\x61\x00`;
}

export function negritoCentralizado(texto: string): string {
  return `${ESC}\x61\x01${ESC}\x45\x01${texto}${ESC}\x45\x00${ESC}\x61\x00\n`;
}

export async function imprimirNaRede(texto: string): Promise<{ sucesso: boolean; mensagem: string }> {
  const ip = localStorage.getItem("ipPonteImpressao");

  if (!ip) {
    return { sucesso: false, mensagem: "Configure o IP da impressora primeiro, em 'Config. Impressora'." };
  }

  try {
    const resposta = await fetch(`https://${ip}:5005/imprimir`, {
      method: "POST",
      body: texto,
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