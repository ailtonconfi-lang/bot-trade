require("dotenv").config();
const { ethers } = require("ethers");

// ===== ENV =====
const RPC_URL = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// ===== CONFIG =====
const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // Pancake
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const USDT = "0x55d398326f99059fF775485246999027B3197955";
const BTCB = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c";

// ===== ESTRATÉGIA =====
const BUY_TRIGGER = 0.98;
const SELL_TRIGGER = 1.02;
const AMOUNT_USDT = "5"; // valor por trade

// ===== SETUP =====
const provider = new ethers.JsonRpcProvider(RPC_URL);
let wallet = null;

if (PRIVATE_KEY) {
  wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("✅ Wallet carregada");
} else {
  console.log("❌ Sem PRIVATE_KEY");
}

const router = new ethers.Contract(ROUTER, [
  "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline)"
], wallet);

// ===== ESTADO =====
let lastPriceBNB = 0;
let lastPriceBTC = 0;

// ===== FUNÇÃO PREÇO =====
async function getPrice(token) {
  const amountIn = ethers.parseUnits("1", 18);
  const path = [token, USDT];
  const amounts = await router.getAmountsOut(amountIn, path);
  return Number(ethers.formatUnits(amounts[1], 18));
}

// ===== COMPRA =====
async function buy(token) {
  try {
    const amountIn = ethers.parseUnits(AMOUNT_USDT, 18);
    const path = [USDT, token];

    await router.swapExactTokensForTokens(
      amountIn,
      0,
      path,
      wallet.address,
      Math.floor(Date.now() / 1000) + 60
    );

    console.log("🟢 COMPROU", token);
  } catch (e) {
    console.log("❌ Erro compra:", e.message);
  }
}

// ===== VENDA =====
async function sell(token) {
  try {
    const amountIn = ethers.parseUnits("0.001", 18);
    const path = [token, USDT];

    await router.swapExactTokensForTokens(
      amountIn,
      0,
      path,
      wallet.address,
      Math.floor(Date.now() / 1000) + 60
    );

    console.log("🔴 VENDEU", token);
  } catch (e) {
    console.log("❌ Erro venda:", e.message);
  }
}

// ===== LOOP =====
async function runBot() {
  if (!wallet) {
    console.log("⛔ Bot parado (sem wallet)");
    return;
  }

  console.log("🚀 Bot rodando...");

  setInterval(async () => {
    try {
      const priceBNB = await getPrice(WBNB);
      const priceBTC = await getPrice(BTCB);

      console.log("💰 BNB:", priceBNB);
      console.log("💰 BTC:", priceBTC);

      // ===== BNB =====
      if (lastPriceBNB && priceBNB <= lastPriceBNB * BUY_TRIGGER) {
        await buy(WBNB);
      }

      if (lastPriceBNB && priceBNB >= lastPriceBNB * SELL_TRIGGER) {
        await sell(WBNB);
      }

      // ===== BTC =====
      if (lastPriceBTC && priceBTC <= lastPriceBTC * BUY_TRIGGER) {
        await buy(BTCB);
      }

      if (lastPriceBTC && priceBTC >= lastPriceBTC * SELL_TRIGGER) {
        await sell(BTCB);
      }

      lastPriceBNB = priceBNB;
      lastPriceBTC = priceBTC;

    } catch (e) {
      console.log("Erro loop:", e.message);
    }
  }, 10000);
}

runBot();
