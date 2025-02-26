// api/frame.js
module.exports = (req, res) => {
  const frameResponse = {
    image: 'https://pepec-frogger.vercel.app/silver_robot_frog.png',
    buttons: [
      {
        label: 'Play Now',
        action: 'post_redirect',
        target: 'https://pepec-frogger.vercel.app/'
      }
    ],
    post_url: 'https://pepec-frogger.vercel.app/api/frame' // Optional: loopback for Warpcast validation
  };
  res.status(200).json(frameResponse);
};
