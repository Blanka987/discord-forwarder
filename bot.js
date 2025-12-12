import dotenv from "dotenv";
dotenv.config();

import { Client, GatewayIntentBits, Partials } from "discord.js";
import axios from "axios";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel] // Needed for webhook messages
});

const TARGET = process.env.RAILWAY_URL;

client.on("ready", () => {
  console.log(`Bot ready as ${client.user.tag}`);
});

client.on("messageCreate", async msg => {
  try {
    // Ignore messages from THIS bot (prevents loops)
    if (msg.author.bot && msg.author.id === client.user.id) return;

    // Accept webhook messages (msg.webhookId != null)
    const isWebhookMessage = !!msg.webhookId;

    // Only process:
    // - Webhook messages
    // - Normal user messages (but ONLY if needed)
    if (!isWebhookMessage && msg.author.bot) return;

    const text = msg.content || "";
    if (!text || !TARGET) return;

    await axios.post(TARGET, { text });

    console.log(
      `Forwarded${isWebhookMessage ? " webhook" : ""} message:`,
      text.substring(0, 80)
    );

  } catch (err) {
    console.error("Forward error:", err.message);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
