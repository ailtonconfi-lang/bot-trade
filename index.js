require("dotenv").config();
const { ethers } = require("ethers");

// ================== CONFIG ==================
const RPC_URL = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// ================== DEBUG ==================
console.log("🚀 Iniciando bot...");
console.log("🔍 RPC:", RPC_URL ? "OK" : "FALTANDO");
console.log("🔍 PRIVATE_KEY:", PRIVATE_KEY ? "OK" : "FALTANDO");

// ================== VALIDAÇÃO ==================
if (!PRIVATE_KEY) {
  console.log("⛔ Bot parado (sem PRIVATE_KEY)");
}

// ================== ENDEREÇOS ==================
const TOKEN_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // USDT
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

// ================== ESTRATÉGIA ==================
const BUY_TRIGGER = 0.98;
const SELL_TRIGGER = 1.02;

// ================== PROVIDER ==================
const provider = new ethers.JsonRpcProvider(RPC_URL);

// ================== WALLET ==================
let wallet = null;
if (PRIVATE_KEY) {
  try {
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log("✅ Wallet conectada");
  } catch (err) {
    console.log("❌ Erro ao criar wallet:", err.message);
  }
}

// ================== CONTRATO ==================
let router = null;
if (wallet) {
  router = new ethers.Contract(
    ROUTER,
    [
      "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory)"
    ],
    wallet
  );
}

// ================== LOOP ==================
async function runBot() {
  try {
    if (!router) {
      console.log("⛔ Bot não pode rodar (sem wallet)");
      return;
    }

    const amountIn = ethers.parseEther("0.01");

    const amounts = await router.getAmountsOut(amountIn, [
      WBNB,
      TOKEN_ADDRESS
    ]);

    const price = Number(ethers.formatEther(amounts[1]));

    console.log("💰 Preço atual:", price);

    // Aqui depois a gente liga compra/venda real
  } catch (err) {
    console.log("❌ Erro:", err.message);
  }

  setTimeout(runBot, 10000);
}

// ================== START ==================
runBot();
