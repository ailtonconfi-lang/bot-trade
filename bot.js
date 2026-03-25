import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

// ================= CONFIG =================

const RPC = "https://bsc-dataseed.binance.org/";
const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// PancakeSwap Router
const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

const routerABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)"
];

const router = new ethers.Contract(ROUTER, routerABI, wallet);

// ================= TOKENS =================

// WBNB
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

// USDT (BSC)
const USDT = "0x55d398326f99059fF775485246999027B3197955";

// TOKEN QUE VOCÊ QUER TRADE (troca aqui)
const TOKEN = "COLOQUE_O_TOKEN_AQUI";

// ================= CONFIG BOT =================

const AMOUNT_BNB = "0.01"; // valor por trade
const SLIPPAGE = 0.90; // 10%
const INTERVAL = 30000; // 30 segundos

// ================= FUNÇÕES =================

async function getPrice(path, amountIn) {
  const amounts = await router.getAmountsOut(amountIn, path);
  return amounts[amounts.length - 1];
}

// ================= BUY =================

async function buyToken() {
  try {
    console.log("🟢 Comprando token...");

    const amountIn = ethers.parseEther(AMOUNT_BNB);

    const path = [WBNB, TOKEN];

    const amounts = await router.getAmountsOut(amountIn, path);
    const amountOutMin = amounts[1] * BigInt(Math.floor(SLIPPAGE * 100)) / 100n;

    const tx = await router.swapExactETHForTokens(
      amountOutMin,
      path,
      wallet.address,
      Math.floor(Date.now() / 1000) + 60 * 5,
      {
        value: amountIn,
        gasLimit: 300000
      }
    );

    console.log("⏳ Aguardando compra...");
    await tx.wait();

    console.log("✅ Compra concluída");

  } catch (err) {
    console.log("❌ Erro na compra:", err.message);
  }
}

// ================= SELL =================

async function sellToken() {
  try {
    console.log("🔴 Vendendo token...");

    const tokenContract = new ethers.Contract(
      TOKEN,
      ["function balanceOf(address) view returns (uint)", "function approve(address spender, uint amount) returns (bool)"],
      wallet
    );

    const balance = await tokenContract.balanceOf(wallet.address);

    if (balance == 0n) {
      console.log("⚠️ Sem tokens para vender");
      return;
    }

    // Aprovar router
    const approveTx = await tokenContract.approve(ROUTER, balance);
    await approveTx.wait();

    const path = [TOKEN, WBNB];

    const amounts = await router.getAmountsOut(balance, path);
    const amountOutMin = amounts[1] * BigInt(Math.floor(SLIPPAGE * 100)) / 100n;

    const tx = await router.swapExactTokensForETH(
      balance,
      amountOutMin,
      path,
      wallet.address,
      Math.floor(Date.now() / 1000) + 60 * 5,
      {
        gasLimit: 300000
      }
    );

    console.log("⏳ Aguardando venda...");
    await tx.wait();

    console.log("✅ Venda concluída");

  } catch (err) {
    console.log("❌ Erro na venda:", err.message);
  }
}

// ================= LOOP =================

async function runBot() {
  console.log("🚀 BOT INICIADO 24H");

  while (true) {
    try {
      await buyToken();

      // espera um pouco antes de vender
      await new Promise(r => setTimeout(r, 15000));

      await sellToken();

    } catch (err) {
      console.log("Erro geral:", err.message);
    }

    console.log(`⏱️ Aguardando ${INTERVAL / 1000}s...`);
    await new Promise(r => setTimeout(r, INTERVAL));
  }
}

runBot();