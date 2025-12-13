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

    // Ladda alla guild members (krävs)
    await guild.members.fetch();

    // 🔑 VIKTIGT: endast members som SER kanalen
    const membersWithAccess = guild.members.cache.filter(m => {
      if (m.user.bot) return false; // ❌ bort med bots
      return channel.permissionsFor(m)?.has('ViewChannel');
    });

    const members = membersWithAccess.map(m => ({
      id: m.user.id,
      name: m.displayName || m.user.username
    }));

    console.log(`👥 Found ${members.length} real members with access`);

    const res = await fetch(`${RAILWAY_URL}/api/sync-members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': API_SECRET
      },
      body: JSON.stringify({ members })
    });

    if (!res.ok) {
      console.error('❌ Sync failed:', res.status);
    } else {
      console.log(`✅ Synced ${members.length} members to Railway`);
    }

  } catch (err) {
    console.error('❌ Member sync failed:', err);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
