const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const cors = require("cors");

const app = express();
app.use(express.static("."));
app.use(bodyParser.json());
app.use(cors());

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://warpcast.com https://*.warpcast.com; default-src 'self'; script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; connect-src 'self';"
  );
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.post("/frame-endpoint", (req, res) => {
  console.log("Warpcast Frame request received:", req.body);
  res.json({
    "image": "https://pepec.on-fleek.app/silver_robot_frog.png",
    "buttons": [
      { "label": "Play Now", "action": "post_redirect" }
    ],
    "post_url": "https://pepec.on-fleek.app/"
  });
});

const LEADERBOARD_FILE = "leaderboard.json";

async function loadLeaderboard() {
  try {
    const data = await fs.readFile(LEADERBOARD_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveLeaderboard(leaderboard) {
  await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));
}

function deduplicateLeaderboard(leaderboard) {
  const uniqueEntries = {};
  leaderboard.forEach(entry => {
    if (!uniqueEntries[entry.user.toLowerCase()] || entry.score > uniqueEntries[entry.user.toLowerCase()].score) {
      uniqueEntries[entry.user.toLowerCase()] = { user: entry.user, score: entry.score };
    }
  });
  return Object.values(uniqueEntries);
}

app.post("/submitScore", async (req, res) => {
  const { user, score } = req.body;
  let leaderboard = await loadLeaderboard();
  leaderboard.push({ user, score });
  leaderboard = deduplicateLeaderboard(leaderboard);
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 10);
  await saveLeaderboard(leaderboard);
  res.json({ success: true });
});

app.get("/leaderboard", async (req, res) => {
  const leaderboard = await loadLeaderboard();
  res.json(leaderboard.sort((a, b) => b.score - a.score).slice(0, 10));
});

app.listen(3000, () => console.log("Server running on port 3000"));
