const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs").promises; // Use promises for async file operations
const app = express();

app.use(express.static("."));
app.use(bodyParser.json());

// Set Content Security Policy to allow 'unsafe-eval' for development
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; connect-src 'self';"
  );
  next();
});

const LEADERBOARD_FILE = "leaderboard.json";

// Load leaderboard from file or initialize empty
async function loadLeaderboard() {
  try {
    const data = await fs.readFile(LEADERBOARD_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.log("No leaderboard file found, initializing empty leaderboard.");
    return []; // Return empty array if file doesn’t exist or there’s an error
  }
}

// Save leaderboard to file
async function saveLeaderboard(leaderboard) {
  try {
    await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));
  } catch (err) {
    console.error("Error saving leaderboard:", err);
    throw err;
  }
}

// Deduplicate and keep highest score per wallet
function deduplicateLeaderboard(leaderboard) {
  const uniqueEntries = {};
  leaderboard.forEach(entry => {
    const lowerCaseUser = entry.user.toLowerCase();
    if (!uniqueEntries[lowerCaseUser] || entry.score > uniqueEntries[lowerCaseUser].score) {
      uniqueEntries[lowerCaseUser] = { user: entry.user, score: entry.score };
    }
  });
  return Object.values(uniqueEntries);
}

app.post("/submitScore", async (req, res) => {
  console.log("Received score submission request...");
  const { user, score } = req.body;

  try {
    let leaderboard = await loadLeaderboard();

    // Find existing entry for this wallet (case-insensitive)
    const existingEntry = leaderboard.find(entry => entry.user.toLowerCase() === user.toLowerCase());

    if (existingEntry) {
      // Update score if the new one is higher
      if (score > existingEntry.score) {
        existingEntry.score = score;
        console.log(`Updated score for ${user} to ${score} (was ${existingEntry.score})`);
      } else {
        console.log(`Score ${score} for ${user} not higher than existing ${existingEntry.score}, skipping update`);
      }
    } else {
      // Add new entry if wallet doesn’t exist
      leaderboard.push({ user, score });
      console.log(`New score submitted: ${user} => ${score}`);
    }

    // Deduplicate and keep highest score per wallet
    leaderboard = deduplicateLeaderboard(leaderboard);

    // Sort descending by score and limit to top 10
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10); // Keep only top 10 scores

    await saveLeaderboard(leaderboard);
    res.json({ success: true });
  } catch (err) {
    console.error("Error submitting score:", err);
    res.status(500).json({ success: false, error: "Server error saving score" });
  }
});

app.get("/leaderboard", async (req, res) => {
  console.log("Received leaderboard request...");
  try {
    const leaderboard = await loadLeaderboard();
    // Deduplicate and keep highest score per wallet
    const deduplicated = deduplicateLeaderboard(leaderboard);
    // Sort descending by score and limit to top 10
    const sorted = deduplicated.sort((a, b) => b.score - a.score).slice(0, 10);
    res.json(sorted); // Return top 10 scores with highest per wallet
  } catch (err) {
    console.error("Error loading leaderboard:", err);
    res.status(500).json({ success: false, error: "Server error loading leaderboard" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));