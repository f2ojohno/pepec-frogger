const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const cors = require("cors");

const app = express();
app.use(express.static("."));
app.use(bodyParser.json());
app.use(cors());

// ✅ FIX: Set correct Content-Security-Policy for Warpcast embedding
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

// ✅ FIX: Correct Warpcast Frame JSON response
app.post("/frame-endpoint", async (req, res) => {
  console.log("Received Warpcast Frame request...");
  res.json({
    "image": "https://your-deployed-url.com/silver_robot_frog.png",
    "post_url": "https://your-deployed-url.com/",
    "buttons": [
      { "text": "Play Now", "action": "post" }
    ]
  });
});

// ✅ Leaderboard System
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

// ✅ FIX: Ensure leaderboard keeps highest scores only
function deduplicateLeaderboard(leaderboard) {
  const uniqueEntries = {};
  leaderboard.forEach(entry => {
    if (!uniqueEntries[entry.user.toLowerCase()] || entry.score > uniqueEntries[entry.user.toLowerCase()].score) {
      uniqueEntries[entry.user.toLowerCase()] = { user: entry.user, score: entry.score };
    }
  });
  return Object.values(uniqueEntries);
}

// ✅ Submit Score
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

// ✅ Get Leaderboard
app.get("/leaderboard", async (req, res) => {
  const leaderboard = await loadLeaderboard();
  res.json(leaderboard.sort((a, b) => b.score - a.score).slice(0, 10));
});

app.listen(3000, () => console.log("Server running on port 3000"));
