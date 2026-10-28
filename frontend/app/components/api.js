export const API = "http://localhost:3000";

export async function lerResposta(resposta) {
  const texto = await resposta.text();

  if (!texto) return {};

  try {
    return JSON.parse(texto);
  } catch {
    return { mensagem: texto };
  }
}

export async function obterTokenCsrf() {
  const resposta = await fetch(`${API}/csrf-token`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const dados = await lerResposta(resposta);

  if (
    !resposta.ok ||
    typeof dados.csrfToken !== "string" ||
    !dados.csrfToken
  ) {
    throw new Error(
      dados.mensagem ||
        "Não foi possível obter o token de segurança."
    );
  }

  return dados.csrfToken;
}

export function extrairConta(resultado) {
  const conta =
    resultado?.usuario ??
    resultado?.user ??
    resultado?.conta ??
    resultado?.sessao?.user ??
    resultado?.dados?.usuario ??
    resultado?.data?.usuario ??
    resultado?.data?.user ??
    null;

  if (conta && typeof conta === "object") {
    return conta;
  }

  // Algumas APIs devolvem os dados do usuário diretamente.
  if (
    resultado &&
    typeof resultado === "object" &&
    [
      "id_usuario",
      "id",
      "login",
      "nome",
      "email",
      "username",
      "name",
    ].some((campo) => resultado[campo] != null)
  ) {
    return resultado;
  }

  return null;
}