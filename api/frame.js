// api/frame.js
module.exports = async (req, res) => {
  console.log('Frame request received:', req.method, req.body);

  try {
    let state = { position: 0, score: 0, gameOver: false };

    if (req.method === 'POST' && req.body?.untrustedData?.buttonIndex === 1) {
      // User clicked "Jump"
      state.position += 1;
      state.score += 10;

      // Simulate a simple obstacle at position 3
      if (state.position === 3) {
        state.gameOver = true;
      }
    }

    const frameResponse = {
      image: state.gameOver
        ? 'https://pepec-frogger.vercel.app/silver_robot_frog.png' // Game over image
        : `https://pepec-frogger.vercel.app/silver_robot_frog.png?pos=${state.position}`, // Dynamic position (could use different images)
      buttons: state.gameOver
        ? [
            {
              label: 'Play Full Game',
              action: 'link',
              target: 'https://pepec-frogger.vercel.app/'
            }
          ]
        : [
            {
              label: `Jump (Score: ${state.score})`,
              action: 'post'
            }
          ],
      post_url: 'https://pepec-frogger.vercel.app/api/frame'
    };

    console.log('Sending Frame response:', frameResponse);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(frameResponse);
  } catch (error) {
    console.error('Frame error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
