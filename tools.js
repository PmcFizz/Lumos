// 配置参数数组
const config = [
  { time: 2000, value: "1" },
  { time: 3000, value: "2" },
  { time: 7000, value: "3" },
  { time: 10000, value: "4" },
];

// 执行函数，接受一个value参数
function executeAction(value) {
  console.log(`${+new Date()} value: ${value}`);
}

// 用于计算总延迟的变量
let totalDelay = 0;

console.log(`${+new Date()} value: `);
// 循环配置数组，设置定时器
config.forEach((item) => {
  // 计算当前项目应该延迟的时间
  totalDelay += item.time;
  setTimeout(() => {
    executeAction(item.value);
  }, totalDelay);
});
