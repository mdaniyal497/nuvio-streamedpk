// providers/streamedpk.js

function getStreams(tmdbId, mediaType, season, episode) {
  console.log("[Streamed.pk] Fetching available streams...");

  var API_BASE = "https://streamed.pk/api/matches/live";
  var HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Referer": "https://streamed.pk/",
    "Accept": "application/json, text/plain, */*"
  };

  return fetch(API_BASE, { headers: HEADERS })
    .then(function(response) {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then(function(matches) {
      var streams = [];

      if (!matches || !Array.isArray(matches)) {
        return streams;
      }

      // Iterate through active matches
      matches.forEach(function(match) {
        var matchTitle = match.title || (match.teams ? match.teams.home + " vs " + match.teams.away : "Live Match");
        var matchCategory = match.category || "Sports";

        if (match.streams && Array.isArray(match.streams)) {
          match.streams.forEach(function(streamItem, index) {
            var rawStreamUrl = streamItem.url || streamItem.streamUrl;

            if (rawStreamUrl) {
              // Appending headers with '|' instructs Nuvio's player to pass them to CDN
              var formattedUrl = rawStreamUrl + "|Referer=https://streamed.pk/&User-Agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

              streams.push({
                name: "Streamed.pk",
                title: matchTitle + " (" + matchCategory + ") - Server " + (index + 1),
                quality: streamItem.quality || "HD 1080p",
                url: formattedUrl,
                format: "m3u8",
                isLive: true
              });
            }
          });
        }
      });

      console.log("[Streamed.pk] Successfully resolved " + streams.length + " streams.");
      return streams;
    })
    .catch(function(error) {
      console.error("[Streamed.pk] Error resolving streams:", error.message);
      return [];
    });
}

module.exports = { getStreams };
