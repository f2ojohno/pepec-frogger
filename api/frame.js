export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Handle frame interaction (e.g., wallet actions or state updates)
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
      <meta name="fc:frame:button:1:target" content="https://pepec-frogger.vercel.app/">
      <meta name="fc:frame:state" content='{"walletRequired": true}'> <!-- Signal that a wallet is required -->
      <script src="https://unpkg.com/frames.js@0.8.0"></script> <!-- Use a stable version for MWP compatibility -->
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          try {
            const sdk = new Frames();
            sdk.ready({
              walletRequired: true, // Signal MWP wallet readiness
              onWalletConnect: () => {
                console.log('Wallet connected via MWP');
                // Optionally handle wallet connection (e.g., verify Farcaster ID or Ethereum address)
              },
              onError: (error) => {
                console.error('Frames SDK error:', error);
              }
            });
            console.log('Frames SDK loaded and ready with MWP support');
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
