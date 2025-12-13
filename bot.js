import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const WEBHOOK_CHANNEL_ID = process.env.WEBHOOK_CHANNEL_ID;
const REPORT_CHANNEL_ID = process.env.REPORT_CHANNEL_ID;
const RAILWAY_URL = process.env.RAILWAY_URL;

client.once('ready', () => {
  console.log(`Bot ready as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  // Only listen to webhook channel
  if (message.channel.id !== WEBHOOK_CHANNEL_ID) return;

  // Ignore itself
  if (message.author?.bot && message.author.id === client.user.id) return;

  let payload = null;

  // Prefer embed text
  if (message.embeds.length > 0) {
    payload = {
      embeds: message.embeds.map(e => e.toJSON())
    };
  } else {
    payload = {
      text: message.content
    };
  }

  try {
    await axios.post(RAILWAY_URL, payload);
    console.log("✓ Sent webhook payload to Railway");
  } catch (err) {
    console.error("✗ Failed sending to Railway:", err.message);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
