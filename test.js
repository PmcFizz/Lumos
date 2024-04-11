const deviceAddress = 1; // Modbus设备地址
const ledRegisterStartAddress = 10; // 寄存器起始地址，根据实际调整
const totalLeds = 32; // 总LED数
let currentLed = 0; // 当前点亮的LED编号

// 点亮下一个LED的函数
function activateNextLed() {
  // 计算要写入的寄存器值
  let register1 = 0;
  let register2 = 0;

  if (currentLed < 16) {
    register1 = 1 << currentLed; // 点亮第一个寄存器中的LED
  } else {
    register2 = 1 << (currentLed - 16); // 点亮第二个寄存器中的LED
  }

  // 更新当前LED编号，准备下一次迭代
  currentLed = (currentLed + 1) % totalLeds;

  console.log(currentLed, register1, register2)

  // // 将寄存器值写入Modbus设备
  // client.writeRegisters(ledRegisterStartAddress, [register1, register2])
  //   .then(() => {
  //     console.log(`Activated LED ${currentLed}`);
  //   })
  //   .catch((e) => {
  //     console.error(e);
  //   });
}


setInterval(activateNextLed, 1000)