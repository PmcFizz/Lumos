const express = require("express");
const bodyParser = require("body-parser");
const ModbusRTU = require("modbus-serial");
const client = new ModbusRTU();
const app = express();
const port = 666;
let interval = null;
let ledRegisterStartAddress = 10; // 寄存器开始

app.use(bodyParser.json()); // 支持 JSON 编码的请求体
app.use(express.static("public")); // 设置静态文件目录

// 点亮下一个LED的函数
function activateNextLed(currentLed, n) {
  // 初始化所有寄存器的值为0
  let registers = new Array(n).fill(0x0000);

  // 计算当前LED所在的寄存器索引和该寄存器内的位置
  let regIndex = Math.floor(currentLed / 16);
  let ledPosition = currentLed % 16;

  // 设置相应寄存器的值
  registers[regIndex] = 1 << ledPosition;

  // 更新当前LED编号，准备下一次迭代
  currentLed = (currentLed + 1) % totalLeds;

  // 将寄存器值写入Modbus设备
  client
    .writeRegisters(ledRegisterStartAddress, registers)
    .then(() => {
      console.log(`Activated LED ${currentLed + 1}`);
    })
    .catch((e) => {
      console.error(e);
    });
}

// 提供一个API端点接收Modbus配置并返回寄存器值
app.post("/configure-modbus", (req, res) => {
  const { serialPort, deviceId } = req.body;

  client
    .connectRTUBuffered(serialPort, { baudRate: 9600 })
    .then(() => {
      console.log("Connected to Modbus device.");
      client.setID(deviceId);

      // 读取前10个寄存器的值，索引为0-9
      return client.readHoldingRegisters(0, 10);
    })
    .then((data) => {
      res.json({ success: true, data: data.data });
    })
    .catch((error) => {
      console.error(error);
      res.json({ success: false, message: error.message });
    });
});

// 开始循环亮灯
app.post("/start-loop-light-sign-led", (req, res) => {
  const { registerNum = 2 } = req.body;
  interval = setInterval(() => activateNextLed(currentLed, registerNum), 1000); // 每1000毫秒（1秒）激活下一个LED
  res.json({
    success: true,
    data: { interval, msg: "开始循环，单灯1秒步进亮" },
  });
});

// 停止循环亮灯
app.post("/stop-loop-light-sign-led", (req, res) => {
  // const { interval } = req.body;
  if (interval) {
    clearInterval(interval);
  }
  res.json({ success: true, data: { interval, msg: "清空亮灯循环" } });
});

// 点亮所有灯
app.post("/light-all-led", (req, res) => {
  const { registerNum = 2 } = req.body;
  let registers = new Array(registerNum).fill(0xffff);
  // 将寄存器值写入Modbus设备
  client
    .writeRegisters(ledRegisterStartAddress, registers)
    .then(() => {
      res.json({ success: true, data: { interval, msg: "全部灯已点亮" } });
    })
    .catch((e) => {
      console.error(e);
      res.json({ success: false, data: { msg: "点亮报错" } });
    });
});

// 熄灭所有灯
app.post("/extinguish-all-led", (req, res) => {
  const { registerNum = 2 } = req.body;
  let registers = new Array(registerNum).fill(0x0000);
  // 将寄存器值写入Modbus设备
  client
    .writeRegisters(ledRegisterStartAddress, registers)
    .then(() => {
      res.json({ success: true, data: { interval, msg: "全部灯已熄灭" } });
    })
    .catch((e) => {
      console.error(e);
      res.json({ success: false, data: { msg: error.message } });
    });
});

// 操作单个灯,lightNum:灯编号从1开始，on：需要设置的灯的状态，true或false；
app.post("/set-light", (req, res) => {
  const { lightNumber, state } = req.body; // 从请求体中获取灯的编号和状态
  let registerAddress = Math.floor((lightNumber - 1) / 16); // 计算寄存器地址
  registerAddress = registerAddress + ledRegisterStartAddress;
  const bitPosition = (lightNumber - 1) % 16; // 计算在寄存器中的位位置

  client
    .readHoldingRegisters(registerAddress, 1)
    .then((data) => {
      let currentValue = data.data[0]; // 获取当前寄存器的值
      if (state) {
        currentValue |= 1 << bitPosition; // 点亮灯：将相应的位设置为1
      } else {
        currentValue &= ~(1 << bitPosition); // 熄灭灯：将相应的位设置为0
      }

      // 将更新后的寄存器值写回
      return client.writeRegister(registerAddress, currentValue);
    })
    .then(() => {
      res.json({
        success: true,
        msg: `Light ${lightNumber} has been turned ${state ? "on" : "off"}.`,
      });
    })
    .catch((error) => {
      console.error(error);
      res.json({ success: false, msg: error.message });
    });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
