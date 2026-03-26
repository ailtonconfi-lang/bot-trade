const { ethers } = require("ethers");

// ===== ENV =====
const RPC_URL = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// ===== SETUP =====
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY, provider) : null;

console.log("🚀 Bot iniciado (modo RPC)");

// ===== CONTRATOS =====
const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const routerAbi = [
  "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)"
];

const router = new ethers.Contract(ROUTER, routerAbi, provider);

// ===== TOKENS =====
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const BTCB = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c";
const USDT = "0x55d398326f99059fF775485246999027B3197955";

// ===== ESTADO =====
let baseBTC = null;
let baseBNB = null;
let inBTC = false;
let inBNB = false;

// ===== PEGAR PREÇO VIA PANCAKESWAP =====
async function getPrice(token) {
  try {
    const amountIn = ethers.parseUnits("1", 18);
    const path = [token, USDT];

    const amounts = await router.getAmountsOut(amountIn, path);

    const price = Number(ethers.formatUnits(amounts[1], 18));

    return price;

  } catch (err) {
    console.log("❌ Erro RPC:", err.message);
    return null;
  }
}

// ===== AÇÕES =====
async function buy(token) {
  console.log("🟢 COMPRANDO:", token);
}

async function sell(token) {
  console.log("🔴 VENDENDO:", token);
}

// ===== LOOP =====
setInterval(async () => {

  const btc = await getPrice(BTCB);
  const bnb = await getPrice(WBNB);

  if (!btc || !bnb) {
    console.log("⚠️ Erro ao pegar preço RPC");
    return;
  }

  console.log("💰 BTC:", btc);
  console.log("💰 BNB:", bnb);

  // BTC
  if (!baseBTC) baseBTC = btc;

  if (!inBTC && btc <= baseBTC * 0.995) {
    await buy("BTC");
    inBTC = true;
    baseBTC = btc;
  }

  if (inBTC && btc >= baseBTC * 1.005) {
    await sell("BTC");
    inBTC = false;
    baseBTC = btc;
  }

  // BNB
  if (!baseBNB) baseBNB = bnb;

  if (!inBNB && bnb <= baseBNB * 0.995) {
    await buy("BNB");
    inBNB = true;
    baseBNB = bnb;
  }

  if (inBNB && bnb >= baseBNB * 1.005) {
    await sell("BNB");
    inBNB = false;
    baseBNB = bnb;
  }

}, 10000);
