import { app, BrowserWindow, shell } from "electron";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "../../..");
const PORT_FILE = join(REPO_ROOT, ".clipforge-dev-port");

const readDevPort = () => {
  if (process.env.PORT !== undefined && process.env.PORT !== "") {
    return process.env.PORT;
  }
  if (!existsSync(PORT_FILE)) {
    return null;
  }
  const port = readFileSync(PORT_FILE, "utf8").trim();
  return port !== "" ? port : null;
};

const waitForDevPort = async (maxMs = 180_000) => {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const port = readDevPort();
    if (port !== null) {
      return port;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });
  }
  throw new Error(
    "Timed out waiting for ClipForge web server. Is @clipforge/web dev running?",
  );
};

const waitForHttp = async (url, maxMs = 180_000) => {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(2_000),
        redirect: "follow",
      });
      if (response.status < 500) {
        return;
      }
    } catch {
      // Server still starting
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }
  throw new Error(`Timed out waiting for ${url}`);
};

/** @type {BrowserWindow | null} */
let mainWindow = null;

const createWindow = async (port) => {
  const appUrl = `http://127.0.0.1:${port}`;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: "ClipForge",
    show: false,
    webPreferences: {
      preload: join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  await waitForHttp(appUrl);
  await mainWindow.loadURL(appUrl);
};

const bootstrap = async () => {
  const port = await waitForDevPort();
  await createWindow(port);
};

app.whenReady().then(() => {
  void bootstrap().catch((error) => {
    console.error("[clipforge-desktop]", error);
    app.exit(1);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    void bootstrap().catch((error) => {
      console.error("[clipforge-desktop]", error);
    });
  }
});
