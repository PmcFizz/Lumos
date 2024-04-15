const express = require("express");
const bodyParser = require("body-parser");
const ModbusRTU = require("modbus-serial");
const { v4: uuid } = require("uuid");
const { JsonDB, Config } = require("node-json-db");
const deviceConfig = require("./config");
const client = new ModbusRTU();
const db = new JsonDB(new Config("fizzDataBase", true, false, "/"));
const app = express();
const port = 666;
let interval = null;
let currentLed = 0;
app.use(bodyParser.json()); // 支持 JSON 编码的请求体
app.use(express.static("public")); // 设置静态文件目录

// 点亮下一个LED的函数
function activateNextLed(n) {
  // 初始化所有寄存器的值为0
  let registers = new Array(n).fill(0x0000);
  const totalLeds = n * 16;

  // 计算当前LED所在的寄存器索引和该寄存器内的位置
  let regIndex = Math.floor(currentLed / 16);
  let ledPosition = currentLed % 16;

  // 设置相应寄存器的值
  registers[regIndex] = 1 << ledPosition;

  // 更新当前LED编号，准备下一次迭代
  currentLed = (currentLed + 1) % totalLeds;

  // 将寄存器值写入Modbus设备
  client
    .writeRegisters(deviceConfig.ledRegisterStartAddress, registers)
    .then(() => {
      console.log(`Activated LED ${currentLed + 1}`);
    })
    .catch((e) => {
      console.error(e);
    });
}

function parseRegisterValuesToLightStates(registers) {
  let lightStates = [];

  registers.forEach((register, registerIndex) => {
    // 将寄存器值转换为16位二进制字符串
    let binaryString = register.toString(2).padStart(16, "0");

    // 遍历二进制字符串，从右向左（即从低位到高位）
    for (let bitIndex = 0; bitIndex < binaryString.length; bitIndex++) {
      // 计算灯的总编号
      let lightIndex = bitIndex + 1 + registerIndex * 16;
      // 判断当前灯的状态，true为亮（'1'），false为灭（'0'）
      let lightState = binaryString[binaryString.length - 1 - bitIndex] === "1";
      // 添加到结果数组
      lightStates.push({
        name: lightIndex.toString(),
        index: lightIndex,
        state: lightState,
      });
    }
  });

  return lightStates;
}

// 提供一个API端点接收Modbus配置并返回寄存器值
app.post("/configure-modbus", async (req, res) => {
  const { serialPort, modbusId, deviceName } = req.body;
  console.log("client.isOpen", client.isOpen);
  try {
    if (!client.isOpen) {
      await client.connectRTUBuffered(serialPort, { baudRate: 9600 });
      client.setID(modbusId);
    }
    console.log("Connected to Modbus device.");
    // 读取前10个寄存器的值，索引为0-9
    const data = await client.readHoldingRegisters(0, 10);
    const deviceId = uuid();
    const deviceDetailId = uuid();
    await db.push("/devices", [
      { id: deviceId, deviceName, serialPort, modbusId },
    ]);
    await db.push("/devices_detail", [
      { id: deviceDetailId, deviceId, deviceName, configData: data.data },
    ]);
    // data.data = [1, 96, 1, 255, 1, 2, 0, 255, 16, 20];
    res.json({
      success: true,
      data: {
        deviceId,
        deviceDetailId,
        deviceName,
        serialPort,
        modbusId,
        configData: data.data,
      },
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
  if (client.isOpen) {
  }
});

// 查询一个设备上所有灯的状态，传入设备id；
app.post("/query-device-light", async (req, res) => {
  const { deviceId } = req.body;
  const item = await db.getData(`/devices_detail/0`);
  const registerNum = item.configData[deviceConfig.outputCircuitsIndex];

  client
    .readHoldingRegisters(deviceConfig.ledRegisterStartAddress, registerNum)
    .then((data) => {
      let lightsStates = parseRegisterValuesToLightStates(data.data);
      res.json({
        success: true,
        data: lightsStates,
        msg: `query ${registerNum} start from ${deviceConfig.ledRegisterStartAddress} `,
      });
    })
    .catch((error) => {
      console.error(error);
      res.json({ success: false, msg: error.message });
    });
});

// 开始循环亮灯
app.post("/start-loop-light-sign-led", (req, res) => {
  const { registerNum = 2 } = req.body;
  interval = setInterval(() => activateNextLed(registerNum), 1000); // 每1000毫秒（1秒）激活下一个LED
  res.json({
    success: true,
    data: { msg: "开始循环，单灯1秒步进亮" },
  });
});

// 停止循环亮灯
app.post("/stop-loop-light-sign-led", (req, res) => {
  // const { interval } = req.body;
  if (interval) {
    clearInterval(interval);
  }
  res.json({ success: true, data: { msg: "清空亮灯循环" } });
});

// 点亮所有灯
app.post("/all-on-led", async (req, res) => {
  const item = await db.getData(`/devices_detail/0`);
  const registerNum = item.configData[deviceConfig.outputCircuitsIndex];

  let registers = new Array(registerNum).fill(0xffff);
  // 将寄存器值写入Modbus设备
  client
    .writeRegisters(deviceConfig.ledRegisterStartAddress, registers)
    .then(() => {
      res.json({ success: true, data: { interval, msg: "全部灯已点亮" } });
    })
    .catch((e) => {
      console.error(e);
      res.json({ success: false, data: { msg: "点亮报错" } });
    });
});

// 熄灭所有灯
app.post("/all-off-led", async (req, res) => {
  const item = await db.getData(`/devices_detail/0`);
  const registerNum = item.configData[deviceConfig.outputCircuitsIndex];

  let registers = new Array(registerNum).fill(0x0000);
  // 将寄存器值写入Modbus设备
  client
    .writeRegisters(deviceConfig.ledRegisterStartAddress, registers)
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
  registerAddress = registerAddress + deviceConfig.ledRegisterStartAddress;
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

// 查询灯的状态，传入设备ID；
app.post("/query-led-status", async (req, res) => {
  // const { registerNum = 2 } = req.body; // 从请求体中获取灯的编号和状态
  const item = await db.getData(`/devices_detail/0`);
  const registerNum = item.configData[deviceConfig.outputCircuitsIndex];

  client
    .readHoldingRegisters(deviceConfig.ledRegisterStartAddress, registerNum)
    .then((data) => {
      let lightsStates = parseRegisterValuesToLightStates(data.data);
      res.json({
        success: true,
        data: lightsStates,
        msg: `query ${registerNum} start from ${deviceConfig.ledRegisterStartAddress} `,
      });
    })
    .catch((error) => {
      console.error(error);
      res.json({ success: false, msg: error.message });
    });
});

app.post("/set-led-brightness", async (req, res) => {
  const { brightnessValue } = req.body;

  client
    .writeRegister(deviceConfig.brightnessIndex, brightnessValue)
    .then((data) => {
      res.json({
        success: true,
        data: { brightnessValue },
        msg: `change led brightness to ${brightnessValue} `,
      });
    })
    .catch((error) => {
      console.error(error);
      res.json({ success: false, msg: error.message });
    });
});

app.post("/set-led-color", async (req, res) => {
  const { colorValue } = req.body;

  client
    .writeRegister(deviceConfig.brightnessIndex, colorValue)
    .then((data) => {
      res.json({
        success: true,
        data: { colorValue },
        msg: `change led color to ${colorValue} `,
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
