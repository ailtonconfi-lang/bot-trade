const { ethers } = require("ethers");

// ===== ENV =====
const RPC_URL = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// ===== CONFIG =====
const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const BTCB = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c";

// ===== SETUP =====
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY, provider) : null;

console.log("🚀 Bot iniciado");

// ===== ESTADO =====
let basePriceBTC = null;
let basePriceBNB = null;
let inPositionBTC = false;
let inPositionBNB = false;

// ===== FUNÇÃO PREÇO REAL (BINANCE) =====
async function getRealPrice(symbol) {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const data = await res.json();
    return parseFloat(data.price);
  } catch (err) {
    console.log("Erro API:", err.message);
    return null;
  }
}

// ===== COMPRA =====
async function buy(token) {
  console.log("🟢 COMPRANDO", token);
  // (simplificado - depois melhoramos)
}

// ===== VENDA =====
async function sell(token) {
  console.log("🔴 VENDENDO", token);
  // (simplificado - depois melhoramos)
}

// ===== LOOP PRINCIPAL =====
setInterval(async () => {

  const priceBTC = await getRealPrice("BTCUSDT");
  const priceBNB = await getRealPrice("BNBUSDT");

  console.log("💰 BTC:", priceBTC);
  console.log("💰 BNB:", priceBNB);

  // ===== BTC =====
  if (!basePriceBTC) basePriceBTC = priceBTC;

  if (!inPositionBTC && priceBTC <= basePriceBTC * 0.995) {
    console.log("🟢 COMPRANDO BTC");
    await buy(BTCB);
    inPositionBTC = true;
    basePriceBTC = priceBTC;
  }

  if (inPositionBTC && priceBTC >= basePriceBTC * 1.005) {
    console.log("🔴 VENDENDO BTC");
    await sell(BTCB);
    inPositionBTC = false;
    basePriceBTC = priceBTC;
  }

  // ===== BNB =====
  if (!basePriceBNB) basePriceBNB = priceBNB;

  if (!inPositionBNB && priceBNB <= basePriceBNB * 0.995) {
    console.log("🟢 COMPRANDO BNB");
    await buy(WBNB);
    inPositionBNB = true;
    basePriceBNB = priceBNB;
  }

  if (inPositionBNB && priceBNB >= basePriceBNB * 1.005) {
    console.log("🔴 VENDENDO BNB");
    await sell(WBNB);
    inPositionBNB = false;
    basePriceBNB = priceBNB;
  }

}, 10000);
