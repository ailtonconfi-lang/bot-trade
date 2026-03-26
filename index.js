const { ethers } = require("ethers");

// ===== ENV =====
const RPC_URL = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// ===== VALIDAÇÃO =====
if (!RPC_URL) {
  throw new Error("RPC_URL não definida no Railway");
}

if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY não definida no Railway");
}

// ===== CONFIG =====
const TOKEN_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // USDT (teste)

const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

// ===== ESTRATÉGIA =====
const BUY_TRIGGER = 0.98;
const SELL_TRIGGER = 1.02;
const STOP_LOSS = 0.95;
const TRAILING = 0.97;

// ===== SETUP =====
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY.trim(), provider);

// ===== CONTRATOS =====
const router = new ethers.Contract(
  ROUTER,
  [
    "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory)",
    "function swapExactETHForTokens(uint,uint,address[],address,uint) payable",
    "function swapExactTokensForETH(uint,uint,address[],address,uint)"
  ],
  wallet
);

const token = new ethers.Contract(
  TOKEN_ADDRESS,
  [
    "function approve(address spender,uint amount) returns (bool)",
    "function balanceOf(address owner) view returns (uint)"
  ],
  wallet
);

// ===== ESTADO =====
let basePrice = null;
let highestPrice = 0;
let inPosition = false;

// ===== PREÇO =====
async function getPrice() {
  const amounts = await router.getAmountsOut(
    ethers.parseEther("0.01"),
    [WBNB, TOKEN_ADDRESS]
  );

  return Number(ethers.formatEther(amounts[1]));
}

// ===== APPROVE =====
async function approve() {
  console.log("🔓 Approve...");
  const tx = await token.approve(ROUTER, ethers.MaxUint256);
  await tx.wait();
  console.log("✅ Approve OK");
}

// ===== BUY =====
async function buy() {
  console.log("🟢 COMPRANDO...");

  const tx = await router.swapExactETHForTokens(
    0,
    [WBNB, TOKEN_ADDRESS],
    wallet.address,
    Math.floor(Date.now() / 1000) + 300,
    {
      value: ethers.parseEther("0.01"),
    }
  );

  await tx.wait();
  await approve();

  inPosition = true;

  console.log("✅ Comprado");
}

// ===== SELL =====
async function sell() {
  console.log("🔴 VENDENDO...");

  const balance = await token.balanceOf(wallet.address);

  if (balance == 0n) {
    console.log("⚠️ Sem tokens pra vender");
    return;
  }

  const tx = await router.swapExactTokensForETH(
    balance,
    0,
    [TOKEN_ADDRESS, WBNB],
    wallet.address,
    Math.floor(Date.now() / 1000) + 300
  );

  await tx.wait();

  inPosition = false;

  console.log("✅ Vendido");
}

// ===== LOOP =====
async function run() {
  try {
    const price = await getPrice();
    console.log("💰 Preço:", price);

    if (!basePrice) {
      basePrice = price;
      console.log("📌 Base inicial:", basePrice);
      return;
    }

    // ===== COMPRA =====
    if (!inPosition && price <= basePrice * BUY_TRIGGER) {
      console.log("📉 Queda detectada → COMPRAR");
      await buy();

      basePrice = price;
      highestPrice = price;
    }

    // ===== GERENCIAMENTO =====
    if (inPosition) {
      if (price > highestPrice) {
        highestPrice = price;
      }

      // STOP LOSS
      if (price <= basePrice * STOP_LOSS) {
        console.log("🛑 STOP LOSS");
        await sell();
        basePrice = price;
      }

      // TAKE PROFIT
      else if (price >= basePrice * SELL_TRIGGER) {
        console.log("🎯 TAKE PROFIT");
        await sell();
        basePrice = price;
      }

      // TRAILING
      else if (price <= highestPrice * TRAILING) {
        console.log("📉 TRAILING SELL");
        await sell();
        basePrice = price;
      }
    }
  } catch (err) {
    console.log("❌ Erro:", err.message);
  }

  setTimeout(run, 10000);
}

run();