const { ethers } = require("ethers");

// ================= FETCH (corrige erro no Railway) =================
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// ================= ENV =================
const RPC_URL = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";

// ================= SETUP =================
const provider = new ethers.JsonRpcProvider(RPC_URL);

console.log("🚀 Bot iniciado (modo RPC)");

// ================= ESTADO =================
let baseBTC = null;
let baseBNB = null;

let inBTC = false;
let inBNB = false;

// ================= PREÇO REAL BTC (BINANCE) =================
async function getBTCPrice() {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
    const data = await res.json();
    return Number(data.price);
  } catch (err) {
    console.log("❌ BTC API erro:", err.message);
    return null;
  }
}

// ================= PREÇO REAL BNB (BINANCE) =================
async function getBNBPrice() {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT");
    const data = await res.json();
    return Number(data.price);
  } catch (err) {
    console.log("❌ BNB API erro:", err.message);
    return null;
  }
}

// ================= LOOP =================
async function loop() {
  while (true) {

    const btc = await getBTCPrice();
    const bnb = await getBNBPrice();

    if (!btc || !bnb) {
      console.log("⚠️ erro ao pegar preço");
    } else {

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

    await new Promise(r => setTimeout(r, 10000));
  }
}

loop();
