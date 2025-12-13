import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== KONFIG =====
const REPORT_CHANNEL_ID = process.env.REPORT_CHANNEL_ID;
const DONATION_CHANNEL_ID = process.env.WEBHOOK_CHANNEL_ID;
const RAILWAY_URL = process.env.RAILWAY_URL;
const API_SECRET = process.env.API_SECRET;
// ==================

async function syncMembers(guild) {
  await guild.members.fetch();

  const members = guild.members.cache.map(m => ({
    id: m.user.id,
    name: m.displayName || m.user.username
  }));

  await fetch(`${RAILWAY_URL}/api/sync-members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-secret': API_SECRET
    },
    body: JSON.stringify({ members })
  });

  console.log(`👥 Synced ${members.length} members`);
}

// 🔹 BOT READY
client.once('clientReady', async () => {
  console.log(`🤖 Bot ready as ${client.user.tag}`);

  const channel = await client.channels.fetch(REPORT_CHANNEL_ID);
  await syncMembers(channel.guild);
});

// 🔹 NY MEDLEM GÅR MED I SERVERN
client.on('guildMemberAdd', async (member) => {
  console.log(`➕ New guild member: ${member.user.tag}`);
  await syncMembers(member.guild);
});

// 🔹 ROLLER ÄNDRAS (kanal-access)
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
    console.log(`🔁 Roles updated for ${newMember.user.tag}`);
    await syncMembers(newMember.guild);
  }
});

// 🔹 DONATION TRIGGER
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== DONATION_CHANNEL_ID) return;

  await fetch(`${RAILWAY_URL}/api/donation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-secret': API_SECRET
    },
    body: JSON.stringify({
      userId: message.author.id,
      content: message.content
    })
  });

  console.log(`💾 Donation received from ${message.author.tag}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
