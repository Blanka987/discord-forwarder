// bot.js
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

const RAILWAY_URL = process.env.RAILWAY_URL; // e.g. https://syn-webhook-server-production.up.railway.app/syn-county
const ADMIN_SECRET = process.env.ADMIN_SECRET; // same secret as in Railway variables

client.on("ready", () => {
  console.log("Bot ready as", client.user.tag);
});

client.on("messageCreate", async (message) => {
  try {
    // ignore our own bot messages
    if (message.author && message.author.id === client.user.id) return;

    const content = message.content || "";
    const embeds = message.embeds || [];

    // If message is a command (prefix '!')
    if (content.startsWith("!")) {
      const parts = content.trim().split(/\s+/);
      const cmd = parts[0].toLowerCase();

      // !mystats
      if (cmd === "!mystats") {
        const id = message.author.id;
        try {
          const resp = await axios.get(`${RAILWAY_URL.replace(/\/syn-county\/?$/,'')}/stats/user/${id}`);
          const data = resp.data;
          await message.reply({
            embeds: [{
              title: "📊 Your donation stats",
              color: 0x3498db,
              fields: [
                { name: "This week", value: `${data.thisWeek}`, inline: true },
                { name: "Previous week", value: `${data.previousWeek}`, inline: true }
              ]
            }]
          });
        } catch (e) {
          console.error("mystats error:", e.message);
          message.reply("Couldn't fetch your stats.");
        }
        return;
      }

      // !top
      if (cmd === "!top") {
        const n = parseInt(parts[1] || "10", 10) || 10;
        try {
          const resp = await axios.get(`${RAILWAY_URL.replace(/\/syn-county\/?$/,'')}/stats/top?n=${n}`);
          const top = resp.data.top || [];
          const lines = top.map((t, i) => `${i+1}. <@${t.id}> — ${t.thisWeek}`);
          await message.reply({
            embeds: [{
              title: `🏆 Top ${Math.min(n, top.length)} donors (this week)`,
              description: lines.join("\n") || "No donations yet",
              color: 0xf1c40f
            }]
          });
        } catch (e) {
          console.error("top error:", e.message);
          message.reply("Couldn't fetch leaderboard.");
        }
        return;
      }

      // !allstats
      if (cmd === "!allstats") {
        const n = parseInt(parts[1] || "50", 10) || 50;
        try {
          const resp = await axios.get(`${RAILWAY_URL.replace(/\/syn-county\/?$/,'')}/stats/top?n=${n}`);
          const top = resp.data.top || [];
          const lines = top.map((t, i) => `${i+1}. <@${t.id}> — ${t.thisWeek} (prev ${t.previousWeek})`);
          await message.reply({
            embeds: [{
              title: `📚 All stats (top ${Math.min(n, top.length)})`,
              description: lines.join("\n") || "No donations yet",
              color: 0x95a5a6
            }]
          });
        } catch (e) {
          console.error("allstats error:", e.message);
          message.reply("Couldn't fetch all stats.");
        }
        return;
      }

      // !resetweek - admin-only
      if (cmd === "!resetweek") {
        // only allow server admins to run this
        if (!message.member || !message.member.permissions.has("Administrator")) {
          message.reply("You must be a server administrator to run this command.");
          return;
        }

        try {
          // call the reset endpoint with secret header
          const base = RAILWAY_URL.replace(/\/syn-county\/?$/,'');
          await axios.post(base + "/admin/reset", {}, {
            headers: { "x-admin-secret": ADMIN_SECRET || "" }
          });

          message.reply("✅ Weekly reset executed.");
        } catch (e) {
          console.error("reset error:", e.message);
          message.reply("Failed to run weekly reset. Check logs.");
        }
        return;
      }
    }

    // Not a command -> check if webhook/embedded message to forward
    // Forward any normal message or embed (webhook messages often have embeds)
    const payload = {
      text: content,
      embeds: embeds.map(e => ({
        title: e.title || "",
        description: e.description || "",
        fields: e.fields || []
      }))
    };

    // Only forward if there is something meaningful
    if ((payload.text && payload.text.trim()) || (payload.embeds && payload.embeds.length > 0)) {
      try {
        await axios.post(RAILWAY_URL, payload);
        console.log("Forwarded to Railway:", (content || embeds[0]?.title || "").slice(0, 120));
      } catch (e) {
        console.error("Forward failed:", e.message);
      }
    }
  } catch (err) {
    console.error("messageCreate error:", err && err.message ? err.message : err);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
