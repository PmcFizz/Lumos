// create an empty modbus client
const ModbusRTU = require("modbus-serial");
const client = new ModbusRTU();

// open connection to a serial port
client.connectRTUBuffered("/dev/tty.usbserial-110", { baudRate: 9600 }, write);

function write() {
    client.setID(1);

    // 从第0个位置，写入4个寄存器的值
    client.writeRegisters(0, [0xffff , 0xffff, 0x0003, 0x0001])
        .then(read);
}

function read() {
    // 从第0个位置，读取5个寄存器的值
    client.readHoldingRegisters(0, 5)
        .then(console.log);
}