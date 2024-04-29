const electronInstaller = require("electron-winstaller");
// NB: Use this syntax within an async function, Node does not have support for
//     top-level await as of Node 12.

build = async () => {
  try {
    await electronInstaller.createWindowsInstaller({
      appDirectory: "./build/lumos-win32-x64",
      outputDirectory: "./build/installer64",
      name: "Lumos",
      title: "Lumos",
      authors: "Fizz",
      description: "Modbus RGB LED Control Progrom",
      exe: "Lumos.exe",
      setupExe: "Lumos_setup.exe",
      setupMsi: "Lumos_setup.msi",
      version: "0.0.2",
      // loadingGif: "./build/lumos-win32-x64/resources/app/public/loading.gif",
      // iconUrl: "./build/lumos-win32-x64/resources/app/public/lumos.ico",
    });
    console.log("It worked!");
  } catch (e) {
    console.log(`No dice: ${e.message}`);
  }
};

build();
