// game.js (Reverted to Original Sizes)
const REQUIRED_PEPEC_AMOUNT = "0";
const TOKEN_DECIMALS = 18;
const requiredBalance = ethers.utils.parseUnits(REQUIRED_PEPEC_AMOUNT, TOKEN_DECIMALS);
const pepecContractAddress = "0x1196c6704789620514fD25632aBe15F69a50bc4f";
const pepecABI = ["function balanceOf(address owner) view returns (uint256)"];
const BASE_CHAIN_ID = 8453;

console.log("Configuration loaded.");
console.log("Page loaded at:", window.location.href);

const backgroundMusicFiles = [
  "soundtrack/level1.mp3",
  "soundtrack/level2.mp3",
  "soundtrack/level3.mp3",
  "soundtrack/level4.mp3",
  "soundtrack/level5.mp3",
  "soundtrack/level6.mp3",
  "soundtrack/level7.mp3",
  "soundtrack/level8.mp3"
];
let currentBackgroundMusic = null;
const preloadedAudio = {};

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
preloadAudio();

function updateBackgroundMusic(level) {
  const musicIndex = Math.min(level - 1, backgroundMusicFiles.length - 1);
  const newSrc = window.location.origin + "/" + backgroundMusicFiles[musicIndex];
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
        currentBackgroundMusic = null;
      });
  } else {
    console.log("Music unchanged, already playing:", newSrc);
  }
}

let provider, signer, userAddress;

