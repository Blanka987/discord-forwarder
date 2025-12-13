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

const RAILWAY_URL = process.env.RAILWAY_URL;
const API_SECRET = process.env.API_SECRET;

const MATERIALS_CHANNEL_ID = '1447999167312953536';

/**
 * Skicka alla medlemmar till Railway
 */
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
}

client.once('clientReady', async () => {
  console.log(`🤖 Bot ready as ${client.user.tag}`);

  const guild = client.guilds.cache.first();
  await syncMembers(guild);
});

/**
 * 👤 Medlem går med
 */
client.on('guildMemberAdd', async member => {
  await syncMembers(member.guild);
});

/**
 * 👤 Medlem lämnar
 */
client.on('guildMemberRemove', async member => {
  await syncMembers(member.guild);
});

/**
 * 💰 Donation via meddelande i materials-kanalen
 * (format kan justeras senare)
 */
client.on('messageCreate', async message => {
  if (message.channelId !== MATERIALS_CHANNEL_ID) return;
  if (message.author.bot) return;

  const amount = parseInt(message.content, 10);
  if (isNaN(amount)) return;

  await fetch(`${RAILWAY_URL}/api/donation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-secret': API_SECRET
    },
    body: JSON.stringify({
      userId: message.author.id,
      amount
    })
  });
});

client.login(process.env.DISCORD_BOT_TOKEN);
