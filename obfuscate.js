const fs = require("fs");
const path = require("path");
const { minify } = require("terser");

const options = {
  compress: {
    drop_console: true, // 移除console语句
    drop_debugger: true, // 移除debugger语句
  },
  mangle: {
    toplevel: true, // 混淆顶层作用域的变量和函数名
  },
  output: {
    comments: false, // 不保留任何注释
    beautify: false, // 不美化输出
  },
};
async function obfuscateDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      await obfuscateDir(filePath); // 递归目录
    } else if (path.extname(file) === ".js") {
      console.log(`Obfuscating ${filePath}...`);
      const originalCode = fs.readFileSync(filePath, "utf-8");
      const result = await minify(originalCode, options);
      fs.writeFileSync(path.join(dir, "../dist", filePath), result.code); // 写入混淆后的代码
    }
  }
}

obfuscateDir("./src"); // 替换 './src' 为您的源码目录
