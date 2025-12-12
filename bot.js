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
    // Ignore bot messages from THIS bot only
    if (msg.author?.id === client.user.id) return;

    // Detect webhook messages
    const isWebhook = msg.webhookId !== null;

    let extractedText = "";

    // 1. If webhook AND no content → extract text from embed fields
    if (isWebhook) {
      if (msg.embeds.length > 0) {
        const embed = msg.embeds[0];

        // Description first (if exists)
        if (embed.description) {
          extractedText += embed.description + "\n";
        }

        // Then fields
        if (embed.fields && embed.fields.length > 0) {
          for (const field of embed.fields) {
            extractedText += `${field.name}: ${field.value}\n`;
          }
        }
      }

      // As fallback try normal content
      if (!extractedText && msg.content) {
        extractedText = msg.content;
      }

      if (extractedText.trim()) {
        await axios.post(TARGET, { text: extractedText.trim() });
        console.log("Forwarded webhook message:", extractedText.substring(0, 200));
      } else {
        console.log("Webhook message was empty — nothing forwarded.");
      }

      return;
    }

    // 2. Normal user message fallback
    if (msg.content) {
      await axios.post(TARGET, { text: msg.content });
      console.log("Forwarded user message:", msg.content.substring(0, 200));
    }

  } catch (err) {
    console.error("Forward error:", err.message);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
