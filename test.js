// const deviceAddress = 1; // Modbus设备地址
// const ledRegisterStartAddress = 10; // 寄存器起始地址，根据实际调整
// const totalLeds = 32; // 总LED数
// let currentLed = 0; // 当前点亮的LED编号

// // 点亮下一个LED的函数
// function activateNextLed() {
//   // 计算要写入的寄存器值
//   let register1 = 0;
//   let register2 = 0;

//   if (currentLed < 16) {
//     register1 = 1 << currentLed; // 点亮第一个寄存器中的LED
//   } else {
//     register2 = 1 << (currentLed - 16); // 点亮第二个寄存器中的LED
//   }

//   // 更新当前LED编号，准备下一次迭代
//   currentLed = (currentLed + 1) % totalLeds;

//   console.log(currentLed, register1, register2)

//   // // 将寄存器值写入Modbus设备
//   // client.writeRegisters(ledRegisterStartAddress, [register1, register2])
//   //   .then(() => {
//   //     console.log(`Activated LED ${currentLed}`);
//   //   })
//   //   .catch((e) => {
//   //     console.error(e);
//   //   });
// }

// setInterval(activateNextLed, 1000)

function parseRGBRegisterToHex(hexValue) {
  // 将16进制值转换为二进制字符串
  let binaryString = parseInt(hexValue, 16).toString(2).padStart(15, "0");

  // 初始化存储结果的数组
  let hexColors = [];

  // 每3位解析一个RGB像素，转换为16进制颜色值
  for (let i = 0; i < binaryString.length; i += 3) {
    let red = parseInt(binaryString.charAt(i)) * 255; // R
    let green = parseInt(binaryString.charAt(i + 1)) * 255; // G
    let blue = parseInt(binaryString.charAt(i + 2)) * 255; // B

    // 将RGB值转换为16进制字符串
    let hexColor = ((red << 16) | (green << 8) | blue)
      .toString(16)
      .padStart(6, "0")
      .toUpperCase();
    hexColors.push(hexColor);
  }

  return hexColors;
}

// 示例
let hexValue = "1AC"; // 假设寄存器值
let hexColors = parseRGBRegisterToHex(hexValue);
console.log(hexColors);
