// api/frame.js
module.exports = (req, res) => {
  res.status(200).json({
    image: 'https://pepec-frogger.vercel.app/silver_robot_frog.png',
    buttons: [
      {
        label: 'Play Now',
        action: 'link',
        target: 'https://pepec-frogger.vercel.app/'
      }
    ]
  });
};
