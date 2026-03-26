const { ethers } = require("ethers");

// ===== ENV =====
const RPC_URL = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// ===== SETUP =====
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY, provider) : null;

console.log("🚀 Bot iniciado");

// ===== ESTADO =====
let baseBTC = null;
let baseBNB = null;
let inBTC = false;
let inBNB = false;

// ===== FETCH COM TIMEOUT =====
async function fetchWithTimeout(url, timeout = 5000) {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), timeout)
    )
  ]);
}

// ===== PREÇO BTC =====
async function getPriceBTC() {
  try {
    const res = await fetchWithTimeout("https://api.coinbase.com/v2/prices/BTC-USD/spot");
    const data = await res.json();
    return parseFloat(data.data.amount);
  } catch {
    try {
      const res = await fetchWithTimeout("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
      const data = await res.json();
      return data.bitcoin.usd;
    } catch {
      console.log("❌ BTC sem preço");
      return null;
    }
  }
}

// ===== PREÇO BNB =====
async function getPriceBNB() {
  try {
    const res = await fetchWithTimeout("https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd");
    const data = await res.json();
    return data.binancecoin.usd;
  } catch {
    console.log("❌ BNB sem preço");
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

  const btc = await getPriceBTC();
  const bnb = await getPriceBNB();

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
