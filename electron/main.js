/* eslint-disable @typescript-eslint/no-require-imports */

const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const cron = require("node-cron");

let mainWindow = null;
let splashWindow = null;
let nextServer = null;
let cronJob = null;

const PORT = 3000;

const cachePath = path.join(app.getPath("userData"), "cache");
app.setPath("cache", cachePath);

app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
app.commandLine.appendSwitch("disable-http-cache");

// ==========================================
// انتظار تشغيل السيرفر
// ==========================================

function waitForServer(url, maxAttempts = 60) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      attempts++;

      http.get(url, (res) => {
        console.log(`[waitForServer] Attempt ${attempts}: status ${res.statusCode}`);

        if (res.statusCode < 500) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error(`Server responded with ${res.statusCode}`));
        } else {
          setTimeout(check, 1000);
        }
      }).on("error", () => {
        console.log(`[waitForServer] Attempt ${attempts}: connection failed`);

        if (attempts >= maxAttempts) {
          reject(new Error("Server timeout after 60 attempts"));
        } else {
          setTimeout(check, 1000);
        }
      });
    };

    check();
  });
}

// ==========================================
// تحميل متغيرات البيئة
// ==========================================

function loadEnv(envPath) {
  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const envVars = {};

      envContent.split("\n").forEach((line) => {
        const trimmed = line.trim();

        if (trimmed && !trimmed.startsWith("#")) {
          const [key, ...valueParts] = trimmed.split("=");

          if (key && valueParts.length > 0) {
            envVars[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
          }
        }
      });

      return envVars;
    }
  } catch (err) {
    console.error("Error loading .env:", err);
  }

  return {};
}

