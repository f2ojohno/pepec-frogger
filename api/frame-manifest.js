// api/frame-manifest.js
module.exports = async (req, res) => {
  const manifest = {
    name: "PEPEC FROGGER",
    description: "Dodge cars and level up with your $PEPEC wallet!",
    image: "https://pepec-frogger.vercel.app/silver_robot_frog.png",
    version: "v2",
    entrypoint: "https://pepec-frogger.vercel.app/"
  };
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(manifest);
};
