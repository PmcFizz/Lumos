(function (global) {
  let interval = null;
  let brightnessValue = 10;
  let isAutoQueryStatus = false;
  let registersValues = null;
  let clickRBGNum = null;
  const LED = "led";
  const RGB_LED = "rgb_led";
  let lightMode = LED; // led;rgb_led
  const allOnBtn = document.querySelector("#all-on-btn");
  const allOffBtn = document.querySelector("#all-off-btn");
  const startLoopBtn = document.querySelector("#start-loop-btn");
  const stopLoopBtn = document.querySelector("#stop-loop-btn");
  const queryBtn = document.querySelector("#query-btn");
  const setBrightnessInput = document.querySelector("#led-brightness");
  const setColorBtn = document.querySelector("#set-color-btn");
  const groupSetBtn = document.querySelector("#group-set-btn");
  const scheduleSetBtn = document.querySelector("#schedule-set-btn");
  const floatingDiv = document.getElementById("floatingDiv");
  const changeModeBtn = document.querySelector("#change-mode-btn");
  const rgbLEDContainer = document.querySelector("#rgb-led-container");
  const ledContainer = document.querySelector("#led-container");

  allOnBtn.addEventListener("click", setAllOn);
  allOffBtn.addEventListener("click", setAllOff);
  startLoopBtn.addEventListener("click", startLoop);
  stopLoopBtn.addEventListener("click", stopLoop);
  // queryBtn.addEventListener("click", changeQueryWay); // changeQueryWay; queryLedStatus

  queryBtn.addEventListener("click", queryLedStatus);

  setBrightnessInput.addEventListener("change", setBrightness);
  // setColorBtn.addEventListener("click", setColor);
  groupSetBtn.addEventListener("click", groupSetLed);
  scheduleSetBtn.addEventListener("click", scheduleSetLed);
  changeModeBtn.addEventListener("click", changeMode);

  const afterTwoMTime = addTwoMinutesAndFormat();
  document.querySelector("#schedule-time").value = afterTwoMTime;

  document
    .getElementById("modbusForm")
    .addEventListener("submit", async function (e) {
      if (interval) {
        clearInterval(interval);
      }
      e.preventDefault();
      await connectDevices();
    });

  async function connectDevices() {
    const deviceName = document.querySelector("#deviceName").value;
    const serialPort = document.querySelector("#serialPort").value;
    const modbusId = document.querySelector("#modbusId").value;
    const baudRate = document.querySelector("#baudRate").value;
    const period = document.querySelector("#period").value;
    const data = await sendData("/configure-modbus", {
      serialPort,
      modbusId,
      deviceName,
      baudRate: parseInt(baudRate),
    });

    if (data.success) {
      const indexDomMap = {
        0: "config_modbusId",
        1: "config_baudRate",
        2: "config_workMode",
        // 3: 'config_modbusId',
        // 4: 'config_modbusId',
        // 5: 'config_modbusId',
        // 6: 'config_modbusId',
        7: "config_brightness",
        8: "config_effectiveBit",
        9: "config_outputCircuits",
      };
      data.data.configData[1] = data.data.configData[1] * 100;
      document.querySelector(
        `#config_status`
      ).outerHTML = `<span id="config_status" class="on"></span>`;
      for (const [key, value] of Object.entries(indexDomMap)) {
        document.querySelector(`#${value}`).innerText =
          data.data.configData[key];
      }

      changeQueryWay();
      // if (isAutoQueryStatus) {
      //   interval = setInterval(() => {
      //     queryLedStatus();
      //   }, period * 1000);
      // }
    } else {
      alert("Failed to read registers: " + data.message);
    }
  }

  async function sendData(url, dataToSend) {
    try {
      const response = await global.fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      const result = await response.json();
      if (result.success) {
        console.log(result, "result");
        return result;
      } else {
        alert("Failed to read registers: " + result.message);
      }
    } catch (error) {
      console.error("Error during sendData:", error);
      throw error; // Optionally re-throw to allow further handling upstream
    }
  }

  async function setAllOn() {
    try {
      const data = await sendData("/all-on-led", {}); // Assuming empty object if no data is needed
      if (data && data.success) {
        console.log("操作成功");
        queryLedStatus();
      }
    } catch (error) {
      console.error("Error in setAllOn:", error);
    }
  }

  async function setAllOff() {
    try {
      const data = await sendData("/all-off-led", {}); // Assuming empty object if no data is needed
      if (data && data.success) {
        console.log("操作成功");
        queryLedStatus();
      }
    } catch (error) {
      console.error("Error in setAllOn:", error);
    }
  }

  async function startLoop() {
    try {
      const data = await sendData("/start-loop-light-sign-led", {});
      if (data && data.success) {
        console.log("操作成功");
      }
    } catch (error) {
      console.error("Error in setAllOn:", error);
    }
  }

  async function stopLoop() {
    try {
      const data = await sendData("/stop-loop-light-sign-led", {});
      if (data && data.success) {
        console.log("操作成功");
      }
    } catch (error) {
      console.error("Error in setAllOn:", error);
    }
  }

  function setHtml(data) {
    const arr = parseRegisterValuesToLightStates(data);
    const lHtml = [];
    // TODO 如果已经有了dom，则不需要再生成dom，只需要使用序号来更新状态
    arr.forEach((x, i) => {
      const { state } = x;
      const styleClass = `btn ${
        state ? "btn-outline-success" : "btn-outline-secondary"
      }  btn-sm`;
      const ledNo = i + 1;
      lHtml.push(`
          <button type="button" class="${styleClass}"" onclick="toggleStatus(${ledNo}, ${!state})" >${ledNo} ${
        state ? "ON" : "OFF"
      }</button>
        `);
    });
    ledContainer.innerHTML = lHtml.join("");
  }

  function setRGBHtml(data) {
    const arr = parseRGBRegisterToHex(data);
    const lHtml = [];
    // TODO 如果已经有了dom，则不需要再生成dom，只需要使用序号来更新状态
    arr.forEach((x, i) => {
      const ledNo = i + 1;
      lHtml.push(`
          <button type="button" class="btn btn-sm rgb-btn relative"
            data-ledno="${ledNo}"
            style="background-color: #${x}; color: ${setRandomColor(x)}">
            ${ledNo}
          </button>
        `);
    });
    rgbLEDContainer.innerHTML = lHtml.join("");

    initRGBBtnClick();
  }

  global.toggleStatus = async function (lightNumber, state) {
    try {
      const data = await sendData("/set-light", { lightNumber, state });
      if (data && data.success) {
        console.log("操作成功");
        queryLedStatus();
      }
    } catch (error) {
      console.error("Error in setAllOn:", error);
    }
  };

  async function clickRGBtn(rgbNum, event) {
    console.log(event);
    clickRBGNum = rgbNum;
    // 设置悬浮 div 的位置在按钮上方约 10 像素
    floatingDiv.style.left = event.pageX + "px"; // 点击位置的横坐标
    floatingDiv.style.top = event.pageY - floatingDiv.offsetHeight - 10 + "px"; // 点击位置的纵坐标，向上偏移 div 的高度加额外的 10px
    floatingDiv.style.display = "block"; // 显示悬浮 div
  }

  async function changeQueryWay() {
    queryLedStatus();

    // if (isAutoQueryStatus) {
    //   if (interval) {
    //     clearInterval(interval);
    //     queryBtn.innerText = "Manual Query Led Status";
    //   }
    //   isAutoQueryStatus = false;
    // } else {
    //   interval = setInterval(() => {
    //     queryLedStatus();
    //   }, period * 1000);
    //   queryBtn.innerText = "Auto Query Led Status";
    //   isAutoQueryStatus = true;
    // }
  }

  async function queryLedStatus() {
    const data = await sendData("/query-led-status", {
      deviceId: "eb7793a4-0dfa-4b2e-a6ec-94b7753dfc49",
    });
    if (data.success) {
      registersValues = data.data;
      renderLightHtml();
    }
  }

  async function setBrightness() {
    try {
      const brightnessValue = document.querySelector("#led-brightness").value;
      const data = await sendData("/set-led-brightness", { brightnessValue }); // Assuming empty object if no data is needed
      if (data && data.success) {
        console.log("操作成功");
        checkStatus();
      }
    } catch (error) {
      console.error("Error in setAllOn:", error);
    }
  }

  // 设置整体颜色
  global.changeAllColor = async function (color) {
    const newRegistersValues = updateRegisterValues(registersValues, color);
    try {
      const data = await sendData("/writeRegisters", {
        dataAddress: 10,
        values: newRegistersValues,
      });
      if (data && data.success) {
        console.log("操作成功");
        queryLedStatus();
      }
    } catch (error) {
      console.error("Error in setAllOn:", error);
    }
  };

  async function setColor() {
    try {
      const data = await sendData("/set-led-color", { colorValue: "" });
      if (data && data.success) {
        console.log("操作成功");
      }
      queryLedStatus();
    } catch (error) {
      console.error("Error in setAllOn:", error);
    }
  }

  async function groupSetLed() {
    const open = document.querySelector("#open-led-num").value;
    const close = document.querySelector("#close-led-num").value;
    try {
      const data = await sendData("/groupLed", {
        open: open.split(","),
        close: close.split(","),
      });
      if (data && data.success) {
        console.log("操作成功");
      }
      queryLedStatus();
    } catch (error) {
      console.error("Error in setAllOn:", error);
    }
  }

  async function scheduleSetLed() {
    try {
      const scheduleTime = document.querySelector("#schedule-time").value;
      let open = document.querySelector("#open-led-num").value;
      let close = document.querySelector("#close-led-num").value;
      open = open.split(",");
      close = close.split(",");
      const data = await sendData("/schedule", {
        dateStr: scheduleTime,
        taskData: {
          open,
          close,
        },
      });
      if (data && data.success) {
        window.alert(`在时间${scheduleTime}，开启${open}灯，关闭${close}`);
        console.log("操作成功");
      }
      queryLedStatus();
    } catch (error) {
      console.error("Error in setAllOn:", error);
    }
  }

  function generateRandomHexColors(num) {
    return Array(num)
      .fill()
      .map(() => {
        // 生成随机的红、绿、蓝值
        let red = Math.floor(Math.random() * 256);
        let green = Math.floor(Math.random() * 256);
        let blue = Math.floor(Math.random() * 256);

        // 转换为16进制颜色值
        let hexColor = ((red << 16) | (green << 8) | blue)
          .toString(16)
          .padStart(6, "0")
          .toUpperCase();
        return hexColor;
      });
  }

  function testMode() {
    registersValues = [
      273, 0, 0, 0, 0, 273, 0, 0, 0, 0, 273, 0, 0, 0, 0, 273, 0, 0, 0, 0, 273,
      0, 0, 0, 0,
    ];
    const configData = [1, 96, 1, 255, 1, 2, 0, 255, 16, 20];
    renderLightHtml();

    const indexDomMap = {
      0: "config_modbusId",
      1: "config_baudRate",
      2: "config_workMode",
      7: "config_brightness",
      8: "config_effectiveBit",
      9: "config_outputCircuits",
    };
    configData[1] = configData[1] * 100;
    for (const [key, value] of Object.entries(indexDomMap)) {
      document.querySelector(`#${value}`).innerText = configData[key];
    }
  }

  function initRGBBtnClick() {
    document.querySelectorAll(".rgb-btn").forEach((button) => {
      button.addEventListener("click", function (event) {
        const ledNo = event.target.dataset.ledno;

        clickRBGNum = ledNo;
        var floatingDiv = document.getElementById("floatingDiv");
        var cloneEl = floatingDiv.cloneNode(true);
        cloneEl.style.display = "block";
        this.appendChild(cloneEl);
        // floatingDiv.style.display = "block"; // 显示悬浮 div
      });
    });
  }

  document.getElementById("floatingDiv").addEventListener("click", function () {
    this.style.display = "none";
  });

  // document.addEventListener('click', function (event) {
  //   if (!floatingDiv.contains(event.target) && event.target !== floatingDiv) {
  //     floatingDiv.style.display = 'none';
  //   }
  // });

  global.changeColor = async function (color) {
    const newRegistersValues = updateRegisterValues(
      registersValues,
      color,
      clickRBGNum
    );
    try {
      const data = await sendData("/writeRegisters", {
        dataAddress: 10,
        values: newRegistersValues,
      }); // Assuming empty object if no data is needed
      if (data && data.success) {
        console.log("操作成功");
        queryLedStatus();
      }
    } catch (error) {
      console.error("Error in setAllOn:", error);
    }
  };

  function changeMode() {
    if (lightMode === LED) {
      lightMode = RGB_LED;
    } else {
      lightMode = LED;
    }
    renderLightHtml();
  }

  function renderLightHtml() {
    if (lightMode === RGB_LED) {
      setRGBHtml(registersValues);
      rgbLEDContainer.classList.remove("hide");
      ledContainer.classList.add("hide");
    } else if (lightMode === LED) {
      setHtml(registersValues);
      rgbLEDContainer.classList.add("hide");
      ledContainer.classList.remove("hide");
    }
  }

  async function checkStatus() {
    try {
      const data = await sendData("/checkStatus");
      if (data && data.success) {
        if (data.data === "ON") {
          document.querySelector(
            `#config_status`
          ).outerHTML = `<span id="config_status" class="on"></span>`;
        } else {
          document.querySelector(
            `#config_status`
          ).outerHTML = `<span id="config_status"></span>`;
        }
        if (data.data) {
          connectDevices();
        }
      }
    } catch (error) {
      console.error("Error in setAllOn:", error);
    }
  }

  testMode();
  checkStatus();
})(window);
