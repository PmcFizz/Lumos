// 点亮下一个LED的函数
export function activateNextLed(client, n) {
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
