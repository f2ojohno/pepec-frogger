// api/frame.js
module.exports = async (req, res) => {
  console.log('Frame request received:', req.method, req.body);

  try {
    const frameResponse = {
      image: 'https://pepec-frogger.vercel.app/silver_robot_frog.png',
      buttons: [
        {
          label: 'Play Now',
          action: 'post_redirect',
          target: 'https://pepec-frogger.vercel.app/'
        }
      ],
      post_url: 'https://pepec-frogger.vercel.app/api/frame' // Optional loopback
    };

    console.log('Sending Frame response:', frameResponse);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(frameResponse);
  } catch (error) {
    console.error('Frame error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
