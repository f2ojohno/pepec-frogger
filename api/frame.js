// api/frame.js
module.exports = (req, res) => {
  const frameResponse = {
    image: 'https://pepec-frogger.vercel.app/silver_robot_frog.png', // Temporary Vercel URL
    buttons: [{ label: 'Play Now', action: 'post_redirect' }],
    post_url: 'https://pepec-frogger.vercel.app/' // Temporary Vercel URL
  };
  res.status(200).json(frameResponse);
};
