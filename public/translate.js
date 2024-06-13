var resources = {
  en: {
    translation: {
      configureDevice: "Configure Device",
      deviceName: "Device Name:",
      serialPort: "Serial Port:",
      modbusID: "Modbus ID:",
      baudRate: "Baud Rate:",
      connection: "Connection",
      queryLedStatus: "Query Led Status",
      allOn: "All On",
      allOff: "All Off",
      startLoop: "Start Loop",
      stopLoop: "Stop Loop",
      ledBrightness: "Led Brightness:",
      ledColor: "Led Color:",
      setBrightness: "Set Brightness",
      openLed: "Open Led:",
      closeLed: "Close Led:",
      scheduleTime: "Schedule Time:",
      groupSet: "Group Set",
      scheduleSet: "Schedule Set",
      changeMode: "Change Mode",
      baseInfo: "Base Info",
      id: "ID: ",
      status: "Status: ",
      baudRate: "Baud Rate : ",
      workMode: "Work Mode: ",
      brightness: "Brightness: ",
      effectiveBit: "Effective Bit: ",
      outputCircuits: "Output Circuits: ",
    },
  },
  zh: {
    translation: {
      configureDevice: "配置设备",
      deviceName: "设备名称:",
      serialPort: "串口名称:",
      modbusID: "Modbus ID:",
      baudRate: "波特率:",
      connection: "连接",
      queryLedStatus: "查询LED状态",
      allOn: "全开",
      allOff: "全关",
      startLoop: "开始循环",
      stopLoop: "停止循环",
      ledBrightness: "LED 亮度:",
      ledColor: "LED 颜色:",
      setBrightness: "设置亮度",
      openLed: "打开LED:",
      closeLed: "关闭LED:",
      scheduleTime: "执行时间:",
      groupSet: "批量设置",
      scheduleSet: "定时执行",
      changeMode: "切换模式",
      baseInfo: "基本信息",
      id: "ID: ",
      status: "设备状态: ",
      baudRate: "波特率: ",
      workMode: "工作模式: ",
      brightness: "亮度: ",
      effectiveBit: "有效位: ",
      outputCircuits: "输出寄存器: ",
    },
  },
};

function updateContent() {
  // 查询所有带有 data-i18n 属性的元素，并更新它们的文本
  document.querySelectorAll("[data-i18n]").forEach(function (elem) {
    var key = elem.getAttribute("data-i18n");
    elem.innerHTML = i18next.t(key); // 使用 i18next 的翻译方法
  });
}

i18next.init(
  {
    lng: "zh", // 这里可以根据用户设置或浏览器语言自动设置
    debug: true,
    resources: resources,
  },
  function (err, t) {
    // 初始化后更新页面内容
    updateContent();
  }
);
