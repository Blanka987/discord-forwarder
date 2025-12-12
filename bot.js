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
  partials: [Partials.Channel, Partials.Message]
});

const TARGET = process.env.RAILWAY_URL;

client.on("clientReady", () => {
  console.log(`Bot ready as ${client.user.tag}`);
});

client.on("messageCreate", async msg => {
  try {
    // Ignore ONLY messages from THIS bot
    if (msg.author.id === client.user.id) return;

    // Detect webhook messages
    const isWebhook = msg.webhookId !== null;

    // You MUST FORWARD webhook messages, even if msg.author.bot = true
    if (isWebhook) {
      const text = msg.content || msg.embeds?.[0]?.description || "";
      if (text) {
        await axios.post(TARGET, { text });
        console.log("Forwarded webhook message:", text.substring(0, 200));
      }
      return;
    }

    // For user messages (optional)
    const text = msg.content || "";
    if (text) {
      await axios.post(TARGET, { text });
      console.log("Forwarded user message:", text.substring(0, 200));
    }

  } catch (err) {
    console.error("Forward error:", err.message);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
