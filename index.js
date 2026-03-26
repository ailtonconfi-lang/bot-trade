const { ethers } = require("ethers");
const https = require("https");

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

// ===== PREÇO REAL (BINANCE - CORRIGIDO) =====
function getRealPrice(symbol) {
  return new Promise((resolve) => {
    https.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, (res) => {
      let data = "";

      res.on("data", chunk => data += chunk);

      res.on("end", () => {
        try {
          const json = JSON.parse(data);

          if (!json.price) {
            console.log("❌ API inválida:", json);
            return resolve(null);
          }

          const price = parseFloat(json.price);

          if (isNaN(price)) {
            console.log("❌ Preço inválido");
            return resolve(null);
          }

          resolve(price);

        } catch (err) {
          console.log("❌ Erro parse:", err.message);
          resolve(null);
        }
      });

    }).on("error", (err) => {
      console.log("❌ Erro request:", err.message);
      resolve(null);
    });
  });
}

// ===== COMPRA =====
async function buy(token) {
  console.log("🟢 COMPRANDO", token);
}

// ===== VENDA =====
async function sell(token) {
  console.log("🔴 VENDENDO", token);
}

// ===== LOOP =====
setInterval(async () => {

  const priceBTC = await getRealPrice("BTCUSDT");
  const priceBNB = await getRealPrice("BNBUSDT");

  // proteção contra erro
  if (!priceBTC || !priceBNB) {
    console.log("⚠️ Preço inválido, pulando...");
    return;
  }

  console.log("💰 BTC:", priceBTC);
  console.log("💰 BNB:", priceBNB);

  // ===== BTC =====
  if (!basePriceBTC) basePriceBTC = priceBTC;

  if (!inPositionBTC && priceBTC <= basePriceBTC * 0.995) {
    await buy(BTCB);
    inPositionBTC = true;
    basePriceBTC = priceBTC;
  }

  if (inPositionBTC && priceBTC >= basePriceBTC * 1.005) {
    await sell(BTCB);
    inPositionBTC = false;
    basePriceBTC = priceBTC;
  }

  // ===== BNB =====
  if (!basePriceBNB) basePriceBNB = priceBNB;

  if (!inPositionBNB && priceBNB <= basePriceBNB * 0.995) {
    await buy(WBNB);
    inPositionBNB = true;
    basePriceBNB = priceBNB;
  }

  if (inPositionBNB && priceBNB >= basePriceBNB * 1.005) {
    await sell(WBNB);
    inPositionBNB = false;
    basePriceBNB = priceBNB;
  }

}, 10000);
