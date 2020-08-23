const {app, BrowserWindow, ipcMain, screen} = require("electron");
const path = require("path");
const url = require("url");
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        title: "Covid App",
        icon: __dirname + "\\..\\css\\icon\\covidapp.ico",
        hasShadow: true,
        frame: false,
    webPreferences: {
      nodeIntegration: true,
    },
    });

    app.setUserTasks([]);

    mainWindow.removeMenu();
    //mainWindow.webcontents.toggledevtools();

    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "../html/index.html"),
            protocol: "file:",
            slashes: true,
        })
    );
}

function setMain() {
    mainWindow.resizable = true;
    mainWindow.setSize(1200, 700);
    mainWindow.setMinimumSize(1200, 700);
    mainWindow.setSkipTaskbar(false);
    mainWindow.center();
}

function setThumb() {

    const screenWin = screen.getPrimaryDisplay().workAreaSize;
    const heightThumb = screenWin.height;
    const widthThumb = screenWin.width;
    const [height, width] = [200, 350];

    mainWindow.unmaximize();
    mainWindow.setMinimumSize(1, 1);
    mainWindow.setPosition(widthThumb - width - 40, 40);
    mainWindow.setSize(width, height);
    mainWindow.setSkipTaskbar(true);
    mainWindow.resizable = false;

    //mainWindow.webcontents.toggledevtools();
}

app.on("ready", () => {
    createWindow();
    setMain();
});

app.on("quit", () => {
    mainWindow.close();
});

ipcMain.on("thumb", () => {
    setThumb();
});

ipcMain.on("main", () => {
    setMain();
});

