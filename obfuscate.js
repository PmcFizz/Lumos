const fs = require("fs");
const path = require("path");
const { minify } = require("terser");
// const htmlMinifier = require("html-minifier").minify;

const optionsJS = {
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

const optionsHTML = {
  removeComments: true,
  collapseWhitespace: true,
  minifyJS: true,
  minifyCSS: true,
};

async function obfuscateDir(dir, outputDir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const outputPath = path.join(outputDir, path.relative("./src", filePath));
    const outputDirPath = path.dirname(outputPath);

    // Ensure output directory exists
    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath, { recursive: true });
    }

    if (fs.statSync(filePath).isDirectory()) {
      await obfuscateDir(filePath, outputDir); // 递归目录
    } else if (path.extname(file) === ".js") {
      console.log(`Obfuscating ${filePath}...`);
      const originalCode = fs.readFileSync(filePath, "utf-8");
      const result = await minify(originalCode, optionsJS);
      fs.writeFileSync(outputPath, result.code); // 写入混淆后的代码
    } else if (path.extname(file) === ".html") {
      console.log(`Minifying ${filePath}...`);
      const originalCode = fs.readFileSync(filePath, "utf-8");
      // const result = htmlMinifier(originalCode, optionsHTML);
      fs.writeFileSync(outputPath, originalCode); // 写入压缩后的 HTML
    }
  }
}

// Example directories to be obfuscated/minified
const directories = ["./src", "./public"]; // Add more directories as needed
directories.forEach((dir) => {
  obfuscateDir(dir, "./dist");
});
