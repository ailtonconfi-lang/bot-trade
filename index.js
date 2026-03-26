require("dotenv").config();
const { ethers } = require("ethers");

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const TOKEN_ADDRESS = "SEU_TOKEN_AQUI";
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

// CONFIG
const BUY_TRIGGER = 0.98;
const SELL_TRIGGER = 1.02;
const STOP_LOSS = 0.95;
const TRAILING = 0.97;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const router = new ethers.Contract(ROUTER, [
  "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory)",
  "function swapExactETHForTokens(uint,uint,address[],address,uint) payable",
  "function swapExactTokensForETH(uint,uint,address[],address,uint)"
], wallet);

const token = new ethers.Contract(TOKEN_ADDRESS, [
  "function approve(address spender,uint amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint)"
], wallet);

let basePrice = null;
let highestPrice = 0;
let inPosition = false;

async function getPrice() {
  const amounts = await router.getAmountsOut(
    ethers.parseEther("0.01"),
    [WBNB, TOKEN_ADDRESS]
  );
  return Number(ethers.formatEther(amounts[1]));
}

async function approve() {
  const tx = await token.approve(ROUTER, ethers.MaxUint256);
  await tx.wait();
  console.log("✅ Approve OK");
}

async function buy() {
  console.log("🟢 COMPRANDO...");
  const tx = await router.swapExactETHForTokens(
    0,
    [WBNB, TOKEN_ADDRESS],
    wallet.address,
    Math.floor(Date.now()/1000)+300,
    { value: ethers.parseEther("0.01") }
  );
  await tx.wait();
  await approve();
  inPosition = true;
  console.log("✅ Comprado");
}

async function sell() {
  console.log("🔴 VENDENDO...");
  const balance = await token.balanceOf(wallet.address);

  const tx = await router.swapExactTokensForETH(
    balance,
    0,
    [TOKEN_ADDRESS, WBNB],
    wallet.address,
    Math.floor(Date.now()/1000)+300
  );
  await tx.wait();
  inPosition = false;
  console.log("✅ Vendido");
}

async function run() {
  try {
    const price = await getPrice();
    console.log("💰 Preço:", price);

    if (!basePrice) basePrice = price;

    // COMPRA
    if (!inPosition && price <= basePrice * BUY_TRIGGER) {
      await buy();
      basePrice = price;
      highestPrice = price;
    }

    // SE ESTÁ COMPRADO
    if (inPosition) {

      if (price > highestPrice) {
        highestPrice = price;
      }

      // STOP LOSS
      if (price <= basePrice * STOP_LOSS) {
        console.log("🛑 STOP LOSS");
        await sell();
        basePrice = price;
      }

      // TAKE PROFIT FIXO
      else if (price >= basePrice * SELL_TRIGGER) {
        console.log("🎯 TAKE PROFIT");
        await sell();
        basePrice = price;
      }

      // TRAILING PROFIT
      else if (price <= highestPrice * TRAILING) {
        console.log("📉 TRAILING SELL");
        await sell();
        basePrice = price;
      }
    }

  } catch (err) {
    console.log("❌ Erro:", err.message);
  }

  setTimeout(run, 10000);
}

run();