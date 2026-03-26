const { ethers } = require("ethers");

// ===== ENV =====
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!RPC_URL || !PRIVATE_KEY) {
  console.log("❌ Faltando RPC ou PRIVATE_KEY");
  process.exit(1);
}

// ===== CONFIG =====
const TOKENS = [
  {
    name: "BNB",
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
  },
  {
    name: "BTC",
    address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c" // BTCB
  }
];

const USDT = "0x55d398326f99059ff775485246999027b3197955";

const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

// ===== ESTRATÉGIA =====
const BUY_TRIGGER = 0.98;
const SELL_TRIGGER = 1.02;
const STOP_LOSS = 0.95;
const TRAILING = 0.97;

// ===== SETUP =====
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const router = new ethers.Contract(
  ROUTER,
  [
    "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)",
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)"
  ],
  wallet
);

console.log("🚀 Bot iniciado");

// ===== ESTADO =====
let lastPrices = {};
let bought = {};
let peakPrice = {};

// ===== FUNÇÃO PREÇO =====
async function getPrice(token) {
  try {
    const amountIn = ethers.parseUnits("1", 18);
    const path = [token.address, USDT];

    const amounts = await router.getAmountsOut(amountIn, path);
    return parseFloat(ethers.formatUnits(amounts[1], 18));
  } catch (e) {
    console.log("Erro preço:", token.name);
    return null;
  }
}

// ===== COMPRA =====
async function buy(token) {
  console.log(`🟢 Comprando ${token.name}...`);

  try {
    const tx = await router.swapExactETHForTokens(
      0,
      ["0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", token.address],
      wallet.address,
      Math.floor(Date.now() / 1000) + 60,
      { value: ethers.parseEther("0.001") } // valor pequeno
    );

    await tx.wait();
    console.log(`✅ Comprado ${token.name}`);
  } catch (e) {
    console.log("Erro compra:", e.message);
  }
}

// ===== VENDA =====
async function sell(token) {
  console.log(`🔴 Vendendo ${token.name}...`);
  // (simplificado — precisa approve depois se quiser full real)
}

// ===== LOOP =====
setInterval(async () => {
  for (let token of TOKENS) {
    const price = await getPrice(token);
    if (!price) continue;

    console.log(`💰 ${token.name}: ${price}`);

    if (!lastPrices[token.name]) {
      lastPrices[token.name] = price;
      continue;
    }

    const ratio = price / lastPrices[token.name];

    // COMPRA
    if (!bought[token.name] && ratio <= BUY_TRIGGER) {
      await buy(token);
      bought[token.name] = true;
      peakPrice[token.name] = price;
    }

    // ATUALIZA TOPO
    if (bought[token.name] && price > peakPrice[token.name]) {
      peakPrice[token.name] = price;
    }

    // VENDA
    if (
      bought[token.name] &&
      (price <= peakPrice[token.name] * TRAILING ||
        price <= lastPrices[token.name] * STOP_LOSS ||
        ratio >= SELL_TRIGGER)
    ) {
      await sell(token);
      bought[token.name] = false;
    }

    lastPrices[token.name] = price;
  }
}, 5000);
