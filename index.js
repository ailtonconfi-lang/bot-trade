const { ethers } = require("ethers");

// ===== ENV =====
const RPC_URL = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// ===== CONFIG =====
const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const USDT = "0x55d398326f99059fF775485246999027B3197955";
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const BTCB = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c";

// ===== AJUSTES =====
const BUY_DROP = -0.01;   // -1% compra
const SELL_RISE = 0.01;  // +1% vende

const TRADE_AMOUNT = "0.005"; // valor em BNB (teste pequeno!)


// ===== SETUP =====
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const router = new ethers.Contract(
  ROUTER,
  [
    "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable",
    "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external"
  ],
  wallet
);

let inPosition = false;
let lastPrice = null;

console.log("🚀 BOT PROFISSIONAL INICIADO");


// ===== PEGAR PREÇO =====
async function getPrice() {
  try {
    const amountIn = ethers.parseUnits("1", 18);
    const path = [BTCB, WBNB, USDT];

    const amounts = await router.getAmountsOut(amountIn, path);

    return Number(ethers.formatUnits(amounts[2], 18));

  } catch (err) {
    console.log("❌ erro preço:", err.message);
    return null;
  }
}


// ===== COMPRA =====
async function buy() {
  try {
    console.log("🟢 COMPRANDO...");

    const tx = await router.swapExactETHForTokens(
      0,
      [WBNB, BTCB],
      wallet.address,
      Math.floor(Date.now() / 1000) + 60 * 5,
      {
        value: ethers.parseEther(TRADE_AMOUNT)
      }
    );

    await tx.wait();
    console.log("✅ COMPRA REALIZADA");

  } catch (err) {
    console.log("❌ erro compra:", err.message);
  }
}


// ===== VENDA =====
async function sell() {
  try {
    console.log("🔴 VENDENDO...");

    const tx = await router.swapExactTokensForETH(
      ethers.parseUnits("0.001", 18),
      0,
      [BTCB, WBNB],
      wallet.address,
      Math.floor(Date.now() / 1000) + 60 * 5
    );

    await tx.wait();
    console.log("✅ VENDA REALIZADA");

  } catch (err) {
    console.log("❌ erro venda:", err.message);
  }
}


// ===== LOOP =====
async function loop() {
  while (true) {
    try {
      const price = await getPrice();

      if (!price) {
        console.log("⚠️ erro ao pegar preço");
      } else {
        console.log("🔥 BTC:", price);

        if (!lastPrice) {
          lastPrice = price;
        }

        const change = (price - lastPrice) / lastPrice;

        console.log("📊 Variação:", (change * 100).toFixed(2), "%");

        // COMPRA
        if (!inPosition && change <= BUY_DROP) {
          await buy();
          inPosition = true;
          lastPrice = price;
        }

        // VENDA
        if (inPosition && change >= SELL_RISE) {
          await sell();
          inPosition = false;
          lastPrice = price;
        }
      }

    } catch (err) {
      console.log("❌ erro geral:", err.message);
    }

    await new Promise(r => setTimeout(r, 5000));
  }
}

loop();
