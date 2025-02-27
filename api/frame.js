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
      <meta name="fc:frame:state" content='{"walletRequired": true, "chainId": 8453, "farcasterWallet": true}'> <!-- Explicitly signal Farcaster wallet -->
      <meta name="fc:frame:title" content="PEPEC FROGGER">
      <meta name="fc:frame:description" content="Dodge cars, collect points, and survive with your Farcaster wallet!">
      <script src="https://unpkg.com/frames.js@0.8.0"></script> <!-- Stable version for Farcaster Frames -->
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          try {
            const sdk = new Frames();
            sdk.ready({
              walletRequired: true,
              chainId: 8453, // Base chain for Farcaster wallet
              farcasterWallet: true, // Explicitly request Farcaster wallet via MWP
              onWalletConnect: (wallet) => {
                console.log('Farcaster wallet connected via MWP:', wallet.address);
                // Optionally verify wallet is on Base (chain ID 8453)
                if (wallet.chainId !== 8453) {
                  console.warn('Wallet not on Base chain, redirecting...');
                  // Optional: Trigger chain switch if needed
                  sdk.actions.openUrl({ url: 'https://warpcast.com/~/settings/connected-addresses' });
                }
              },
              onError: (error) => {
                console.error('Frames SDK error:', error);
                // Handle specific errors (e.g., wallet not found)
                if (error.message.includes('wallet not found')) {
                  console.warn('Prompting user to connect Farcaster wallet...');
                  sdk.actions.openUrl({ url: 'https://warpcast.com/~/settings/connected-addresses' });
                }
              }
            });
            console.log('Frames SDK loaded and ready with Farcaster wallet and MWP support');
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
