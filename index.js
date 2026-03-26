require("dotenv").config();
const { ethers } = require("ethers");

// ===== ENV =====
const RPC_URL = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
const PRIVATE_KEY = process.env.PRIVATE_KEY || null;

// ===== DEBUG =====
console.log("🚀 Iniciando bot...");
console.log("🔍 RPC:", RPC_URL ? "OK" : "FALTANDO");
console.log("🔍 PRIVATE_KEY:", PRIVATE_KEY ? "OK" : "FALTANDO");

// ===== VALIDAÇÃO =====
if (!PRIVATE_KEY) {
  console.log("❌ PRIVATE_KEY não encontrada - bot não vai operar");
}

// ===== CONFIG =====
const TOKEN_ADDRESS = "0x55d398326f99059ff775485246999027b3197955"; // USDT
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

// ===== ESTRATÉGIA =====
const BUY_TRIGGER = 0.98;
const SELL_TRIGGER = 1.02;

// ===== PROVIDER =====
const provider = new ethers.JsonRpcProvider(RPC_URL);

// ===== WALLET =====
let wallet = null;

if (PRIVATE_KEY) {
  try {
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log("✅ Wallet carregada");
  } catch (err) {
    console.log("❌ Erro ao criar wallet:", err.message);
  }
}

// ===== ROUTER CONTRACT =====
const router = new ethers.Contract(
  ROUTER,
  [
    "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)"
  ],
  provider
);

// ===== SIMULADOR DE PREÇO =====
let lastPrice = 0;

function gerarPreco() {
  const base = 625;
  const variacao = (Math.random() - 0.5) * 10;
  lastPrice = base + variacao;

  console.log("💰 Preço:", lastPrice.toFixed(2));
}

// ===== LOOP =====
setInterval(() => {
  gerarPreco();

  if (!wallet) {
    console.log("⛔ Bot parado (sem wallet)");
    return;
  }

  // Aqui futuramente entra compra/venda real
  console.log("🤖 Bot rodando...");
}, 3000);
