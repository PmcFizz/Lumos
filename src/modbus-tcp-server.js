const ModbusRTU = require("modbus-serial");
const vector = {
  getInputRegister: function (addr, unitID) {
    // 获取输入寄存器
    return addr;
  },
  getHoldingRegister: function (addr, unitID) {
    // 获取保持寄存器
    return addr + 8000;
  },
  getCoil: function (addr, unitID) {
    // 获取线圈
    return addr % 2 === 0;
  },
  setRegister: function (addr, value, unitID) {
    // 设置寄存器
    console.log("Write to register", addr, value);
  },
  setCoil: function (addr, value, unitID) {
    // 设置线圈
    console.log("Write to coil", addr, value);
  },
  readDeviceIdentification: function (addr) {
    return {
      0x00: "VendorName",
      0x01: "ProductCode",
      0x02: "MajorMinorRevision",
    };
  },
};

// 创建服务器实例并监听
new ModbusRTU.ServerTCP(
  vector,
  {
    host: "0.0.0.0",
    port: 502,
    debug: true,
    unitID: 1,
  },
  (err) => {
    if (err) {
      console.error("Modbus TCP Server Error: ", err);
    } else {
      console.log("Modbus TCP Server is running");
    }
  }
);
