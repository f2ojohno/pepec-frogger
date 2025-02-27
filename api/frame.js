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
      <meta name="fc:frame:state" content='{"walletRequired": true, "chainId": 8453}'> <!-- Specify Base chain for Farcaster wallet -->
      <meta name="fc:frame:title" content="PEPEC FROGGER"> <!-- Optional: Improve accessibility -->
      <meta name="fc:frame:description" content="Dodge cars, collect points, and survive with your Farcaster wallet!"> <!-- Optional: Improve accessibility -->
      <script src="https://unpkg.com/frames.js@0.8.0"></script> <!-- Stable version for MWP -->
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          try {
            const sdk = new Frames();
            sdk.ready({
              walletRequired: true,
              chainId: 8453, // Specify Base chain for Farcaster wallet compatibility
              onWalletConnect: (wallet) => {
                console.log('Farcaster wallet connected via MWP:', wallet.address);
                // Optionally verify wallet is on Base (chain ID 8453)
              },
              onError: (error) => {
                console.error('Frames SDK error:', error);
              }
            });
            console.log('Frames SDK loaded and ready with MWP and Farcaster wallet support');
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
