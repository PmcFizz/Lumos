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
    let binaryString = hexValue
      .toString(2)
      .padStart(15, "0")
      .split("")
      .reverse()
      .join("");

    // 初始化存储结果的数组
    // let hexColors = [];

    const colorOrder = {
      b: 0,
      r: 1,
      g: 2,
    };
    // 每3位解析一个RGB像素，转换为16进制颜色值
    for (let i = 0; i < binaryString.length; i += 3) {
      let red = parseInt(binaryString.charAt(i + colorOrder.r)) * 255; // R
      let green = parseInt(binaryString.charAt(i + colorOrder.g)) * 255; // G
      let blue = parseInt(binaryString.charAt(i + colorOrder.b)) * 255; // B

      // 将RGB值转换为16进制字符串
      let hexColor = ((red << 16) | (green << 8) | blue)
        .toString(16)
        .padStart(6, "0")
        .toUpperCase();
      rgbArr.push(hexColor);
    }

    // rgbArr.push(...hexColors);
  });

  return rgbArr;
}

// #000000 - 所有颜色都关闭
// #0000FF - 只有蓝色
// #00FF00 - 只有绿色
// #00FFFF - 绿色和蓝色
// #FF0000 - 只有红色
// #FF00FF - 红色和蓝色
// #FFFF00 - 红色和绿色
// #FFFFFF - 所有颜色都亮

const colors = [
  "000000",
  "0000FF",
  "00FF00",
  "00FFFF",
  "FF0000",
  "FF00FF",
  "FFFF00",
  "FFFFFF",
];

/**
 * 根据颜色索引和一个新的颜色，获取寄存器的值
 * @param {*} registers 所有寄存器的值
 * @param {*} globalColorIndex 全局的颜色索引，0起
 * @param {*} newColorIndex 新颜色的索引
 * @returns
 */
function updateRegisterValues(registers, globalColorIndex, newColorIndex) {
  // 二进制表示的8种可能的RGB颜色
  const colorMap = ["000", "001", "010", "011", "100", "101", "110", "111"];

  // 计算在哪个寄存器及该寄存器内的索引位置
  let registerIndex = Math.floor(globalColorIndex / 5);
  let colorIndexInRegister = globalColorIndex % 5;

  // 检查是否超出了寄存器的范围
  if (registerIndex >= registers.length) {
    throw new Error("Color index is out of the range of provided registers.");
  }

  // 获取要修改的寄存器的当前值
  let currentHexValue = registers[registerIndex];

  // 将当前16进制寄存器值转换为二进制字符串
  let binaryString = parseInt(currentHexValue, 16)
    .toString(2)
    .padStart(15, "0");

  // 获取新颜色的二进制表示
  let newColorBinary = colorMap[newColorIndex];

  // 计算需要修改的颜色在二进制字符串中的起始位置
  let startIndex = colorIndexInRegister * 3;

  // 更新二进制字符串的对应部分
  binaryString =
    binaryString.substring(0, startIndex) +
    newColorBinary +
    binaryString.substring(startIndex + 3);

  // 将更新后的二进制字符串转回16进制
  let newHexValue = parseInt(binaryString, 2)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  // 更新寄存器数组
  registers[registerIndex] = newHexValue;

  return registers;
}

// 示例使用
// let registers = ['1AC', '2B3']; // 假设这是从设备读取的寄存器值
// let globalColorIndex = 6;       // 要修改的全局颜色索引
// let newColorIndex = 3;          // 新颜色索引（对应颜色'011'）
// let updatedRegisters = updateRegisterValues(registers, globalColorIndex, newColorIndex);
// console.log(updatedRegisters);
