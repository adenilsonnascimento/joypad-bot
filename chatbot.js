// =====================================
// IMPORTAÇÕES
// =====================================
const express = require("express");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

// =====================================
// SERVIDOR WEB PARA O FLY.IO
// =====================================
const app = express();

app.get("/", (req, res) => {
  res.send("🤖 Bot Joypad Games está online!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Servidor rodando na porta ${PORT}`);
});

// =====================================
// CONFIGURAÇÃO DO CLIENTE
// =====================================
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "./.wwebjs_auth",
  }),

  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-software-rasterizer",
      "--mute-audio",
      "--no-zygote",
      "--single-process",
    ],
  },
});

// =====================================
// CONTROLE DE ESTADOS
// =====================================
const emSuporte = new Set();
const jaRecebeuMenu = new Map();
const EXPIRACAO_MENU = 24 * 60 * 60 * 1000;

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

client.on("disconnected", async (reason) => {
  console.log("⚠️ WhatsApp desconectado:", reason);
  console.log("DICA: Se o problema persistir, apague a pasta .wwebjs_auth e reinicie o bot.");
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
// FUNIL PRINCIPAL
// =====================================
client.on("message_create", async (msg) => {
  try {
    const usuarioId = msg.fromMe ? msg.to : msg.from;
    if (!usuarioId || usuarioId.endsWith("@g.us") || usuarioId === "status@broadcast") return;

    const chat = await msg.getChat();
    if (chat.isGroup) return;

    const texto = msg.body ? msg.body.trim().toLowerCase() : "";

    console.log(`📩 Conversa: ${usuarioId} | Texto: "${texto}"`);

    // ENCERRAMENTO PELO ATENDENTE
    if (msg.fromMe) {
      if (emSuporte.has(usuarioId) && (texto === "#fechar" || texto === "finalizar")) {
        emSuporte.delete(usuarioId);
        jaRecebeuMenu.delete(usuarioId);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(usuarioId, "🏁 *Atendimento encerrado!* O assistente virtual foi reativado.");
      }
      return;
    }

    // SUPORTE HUMANO ATIVO
    if (emSuporte.has(usuarioId)) {
      if (texto === "#fechar" || texto === "finalizar") {
        emSuporte.delete(usuarioId);
        jaRecebeuMenu.delete(usuarioId);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(usuarioId, "🏁 *Atendimento encerrado com sucesso!* O assistente virtual foi reativado.");
      }
      return;
    }

    const typing = async (tempo = 2000) => {
      await chat.sendStateTyping();
      await delay(tempo);
    };

    // MENU AUTOMÁTICO
    const visto = jaRecebeuMenu.get(usuarioId);
    const expirou = !visto || Date.now() - visto > EXPIRACAO_MENU;
    const pediuMenu = texto === "menu" || texto === "inicio" || texto === "início";

    if (expirou || pediuMenu) {
      jaRecebeuMenu.set(usuarioId, Date.now());
      await typing(1500);
      const hora = new Date().getHours();
      let saudacao = (hora >= 5 && hora < 12) ? "Bom dia" : (hora >= 12 && hora < 18) ? "Boa tarde" : "Boa noite";

      await client.sendMessage(usuarioId, 
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

_*Digite "Menu" a qualquer momento para voltar aqui.*_`);
      return;
    }

    // OPÇÕES DO MENU
    if (texto === "1" || texto === "ps3") {
      await typing(1500);
      await client.sendMessage(usuarioId, "🎮 *Jogos de PS3:* https://joypad.com.br/categoria/todos-os-produtos/playstation3/" );
      return;
    }

    if (texto === "2" || texto === "ps4") {
      await typing(1500);
      await client.sendMessage(usuarioId, "🎮 *Jogos de PS4:* https://joypad.com.br/categoria/todos-os-produtos/playstation4/" );
      return;
    }

    if (texto === "3" || texto === "ps5") {
      await typing(1500);
      await client.sendMessage(usuarioId, "🎮 *Jogos de PS5:* https://joypad.com.br/categoria/todos-os-produtos/playstation5/" );
      return;
    }

    if (texto === "4") {
      await typing(2000);
      await client.sendMessage(usuarioId, "🟩 *Catálogo Xbox:* https://joypad.com.br/categoria/todos-os-produtos/xbox/" );
      return;
    }

    if (texto === "5") {
      await typing(2500);
      await client.sendMessage(usuarioId, "💻 *PC Steam Offline:* https://joypad.com.br/categoria/todos-os-produtos/pc-steam-offline/" );
      return;
    }

    if (texto === "6") {
      emSuporte.add(usuarioId);
      await typing(2000);
      await client.sendMessage(usuarioId, "🛠️ *Suporte Técnico:* O robô foi pausado. Envie seu console e o erro para nossa equipe.");
      return;
    }

    if (texto === "7") {
      await typing(1500);
      await client.sendMessage(usuarioId, "🔥 *Grupo Oficial:* https://chat.whatsapp.com/G9AKnxEMpsaEBWjKinE27Q" );
      return;
    }

    // OPÇÃO INVÁLIDA
    await typing(1000);
    await client.sendMessage(usuarioId, "❌ Opção inválida. Digite *Menu* para voltar.");

  } catch (error) {
    console.error("❌ Erro no fluxo:", error);
  }
});