async function connectWallet() {
  console.log("connectWallet function triggered");
  if (!window.ethereum) {
    console.log("No Web3 wallet detected");
    alert("Please install a Web3 wallet like MetaMask to play.");
    document.getElementById("message").innerText = "No Web3 wallet detected.";
    return;
  }

  try {
    console.log("Requesting accounts...");
    provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    if (!accounts || accounts.length === 0) throw new Error("No accounts found.");
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    console.log("Connected address:", userAddress);

    const network = await provider.getNetwork();
    console.log("Connected to network:", network.name, "Chain ID:", network.chainId);
    if (network.chainId !== BASE_CHAIN_ID) {
      console.log("Switching to Base network...");
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${BASE_CHAIN_ID.toString(16)}` }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          console.log("Adding Base network...");
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
    console.log("Calling checkPepecBalance...");
    await checkPepecBalance();
  } catch (err) {
    console.error("Wallet connection error:", err);
    document.getElementById("message").innerText = `Error: ${err.message || "Unknown error"}`;
  }
}

async function checkPepecBalance() {
  try {
    console.log("checkPepecBalance started");
    if (!provider || !userAddress) {
      console.log("Wallet not connected");
      throw new Error("Wallet not connected.");
    }
    const network = await provider.getNetwork();
    console.log("Network check:", network.name, "Chain ID:", network.chainId);
    if (network.chainId !== BASE_CHAIN_ID) {
      console.log("Wrong network detected");
      throw new Error("Wallet not on Base network (chain ID 8453).");
    }

    const contract = new ethers.Contract(pepecContractAddress, pepecABI, provider);
    console.log("Checking balance for:", userAddress);
    const balance = await contract.balanceOf(userAddress);
    const formattedBalance = ethers.utils.formatUnits(balance, TOKEN_DECIMALS);
    console.log("Balance:", formattedBalance, "$PEPEC");

    if (balance.lt(requiredBalance)) {
      console.log("Insufficient balance:", formattedBalance, "<", REQUIRED_PEPEC_AMOUNT);
      document.getElementById("message").innerText = `Insufficient $PEPEC (${formattedBalance} < ${REQUIRED_PEPEC_AMOUNT})`;
    } else {
      console.log("Balance sufficient, starting game...");
      document.getElementById("message").innerText = `Balance verified (${formattedBalance} $PEPEC) – Starting game!`;
      await checkImagesLoaded();
      console.log("Images loaded, calling startGame...");
      startGame();
      loadLeaderboard();
    }
  } catch (err) {
    console.error("Error in checkPepecBalance:", err);
    document.getElementById("message").innerText = `Error checking balance: ${err.reason || err.message || "Contract call failed"}`;
    if (err.code === "CALL_EXCEPTION") {
      console.log("Contract call reverted, starting in test mode...");
      document.getElementById("message").innerText = "Balance check failed – Starting game anyway (test mode)";
      await checkImagesLoaded();
      console.log("Images loaded in test mode, calling startGame...");
      startGame();
      loadLeaderboard();
    }
  }
}

console.log("Binding Wallet Connect button...");
const connectWalletBtn = document.getElementById("connectWalletBtn");
if (connectWalletBtn) {
  console.log("Button found, adding event listener...");
  connectWalletBtn.addEventListener("click", connectWallet);
} else {
  console.error("Wallet Connect button not found in DOM!");
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const frogImg = new Image(); frogImg.src = "silver_robot_frog.png";
const carImg = new Image(); carImg.src = "car.png";
const car2Img = new Image(); car2Img.src = "car2.png";
const car3Img = new Image(); car3Img.src = "car3.png";
const bushImg = new Image(); bushImg.src = "bush.png";
const carImages = [carImg, car2Img, car3Img];

async function checkImagesLoaded() {
  const images = [frogImg, carImg, car2Img, car3Img, bushImg];
  console.log("Checking image load status...");
  const loadPromises = images.map(img => 
    new Promise((resolve, reject) => {
      if (img.complete && img.naturalWidth) {
        console.log(`Image loaded: ${img.src}`);
        resolve();
      } else {
        img.onload = () => {
          console.log(`Image loaded: ${img.src}`);
          resolve();
        };
        img.onerror = () => {
          console.error(`Image failed to load: ${img.src}`);
          reject();
        };
      }
    })
  );

  const timeoutPromise = new Promise(resolve => {
    setTimeout(() => {
      console.log("Image loading timeout reached, proceeding anyway...");
      resolve();
    }, 5000);
  });

  await Promise.race([Promise.all(loadPromises), timeoutPromise]);
  console.log("All images processed (loaded or timed out)");
}

let frog, obstacles, score, level, gameOver, highestY;
let highScore = 0;
let bushes = [];

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, 100);
  gradient.addColorStop(0, "#87CEEB");
  gradient.addColorStop(1, "#B0E0E6");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, 100);
}

function generateBushes() {
  bushes.length = 0;
  for (let i = 0; i < 8; i++) {
    bushes.push({
      x: Math.random() * canvas.width,
      y: Math.random() > 0.5 ? Math.random() * 80 : 520 + Math.random() * 80,
      width: 40,
      height: 40
    });
  }
}

function drawGrassAndBushes() {
  const grassGradient = ctx.createLinearGradient(0, 0, 0, 600);
  grassGradient.addColorStop(0, "#4CAF50");
  grassGradient.addColorStop(1, "#388E3C");
  ctx.fillStyle = grassGradient;
  ctx.fillRect(0, 0, canvas.width, 100);
  ctx.fillRect(0, 500, canvas.width, 100);

  bushes.forEach(bush => {
    ctx.shadowBlur = 5;
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.drawImage(bushImg, bush.x, bush.y, bush.width, bush.height);
    ctx.shadowBlur = 0;
  });
}

function drawRoad() {
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 100, canvas.width, 20);
  ctx.fillRect(0, 480, canvas.width, 20);
  ctx.fillStyle = "#616161";
  ctx.fillRect(0, 120, canvas.width, 360);
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 3;
  ctx.setLineDash([20, 15]);
  for (let laneY = 170; laneY < 470; laneY += 50) {
    ctx.beginPath();
    ctx.moveTo(0, laneY);
    ctx.lineTo(canvas.width, laneY);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function resetGame() {
  frog = { x: 375, y: 550, width: 50, height: 50 };
  score = 0;
  level = 1;
  gameOver = false;
  highestY = 550;
  generateBushes();
  initObstacles();
  updateBackgroundMusic(level);
  updateUI();
}

function initObstacles() {
  obstacles = [];
  const numCars = 2 + (level - 1) * 2;
  const minSpeed = 2.5 + (level - 1) * 0.5;
  for (let i = 0; i < numCars; i++) {
    let laneY = 120 + (i % 8) * 50;
    let speed = (Math.random() * 1 + minSpeed) * (Math.random() > 0.5 ? 1 : -1);
    obstacles.push({
      x: speed > 0 ? -60 : canvas.width,
      y: laneY,
      width: 60,
      height: 30,
      speed,
      img: carImages[Math.floor(Math.random() * carImages.length)]
    });
  }
}

function drawCar(obstacle) {
  ctx.save();
  if (obstacle.speed < 0) {
    ctx.scale(-1, 1);
    ctx.drawImage(obstacle.img, -obstacle.x - obstacle.width, obstacle.y, obstacle.width, obstacle.height);
  } else {
    ctx.drawImage(obstacle.img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  }
  ctx.restore();
}

function updateUI() {
  document.getElementById("score").innerText = `Score: ${score}`;
  document.getElementById("highScore").innerText = `High Score: ${highScore}`;
  document.getElementById("level").innerText = `Level: ${level}`;
}

async function startGame() {
  console.log("startGame triggered");
  document.getElementById("login").style.opacity = "0";
  setTimeout(() => {
    console.log("Hiding login container");
    document.getElementById("login").style.display = "none";
    document.getElementById("login").style.opacity = "1";
  }, 300);
  resetGame();
  if (currentBackgroundMusic) {
    currentBackgroundMusic.play().catch(err => console.error("Error playing background music:", err));
  }
  console.log("Starting game loop...");
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  if (gameOver) {
    console.log("Game over, exiting loop");
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawGrassAndBushes();
  drawRoad();

  obstacles.forEach(obstacle => {
    obstacle.x += obstacle.speed;
    if (obstacle.speed > 0 && obstacle.x > canvas.width) obstacle.x = -obstacle.width;
    if (obstacle.speed < 0 && obstacle.x + obstacle.width < 0) obstacle.x = canvas.width;
    drawCar(obstacle);
    if (
      frog.x < obstacle.x + obstacle.width &&
      frog.x + frog.width > obstacle.x &&
      frog.y < obstacle.y + obstacle.height &&
      frog.y + frog.height > obstacle.y
    ) {
      handleGameOver();
    }
  });

  ctx.shadowBlur = 5;
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.drawImage(frogImg, frog.x, frog.y, frog.width, frog.height);
  ctx.shadowBlur = 0;

  updateUI();
  console.log("Game loop frame drawn");
  requestAnimationFrame(gameLoop);
}

const step = 15;
let touchStartX = null, touchStartY = null;
let lastTouchMove = 0;

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (gameOver) return;
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (gameOver || !touchStartX || !touchStartY) return;
  const now = Date.now();
  if (now - lastTouchMove < 50) return;
  const touch = e.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 20) {
      frog.x += step;
      if (frog.x > canvas.width - frog.width) frog.x = canvas.width - frog.width;
      lastTouchMove = now;
    } else if (deltaX < -20) {
      frog.x -= step;
      if (frog.x < 0) frog.x = 0;
      lastTouchMove = now;
    }
  } else {
    if (deltaY < -20) {
      frog.y -= step;
      if (frog.y < highestY) {
        score += 10;
        highestY = frog.y;
      }
      lastTouchMove = now;
    } else if (deltaY > 20) {
      frog.y += step;
      lastTouchMove = now;
    }
  }
  if (frog.y <= 50) levelUp();
  updateUI();
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

canvas.addEventListener("touchend", () => {
  touchStartX = null;
  touchStartY = null;
});

document.addEventListener("keydown", (e) => {
  if (gameOver) return;
  switch (e.key) {
    case "ArrowUp":
      frog.y -= step;
      if (frog.y < highestY) {
        score += 10;
        highestY = frog.y;
      }
      break;
    case "ArrowDown":
      frog.y += step;
      break;
    case "ArrowLeft":
      frog.x -= step;
      if (frog.x < 0) frog.x = 0;
      break;
    case "ArrowRight":
      frog.x += step;
      if (frog.x > canvas.width - frog.width) frog.x = canvas.width - frog.width;
      break;
  }
  if (frog.y <= 50) levelUp();
  updateUI();
});

function levelUp() {
  level++;
  score += 100;
  document.getElementById("message").innerText = `Level ${level}!`;
  frog.y = 550;
  highestY = 550;
  initObstacles();
  updateBackgroundMusic(level);
  updateUI();
}

function handleGameOver() {
  gameOver = true;
  if (currentBackgroundMusic) {
    currentBackgroundMusic.pause();
    currentBackgroundMusic.currentTime = 0;
  }
  document.getElementById("message").innerText = `Game Over! Score: ${score}`;
  if (score > highScore) highScore = score;
  submitScore(score);
  setTimeout(() => {
    document.getElementById("message").innerText += " | Restarting in 2 seconds...";
    setTimeout(startGame, 2000);
  }, 100);
}

async function submitScore(finalScore) {
  try {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userAddress || 'Anonymous', score: finalScore })
    });
    if (response.ok) {
      document.getElementById('message').innerText += ' | Score submitted!';
      loadLeaderboard();
    } else {
      throw new Error('Failed to submit score');
    }
  } catch (err) {
    console.error('Error submitting score:', err);
    document.getElementById('message').innerText += ' | Error submitting score';
  }
}

async function loadLeaderboard() {
  try {
    const response = await fetch('/api/leaderboard');
    const data = await response.json();
    console.log('Leaderboard data received:', data);
    const leaderboard = Array.isArray(data) ? data : [];
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = leaderboard.length === 0 
      ? '<li>No scores yet!</li>' 
      : leaderboard.map(entry => `<li>${entry.user.substring(0, 6)}...${entry.user.substring(entry.user.length - 4)} : ${entry.score}</li>`).join('');
  } catch (err) {
    console.error('Error loading leaderboard:', err);
    document.getElementById('leaderboardList').innerHTML = '<li>Error loading leaderboard</li>';
  }
}
