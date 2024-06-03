const { JsonDB, Config } = require("node-json-db");
const db = new JsonDB(new Config("fizzDataBase", true, false, "/"));

const saveDevice = async (devicesData) => {
  await db.push("/devices", devicesData);
};

const saveDeviceConfig = async (devicesData) => {
  await db.push("/deviceConfig", devicesData);
};

const saveDeviceRegister = async (data) => {
  await db.push("/deviceRegister", data);
};

const getDeviceRegister = async () => {
  return await db.getData("/deviceRegister");
};

module.exports = {
  saveDevice,
  saveDeviceConfig,
  saveDeviceRegister,
  getDeviceRegister,
};
