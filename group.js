// 现在有15个保持寄存器，每个寄存器有16位，代表16个灯的状态。灯的编号是从1到15*16。按从低位到高位。
// 现在知道15个寄存器的值，并且要求关闭和开启几个灯。请求的数据结构如下：
// {open:[1,2,23,56],close:[4,9,53,78]}。
// open代表要开启的灯的编号，close表示要关闭的灯的编号。
// 请你根据现有的寄存器值，和请求参数，算出应该写入的15个寄存器值。使用nodejs语言来实现。只需写出算出值的函数。无需真正写入

function updateRegisters(registers, request) {
  // 将编号转换为寄存器和位位置
  function convertToPosition(lightNumber) {
    const registerIndex = Math.floor((lightNumber - 1) / 16);
    const bitPosition = (lightNumber - 1) % 16;
    return { registerIndex, bitPosition };
  }

  // 处理开启灯的操作
  request.open.forEach((lightNumber) => {
    const { registerIndex, bitPosition } = convertToPosition(lightNumber);
    registers[registerIndex] |= 1 << bitPosition; // 使用位或操作来开灯
  });

  // 处理关闭灯的操作
  request.close.forEach((lightNumber) => {
    const { registerIndex, bitPosition } = convertToPosition(lightNumber);
    registers[registerIndex] &= ~(1 << bitPosition); // 使用位与和位非操作来关灯
  });

  return registers;
}

// 示例使用
const currentRegisters = [
  0xffff, 0xffff, 0xffff, 0xffff, 0xffff, 0xffff, 0xffff, 0xffff, 0xffff,
  0xffff, 0xffff, 0xffff, 0xffff, 0xffff, 0xffff,
]; // 假设所有灯初始都是开启的
const request = {
  open: [1, 2, 23, 56],
  close: [4, 9, 53, 78],
};

const updatedRegisters = updateRegisters(currentRegisters, request);
console.log(updatedRegisters);
