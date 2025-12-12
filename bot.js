import dotenv from "dotenv";
dotenv.config();

import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TARGET = process.env.RAILWAY_URL;

client.on("ready", () => {
  console.log(`Bot ready as ${client.user.tag}`);
});

client.on("messageCreate", async msg => {
  try {
    if (msg.author.bot) return;

    const text = msg.content || "";
    if (!text) return;

    await axios.post(TARGET, { text });
    console.log("Forwarded:", text.substring(0, 50));
  } catch (err) {
    console.log("Forward error:", err.message);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
