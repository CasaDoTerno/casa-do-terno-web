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