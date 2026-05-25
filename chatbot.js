// =====================================
// IMPORTAÇÕES
// =====================================
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

// =====================================
// CONFIGURAÇÃO DO CLIENTE
// =====================================
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "./.wwebjs_auth",
  }),

  puppeteer: {
    headless: true,

    // Compatível com nuvem
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,

    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  },
});

// =====================================
// CONTROLE DE ESTADOS (MEMÓRIA DO ROBÔ)
// =====================================
const emSuporte = new Set();
const jaRecebeuMenu = new Map();
const EXPIRACAO_MENU = 24 * 60 * 60 * 1000; // 24 horas

// =====================================
// EVENTOS DE CONEXÃO
// =====================================
client.on("qr", (qr) => {
  console.log("📲 Escaneie o QR Code abaixo:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ WhatsApp conectado com sucesso!");
});

client.on("authenticated", () => {
  console.log("🔐 Sessão autenticada!");
});

client.on("auth_failure", (msg) => {
  console.log("❌ Falha na autenticação:", msg);
});

// =====================================
// RECONEXÃO AUTOMÁTICA
// =====================================
client.on("disconnected", async (reason) => {
  console.log("⚠️ WhatsApp desconectado:", reason);

  try {
    await client.destroy();

    console.log("🔄 Tentando reconectar em 5 segundos...");

    setTimeout(() => {
      client.initialize();
    }, 5000);

  } catch (err) {
    console.error("❌ Erro ao reconectar:", err);
  }
});

// =====================================
// INICIALIZAÇÃO
// =====================================
client.initialize();

