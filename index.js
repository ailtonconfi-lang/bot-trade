const { ethers } = require("ethers");

// ===== ENV =====
const RPC_URL = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// ===== CONFIG =====
const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const USDT = "0x55d398326f99059fF775485246999027B3197955";
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const BTCB = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c";

// ===== SETUP =====
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = PRIVATE_KEY
  ? new ethers.Wallet(PRIVATE_KEY, provider)
  : null;

const router = new ethers.Contract(
  ROUTER,
  ["function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"],
  provider
);

console.log("🚀 Bot iniciado");

// ===== PEGAR PREÇO REAL (SEM API EXTERNA) =====
async function getPrice(token) {
  try {
    const amountIn = ethers.parseUnits("1", 18);

    const path = token === WBNB
      ? [WBNB, USDT]
      : [token, WBNB, USDT];

    const amounts = await router.getAmountsOut(amountIn, path);

    const price = Number(ethers.formatUnits(amounts[amounts.length - 1], 18));

    return price;

  } catch (err) {
    console.log("❌ Erro RPC:", err.reason || err.message);
    return null;
  }
}

// ===== LOOP =====
async function loop() {
  while (true) {
    try {
      const btc = await getPrice(BTCB);
      const bnb = await getPrice(WBNB);

      if (!btc || !bnb) {
        console.log("⚠️ erro ao pegar preço");
      } else {
        console.log(`🔥 BTC: ${btc}`);
        console.log(`🔥 BNB: ${bnb}`);
      }

    } catch (err) {
      console.log("❌ erro geral:", err.message);
    }

    await new Promise(r => setTimeout(r, 5000));
  }
}

loop();
