require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const PORT = process.env.PORT || 3000;
const JKT48_API_KEY = process.env.JKT48_API_KEY;
const PRIORITY_TOKEN = process.env.PRIORITY_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Menyimpan ID live yang sudah dikirim agar tidak spam
const activeLive = new Set();

client.once("clientReady", () => {
  console.log(`Bot Erine Online: ${client.user.tag}`);
  
  // Mulai pengecekan live setiap 27 detik
  setInterval(checkJKT48Live, 27000);
  checkJKT48Live(); // Cek langsung saat startup
});

async function checkJKT48Live() {
  try {
    const response = await axios.get(`https://v2.jkt48connect.com/api/jkt48/live`, {
      params: { 
        apikey: JKT48_API_KEY,
        priority_token: JKT48_API_KEY 
      },
      headers: { 
        "User-Agent": "Mozilla/5.0",
        "x-api-key": JKT48_API_KEY,
        "x-priority-token": JKT48_API_KEY,
        "apikey": JKT48_API_KEY,
        "Authorization": `Bearer ${JKT48_API_KEY}`
      },
      timeout: 15000
    });

    console.log("Koneksi API JKT48 Berhasil");
    const liveData = response.data;
    if (!liveData || !Array.isArray(liveData)) return;

    const channel = await client.channels.fetch(CHANNEL_ID);
    const currentLiveIds = new Set();

    for (const live of liveData) {
      // Filter: Hanya proses jika nama member mengandung "Erine"
      if (!live.name.toLowerCase().includes("erine")) continue;

      const liveId = live.room_id || live.live_id || live.url_key;
      currentLiveIds.add(liveId);

      if (!activeLive.has(liveId)) {
        activeLive.add(liveId);

        // Tentukan URL berdasarkan tipe (IDN atau Showroom)
        let liveUrl = "https://www.jkt48connect.com";
        if (live.type === "idn") {
          liveUrl = `https://www.idn.app/${live.url_key}/live`;
        } else if (live.type === "showroom") {
          liveUrl = `https://www.showroom-live.com/r/${live.url_key}`;
        }

        // Buat tampilan Embed yang Premium
        const embed = new EmbedBuilder()
          .setTitle(`✨ ${live.name} is now LIVE!`)
          .setDescription(`Yuk nonton **${live.name}** sekarang di **${live.type ? live.type.toUpperCase() : "JKT48 Connect"}**!`)
          .setURL(liveUrl)
          .setColor(0xFF0044)
          .setThumbnail(live.img || live.img_alt || null)
          .addFields(
            { name: "👤 Member", value: live.name, inline: true },
            { name: "📱 Platform", value: live.type ? live.type.toUpperCase() : "Live", inline: true }
          )
          .setImage(live.img_alt || live.img || null)
          .setTimestamp()
          .setFooter({ text: "JKT48 Live Notification • Erine System", iconURL: client.user.displayAvatarURL() });

        await channel.send({ 
          content: `NOTIFIKASI: ${live.name} sedang LIVE! @everyone`, 
          embeds: [embed] 
        });
        
        console.log(`Notifikasi Live terkirim untuk: ${live.name}`);
      }
    }

    // Hapus ID yang sudah tidak live dari Set
    for (const id of activeLive) {
      if (!currentLiveIds.has(id)) {
        activeLive.delete(id);
      }
    }

  } catch (error) {
    if (error.code === "ECONNABORTED") {
      console.error("❌ Koneksi ke API JKT48 Timeout (Terlalu lama)");
    } else {
      console.error("❌ Gagal mengambil data live:", error.message);
    }
  }
}

app.post("/send", async (req, res) => {
  const { title, message, url, image } = req.body;

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

    await channel.send("📢 **Pengumuman Baru dari Cavallery**");

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
    res.json({ status: "berhasil" });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ status: "error", detail: err.message });
  }
});

app.listen(PORT, () => console.log(`Bridge Erine Aktif di Port ${PORT}`));
client.login(TOKEN);
