const { ethers } = require("ethers");

// fetch compatível Railway
global.fetch = require("node-fetch");

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

console.log("🚀 Iniciando bot...");

// ===== ESTADO =====
let baseBTC = null;
let baseBNB = null;
let inBTC = false;
let inBNB = false;

// ===== PREÇO REAL (BINANCE + FALLBACK) =====
async function getPrice(symbol) {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const data = await res.json();

    if (data.price) {
      return parseFloat(data.price);
    }

  } catch (e) {
    console.log("⚠️ Binance falhou...");
  }

  // fallback CoinGecko
  try {
    const url = symbol.includes("BTC")
      ? "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
      : "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd";

    const res = await fetch(url);
    const data = await res.json();

    if (symbol.includes("BTC")) {
      return data.bitcoin.usd;
    } else {
      return data.binancecoin.usd;
    }

  } catch (err) {
    console.log("❌ Erro geral API");
    return null;
  }
}

// ===== COMPRA =====
async function buy(token) {
  console.log("🟢 COMPRANDO:", token);
}

// ===== VENDA =====
async function sell(token) {
  console.log("🔴 VENDENDO:", token);
}

// ===== LOOP =====
setInterval(async () => {

  const btc = await getPrice("BTCUSDT");
  const bnb = await getPrice("BNBUSDT");

  if (!btc || !bnb) {
    console.log("⚠️ Erro ao pegar preço");
    return;
  }

  console.log("💰 BTC:", btc);
  console.log("💰 BNB:", bnb);

  // ===== BTC =====
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

  // ===== BNB =====
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
