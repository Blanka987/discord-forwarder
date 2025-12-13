import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const REPORT_CHANNEL_ID = process.env.REPORT_CHANNEL_ID;
const RAILWAY_URL = process.env.RAILWAY_URL;
const API_SECRET = process.env.API_SECRET;

client.once('clientReady', async () => {
  console.log(`🤖 Bot ready as ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(REPORT_CHANNEL_ID);
    const guild = channel.guild;

    await guild.members.fetch();

    const members = guild.members.cache
      .filter(m => !m.user.bot)
      .map(m => ({
        id: m.user.id,
        name: m.displayName || m.user.username
      }));

    const res = await fetch(`${RAILWAY_URL}/api/sync-members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': API_SECRET
      },
      body: JSON.stringify({ members })
    });

    if (!res.ok) {
      console.error('❌ Sync failed with status:', res.status);
    } else {
      console.log(`👥 Synced ${members.length} members to Railway`);
    }

  } catch (err) {
    console.error('❌ Member sync failed:', err.message);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
