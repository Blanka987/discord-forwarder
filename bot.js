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

function extractTextFromEmbed(embed) {
  let out = "";

  if (!embed) return out;

  if (embed.title) out += `Title: ${embed.title}\n`;
  if (embed.author && embed.author.name) out += `Author: ${embed.author.name}\n`;
  if (embed.description) out += embed.description + "\n";

  if (embed.fields && embed.fields.length) {
    for (const f of embed.fields) {
      // Some embeds put useful data in name OR value or both
      if (f.name) out += `${f.name}: `;
      if (f.value) out += `${f.value}\n`;
    }
  }

  return out.trim();
}

function summarizeEmbeds(embeds) {
  // Create a short safe summary for logs (no long dumps)
  try {
    return embeds.map(e => {
      const title = e.title ? e.title : "<no-title>";
      const fieldCount = e.fields ? e.fields.length : 0;
      const descSample = e.description ? (e.description.length > 80 ? e.description.slice(0,80)+"…" : e.description) : "";
      return `${title} | fields:${fieldCount} | desc:${descSample}`;
    }).join(" || ");
  } catch (e) {
    return "<embed-summarize-error>";
  }
}

client.on("clientReady", () => {
  console.log(`Bot ready as ${client.user.tag}`);
});

client.on("messageCreate", async msg => {
  try {
    // ignore only our own messages
    if (msg.author?.id === client.user.id) return;

    const isWebhook = !!msg.webhookId;
    let combined = "";

    // 1) prefer explicit content if present
    if (msg.content && msg.content.trim()) {
      combined += msg.content.trim() + "\n";
    }

    // 2) collect from all embeds (robust)
    if (msg.embeds && msg.embeds.length) {
      // add a short summary to logs so we can debug format
      console.log("Embed summary:", summarizeEmbeds(msg.embeds));

      for (const e of msg.embeds) {
        const txt = extractTextFromEmbed(e);
        if (txt) combined += txt + "\n";
      }
    }

    // 3) as extra fallback: if attachments with text (rare), include their filenames
    if (!combined.trim() && msg.attachments && msg.attachments.size) {
      const names = Array.from(msg.attachments.values()).map(a => a.name || a.url).join(", ");
      combined = `Attachments: ${names}`;
    }

    if (!combined.trim()) {
      // nothing to forward; log for debugging if webhook
      if (isWebhook) {
        console.log("Webhook message had no extractable text. embed-sum:", summarizeEmbeds(msg.embeds || []));
      }
      return;
    }

    // Trim to something reasonable so we don't send huge payloads to Railway
    const payloadText = combined.trim();

    // send to Railway endpoint
    await axios.post(TARGET, { text: payloadText });
    console.log(`${isWebhook ? "Forwarded webhook" : "Forwarded user"} message:`, payloadText.slice(0, 240));
  } catch (err) {
    console.error("Forward error:", err && err.message ? err.message : err);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
