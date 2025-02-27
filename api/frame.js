import { ConnectWallet } from 'onchainkit'; // Import OnchainKit wallet component

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
      <meta name="fc:frame:state" content='{"walletRequired": true, "chainId": 8453, "farcasterWallet": true}'>
      <meta name="fc:frame:title" content="PEPEC FROGGER">
      <meta name="fc:frame:description" content="Dodge cars, collect points, and survive with your Farcaster wallet!">
      <script src="https://unpkg.com/frames.js@0.8.0"></script>
      <script src="https://unpkg.com/react@18"></script>
      <script src="https://unpkg.com/react-dom@18"></script>
      <script src="https://unpkg.com/onchainkit@latest/dist/index.umd.js"></script> <!-- OnchainKit UMD bundle -->
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          try {
            const React = window.React;
            const ReactDOM = window.ReactDOM;
            const { ConnectWallet } = window.OnchainKit;

            const App = () => (
              <ConnectWallet
                onConnect={(wallet) => {
                  console.log('Wallet connected via OnchainKit:', wallet.address);
                  // Signal frame readiness with wallet
                  const sdk = new Frames();
                  sdk.ready({
                    walletRequired: true,
                    chainId: 8453,
                    farcasterWallet: true,
                    onWalletConnect: (w) => console.log('Farcaster wallet connected:', w.address),
                    onError: (error) => console.error('OnchainKit/Frames error:', error)
                  });
                  console.log('Frames SDK loaded and ready with OnchainKit wallet support');
                }}
                chainId={8453} // Base chain
                appName="PEPEC Frogger"
              />
            );

            ReactDOM.render(<App />, document.body);
          } catch (error) {
            console.error('Error initializing OnchainKit/Frames:', error);
          }
        });
      </script>
    </head>
    <body></body>
    </html>
  `);
}
