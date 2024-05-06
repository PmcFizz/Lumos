// 读取另一台电脑，192.168.3.46:502 Modbus TCP
// create an empty modbus client
const ModbusRTU = require("modbus-serial");
const client = new ModbusRTU();

// open connection to a tcp line
client.connectTCP("192.168.3.46", { port: 502 });
client.setID(1);

// read the values of 10 registers starting at address 0
// on device number 1. and log the values to the console.
// 读取0-10个寄存器的值
setInterval(function () {
  client.readHoldingRegisters(0, 10, function (err, data) {
    console.log(data);
  });
}, 1000);

let i = 1;
setInterval(() => {
  // 从地址5的寄存器开始，写入i，i*2 + 1
  client.writeRegisters(5, [i, i * 2 + 1]).then(() => {
    console.log("write success");
    i++;
  });
}, 1000);
