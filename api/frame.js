export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Handle frame interaction (optional for now, can expand later)
    return res.status(200).json({ success: true });
  }
  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="fc:frame" content="vNext">
      <meta name="fc:frame:image" content="https://pepec-frogger.vercel.app/silver_robot_frog.png">
      <meta name="fc:frame:button:1" content="Play Frogger">
      <meta name="fc:frame:button:1:action" content="launch_frame">
      <meta name="fc:frame:button:1:target" content="https://pepec-frogger.vercel.app/game.html">
      <script src="https://unpkg.com/@farcaster/frames.js@1.0.0"></script> <!-- Specify version to ensure consistency -->
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          try {
            const sdk = new Frames();
            sdk.ready();
            console.log('Frames SDK loaded and ready');
          } catch (error) {
            console.error('Error initializing Frames SDK:', error);
          }
        });
      </script>
    </head>
    <body></body>
    </html>
  `);
}
