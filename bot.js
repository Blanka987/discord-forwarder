import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const RAILWAY_URL = process.env.RAILWAY_URL;

client.on("ready", () => {
  console.log(`Bot ready as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {

  // Ignore only our own bot
  if (message.author.id === client.user.id) return;

  const plainText = message.content || "";
  const embeds = message.embeds || [];

  // Debug log
  console.log("BOT RECEIVED MESSAGE");
  console.log("Plain text:", plainText);
  if (embeds.length > 0) console.log("Embed title:", embeds[0].title);

  // Build the JSON payload for Railway
  const payload = {
    text: plainText,
    embeds: embeds.map(e => ({
      title: e.title || "",
      description: e.description || "",
      fields: e.fields || []
    }))
  };

  try {
    await axios.post(RAILWAY_URL, payload);
    console.log("✔ Sent to Railway");
  } catch (err) {
    console.error("❌ Failed sending:", err.message);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
