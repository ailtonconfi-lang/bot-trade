const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

console.log("🚀 Bot iniciado");

// ================= ESTADO =================
let baseBTC = null;
let baseBNB = null;

let inBTC = false;
let inBNB = false;

// ================= PREÇO (COINGECKO - MAIS ESTÁVEL) =================
async function getPrices() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,binancecoin&vs_currencies=usd");
    const data = await res.json();

    return {
      btc: data.bitcoin.usd,
      bnb: data.binancecoin.usd
    };

  } catch (err) {
    console.log("❌ erro API:", err.message);
    return null;
  }
}

// ================= LOOP CONTROLADO =================
async function runBot() {

  const prices = await getPrices();

  if (!prices) {
    console.log("⚠️ erro ao pegar preço");
    return;
  }

  const btc = prices.btc;
  const bnb = prices.bnb;

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

// ================= INTERVALO (NÃO MORRE) =================
setInterval(runBot, 10000);

// primeira execução imediata
runBot();
