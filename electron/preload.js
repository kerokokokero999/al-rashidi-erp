/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge } = require("electron");

// ✅ نكشف معلومات بسيطة للتطبيق
contextBridge.exposeInMainWorld("electron", {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  },
});