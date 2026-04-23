require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const PORT = process.env.PORT || 3000;

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log(`✅ Bot Erine Online: ${client.user.tag}`);
});

app.post("/send", async (req, res) => {
  const { title, message, url, image } = req.body;

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

    // 1. Pesan Teks Pembuka
    await channel.send("Pengumuman Penambahan Fitur Baru Website Cavallery.");

    // 2. Susun Kotak Embed
    const embed = new EmbedBuilder()
      .setTitle(title || "Update Baru")
      .setDescription(message)
      .setURL(url && url.startsWith("http") ? url : null)
      .setColor(0x5865f2)
      .setTimestamp()
      .setFooter({ text: "Bot Erine • Cavallery System" });

    if (image && image.startsWith("http")) {
      embed.setImage(image);
    }

    if (url) {
      embed.addFields({
        name: "🔗 Website Link",
        value: `[Klik di sini untuk membuka](${url})`,
      });
    }

    await channel.send({ embeds: [embed] });
    console.log("🚀 Notifikasi Erine terkirim!");
    res.json({ status: "berhasil" });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ status: "error", detail: err.message });
  }
});

app.listen(PORT, () => console.log(`📡 Bridge Erine Aktif di Port ${PORT}`));
client.login(TOKEN);
