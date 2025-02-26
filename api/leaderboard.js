// api/leaderboard.js
const { kv } = require('@vercel/kv');

function deduplicateLeaderboard(leaderboard) {
  console.log('Deduplicating leaderboard:', leaderboard);
  const uniqueEntries = {};
  leaderboard.forEach(entry => {
    if (!uniqueEntries[entry.user.toLowerCase()] || entry.score > uniqueEntries[entry.user.toLowerCase()].score) {
      uniqueEntries[entry.user.toLowerCase()] = { user: entry.user, score: entry.score };
    }
  });
  return Object.values(uniqueEntries);
}

module.exports = async (req, res) => {
  try {
    console.log('Request received:', req.method, req.body);
    if (req.method === 'POST') {
      const { user, score } = req.body;
      if (!user || typeof score !== 'number') {
        console.log('Invalid data:', { user, score });
        return res.status(400).json({ success: false, error: 'Invalid data' });
      }
      let leaderboard = (await kv.get('leaderboard')) || [];
      console.log('Current leaderboard from KV:', leaderboard);
      if (!Array.isArray(leaderboard)) {
        console.log('Leaderboard was not an array, resetting to empty array');
        leaderboard = [];
      }
      leaderboard.push({ user, score });
      leaderboard = deduplicateLeaderboard(leaderboard);
      leaderboard.sort((a, b) => b.score - a.score);
      leaderboard = leaderboard.slice(0, 10);
      await kv.set('leaderboard', leaderboard);
      console.log('Updated leaderboard saved:', leaderboard);
      res.status(200).json({ success: true });
    } else if (req.method === 'GET') {
      const leaderboard = (await kv.get('leaderboard')) || [];
      console.log('Returning leaderboard:', leaderboard);
      if (!Array.isArray(leaderboard)) {
        console.log('Leaderboard was not an array, returning empty array');
        return res.status(200).json([]);
      }
      res.status(200).json(leaderboard.sort((a, b) => b.score - a.score).slice(0, 10));
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, error: 'Server error', details: error.message });
  }
};
