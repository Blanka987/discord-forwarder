import 'dotenv/config';
import fetch from 'node-fetch';
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ====== KONFIG ======
const OUTPUT_CHANNEL_ID = '1448634638347145360';
const RAILWAY_URL = process.env.RAILWAY_URL;
const API_SECRET = process.env.API_SECRET;
// ====================

client.once('clientReady', async () => {
  console.log(`🤖 Bot ready as ${client.user.tag}`);

  try {
    // Vänta lite så Discord är helt redo
    await new Promise(r => setTimeout(r, 3000));

    const channel = await client.channels.fetch(OUTPUT_CHANNEL_ID);
    const guild = channel.guild;

    await guild.members.fetch();

    const members = guild.members.cache.map(m => ({
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
    console.error('❌ Member sync failed:', err);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
