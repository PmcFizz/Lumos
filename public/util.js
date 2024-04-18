/**
 * 解析寄存器值成灯的信号
 * @param {*} registers
 * @returns
 */
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

/**
 * 将多个寄存器翻译成颜色值
 * @param {*} registers
 * @returns
 */
function parseRGBRegisterToHex(registers) {
  let rgbArr = [];
  registers.forEach((hexValue) => {
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

    rgbArr.push(hexColors);
  });

  return rgbArr;
}
