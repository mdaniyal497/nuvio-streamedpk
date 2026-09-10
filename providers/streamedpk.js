// providers/streamedpk.js

var API_BASE = "https://streamed.pk/api/matches/live";
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Referer": "https://streamed.pk/",
  "Accept": "application/json, text/plain, */*"
};

// 1. CATALOG HANDLER: Fetches live matches to display on Nuvio Home Screen
function getCatalog(type, id) {
  console.log("[Streamed.pk] Fetching live catalog items...");

  return fetch(API_BASE, { headers: HEADERS })
    .then(function(response) {
      if (!response.ok) throw new Error("HTTP error " + response.status);
      return response.json();
    })
    .then(function(matches) {
      var catalogItems = [];

      if (!matches || !Array.isArray(matches)) return { metas: catalogItems };

      matches.forEach(function(match) {
        var matchTitle = match.title || (match.teams ? match.teams.home + " vs " + match.teams.away : "Live Match");
        var category = match.category || "Sports";
        var posterUrl = match.poster || match.banner || "https://streamed.pk/favicon.ico";

        catalogItems.push({
          id: "spk_" + (match.id || encodeURIComponent(matchTitle)),
          type: "tv",
          name: matchTitle,
          poster: posterUrl,
          description: category.toUpperCase() + " - Live on Streamed.pk",
          genres: [category]
        });
      });

      return { metas: catalogItems };
    })
    .catch(function(error) {
      console.error("[Streamed.pk] Catalog fetch error:", error.message);
      return { metas: [] };
    });
}

// 2. STREAM HANDLER: Resolves the direct .m3u8 link when a match poster is clicked
function getStreams(tmdbId, mediaType, season, episode) {
  console.log("[Streamed.pk] Resolving stream for ID:", tmdbId);

  return fetch(API_BASE, { headers: HEADERS })
    .then(function(response) {
      if (!response.ok) throw new Error("HTTP error " + response.status);
      return response.json();
    })
    .then(function(matches) {
      var streams = [];
      if (!matches || !Array.isArray(matches)) return streams;

      // Extract match identifier
      var cleanId = tmdbId.replace("spk_", "");

      // Find the selected match
      var targetMatch = matches.find(function(m) {
        var title = m.title || (m.teams ? m.teams.home + " vs " + m.teams.away : "");
        return String(m.id) === cleanId || encodeURIComponent(title) === cleanId;
      });

      if (targetMatch && targetMatch.streams && Array.isArray(targetMatch.streams)) {
        targetMatch.streams.forEach(function(streamItem, index) {
          var rawStreamUrl = streamItem.url || streamItem.streamUrl;

          if (rawStreamUrl) {
            // Append HTTP headers required to bypass 403 Forbidden errors
            var formattedUrl = rawStreamUrl + "|Referer=https://streamed.pk/&User-Agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

            streams.push({
              name: "Streamed.pk",
              title: "Server " + (index + 1) + " (" + (streamItem.quality || "HD") + ")",
              quality: streamItem.quality || "HD 1080p",
              url: formattedUrl,
              format: "m3u8",
              isLive: true
            });
          }
        });
      }

      return streams;
    })
    .catch(function(error) {
      console.error("[Streamed.pk] Stream resolve error:", error.message);
      return [];
    });
}

module.exports = { getCatalog, getStreams };
