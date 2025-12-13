// bot.js
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers // VIKTIG
  ]
});

const REPORT_CHANNEL_ID = '1448634638347145360';
const RAILWAY_SYNC_URL = `${process.env.RAILWAY_URL}/api/sync-members`;

client.once('ready', async () => {
  console.log(`Bot ready as ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(REPORT_CHANNEL_ID);
    const guild = channel.guild;

    await guild.members.fetch();

    const members = guild.members.cache.map(m => ({
      id: m.user.id,
      name: m.user.username
    }));

    await axios.post(RAILWAY_SYNC_URL, { members });
    console.log(`✅ Synced ${members.length} members to Railway`);
  } catch (err) {
    console.error('❌ Member sync failed:', err.message);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
