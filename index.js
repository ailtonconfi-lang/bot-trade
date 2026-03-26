const { ethers } = require("ethers");

console.log("🚀 Bot iniciado");

// ================= RPC =================
const RPC_URL = "https://bsc-dataseed.binance.org/";
const provider = new ethers.JsonRpcProvider(RPC_URL);

// ================= PANCAKE =================
const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

const routerAbi = [
  "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)"
];

const router = new ethers.Contract(ROUTER, routerAbi, provider);

// ================= TOKENS =================
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const BTCB = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c";
const USDT = "0x55d398326f99059fF775485246999027B3197955";

// ================= ESTADO =================
let baseBTC = null;
let baseBNB = null;

let inBTC = false;
let inBNB = false;

// ================= PREÇO BTC =================
async function getBTCPrice() {
  try {
    const amountIn = ethers.parseUnits("1", 18);
    const path = [BTCB, WBNB, USDT];

    const amounts = await router.getAmountsOut(amountIn, path);

    return Number(ethers.formatUnits(amounts[2], 18));

  } catch (err) {
    console.log("❌ BTC erro:", err.message);
    return null;
  }
}

// ================= PREÇO BNB =================
async function getBNBPrice() {
  try {
    const amountIn = ethers.parseUnits("1", 18);
    const path = [WBNB, USDT];

    const amounts = await router.getAmountsOut(amountIn, path);

    return Number(ethers.formatUnits(amounts[1], 18));

  } catch (err) {
    console.log("❌ BNB erro:", err.message);
    return null;
  }
}

// ================= BOT =================
async function runBot() {

  const btc = await getBTCPrice();
  const bnb = await getBNBPrice();

  if (!btc || !bnb) {
    console.log("⚠️ erro ao pegar preço");
    return;
  }

  console.log("💰 BTC:", btc);
  console.log("💰 BNB:", bnb);

  // ===== BTC =====
  if (!baseBTC) baseBTC = btc;

  if (!inBTC && btc <= baseBTC * 0.995) {
    console.log("🟢 COMPRAR BTC");
    inBTC = true;
    baseBTC = btc;
  }

  if (inBTC && btc >= baseBTC * 1.005) {
    console.log("🔴 VENDER BTC");
    inBTC = false;
    baseBTC = btc;
  }

  // ===== BNB =====
  if (!baseBNB) baseBNB = bnb;

  if (!inBNB && bnb <= baseBNB * 0.995) {
    console.log("🟢 COMPRAR BNB");
    inBNB = true;
    baseBNB = bnb;
  }

  if (inBNB && bnb >= baseBNB * 1.005) {
    console.log("🔴 VENDER BNB");
    inBNB = false;
    baseBNB = bnb;
  }
}

// ================= LOOP =================
setInterval(runBot, 10000);
runBot();
