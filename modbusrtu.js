/**
 *  寄存器0 - 【ID】（范围：1~255）[只能按键设置]
 *  寄存器1 - 【波特率】（范围：9600、19200、38400）[只能按键设置]
 *  寄存器2 - 【工作模式】（模式1、2、3）
 *  寄存器3 - 【DIM1灰度】（范围：0~255，与模式无关）
 *  寄存器4 - 【DIM2灰度】（范围：0~255，与模式无关）
 *  寄存器5 - 【DIM频率】（范围：1~5kHZ，与模式无关）
 *  寄存器6 - 【预留】
 *  寄存器7 - 【驱动板整体灰度】（范围：1~255，模式1专用）
 *  寄存器8 - 【寄存器有效位数】（范围：3~16，模式1专用）
 *  寄存器9 - 【驱动板输出路数】（范围：16~111*16）
 */
// create an empty modbus client
const ModbusRTU = require("modbus-serial");
const client = new ModbusRTU();

// open connection to a serial port
client.connectRTUBuffered("/dev/tty.usbserial-110", { baudRate: 9600 }, write);

function write() {
  client.setID(1);

  // 前9个寄存器是配置参数
  // 从第10个位置，写入4个寄存器的值
  client
    // .writeRegisters(10, [0xffff, 0xffff, 0xffff, 0xffff])
    .writeRegisters(10, [0x0000, 0x0000, 0x0000, 0x0000])
    .then(read);
}

function read() {
  // 从第0个位置，读取5个寄存器的值
  client
    .readHoldingRegisters(10, 5)
    .then(console.log);
}