// ==========================================
// Splash Screen - Modern Salesaty Design
// ==========================================

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 560,
    height: 600,
    transparent: false,
    frame: false,
    alwaysOnTop: true,
    center: true,
    show: false,
    resizable: false,
    backgroundColor: "#080F1E",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = !app.isPackaged;

  const logoPath = isDev
    ? path.join(__dirname, "..", "public", "logo.png")
    : path.join(process.resourcesPath, "app", "public", "logo.png");

  let logoUrl = "";

  try {
    if (fs.existsSync(logoPath)) {
      const logoBase64 = fs.readFileSync(logoPath).toString("base64");
      logoUrl = `data:image/png;base64,${logoBase64}`;
      console.log("Splash logo loaded successfully:", logoPath);
    } else {
      console.error("Splash logo not found:", logoPath);
    }
  } catch (error) {
    console.error("Failed to load splash logo:", error);
  }

  const splashHTML = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            height: 100vh;
            overflow: hidden;
            display: grid;
            place-items: center;
            position: relative;
            color: #F8FAFC;
            font-family: "Segoe UI", Tahoma, Arial, sans-serif;
            background:
              radial-gradient(ellipse at 15% 10%, rgba(14, 165, 233, .17), transparent 42%),
              radial-gradient(ellipse at 90% 90%, rgba(99, 102, 241, .16), transparent 40%),
              #080F1E;
          }

          body::before {
            content: "";
            position: absolute;
            inset: 0;
            opacity: .16;
            background-image: radial-gradient(rgba(148, 163, 184, .55) .7px, transparent .7px);
            background-size: 24px 24px;
            mask-image: linear-gradient(to bottom, black, transparent 85%);
          }

          .glow {
            position: absolute;
            width: 340px;
            height: 340px;
            border-radius: 50%;
            border: 1px solid rgba(56, 189, 248, .10);
            animation: orbit 18s linear infinite;
          }

          .glow::before,
          .glow::after {
            content: "";
            position: absolute;
            border: 1px solid rgba(56, 189, 248, .10);
            border-radius: 50%;
          }

          .glow::before {
            inset: 22px;
          }

          .glow::after {
            inset: 48px;
          }

          @keyframes orbit {
            from {
              transform: rotate(0deg) scale(1);
            }

            50% {
              transform: rotate(180deg) scale(1.035);
            }

            to {
              transform: rotate(360deg) scale(1);
            }
          }

          .card {
            position: relative;
            z-index: 2;
            width: 430px;
            padding: 42px 38px 34px;
            text-align: center;
            border: 1px solid rgba(148, 163, 184, .17);
            border-radius: 28px;
            background: linear-gradient(145deg, rgba(20, 32, 53, .94), rgba(12, 21, 38, .94));
            box-shadow:
              0 28px 80px rgba(0, 0, 0, .42),
              inset 0 1px rgba(255, 255, 255, .05);
            animation: cardIn .8s cubic-bezier(.2,.8,.2,1) both;
          }

          @keyframes cardIn {
            from {
              opacity: 0;
              transform: translateY(18px) scale(.975);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .logo-wrap {
            width: 116px;
            height: 116px;
            margin: 0 auto 24px;
            padding: 10px;
            display: grid;
            place-items: center;
            border-radius: 30px;
            background: linear-gradient(145deg, #FFFFFF, #E8F1FA);
            box-shadow:
              0 12px 36px rgba(14, 165, 233, .18),
              0 0 0 8px rgba(56, 189, 248, .045);
            animation: logoFloat 4.5s ease-in-out infinite;
          }

          .logo-wrap img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          @keyframes logoFloat {
            0%, 100% {
              transform: translateY(0);
            }

            50% {
              transform: translateY(-6px);
            }
          }

          h1 {
            direction: ltr;
            font-size: 39px;
            line-height: 1.2;
            font-weight: 800;
            letter-spacing: -.8px;
            color: #F8FAFC;
          }

          .brand-line {
            width: 46px;
            height: 3px;
            margin: 13px auto 15px;
            border-radius: 10px;
            background: linear-gradient(90deg, #38BDF8, #818CF8);
          }

          .subtitle {
            color: #A9B8CC;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 38px;
          }

          .loading-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            color: #C7D2E2;
            font-size: 12px;
            font-weight: 600;
          }

          #percent {
            direction: ltr;
            color: #7DD3FC;
            font-variant-numeric: tabular-nums;
          }

          .progress-track {
            height: 7px;
            overflow: hidden;
            border-radius: 20px;
            background: rgba(148, 163, 184, .15);
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, .35);
          }

          .progress-fill {
            width: 4%;
            height: 100%;
            border-radius: inherit;
            position: relative;
            background: linear-gradient(90deg, #0EA5E9, #38BDF8 55%, #818CF8);
            box-shadow: 0 0 16px rgba(56, 189, 248, .38);
            transition: width 650ms cubic-bezier(.22,.61,.36,1);
          }

          .progress-fill::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent);
            transform: translateX(-100%);
            animation: shine 2.2s ease-in-out infinite;
          }

          @keyframes shine {
            to {
              transform: translateX(100%);
            }
          }

          .status {
            min-height: 18px;
            margin-top: 14px;
            color: #8193AA;
            font-size: 11px;
            font-weight: 500;
          }

          .footer {
            position: absolute;
            z-index: 2;
            bottom: 19px;
            left: 0;
            right: 0;
            text-align: center;
            color: rgba(148, 163, 184, .52);
            font-size: 10px;
          }

          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: .01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: .01ms !important;
            }
          }
        </style>
      </head>

      <body>
        <div class="glow"></div>

        <main class="card">
          <div class="logo-wrap">
            <img
              src="${logoUrl}"
              alt="Salesaty"
              onerror="console.error('Splash logo failed to render')"
            >
          </div>

          <h1>Salesaty</h1>

          <div class="brand-line"></div>

          <p class="subtitle">
            نظام متكامل لإدارة المبيعات والمخزون
          </p>

          <section class="progress-area">
            <div class="loading-head">
              <span id="loading-label">جاري تجهيز النظام...</span>
              <span id="percent">4%</span>
            </div>

            <div class="progress-track">
              <div class="progress-fill" id="progress-fill"></div>
            </div>

            <p class="status" id="status">
              يتم تشغيل الخدمات وتحميل البيانات
            </p>
          </section>
        </main>

        <div class="footer">
          © 2026 Salesaty · جميع الحقوق محفوظة
        </div>

        <script>
          (() => {
            const fill = document.getElementById("progress-fill");
            const percent = document.getElementById("percent");
            const label = document.getElementById("loading-label");
            const status = document.getElementById("status");

            let progress = 4;
            let finished = false;

            const stages = [
              {
                at: 18,
                label: "جاري تشغيل النظام...",
                status: "تهيئة بيئة التشغيل"
              },
              {
                at: 42,
                label: "جاري تحميل البيانات...",
                status: "الاتصال بقاعدة البيانات وتجهيزها"
              },
              {
                at: 68,
                label: "تقريباً انتهينا...",
                status: "تجهيز واجهة البرنامج"
              },
              {
                at: 86,
                label: "لحظات أخيرة...",
                status: "يتم التأكد من جاهزية جميع الخدمات"
              }
            ];

            // يتقدم ببطء حتى 90%، ولا يصل إلى 100%
            // إلا بعد جاهزية النافذة الرئيسية.

            const timer = setInterval(() => {
              if (finished || progress >= 90) return;

              const remaining = 90 - progress;

              progress = Math.min(
                90,
                progress + Math.max(0.18, remaining * 0.018)
              );

              const shown = Math.floor(progress);

              fill.style.width = shown + "%";
              percent.textContent = shown + "%";

              const stage = [...stages]
                .reverse()
                .find(item => shown >= item.at);

              if (stage) {
                label.textContent = stage.label;
                status.textContent = stage.status;
              }
            }, 450);

            window.finishSplashLoading = () => {
              if (finished) return;

              finished = true;
              clearInterval(timer);

              label.textContent = "تم تجهيز Salesaty";
              status.textContent = "أهلاً بك";

              fill.style.width = "100%";
              percent.textContent = "100%";
            };
          })();
        </script>
      </body>
    </html>
  `;

  splashWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`
  );

  splashWindow.once("ready-to-show", () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.show();
    }
  });

  splashWindow.on("closed", () => {
    splashWindow = null;
  });
}

