const { ethers } = require("ethers");

// ===== ENV =====
const RPC_URL = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// ===== DEBUG =====
console.log("🔍 RPC:", RPC_URL ? "OK" : "FALTANDO");
console.log("🔍 KEY:", PRIVATE_KEY ? "OK" : "FALTANDO");

// ===== VALIDAÇÃO (NÃO QUEBRA O BOT)
if (!PRIVATE_KEY) {
  console.log("⚠️ PRIVATE_KEY não encontrada - bot não vai operar");
}

// ===== CONFIG =====
const TOKEN_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // USDT
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

// ===== ESTRATÉGIA =====
const BUY_TRIGGER = 0.98;
const SELL_TRIGGER = 1.02;

// ===== SETUP =====
const provider = new ethers.JsonRpcProvider(RPC_URL);

// ⚠️ só cria wallet se tiver chave
let wallet = null;
if (PRIVATE_KEY) {
  wallet = new ethers.Wallet(PRIVATE_KEY, provider);
}

// ===== CONTRATO =====
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

// ===== LOOP =====
async function run() {
  try {
    if (!router) {
      console.log("⛔ Bot parado (sem PRIVATE_KEY)");
      return;
    }

    const amounts = await router.getAmountsOut(
      ethers.parseEther("0.01"),
      [WBNB, TOKEN_ADDRESS]
    );

    const price = Number(ethers.formatEther(amounts[1]));

    console.log("💰 Preço:", price);

  } catch (err) {
    console.log("❌ Erro:", err.message);
  }

  setTimeout(run, 10000);
}

run();