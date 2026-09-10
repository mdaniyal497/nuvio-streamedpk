const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const manifest = require("./manifest.json");

const app = express();
app.use(cors());

const API_BASE = "https://streamed.pk/api/matches/live";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Referer": "https://streamed.pk/",
  "Accept": "application/json, text/plain, */*"
};

// 1. Manifest Endpoint
app.get("/manifest.json", (req, res) => {
  res.json(manifest);
});

// 2. Catalog Endpoint (Builds the Home Screen Posters)
app.get("/catalog/:type/:id.json", async (req, res) => {
  try {
    const response = await fetch(API_BASE, { headers: HEADERS });
    if (!response.ok) throw new Error("API error");
    const matches = await response.json();

    const metas = (matches || []).map((match) => {
      const matchTitle = match.title || (match.teams ? `${match.teams.home} vs ${match.teams.away}` : "Live Match");
      const category = match.category || "Sports";
      
      return {
        id: `spk_${match.id || encodeURIComponent(matchTitle)}`,
        type: "tv",
        name: matchTitle,
        poster: match.poster || match.banner || "https://streamed.pk/favicon.ico",
        description: `${category.toUpperCase()} - Live on Streamed.pk`,
        genres: [category]
      };
    });

    res.json({ metas });
  } catch (error) {
    console.error("Catalog Error:", error);
    res.json({ metas: [] });
  }
});

// 3. Stream Endpoint (Plays the Match when clicked)
app.get("/stream/:type/:id.json", async (req, res) => {
  const cleanId = req.params.id.replace("spk_", "").replace(".json", "");

  try {
    const response = await fetch(API_BASE, { headers: HEADERS });
    if (!response.ok) throw new Error("API error");
    const matches = await response.json();

    const targetMatch = matches.find((m) => {
      const title = m.title || (m.teams ? `${m.teams.home} vs ${m.teams.away}` : "");
      return String(m.id) === cleanId || encodeURIComponent(title) === cleanId;
    });

    const streams = [];
    if (targetMatch && Array.isArray(targetMatch.streams)) {
      targetMatch.streams.forEach((streamItem, index) => {
        const rawStreamUrl = streamItem.url || streamItem.streamUrl;
        if (rawStreamUrl) {
          streams.push({
            name: "Streamed.pk",
            title: `Server ${index + 1} (${streamItem.quality || "HD"})`,
            url: `${rawStreamUrl}|Referer=https://streamed.pk/&User-Agent=Mozilla/5.0`
          });
        }
      });
    }

    res.json({ streams });
  } catch (error) {
    console.error("Stream Error:", error);
    res.json({ streams: [] });
  }
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Streamed.pk Addon running on port ${PORT}`));