// ==========================================
// إغلاق شاشة البداية
// ==========================================

function closeSplashWindow() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
}

function completeSplashWindow() {
  if (!splashWindow || splashWindow.isDestroyed()) return;

  splashWindow.webContents.executeJavaScript(
    "window.finishSplashLoading && window.finishSplashLoading();"
  ).catch(() => {}).finally(() => {
    setTimeout(() => {
      closeSplashWindow();
    }, 550);
  });
}

// ==========================================
// تشغيل Next.js Server
// ==========================================

function startNextServer() {
  return new Promise((resolve, reject) => {
    const isDev = !app.isPackaged;

    const serverDir = isDev
      ? path.join(__dirname, "..", ".next", "standalone")
      : path.join(process.resourcesPath, "app");

    const serverPath = path.join(serverDir, "server.js");

    const prismaDir = isDev
      ? path.join(__dirname, "..", "prisma")
      : path.join(serverDir, "prisma");

    // مجلد قاعدة البيانات القابل للكتابة

    const databaseDir = isDev
      ? prismaDir
      : path.join(app.getPath("userData"), "database");

    // إنشاء المجلد عند الحاجة

    if (!fs.existsSync(databaseDir)) {
      fs.mkdirSync(databaseDir, { recursive: true });
    }

    const dbPath = path.join(databaseDir, "dev.db");

    // نسخ قاعدة البيانات الأصلية عند أول تشغيل فقط

    if (!isDev && !fs.existsSync(dbPath)) {
      const sourceDb = path.join(prismaDir, "dev.db");

      if (fs.existsSync(sourceDb)) {
        fs.copyFileSync(sourceDb, dbPath);
        console.log("Database copied successfully:", dbPath);
      } else {
        throw new Error("Original database not found: " + sourceDb);
      }
    }

    console.log("Active database:", dbPath);

    const envPath = isDev
      ? path.join(__dirname, "..", ".env")
      : path.join(serverDir, ".env");

    // حفظ سجل الأخطاء داخل مجلد بيانات البرنامج

    const logPath = path.join(
      app.getPath("userData"),
      "server-startup.log"
    );

    let serverErrors = "";
    let settled = false;

    const writeLog = (message) => {
      const line = `[${new Date().toISOString()}] ${message}\n`;

      try {
        fs.appendFileSync(logPath, line, "utf8");
      } catch (err) {
        console.error("Cannot write server log:", err);
      }

      console.log(line);
    };

    writeLog("========== SERVER STARTING ==========");
    writeLog(`Server path: ${serverPath}`);
    writeLog(`Server exists: ${fs.existsSync(serverPath)}`);
    writeLog(`Server directory: ${serverDir}`);
    writeLog(`Prisma directory: ${prismaDir}`);
    writeLog(`Database exists: ${fs.existsSync(dbPath)}`);
    writeLog(`Environment exists: ${fs.existsSync(envPath)}`);

    if (!fs.existsSync(serverPath)) {
      reject(new Error(`Server.js not found: ${serverPath}`));
      return;
    }

    const envVars = loadEnv(envPath);
    const nodeBinary = process.execPath;

    nextServer = spawn(nodeBinary, [serverPath], {
      cwd: serverDir,

      env: {
        ...process.env,
        ...envVars,
        ELECTRON_RUN_AS_NODE: "1",
        PORT: PORT.toString(),
        NODE_ENV: "production",
        DATABASE_URL: `file:${dbPath.replace(/\\/g, "/")}`,
        NEXTAUTH_URL: `http://localhost:${PORT}`,
      },

      stdio: ["ignore", "pipe", "pipe"],
    });

    nextServer.stdout.on("data", (data) => {
      const output = data.toString();
      writeLog(`[STDOUT] ${output}`);
    });

    nextServer.stderr.on("data", (data) => {
      const output = data.toString();

      serverErrors += output;

      // الاحتفاظ بآخر 10 آلاف حرف

      serverErrors = serverErrors.slice(-10000);

      writeLog(`[STDERR] ${output}`);
    });

    nextServer.on("error", (err) => {
      writeLog(`[SPAWN ERROR] ${err.stack || err.message}`);

      if (!settled) {
        settled = true;
        reject(err);
      }
    });

    nextServer.on("exit", (code, signal) => {
      writeLog(`SERVER EXIT: code=${code}, signal=${signal}`);

      if (!settled) {
        settled = true;

        reject(
          new Error(
            `Server exited with code ${code}\n` +
            `Signal: ${signal}\n\n` +
            `Server details:\n${serverErrors || "No stderr output"}\n\n` +
            `Log file: ${logPath}`
          )
        );
      }
    });

    waitForServer(`http://localhost:${PORT}`)
      .then(() => {
        if (!settled) {
          settled = true;

          writeLog("SERVER STARTED SUCCESSFULLY");

          resolve();
        }
      })
      .catch((err) => {
        if (!settled) {
          settled = true;

          writeLog(`SERVER WAIT ERROR: ${err.message}`);

          reject(
            new Error(
              `${err.message}\nServer details:\n${serverErrors}\nLog: ${logPath}`
            )
          );
        }
      });
  });
}

