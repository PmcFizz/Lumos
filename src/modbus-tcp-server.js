const express = require("express");
const ModbusRTU = require("modbus-serial");
const app = express();
const port = 3000;

app.use(express.json()); // 中间件解析 JSON 请求体

// 模拟数据存储
const dataStore = {
  coils: new Array(1000).fill(false),
  holdingRegisters: new Array(1000).fill(0),
  inputRegisters: new Array(1000).fill(0),
};

// Modbus 功能向量
const vector = {
  getInputRegister: (addr, unitID) => dataStore.inputRegisters[addr],
  getHoldingRegister: (addr, unitID) => dataStore.holdingRegisters[addr],
  getCoil: (addr, unitID) => dataStore.coils[addr],
  setRegister: (addr, value, unitID) => {
    dataStore.holdingRegisters[addr] = value;
    console.log(`Register at address ${addr} set to ${value}`);
  },
  setCoil: (addr, value, unitID) => {
    dataStore.coils[addr] = value;
    console.log(`Coil at address ${addr} set to ${value}`);
  },
};

// 创建 Modbus TCP 服务器
new ModbusRTU.ServerTCP(
  vector,
  {
    host: "0.0.0.0",
    port: 502,
    debug: true,
    unitID: 1,
  },
  function (err) {
    if (err) console.error("Modbus server error:", err);
    else console.log("Modbus TCP Server is running");
  }
);

// API to write a register
app.post("/write-register", (req, res) => {
  const { address, value } = req.body;
  if (address == null || value == null) {
    return res.status(400).send("Missing address or value in request body");
  }
  vector.setRegister(address, value, 1);
  res.send(`Register at address ${address} set to ${value}`);
});

// API to read a register
app.get("/read-register/:address", (req, res) => {
  const address = parseInt(req.params.address);
  if (isNaN(address) || address < 0) {
    return res.status(400).send("Invalid address");
  }
  const value = vector.getHoldingRegister(address, 1);
  res.send({ address, value });
});

// 启动 Express 服务器
app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
