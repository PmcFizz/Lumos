/**
 * 不用费劲巴拉地破解了，我准备开源啦。
 */
const express = require("express");
const bodyParser = require("body-parser");
const ModbusRTU = require("modbus-serial");
const path = require("path");
const { v4: uuid } = require("uuid");
const morgan = require("morgan");
// 当应用被打包时，__dirname 的行为会变化
const basePath = __dirname;
// process.env.NODE_ENV === "production" ? process.resourcesPath : __dirname;

// const { JsonDB, Config } = require("node-json-db");
const deviceConfig = require("./config");
const client = new ModbusRTU();
// const db = new JsonDB(new Config("fizzDataBase", true, false, "/"));
const server = express();
const port = 666;
let interval = null;
let currentLed = 0;
server.use(morgan("dev"));
server.use(bodyParser.json()); // 支持 JSON 编码的请求体

server.use(express.static(path.join(basePath, "../", "public")));

// server.use(express.static("public")); // 设置静态文件目录
let registerNum = 20;

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
server.post("/configure-modbus", async (req, res) => {
  const { serialPort, modbusId, deviceName, baudRate = 9600 } = req.body;
  console.log("client.isOpen", client.isOpen);
  try {
    if (!client.isOpen) {
      await client.connectRTUBuffered(serialPort, { baudRate });
      client.setID(modbusId);
    }
    console.log("Connected to Modbus device.");
    // 读取前10个寄存器的值，索引为0-9
    const data = await client.readHoldingRegisters(0, 10);
    console.log(1);
    const deviceId = uuid();
    const deviceDetailId = uuid();
    registerNum = data.data[deviceConfig.outputCircuitsIndex];
    // await db.push("/devices", [
    //   { id: deviceId, deviceName, serialPort, modbusId },
    // ]);
    // console.log(2);
    // await db.push("/devices_detail", [
    //   { id: deviceDetailId, deviceId, deviceName, configData: data.data },
    // ]);
    console.log(3);
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
});

// 查询一个设备上所有灯的状态，传入设备id；
server.post("/query-device-light", async (req, res) => {
  const { deviceId } = req.body;
  // const item = await db.getData(`/devices_detail/0`);
  // const registerNum = item.configData[deviceConfig.outputCircuitsIndex];

  client
    .readHoldingRegisters(deviceConfig.ledRegisterStartAddress, registerNum)
    .then((data) => {
      // let lightsStates = parseRegisterValuesToLightStates(data.data);
      res.json({
        success: true,
        data: data.data,
        msg: `query ${registerNum} start from ${deviceConfig.ledRegisterStartAddress} `,
      });
    })
    .catch((error) => {
      console.error(error);
      res.json({ success: false, msg: error.message });
    });
});

// 开始循环亮灯
server.post("/start-loop-light-sign-led", (req, res) => {
  const { registerNum = 6 } = req.body;
  interval = setInterval(() => activateNextLed(registerNum), 100); // 每1000毫秒（1秒）激活下一个LED
  res.json({
    success: true,
    data: { msg: "开始循环，单灯1秒步进亮" },
  });
});

// 停止循环亮灯
server.post("/stop-loop-light-sign-led", (req, res) => {
  // const { interval } = req.body;
  if (interval) {
    clearInterval(interval);
  }
  res.json({ success: true, data: { msg: "清空亮灯循环" } });
});

// 点亮所有灯
server.post("/all-on-led", async (req, res) => {
  // const item = await db.getData(`/devices_detail/0`);
  // const registerNum = item.configData[deviceConfig.outputCircuitsIndex];

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
server.post("/all-off-led", async (req, res) => {
  // const item = await db.getData(`/devices_detail/0`);
  // const registerNum = item.configData[deviceConfig.outputCircuitsIndex];

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
server.post("/set-light", (req, res) => {
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
server.post("/query-led-status", async (req, res) => {
  // const { registerNum = 2 } = req.body; // 从请求体中获取灯的编号和状态
  // const item = await db.getData(`/devices_detail/0`);
  // const registerNum = item.configData[deviceConfig.outputCircuitsIndex];

  client
    .readHoldingRegisters(deviceConfig.ledRegisterStartAddress, registerNum)
    .then((data) => {
      // let lightsStates = parseRegisterValuesToLightStates(data.data);
      res.json({
        success: true,
        data: data.data,
        msg: `query ${registerNum} start from ${deviceConfig.ledRegisterStartAddress} `,
      });
    })
    .catch((error) => {
      console.error(error);
      res.json({ success: false, msg: error.message });
    });
});

// server.post("/set-led-brightness", async (req, res) => {
//   const { brightnessValue } = req.body;

//   if (interval) {
//     clearInterval(interval);
//     res.json({
//       success: true,
//       data: { brightnessValue },
//       msg: `change led brightness to ${brightnessValue} `,
//     });
//     return;
//   }
//   interval = setInterval(async () => {
//     brightness = brightness + delta;
//     brightness = brightness < 0 ? 0 : brightness;
//     await client.writeRegister(deviceConfig.brightnessIndex, brightness);
//     if (brightness <= 0 && delta < 0) {
//       delta = 20; // 改为增加
//     } else if (brightness >= 255 && delta > 0) {
//       delta = -20; // 改为减少
//     }
//   }, 100);
//   res.json({
//     success: true,
//     data: { brightnessValue },
//     msg: `change led brightness to ${brightnessValue} `,
//   });

//   // client
//   //   .writeRegister(deviceConfig.brightnessIndex, brightnessValue)
//   //   .then((data) => {
//   //     res.json({
//   //       success: true,
//   //       data: { brightnessValue },
//   //       msg: `change led brightness to ${brightnessValue} `,
//   //     });
//   //   })
//   //   .catch((error) => {
//   //     console.error(error);
//   //     res.json({ success: false, msg: error.message });
//   //   });
// });

server.post("/set-led-brightness", async (req, res) => {
  const { brightnessValue } = req.body;

  // 停止之前的循环
  if (interval) {
    clearInterval(interval);
    interval = null; // 清除定时器变量
  }

  let brightness = 100;
  let delta = -10; // 根据初始亮度决定初始增减方向

  // 定义一个异步函数执行写入操作
  async function updateBrightness() {
    try {
      // 写入亮度值到设备
      await client.writeRegister(deviceConfig.brightnessIndex, brightness);
      // 调整亮度值
      brightness += delta;
      // 限制亮度值在有效范围内
      if (brightness <= 0 && delta < 0) {
        brightness = 0;
        delta = 10; // 改为增加
      } else if (brightness >= 100 && delta > 0) {
        brightness = 100;
        delta = -10; // 改为减少
      }

      // 继续调整亮度，或者停止
      if ((delta > 0 && brightness <= 100) || (delta < 0 && brightness >= 0)) {
        setTimeout(updateBrightness, 100); // 等待100ms后继续
      }
    } catch (error) {
      console.error("Error writing to RS485 device:", error.message);
    }
  }

  // 开始循环更新亮度
  updateBrightness();

  // 响应请求
  res.json({
    success: true,
    data: { brightness },
    msg: `Change LED brightness to ${brightnessValue}`,
  });
});

server.post("/set-led-color", async (req, res) => {
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

/**
 * 写入单个寄存器值
 */
server.post("/writeRegister", async (req, res) => {
  const { dataAddress, value } = req.body;

  client
    .writeRegister(dataAddress, value)
    .then((data) => {
      res.json({
        success: true,
        data: { dataAddress, value },
        msg: `change index ${dataAddress}  to ${value} `,
      });
    })
    .catch((error) => {
      console.error(error);
      res.json({ success: false, msg: error.message });
    });
});

/**
 * 写入多个寄存器值
 */
server.post("/writeRegisters", async (req, res) => {
  const { dataAddress, values } = req.body;
  client
    .writeRegisters(dataAddress, values)
    .then((data) => {
      res.json({
        success: true,
        data: { dataAddress, values },
        msg: `change ${dataAddress} to ${values} `,
      });
    })
    .catch((error) => {
      console.error(error);
      res.json({ success: false, msg: error.message });
    });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
