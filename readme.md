# lumos

https://github.com/PmcFizz/lumos.git

要使用 Electron 将一个使用 Express 框架的 Node.js 应用程序打包成一个桌面应用程序，你需要遵循几个步骤来设置和配置 Electron。Electron 允许你将 Web 技术（HTML、CSS、JavaScript）用于构建跨平台的桌面应用程序。这里有一个基本的步骤指南来帮助你开始：

### 1. 安装 Electron

首先，你需要在你的项目中安装 Electron。打开你的项目的根目录，在命令行中运行以下命令：

```bash
npm init -y  # 如果你还没有package.json
npm install electron --save-dev
```

### 2. 创建 Electron 启动脚本

在你的项目根目录下创建一个名为 `main.js` 的新文件，这个文件将作为 Electron 的入口点。这里是一个基本的示例：

```javascript
const { app, BrowserWindow } = require("electron");
const path = require("path");
const express = require("express");

// 创建Express应用
const server = express();
const PORT = 3000;

// 你的Express路由设置
server.use(express.static("public")); // 假设你的前端文件在public目录

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
      preload: path.join(__dirname, "preload.js"), // 如果需要预加载脚本
    },
  });

  // 加载前端页面
  win.loadURL(`http://localhost:${PORT}`);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
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

现在你可以通过以下命令来运行你的 Electron 应用：

```bash
npm start
```

### 5. 打包你的 Electron 应用

为了将你的应用程序打包成一个可以分发的格式，你可以使用 `electron-packager` 或 `electron-builder`。这里是如何使用 `electron-packager` 的示例：

```bash
npm install electron-packager --save-dev
electron-packager . --platform=win32 --arch=x64  # 为Windows平台打包
```

这将创建一个包含你的应用程序的目录，可以在不需要安装 Node.js 的情况下运行。

以上步骤提供了一个将 Express 应用程序与 Electron 结合的基本框架。你可能需要根据你的具体需求进行调整和优化，比如处理不同的操作系统，优化打包配置等。

在 HTML 中使用 i18n（国际化）通常涉及到使用 JavaScript 库或框架，如 Angular、React、Vue 等，这些库或框架提供了内置的 i18n 支持。然而，如果你只想在纯 HTML 中实现基本的国际化，那么你可以使用 JavaScript 和一些简单的策略。

以下是一个基本的步骤指南：

定义语言数据：首先，你需要为每种语言定义一组翻译数据。这通常是一个 JavaScript 对象，其中键是原始文本，值是翻译后的文本。

```javascript
const translations = {
  en: {
    hello: "Hello",
    welcome: "Welcome to our website!",
  },
  fr: {
    hello: "Bonjour",
    welcome: "Bienvenue sur notre site web!",
  },
  // 添加其他语言...
};
```

检测用户语言：你可以使用 navigator.language 或 navigator.languages 来检测用户的首选语言。

javascript
const userLanguage = navigator.language || navigator.userLanguage;
应用翻译：根据检测到的用户语言，从翻译数据中选择相应的翻译，并将其应用到 HTML 元素中。这可以通过遍历 DOM 并替换文本内容来实现。

javascript
function applyTranslations(language) {
const langData = translations[language];
if (!langData) return; // 如果没有找到对应的语言数据，则不执行任何操作

// 遍历 DOM 并应用翻译
const elements = document.querySelectorAll('[data-i18n]');
elements.forEach(element => {
const key = element.getAttribute('data-i18n');
const translation = langData[key];
if (translation) {
element.textContent = translation;
}
});
}

// 应用用户语言的翻译
applyTranslations(userLanguage);
在 HTML 中，你可以使用 data-i18n 属性来标记需要翻译的文本：

html

<h1 data-i18n="hello"></h1>
<p data-i18n="welcome"></p>
处理语言切换：如果你想让用户能够切换语言，你可以添加一个事件监听器来捕获语言切换操作，并调用 applyTranslations 函数来更新翻译。
考虑使用库：虽然上述方法可以实现基本的国际化，但它相对简单且可能不适用于复杂的场景。对于更复杂的项目，考虑使用专门的 i18n 库或框架，如 i18next、polyglot.js 等，它们提供了更强大和灵活的功能。
服务器端渲染：如果你的应用使用服务器端渲染（SSR），你也可以在服务器端处理国际化，根据用户的语言偏好生成相应的 HTML 内容。这通常涉及到使用模板引擎和 i18n 库来动态生成和翻译页面内容。

## 持久化 定时任务

是的，`node-schedule`库在默认情况下将所有定时任务存储在应用的内存中。这意味着如果你的应用程序重启，所有的定时任务将会丢失，因为它们仅仅是在运行时内存中维护。要解决这个问题，你需要实现一种机制来持久化这些任务并在应用程序启动时重新加载它们。

以下是一种可能的解决方案，涉及将定时任务信息保存到一个数据库中，并在服务器启动时从数据库重新加载并重新安排这些任务：

1. **保存任务到数据库**：在创建新的定时任务时，同时将任务的相关信息（如执行时间和任何相关的任务描述或数据）保存到数据库中。

2. **应用启动时重新加载任务**：在应用启动时，从数据库读取所有预定的任务，并使用`node-schedule`重新安排它们。

以下是示例代码，演示如何在 Express 应用中实现这一机制：

```javascript
const express = require("express");
const bodyParser = require("body-parser");
const schedule = require("node-schedule");
const { JsonDB, Config } = require("node-json-db");

const db = new JsonDB(new Config("fizzDataBase", true, false, "/"));
const server = express();
const port = 666;

server.use(bodyParser.json());

// 从数据库加载并恢复定时任务
function loadAndScheduleJobs() {
  try {
    const allTasks = db.getData("/");
    for (let taskKey in allTasks) {
      const task = allTasks[taskKey];
      schedule.scheduleJob(new Date(task.date), function () {
        console.log(`Executing task: ${task.description}`);
        // 实现具体任务逻辑
      });
      console.log(`Task ${taskKey} rescheduled for ${task.date}`);
    }
  } catch (error) {
    console.error("Failed to load tasks from DB", error);
  }
}

// 添加定时任务的路由
server.post("/schedule", (req, res) => {
  const { date, task } = req.body;
  const taskId = `task_${new Date(date).getTime()}`; // 创建一个基于时间戳的任务ID
  const taskData = { date, description: task };

  // 将任务保存到数据库
  db.push(`/${taskId}`, taskData);

  // 计划任务
  schedule.scheduleJob(new Date(date), function () {
    console.log(`Executing task: ${task}`);
    db.delete(`/${taskId}`); // 任务完成后可以选择删除
  });

  res.send(`Task scheduled with ID: ${taskId}`);
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  loadAndScheduleJobs(); // 启动服务器时加载任务
});
```

在这个示例中，每个任务在被计划时都被保存到一个 JSON 数据库中，并且在服务器启动时被重新加载和安排。这个实现只是一个基本的例子，你可能需要根据实际的应用需求调整错误处理、任务存储结构以及任务恢复逻辑。在生产环境中，使用一个更健壮的数据库系统（如 MongoDB, PostgreSQL 等）来管理这些数据可能是更好的选择。

`asar extract .\dist\win-unpacked\resources\app.asar .\fizz\`
