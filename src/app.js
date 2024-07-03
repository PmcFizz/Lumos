/**
 * 不用费劲巴拉地破解了，我准备开源啦。
 */
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const ModbusRTU = require("modbus-serial");
const path = require("path");
const { v4: uuid } = require("uuid");
const morgan = require("morgan");
const schedule = require("node-schedule");
const { updateRegisters } = require("../group");
// 当应用被打包时，__dirname 的行为会变化
const basePath = __dirname;
// process.env.NODE_ENV === "production" ? process.resourcesPath : __dirname;

const deviceConfig = require("./config");
const {
  saveDevice,
  saveDeviceConfig,
  saveDeviceRegister,
  getDeviceRegister,
  saveScheduleJob,
  queryScheduleJob,
} = require("./db");
const client = new ModbusRTU();
const server = express();
const port = 666;
let interval = null;
let currentLed = 0;
server.use(morgan("dev"));
server.use(bodyParser.json()); // 支持 JSON 编码的请求体

server.use(express.static(path.join(basePath, "../", "public")));

// 创建一个HTTP服务器
const wsserver = http.createServer(server);

// 创建WebSocket服务器并绑定到HTTP服务器
const wss = new WebSocket.Server({ server: wsserver });

wss.on("connection", (ws) => {
  console.log("Client connected");

  // 监听来自客户端的消息
  ws.on("message", (message) => {
    console.log(`Received: ${message}`);

    // 可以在这里处理消息，或将其广播给所有客户端
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (error) => {
    console.log("WebSocket error: " + error);
  });
});

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

function initializeRegisters() {
  let registers = new Array(10).fill(0); // 创建10个寄存器，初始值都是0
  registers[0] = 0b100 << 12; // 在第一个寄存器的最左边放置一个绿色像素（100）
  return registers;
}

function shiftGreen(registers) {
  let firstBits = registers[0] >>> 12; // 获取第一个寄存器最左边的3位
  for (let i = 0; i < registers.length - 1; i++) {
    registers[i] = (registers[i] << 3) | (registers[i + 1] >>> 12); // 向左移动3位并从下一个寄存器获取最左边的3位
  }
  registers[registers.length - 1] =
    (registers[registers.length - 1] << 3) | firstBits; // 处理最后一个寄存器，将第一个寄存器原来的最左3位放在最右边
}

function simulate() {
  let registers = initializeRegisters();
  setInterval(() => {
    shiftGreen(registers);
    console.log(registers.map((r) => r.toString(2).padStart(15, "0"))); // 输出所有寄存器的当前状态，用于调试
  }, 1000); // 每秒更新一次
}

// 添加定时任务的路由
server.post("/schedule", async (req, res) => {
  const { dateStr, taskData } = req.body;
  // 使用node-schedule计划一个任务
  const date = new Date(dateStr);

  schedule.scheduleJob(date, async () => {
    const currentValue = await getDeviceRegister();
    const newValue = updateRegisters(currentValue, taskData);
    client
      .writeRegisters(deviceConfig.ledRegisterStartAddress, newValue)
      .then(async () => {
        await saveDeviceRegister(newValue);
        // 这里写你需要执行的任务，比如删除记录
        console.log(`${new Date()} Executing task: ${taskData}`);
      })
      .catch((error) => {
        console.error(error);
      });
  });
  const jobId = uuid();
  await saveScheduleJob({ id: jobId, date, taskData });

  res.json({
    success: true,
    data: {
      dateStr,
      taskData,
    },
  });
});

// 查询一个设备上所有灯的状态，传入设备id；
server.post("/query-job-data", async (req, res) => {
  const jobList = await queryScheduleJob();
  res.json({
    success: true,
    data: jobList,
    msg: `query job data success`,
  });
});

// simulate(); // 开始模拟

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
    const deviceId = uuid();
    const deviceConfigId = uuid();
    registerNum = data.data[deviceConfig.outputCircuitsIndex];
    await saveDevice({ id: deviceId, deviceName, serialPort, modbusId });
    await saveDeviceConfig({
      id: deviceConfigId,
      deviceId,
      deviceName,
      configData: data.data,
    });
    // data.data = [1, 96, 1, 255, 1, 2, 0, 255, 16, 20];
    res.json({
      success: true,
      data: {
        deviceId,
        deviceConfigId,
        deviceName,
        serialPort,
        modbusId,
        status: "ON",
        configData: data.data,
      },
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
});

// 检查设备状态
server.post("/checkStatus", async (req, res) => {
  if (client.isOpen) {
    res.json({ success: true, data: true, message: "设备已连接" });
    return;
  }
  res.json({ success: true, data: false, message: "设备未连接" });
});

// 查询一个设备上所有灯的状态，传入设备id；
server.post("/query-device-light", async (req, res) => {
  const { deviceId } = req.body;
  // const item = await db.getData(`/devices_detail/0`);
  // const registerNum = item.configData[deviceConfig.outputCircuitsIndex];

  client
    .readHoldingRegisters(deviceConfig.ledRegisterStartAddress, registerNum)
    .then(async (data) => {
      await saveDeviceRegister(data.data);
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
    .then(async (data) => {
      await saveDeviceRegister(data.data);
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

server.post("/set-led-brightness", async (req, res) => {
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

// server.post("/set-led-brightness", async (req, res) => {
//   const { brightnessValue } = req.body;

//   // 停止之前的循环
//   if (interval) {
//     clearInterval(interval);
//     interval = null; // 清除定时器变量
//   }

//   let brightness = 255;
//   let maxValue = 255;
//   let minValue = 0;
//   let delta = -50; // 根据初始亮度决定初始增减方向

//   // 定义一个异步函数执行写入操作
//   async function updateBrightness() {
//     try {
//       // 写入亮度值到设备
//       await client.writeRegister(deviceConfig.brightnessIndex, brightness);
//       // 调整亮度值
//       brightness += delta;
//       // 限制亮度值在有效范围内
//       if (brightness <= minValue && delta < minValue) {
//         brightness = minValue;
//         delta = 10; // 改为增加
//       } else if (brightness >= maxValue && delta > minValue) {
//         brightness = maxValue;
//         delta = -10; // 改为减少
//       }

//       // 继续调整亮度，或者停止
//       // if (
//       //   (delta > minValue && brightness <= maxValue) ||
//       //   (delta < minValue && brightness >= minValue)
//       // ) {
//       //   setTimeout(updateBrightness, maxValue); // 等待100ms后继续
//       // }
//     } catch (error) {
//       console.error("Error writing to RS485 device:", error.message);
//     }
//   }

//   // 开始循环更新亮度

//   interval = setInterval(() => {
//     updateBrightness();
//   }, 1000);

//   // updateBrightness();

//   // 响应请求
//   res.json({
//     success: true,
//     data: { brightness },
//     msg: `Change LED brightness to ${brightnessValue}`,
//   });
// });

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

server.post("/loop-led-color", async (req, res) => {
  const { colorValue } = req.body;
  simulate();
  res.json({
    success: true,
    data: { colorValue },
    msg: `change led color to ${colorValue} `,
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

/**
 * 群组操作多个灯
 */
server.post("/groupLed", async (req, res) => {
  const { open, close } = req.body;
  console.log(open, close);
  const currentValue = await getDeviceRegister();
  console.log(currentValue);
  const newValue = updateRegisters(currentValue, { open, close });
  client
    .writeRegisters(deviceConfig.ledRegisterStartAddress, newValue)
    .then(async () => {
      await saveDeviceRegister(newValue);
      res.json({
        success: true,
        data: { open, close },
        msg: `success close:${close}, open:${open} `,
      });
    })
    .catch((error) => {
      console.error(error);
      res.json({ success: false, msg: error.message });
    });
});

wsserver.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
