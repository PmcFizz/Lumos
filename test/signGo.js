const ModbusRTU = require("modbus-serial");
const client = new ModbusRTU();

const deviceAddress = 1; // Modbus设备地址
const ledRegisterStartAddress = 0; // 寄存器起始地址，根据实际调整
let n = 2; // 寄存器数量，可根据实际情况修改
const totalLeds = n * 16; // 总LED数
let currentLed = 0; // 当前点亮的LED编号

// 连接到Modbus RTU设备
client
  .connectRTUBuffered("/dev/ttyUSB0", { baudRate: 9600 }) // 修改为你的串行端口配置
  .then(setup)
  .catch((e) => {
    console.error(e);
  });

// 设置Modbus通信
function setup() {
  console.log("Connected to Modbus device.");
  client.setID(deviceAddress);

  // 开始循环点亮LED
  setInterval(activateNextLed, 1000); // 每1000毫秒（1秒）激活下一个LED
}

// 点亮下一个LED的函数
function activateNextLed() {
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