// ==========================================
// النسخ الاحتياطي التلقائي
// ==========================================

function startAutoBackupCron() {
  console.log("⏰ Starting auto backup cron (every hour)");

  cronJob = cron.schedule("0 * * * *", async () => {
    console.log("⏰ [Cron] Checking auto backup...");

    try {
      const res = await fetch(
        `http://localhost:${PORT}/api/cron/auto-backup`
      );

      const data = await res.json();

      console.log("⏰ [Cron] Auto backup result:", data);
    } catch (err) {
      console.error("⏰ [Cron] Auto backup failed:", err.message);
    }
  });

  setTimeout(async () => {
    console.log("⏰ [Cron] Initial auto backup check...");

    try {
      const res = await fetch(
        `http://localhost:${PORT}/api/cron/auto-backup`
      );

      const data = await res.json();

      console.log("⏰ [Cron] Initial check result:", data);
    } catch (err) {
      console.error("⏰ [Cron] Initial check failed:", err.message);
    }
  }, 30000);
}

// ==========================================
// النافذة الرئيسية
// ==========================================

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Salesaty",
    icon: path.join(__dirname, "icon.ico"),
    show: false,
    autoHideMenuBar: true,
    frame: true,

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  try {
    await mainWindow.webContents.session.clearCache();
    console.log("🗑️ Cache cleared (storage preserved)");
  } catch (err) {
    console.error("Error clearing cache:", err);
  }

  mainWindow.webContents.on("did-start-loading", () => {
    console.log("🔄 Page started loading");
  });

  mainWindow.webContents.on("did-stop-loading", () => {
    console.log("⏹️ Page stopped loading");
  });

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("✅ Page loaded successfully");
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription, validatedURL) => {
      console.error(
        `❌ Failed to load: ${validatedURL} - ${errorCode}: ${errorDescription}`
      );
    }
  );

  mainWindow.loadURL(`http://localhost:${PORT}/login`, {
    extraHeaders: "Cache-Control: no-cache\nPragma: no-cache\n",
  });

  mainWindow.once("ready-to-show", () => {
    completeSplashWindow();
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      require("electron").shell.openExternal(url);
    }

    return { action: "deny" };
  });
}

// ==========================================
// تشغيل التطبيق
// ==========================================

app.whenReady().then(async () => {
  createSplashWindow();

  try {
    await startNextServer();
    await createWindow();
    startAutoBackupCron();
  } catch (err) {
    console.error("❌ Failed to start:", err);

    closeSplashWindow();

    dialog.showErrorBox(
      "خطأ في تشغيل التطبيق",
      `فشل تشغيل السيرفر:\n${err.message}\n\nتأكد من تثبيت التطبيق بشكل صحيح.`
    );

    app.quit();
  }
});

// ==========================================
// إغلاق التطبيق
// ==========================================

app.on("window-all-closed", () => {
  if (nextServer) {
    nextServer.kill();
  }

  if (cronJob) {
    cronJob.stop();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  if (nextServer) {
    nextServer.kill();
  }

  if (cronJob) {
    cronJob.stop();
  }

  closeSplashWindow();
});