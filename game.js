// ===== CONFIGURATION =====
const REQUIRED_PEPEC_AMOUNT = "0"; // For testing, adjust for production
const TOKEN_DECIMALS = 18;
const requiredBalance = ethers.utils.parseUnits(REQUIRED_PEPEC_AMOUNT, TOKEN_DECIMALS);
const pepecContractAddress = "0x1196c6704789620514fD25632aBe15F69a50bc4f";
const pepecABI = ["function balanceOf(address owner) view returns (uint256)"];
const BASE_CHAIN_ID = 8453; // Base L2 Mainnet chain ID

console.log("Configuration loaded.");

// ===== AUDIO SETUP =====
const backgroundMusicFiles = [
  "soundtrack/level1.mp3",  // Level 1
  "soundtrack/level2.mp3",  // Level 2
  "soundtrack/level3.mp3",  // Level 3
  "soundtrack/level4.mp3",  // Level 4
  "soundtrack/level5.mp3",  // Level 5
  "soundtrack/level6.mp3",  // Level 6
  "soundtrack/level7.mp3",  // Level 7
  "soundtrack/level8.mp3"   // Level 8
];
let currentBackgroundMusic = null;
const preloadedAudio = {};

// Preload all audio files
function preloadAudio() {
  backgroundMusicFiles.forEach((file, index) => {
    const src = window.location.origin + "/" + file;
    preloadedAudio[index] = new Audio(src);
    preloadedAudio[index].loop = true;
    preloadedAudio[index].volume = 0.5;
    preloadedAudio[index].preload = "auto";
    console.log("Preloading audio:", src);
  });
}
preloadAudio(); // Call immediately

// Function to switch background music based on level
function updateBackgroundMusic(level) {
  const musicIndex = Math.min(level - 1, backgroundMusicFiles.length - 1);
  const newSrc = window.location.origin + "/" + backgroundMusicFiles[musicIndex]; // Full URL
  
  console.log("Attempting to switch music for Level", level, "to", newSrc);
  
  if (!currentBackgroundMusic || currentBackgroundMusic.src !== newSrc) {
    if (currentBackgroundMusic) {
      console.log("Pausing current music:", currentBackgroundMusic.src);
      currentBackgroundMusic.pause();
      currentBackgroundMusic.currentTime = 0;
    }
    currentBackgroundMusic = preloadedAudio[musicIndex];
    console.log("Using preloaded music for index:", musicIndex);
    currentBackgroundMusic.play()
      .then(() => console.log("Music playing successfully:", newSrc))
      .catch(err => {
        console.error("Error playing background music:", err);
        currentBackgroundMusic = null; // Reset if unplayable
      });
  } else {
    console.log("Music unchanged, already playing:", newSrc);
  }
}

// ===== WALLET CONNECTION & TOKEN BALANCE CHECK =====
let provider, signer, userAddress;

async function connectWallet() {
  console.log("Starting connectWallet function...");
  if (!window.ethereum) {
    alert("Please install a Web3 wallet like MetaMask to play.");
    document.getElementById("message").innerText = "No Web3 wallet detected.";
    return;
  }

  try {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    if (!accounts || accounts.length === 0) throw new Error("No accounts found.");
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    console.log("Connected address:", userAddress);

    const network = await provider.getNetwork();
    console.log("Connected to network:", network.name, "Chain ID:", network.chainId);
    if (network.chainId !== BASE_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${BASE_CHAIN_ID.toString(16)}` }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: `0x${BASE_CHAIN_ID.toString(16)}`,
              chainName: "Base Mainnet",
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://mainnet.base.org"],
              blockExplorerUrls: ["https://basescan.org"]
            }]
          });
        } else {
          throw new Error("Please switch to Base network.");
        }
      }
    }

    document.getElementById("message").innerText = `Wallet connected: ${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
    await checkPepecBalance();
  } catch (err) {
    console.error("Wallet connection error:", err);
    document.getElementById("message").innerText = `Error: ${err.message || "Unknown error"}`;
  }
}

async function checkPepecBalance() {
  try {
    if (!provider || !userAddress) throw new Error("Wallet not connected.");
    const network = await provider.getNetwork();
    console.log("Connected to network:", network.name, "Chain ID:", network.chainId);
    if (network.chainId !== BASE_CHAIN_ID) throw new Error("Wallet not on Base network (chain ID 8453).");

    const contract = new ethers.Contract(pepecContractAddress, pepecABI, provider);
    console.log("Checking balance for:", userAddress);
    const balance = await contract.balanceOf(userAddress);
    const formattedBalance = ethers.utils.formatUnits(balance, TOKEN_DECIMALS);
    console.log("Balance:", formattedBalance, "$PEPEC");

    if (balance.lt(requiredBalance)) {
      document.getElementById("message").innerText = `Insufficient $PEPEC (${formattedBalance} < ${REQUIRED_PEPEC_AMOUNT})`;
    } else {
      document.getElementById("message").innerText = `Balance verified (${formattedBalance} $PEPEC) – Starting game!`;
      await checkImagesLoaded();
      startGame();
      loadLeaderboard();
    }
  } catch (err) {
    console.error("Error checking balance:", err);
    document.getElementById("message").innerText = `Error checking balance: ${err.reason || err.message || "Contract call failed"}`;
    if (err.code === "CALL_EXCEPTION") {
      console.log("Contract call reverted. Starting game in test mode...");
      document.getElementById("message").innerText = "Balance check failed – Starting game anyway (test mode)";
      await checkImagesLoaded();
      startGame();
      loadLeaderboard();
    }
  }
}

document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);

// ===== GAME SETUP =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const frogImg = new Image(); frogImg.src = "silver_robot_frog.png";
const carImg = new Image(); carImg.src = "car.png";
const car2Img = new Image(); car2Img.src = "car2.png
