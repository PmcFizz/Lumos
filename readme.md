# LUMOS

https://github.com/PmcFizz/LUMOS.git

要使用Electron将一个使用Express框架的Node.js应用程序打包成一个桌面应用程序，你需要遵循几个步骤来设置和配置Electron。Electron 允许你将Web技术（HTML、CSS、JavaScript）用于构建跨平台的桌面应用程序。这里有一个基本的步骤指南来帮助你开始：

### 1. 安装Electron

首先，你需要在你的项目中安装Electron。打开你的项目的根目录，在命令行中运行以下命令：

```bash
npm init -y  # 如果你还没有package.json
npm install electron --save-dev
```

### 2. 创建Electron启动脚本

在你的项目根目录下创建一个名为 `main.js` 的新文件，这个文件将作为Electron的入口点。这里是一个基本的示例：

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');

// 创建Express应用
const server = express();
const PORT = 3000;

// 你的Express路由设置
server.use(express.static('public')); // 假设你的前端文件在public目录

// 启动Express服务器
server.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});

// 创建和控制浏览器窗口
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js') // 如果需要预加载脚本
    }
  });

  // 加载前端页面
  win.loadURL(`http://localhost:${PORT}`);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### 3. 配置你的 `package.json`

在你的 `package.json` 文件中添加一个启动脚本和主入口点：

```json
{
  "name": "your-app",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  },
  "dependencies": {
    "express": "^4.17.1"
  },
  "devDependencies": {
    "electron": "^11.0.0"
  }
}
```

### 4. 运行你的应用

现在你可以通过以下命令来运行你的Electron应用：

```bash
npm start
```

### 5. 打包你的Electron应用

为了将你的应用程序打包成一个可以分发的格式，你可以使用 `electron-packager` 或 `electron-builder`。这里是如何使用 `electron-packager` 的示例：

```bash
npm install electron-packager --save-dev
electron-packager . --platform=win32 --arch=x64  # 为Windows平台打包
```

这将创建一个包含你的应用程序的目录，可以在不需要安装Node.js的情况下运行。

以上步骤提供了一个将Express应用程序与Electron结合的基本框架。你可能需要根据你的具体需求进行调整和优化，比如处理不同的操作系统，优化打包配置等。