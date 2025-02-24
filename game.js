// ===== CONFIGURATION =====
const REQUIRED_PEPEC_AMOUNT = "0"; // For testing, adjust for production
const TOKEN_DECIMALS = 18;
const requiredBalance = ethers.utils.parseUnits(REQUIRED_PEPEC_AMOUNT, TOKEN_DECIMALS);
const pepecContractAddress = "0x1196c6704789620514fD25632aBe15F69a50bc4f";
const pepecABI = ["function balanceOf(address owner) view returns (uint256)"];

console.log("Configuration loaded.");

// ===== WALLET CONNECTION & TOKEN BALANCE CHECK =====
let provider, signer, userAddress;

async function connectWallet() {
  console.log("Starting connectWallet function...");
  if (!window.ethereum) {
    console.log("No Ethereum provider detected.");
    alert("Please install a Web3 wallet like MetaMask to play.");
    document.getElementById("message").innerText = "No Web3 wallet detected.";
    return;
  }

  try {
    console.log("Attempting to connect wallet...");
    provider = new ethers.providers.Web3Provider(window.ethereum);
    console.log("Provider initialized:", provider);

    console.log("Requesting accounts...");
    const accounts = await provider.send("eth_requestAccounts", []);
    console.log("Accounts received:", accounts);

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please unlock your wallet.");
    }

    console.log("Getting signer...");
    signer = provider.getSigner();
    console.log("Getting user address...");
    userAddress = await signer.getAddress();
    console.log("Connected address:", userAddress);

    document.getElementById("message").innerText = `Wallet connected: ${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
    await checkPepecBalance();
  } catch (err) {
    console.error("Wallet connection error:", err);
    document.getElementById("message").innerText = `Error connecting wallet: ${err.message || "Unknown error"}`;
    throw err; // Re-throw for higher-level handling
  }
}

async function checkPepecBalance() {
  console.log("Starting checkPepecBalance function...");
  try {
    if (!provider || !userAddress) {
      throw new Error("Wallet not connected.");
    }

    console.log("Initializing contract...");
    const contract = new ethers.Contract(pepecContractAddress, pepecABI, provider);
    console.log("Contract initialized:", contract);
    const balance = await contract.balanceOf(userAddress);
    console.log("Balance fetched:", balance.toString());
    const formattedBalance = ethers.utils.formatUnits(balance, TOKEN_DECIMALS);

    if (balance.lt(requiredBalance)) {
      document.getElementById("message").innerText = `Insufficient $PEPEC balance (${formattedBalance} < ${REQUIRED_PEPEC_AMOUNT})`;
      return;
    } else {
      document.getElementById("message").innerText = `Balance verified (${formattedBalance} $PEPEC) – Starting game!`;
      startGame();
      // Load leaderboard immediately after wallet connection
      console.log("Loading leaderboard on wallet connect...");
      loadLeaderboard();
    }
  } catch (err) {
    console.error("Error checking $PEPEC balance:", err);
    document.getElementById("message").innerText = `Error checking balance: ${err.message || "Unknown error"}`;
    throw err;
  }
}

document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);
console.log("Wallet button listener attached.");

// ===== GAME SETUP =====
console.log("Starting game setup...");
const canvas = document.getElementById("gameCanvas");
console.log("Canvas element:", canvas);
const ctx = canvas.getContext("2d");
console.log("Canvas context:", ctx);

const frogImg = new Image();
frogImg.src = "silver_robot_frog.png";
frogImg.onload = () => console.log("Frog image loaded");
frogImg.onerror = () => console.error("Failed to load frog image");

const carImg = new Image();
carImg.src = "car.png";
carImg.onload = () => console.log("Car image loaded");
carImg.onerror = () => console.error("Failed to load car image");

const car2Img = new Image();
car2Img.src = "car2.png";
car2Img.onload = () => console.log("Car2 image loaded");
car2Img.onerror = () => console.error("Failed to load car2 image");

const car3Img = new Image();
car3Img.src = "car3.png";
car3Img.onload = () => console.log("Car3 image loaded");
car3Img.onerror = () => console.error("Failed to load car3 image");

const bushImg = new Image();
bushImg.src = "bush.png";
bushImg.onload = () => console.log("Bush image loaded");
bushImg.onerror = () => console.error("Failed to load bush image");

const carImages = [carImg, car2Img, car3Img];

// ===== GAME VARIABLES =====
console.log("Initializing game variables...");
let frog, obstacles, score, level, gameOver, highestY;
let highScore = 0;
let bushes = [];

function drawBackground() {
  console.log("Drawing background...");
  const gradient = ctx.createLinearGradient(0, 0, 0, 100);
  gradient.addColorStop(0, "#87CEEB");
  gradient.addColorStop(1, "#B0E0E6");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, 100);
}

function generateBushes() {
  console.log("Generating bushes...");
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
  console.log("Drawing grass and bushes...");
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
  console.log("Drawing road...");
  // Sidewalks (gray borders)
  ctx.fillStyle = "#808080"; // Gray for sidewalks
  ctx.fillRect(0, 100, canvas.width, 20); // Top sidewalk
  ctx.fillRect(0, 480, canvas.width, 20); // Bottom sidewalk

  // Road (gray)
  ctx.fillStyle = "#616161";
  ctx.fillRect(0, 120, canvas.width, 360); // Full road height (120 to 480)
  
  // Lane markings
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 3;
  ctx.setLineDash([20, 15]);
  for (let laneY = 170; laneY < 470; laneY += 50) { // Vertical lanes, same as before
    ctx.beginPath();
    ctx.moveTo(0, laneY);
    ctx.lineTo(canvas.width, laneY);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function resetGame() {
  console.log("Resetting game...");
  frog = { x: 375, y: 550, width: 50, height: 50 };
  score = 0;
  level = 1;
  gameOver = false;
  highestY = 550;
  generateBushes();
  initObstacles();
  updateUI();
}

function initObstacles() {
  console.log("Initializing obstacles...");
  obstacles = [];
  const baseCars = 2;
  const carsPerLevel = 2;
  const numCars = baseCars + (level - 1) * carsPerLevel;
  const baseSpeed = 2.5;
  const speedIncrement = 0.5;
  const minSpeed = baseSpeed + (level - 1) * speedIncrement;

  for (let i = 0; i < numCars; i++) {
    let laneIndex = i % 8;
    let laneY = 120 + laneIndex * 50; // Ensure cars start exactly in lanes (120 to 470)
    let speed = (Math.random() * 1 + minSpeed) * (Math.random() > 0.5 ? 1 : -1); // Base speed + random variation
    let randomBoost = Math.random() * 0.5; // Add random speed boost (0 to 0.5)
    speed += randomBoost * (Math.random() > 0.5 ? 1 : -1); // Apply boost in random direction

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
  console.log("Drawing car at x:", obstacle.x, "y:", obstacle.y);
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
  console.log("Updating UI...");
  document.getElementById("score").innerText = `Score: ${score}`;
  document.getElementById("highScore").innerText = `High Score: ${highScore}`;
  document.getElementById("level").innerText = `Level: ${level}`;
}

async function startGame() {
  console.log("Starting game...");
  try {
    document.getElementById("login").style.opacity = "0"; // Fade out login
    setTimeout(() => {
      document.getElementById("login").style.display = "none";
      document.getElementById("login").style.opacity = "1"; // Reset for next use
    }, 300); // Match CSS transition duration
    resetGame();
    requestAnimationFrame(gameLoop);
  } catch (err) {
    console.error("Error starting game:", err);
    document.getElementById("message").innerText = "Failed to start game. Please refresh.";
  }
}

function gameLoop() {
  console.log("Game loop running...");
  if (gameOver) {
    console.log("Game over, stopping loop...");
    return;
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas each frame
  drawBackground();
  drawGrassAndBushes();
  drawRoad();
  
  obstacles.forEach(obstacle => {
    let laneIndex = Math.floor((obstacle.y - 120) / 50);
    obstacle.y = 120 + laneIndex * 50; // Snap to exact lane position
    if (obstacle.y < 120) obstacle.y = 120; // Prevent going above top of road
    if (obstacle.y > 470) obstacle.y = 470; // Prevent going below bottom of road

    obstacle.x += obstacle.speed;

    if (obstacle.speed > 0 && obstacle.x > canvas.width) obstacle.x = -obstacle.width; // Right-moving wrap to left
    if (obstacle.speed < 0 && obstacle.x + obstacle.width < 0) obstacle.x = canvas.width; // Left-moving wrap to right
    
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

  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", function(e) {
  console.log("Key pressed:", e.key);
  if (gameOver) {
    console.log("Game over, ignoring keypress...");
    return;
  }

  const step = 15; // Kept slower frog movement for difficulty

  switch (e.key) {
    case "ArrowUp":
      frog.y -= step;
      if (frog.y < highestY) {
        score += 10;
        highestY = frog.y;
      }
      if (frog.x < 0) frog.x = 0;
      if (frog.x > canvas.width - frog.width) frog.x = canvas.width - frog.width;
      console.log("Frog moved up to x:", frog.x, "y:", frog.y);
      break;
    case "ArrowDown":
      frog.y += step;
      if (frog.x < 0) frog.x = 0;
      if (frog.x > canvas.width - frog.width) frog.x = canvas.width - frog.width;
      console.log("Frog moved down to x:", frog.x, "y:", frog.y);
      break;
    case "ArrowLeft":
      frog.x -= step;
      if (frog.x < 0) frog.x = 0;
      console.log("Frog moved left to x:", frog.x, "y:", frog.y);
      break;
    case "ArrowRight":
      frog.x += step;
      if (frog.x > canvas.width - frog.width) frog.x = canvas.width - frog.width;
      console.log("Frog moved right to x:", frog.x, "y:", frog.y);
      break;
  }

  if (frog.y <= 50) {
    console.log("Leveling up...");
    levelUp();
  }

  updateUI();
});

function levelUp() {
  console.log("Leveling up to level:", level + 1);
  level++;
  score += 100;
  document.getElementById("message").innerText = `Level ${level}!`;
  frog.y = 550;
  highestY = 550;
  initObstacles();
  updateUI();
}

function handleGameOver() {
  console.log("Game over triggered, score:", score);
  gameOver = true;
  document.getElementById("message").innerText = `Game Over! Score: ${score}`;

  if (score > highScore) {
    highScore = score;
    updateUI();
  }

  submitScore(score);
  setTimeout(() => {
    document.getElementById("message").innerText += " | Restarting in 2 seconds...";
    setTimeout(startGame, 2000);
  }, 100); // Slight delay for readability
}

function submitScore(finalScore) {
  console.log("Submitting score:", finalScore);
  fetch("/submitScore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: userAddress, score: finalScore })
  })
    .then(response => {
      if (!response.ok) throw new Error("Network response was not ok: " + response.statusText);
      return response.json();
    })
    .then(data => {
      console.log("Score submitted successfully:", data);
      document.getElementById("message").innerText += " | Score submitted!";
      loadLeaderboard();
    })
    .catch(err => {
      console.error("Error submitting score:", err);
      document.getElementById("message").innerText += " | Failed to submit score. Try again.";
    });
}

function loadLeaderboard() {
  console.log("Loading leaderboard...");
  fetch("/leaderboard")
    .then(response => {
      if (!response.ok) throw new Error("Network response was not ok: " + response.statusText);
      return response.json();
    })
    .then(data => {
      console.log("Leaderboard data received:", data);
      const leaderboardList = document.getElementById("leaderboardList");
      leaderboardList.innerHTML = "";
      data.forEach(entry => {
        let li = document.createElement("li");
        li.textContent = `${entry.user.substring(0, 6)}...${entry.user.substring(entry.user.length - 4)} : ${entry.score}`;
        leaderboardList.appendChild(li);
      });
    })
    .catch(err => {
      console.error("Error loading leaderboard:", err);
      document.getElementById("message").innerText += " | Failed to load leaderboard.";
    });
}
