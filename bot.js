import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== KONFIG =====
const DONATION_CHANNEL_ID = '1447999167312953536';
const RAILWAY_URL = process.env.RAILWAY_URL;
const API_SECRET = process.env.API_SECRET;
const SITTING_BILL_ID = client.user?.id;
// ==================

async function syncMembers(guild) {
  await guild.members.fetch();

  const members = guild.members.cache
    .filter(m => !m.user.bot)
    .map(m => ({
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

client.once('clientReady', async () => {
  console.log(`🤖 Bot ready as ${client.user.tag}`);
  const guild = client.guilds.cache.first();
  if (guild) await syncMembers(guild);
});

// 🔄 Ny medlem
client.on('guildMemberAdd', async member => {
  await syncMembers(member.guild);
});

// 📦 Donationer
client.on('messageCreate', async message => {
  if (message.channel.id !== DONATION_CHANNEL_ID) return;
  if (message.author.bot) return;

  await fetch(`${RAILWAY_URL}/api/new-donation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-secret': API_SECRET
    },
    body: JSON.stringify({
      content: message.content,
      timestamp: message.createdAt.toISOString()
    })
  });
});

client.login(process.env.DISCORD_BOT_TOKEN);
