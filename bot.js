import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const REPORT_CHANNEL_ID = process.env.REPORT_CHANNEL_ID;
const RAILWAY_URL = process.env.RAILWAY_URL;
const API_SECRET = process.env.API_SECRET;

let dashboardMessageId = null;

async function fetchDashboard() {
  const res = await fetch(`${RAILWAY_URL}/api/dashboard`, {
    headers: { 'x-api-secret': API_SECRET }
  });
  return res.json();
}

function buildEmbed(data) {
  const lines = data
    .sort((a, b) => b.thisWeek - a.thisWeek)
    .map(m =>
      `**${m.name}** — ${m.thisWeek.toFixed(2)} (prev ${m.previousWeek.toFixed(2)})`
    );

  return new EmbedBuilder()
    .setTitle('📊 Camp Materials — Weekly Summary')
    .setDescription(lines.join('\n') || 'No data')
    .setColor(0x2ecc71)
    .setTimestamp();
}

client.once('clientReady', async () => {
  console.log(`🤖 Bot ready as ${client.user.tag}`);

  const channel = await client.channels.fetch(REPORT_CHANNEL_ID);
  const data = await fetchDashboard();
  const embed = buildEmbed(data);

  const msg = await channel.send({ embeds: [embed] });
  dashboardMessageId = msg.id;

  console.log('📌 Dashboard created');
});

// Update dashboard every 30s (and after donations later)
setInterval(async () => {
  if (!dashboardMessageId) return;

  const channel = await client.channels.fetch(REPORT_CHANNEL_ID);
  const msg = await channel.messages.fetch(dashboardMessageId);
  const data = await fetchDashboard();
  const embed = buildEmbed(data);

  await msg.edit({ embeds: [embed] });
  console.log('🔄 Dashboard updated');
}, 30_000);

client.login(process.env.DISCORD_BOT_TOKEN);
