const { JsonDB, Config } = require("node-json-db");
const db = new JsonDB(new Config("fizzDataBase", true, false, "/"));

export const saveDevice = async (devicesData) => {
  await db.push("/devices", devicesData);
};

export const saveDeviceConfig = async (devicesData) => {
  await db.push("/deviceConfig", devicesData);
};

export const saveDeviceRegister = async (data) => {
  await db.push("/deviceRegister", data);
};