// =====================================
// FUNÇÕES AUXILIARES
// =====================================
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// =====================================
// FUNIL DE MENSAGENS PRINCIPAL
// =====================================
client.on("message_create", async (msg) => {
  try {

    // =====================================
    // IDENTIFICA O USUÁRIO
    // =====================================
    const usuarioId = msg.fromMe ? msg.to : msg.from;

    if (!usuarioId) return;
    if (usuarioId.endsWith("@g.us")) return;
    if (usuarioId === "status@broadcast") return;

    const chat = await msg.getChat();

    if (chat.isGroup) return;

    const texto = msg.body
      ? msg.body.trim().toLowerCase()
      : "";

    console.log(
      `📩 Conversa: ${usuarioId} | Texto: "${texto}" | emSuporte: ${emSuporte.has(usuarioId)} | fromMe: ${msg.fromMe}`
    );

    // =====================================
    // VOCÊ FINALIZOU O ATENDIMENTO
    // =====================================
    if (msg.fromMe) {

      if (
        emSuporte.has(usuarioId) &&
        (texto === "#fechar" || texto === "finalizar")
      ) {

        emSuporte.delete(usuarioId);
        jaRecebeuMenu.delete(usuarioId);

        await chat.sendStateTyping();

        await delay(1000);

        await client.sendMessage(
          usuarioId,
          "🏁 *Atendimento encerrado!* O assistente virtual foi reativado."
        );

        console.log(`🤖 Bot reativado pelo atendente: ${usuarioId}`);
      }

      return;
    }

    // =====================================
    // SUPORTE HUMANO ATIVO
    // =====================================
    if (emSuporte.has(usuarioId)) {

      if (
        texto === "#fechar" ||
        texto === "finalizar"
      ) {

        emSuporte.delete(usuarioId);
        jaRecebeuMenu.delete(usuarioId);

        await chat.sendStateTyping();

        await delay(1000);

        await client.sendMessage(
          usuarioId,
          "🏁 *Atendimento encerrado com sucesso!* O assistente virtual foi reativado."
        );

        console.log(`🤖 Bot reativado pelo cliente: ${usuarioId}`);
      }

      return;
    }

    // =====================================
    // SIMULA DIGITAÇÃO
    // =====================================
    const typing = async (tempo = 2000) => {
      await chat.sendStateTyping();
      await delay(tempo);
    };

    // =====================================
    // MENU AUTOMÁTICO
    // =====================================
    const visto = jaRecebeuMenu.get(usuarioId);

    const expirou =
      !visto ||
      Date.now() - visto > EXPIRACAO_MENU;

    const pediuMenu =
      texto === "menu" ||
      texto === "inicio" ||
      texto === "início";

    if (expirou || pediuMenu) {

      jaRecebeuMenu.set(usuarioId, Date.now());

      await typing(1500);

      const hora = new Date().getHours();

      let saudacao = "Olá";

      if (hora >= 5 && hora < 12) {
        saudacao = "Bom dia";
      } else if (hora >= 12 && hora < 18) {
        saudacao = "Boa tarde";
      } else {
        saudacao = "Boa noite";
      }

      await client.sendMessage(
        usuarioId,
`${saudacao}! Bem-vindo à *Joypad Games* 🕹️🎮

Eu sou o assistente virtual da loja.

Escolha uma opção digitando o número correspondente:

1️⃣ - Catálogo PlayStation 3 🟦
2️⃣ - Catálogo PlayStation 4 🟦
3️⃣ - Catálogo PlayStation 5 🟦
4️⃣ - Catálogo Xbox (One / Series) 🟩
5️⃣ - Catálogo PC Steam Offline 💻
6️⃣ - Suporte Técnico 🛠️
7️⃣ - Grupo de Promoções 🔥

_*Digite "Menu" a qualquer momento para voltar aqui.*_`
      );

      return;
    }

    // =====================================
    // PLAYSTATION 3
    // =====================================
    if (texto === "1" || texto === "ps3") {

      await typing(1500);

      await client.sendMessage(
        usuarioId,
`🎮 *Jogos de PS3 disponíveis - Joypad Games* 🟦

🌐 https://joypad.com.br/categoria/todos-os-produtos/playstation3/

_Digite "Menu" para voltar._`
      );

      return;
    }

    // =====================================
    // PLAYSTATION 4
    // =====================================
    if (texto === "2" || texto === "ps4") {

      await typing(1500);

      await client.sendMessage(
        usuarioId,
`🎮 *Jogos de PS4 disponíveis - Joypad Games* 🟦

🌐 https://joypad.com.br/categoria/todos-os-produtos/playstation4/

_Digite "Menu" para voltar._`
      );

      return;
    }

    // =====================================
    // PLAYSTATION 5
    // =====================================
    if (texto === "3" || texto === "ps5") {

      await typing(1500);

      await client.sendMessage(
        usuarioId,
`🎮 *Jogos de PS5 disponíveis - Joypad Games* 🟦

🌐 https://joypad.com.br/categoria/todos-os-produtos/playstation5/

_Digite "Menu" para voltar._`
      );

      return;
    }

    // =====================================
    // XBOX
    // =====================================
    if (texto === "4") {

      await typing(2000);

      await client.sendMessage(
        usuarioId,
`🟩 *Catálogo Xbox - Joypad Games*

Veja nossos jogos e preços atualizados:

🌐 https://joypad.com.br/categoria/todos-os-produtos/xbox/

_Digite "Menu" para voltar._`
      );

      return;
    }

    // =====================================
    // PC STEAM
    // =====================================
    if (texto === "5") {

      await typing(2500);

      await client.sendMessage(
        usuarioId,
`💻 *PC Steam Offline - Joypad Games*

Jogue lançamentos de PC pagando muito menos.

📌 Como funciona?
Você recebe acesso à conta Steam com o jogo já comprado, instala normalmente e joga em modo offline.

🌐 Veja os jogos disponíveis:
https://joypad.com.br/categoria/todos-os-produtos/pc-steam-offline/

_Digite "Menu" para voltar._`
      );

      return;
    }

    // =====================================
    // SUPORTE
    // =====================================
    if (texto === "6") {

      emSuporte.add(usuarioId);

      await typing(2000);

      await client.sendMessage(
        usuarioId,
`🛠️ *Suporte Técnico - Joypad Games*

O robô foi pausado.

Para agilizar o atendimento, envie:

1️⃣ Seu console
2️⃣ Foto ou número do erro
3️⃣ Nome do jogo

Nossa equipe já foi notificada 👍`
      );

      console.log(`⚠️ Suporte ativado para: ${usuarioId}`);

      return;
    }

    // =====================================
    // GRUPO
    // =====================================
    if (texto === "7") {

      await typing(1500);

      await client.sendMessage(
        usuarioId,
`🔥 *Grupo Oficial Joypad Games* 🔥

Entre no grupo para receber:

🎮 Promoções
🆕 Lançamentos
💸 Jogos baratos
🎁 Sorteios

👉 ENTRE AGORA:
https://chat.whatsapp.com/G9AKnxEMpsaEBWjKinE27Q`
      );

      return;
    }

    // =====================================
    // OPÇÃO INVÁLIDA
    // =====================================
    await typing(1000);

    await client.sendMessage(
      usuarioId,
`❌ Opção inválida.

Digite *Menu* para voltar às opções.`
    );

  } catch (error) {

    console.error("❌ Erro no fluxo:", error);

  }
});