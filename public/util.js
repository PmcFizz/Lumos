(function (global) {
  /**
   * 解析寄存器值成灯的信号
   * @param {*} registers
   * @returns
   */
  global.parseRegisterValuesToLightStates = (registers) => {
    let lightStates = [];

    registers.forEach((register, registerIndex) => {
      // 将寄存器值转换为16位二进制字符串
      let binaryString = register.toString(2).padStart(16, "0");

      // 遍历二进制字符串，从右向左（即从低位到高位）
      for (let bitIndex = 0; bitIndex < binaryString.length; bitIndex++) {
        // 计算灯的总编号
        let lightIndex = bitIndex + 1 + registerIndex * 16;
        // 判断当前灯的状态，true为亮（'1'），false为灭（'0'）
        let lightState =
          binaryString[binaryString.length - 1 - bitIndex] === "1";
        // 添加到结果数组
        lightStates.push({
          name: lightIndex.toString(),
          index: lightIndex,
          state: lightState,
        });
      }
    });

    return lightStates;
  };

  /**
   * 将多个寄存器翻译成颜色值
   * @param {*} registers
   * @returns
   */
  global.parseRGBRegisterToHex = (registers) => {
    let rgbArr = [];
    registers.forEach((hexValue) => {
      // 将10进制值转换为二进制字符串
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
  };

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

  // rbg => bgr
  global.colorMap = {
    "000000": "000",
    "0000FF": "001",
    "00FF00": "010",
    "00FFFF": "011",
    FF0000: "100",
    FF00FF: "101",
    FFFF00: "110",
    FFFFFF: "111",
  };

  /**
   * 根据颜色索引和一个新的颜色，获取寄存器的值
   * @param {*} registers 所有寄存器的值
   * @param {*} hexColor 新颜色 16进制
   * @param {*} globalColorIndex 全局的灯珠，1起,如果没有则修改全部
   * @returns
   */
  global.updateRegisterValues = (registers, hexColor, globalColorIndex) => {
    // 将16进制RGB颜色转换为二进制字符串，然后只取RGB相应的位
    const red = parseInt(hexColor.substring(0, 2), 16) > 0 ? "1" : "0";
    const green = parseInt(hexColor.substring(2, 4), 16) > 0 ? "1" : "0";
    const blue = parseInt(hexColor.substring(4, 6), 16) > 0 ? "1" : "0";

    // 需要从高到低拼接 brg
    const newColorBinary = green + red + blue;

    // 如果没有传入灯珠序号，则修改全部灯珠颜色为hexColor
    if (globalColorIndex === undefined) {
      // 如果没有提供颜色索引，则更新所有寄存器的颜色

      return registers.map((register) => {
        // 构建全新的寄存器值，每个颜色3位，5个颜色共15位
        let updatedBinary = newColorBinary.repeat(5);
        // 可能需要在高位补充一个未使用的位
        return parseInt(updatedBinary, 2).toString(10);
      });
    }

    // 计算在哪个寄存器及该寄存器内的索引位置，索引从1开始计数
    let registerIndex = Math.floor((globalColorIndex - 1) / 5);
    let colorIndexInRegister = (globalColorIndex - 1) % 5;

    // 检查是否超出了寄存器的范围
    if (registerIndex >= registers.length) {
      throw new Error("Color index is out of the range of provided registers.");
    }

    // 获取要修改的寄存器的当前值
    let currentHexValue = registers[registerIndex];

    // 将当前10进制寄存器值转换为二进制字符串，注意16位，最高位是不使用的
    let binaryString = currentHexValue.toString(2).padStart(16, "0"); // 保证长度为16位

    // 计算需要修改的颜色在二进制字符串中的起始位置，反向计算，从低位开始
    let startIndex = 16 - (colorIndexInRegister * 3 + 3);

    // 更新二进制字符串的对应部分
    binaryString =
      binaryString.substring(0, startIndex) +
      newColorBinary +
      binaryString.substring(startIndex + 3);

    // 将更新后的二进制字符串转回10进制
    let newHexValue = parseInt(binaryString, 2).toString(10);

    // 更新寄存器数组
    registers[registerIndex] = newHexValue;

    return registers;
  };

  /**
   * 生成背景色相反的字体颜色
   */
  global.setRandomColor = (bgColor) => {
    // 生成随机颜色
    // var randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
    // document.getElementById("colorful-div").style.backgroundColor = randomColor;

    // 计算亮度
    // var bgColor = randomColor.slice(1); // 移除'#'
    var r = parseInt(bgColor.substring(0, 2), 16); // 红色分量
    var g = parseInt(bgColor.substring(2, 4), 16); // 绿色分量
    var b = parseInt(bgColor.substring(4, 6), 16); // 蓝色分量
    var brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // 根据亮度设置文字颜色
    if (brightness > 125) {
      return "black"; // 亮背景，用黑色文字
    } else {
      return "white"; // 暗背景，用白色文字
    }
  };

  /**
   *
   * @returns
   */
  global.addTwoMinutesAndFormat = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 2); // 加2分钟
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();

    // 将月、日、时、分、秒格式化为两位数
    const formattedMonth = month < 10 ? `0${month}` : month;
    const formattedDay = day < 10 ? `0${day}` : day;
    const formattedHour = hour < 10 ? `0${hour}` : hour;
    const formattedMinute = minute < 10 ? `0${minute}` : minute;
    const formattedSecond = second < 10 ? `0${second}` : second;

    // 格式化为YYYY-MM-DD HH:mm
    // 格式化为YYYY-MM-DD HH:mm:ss
    return `${year}-${formattedMonth}-${formattedDay} ${formattedHour}:${formattedMinute}:${formattedSecond}`;
  };
})(window);
