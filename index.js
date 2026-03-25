require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// =============================
// 🔥 ESTADO DO BOT
// =============================
let profitBNB = 0;
let trades = 0;
let lastPrice = 0;

// =============================
// 📈 SIMULADOR DE PREÇO
// =============================
function gerarPreco() {
  const base = 625;
  const variacao = (Math.random() - 0.5) * 10;
  lastPrice = base + variacao;

  console.log("💲 Preço:", lastPrice);
}

// roda a cada 1s
setInterval(gerarPreco, 1000);

// =============================
// 📊 ROTA STATS (ESSA QUE FALTAVA)
// =============================
app.get("/stats", (req, res) => {
  res.json({
    profitBNB,
    trades,
    lastPrice
  });
});

// =============================
// 🔁 SWAP (SIMULADO)
// =============================
app.post("/swap", (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    return res.json({ error: "Valor inválido" });
  }

  trades++;
  profitBNB += Number(amount) * 0.01;

  console.log("🔁 Swap feito:", amount);

  res.json({ success: true });
});

// =============================
// 🚀 START
// =============================
const PORT = 4000;

app.listen(PORT, () => {
  console.log("🚀 Backend rodando na porta " + PORT);
});