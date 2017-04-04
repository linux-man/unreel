"use strict";
global.debug = false;//For debug only
global.notSaved = {value: false};
const electron = require("electron");
const {app, BrowserWindow, dialog, globalShortcut} = electron;
const tmp = require("tmp");
const path = require("path");
const fs = require("fs-extra");

let mainWindow;
let splash;
let hAccel = process.platform !== "linux";
global.appPath = __dirname;
global.homePath = app.getPath("home");

//---------------------------------------  Load settings  --------------------------------
global.settings = {haccel: hAccel, fullscreen: false, maximized: false};
let dataPath = path.join(app.getPath("appData"), "unreel");
fs.ensureDirSync(dataPath);
let settings;
try {
  settings = fs.readJsonSync(path.join(dataPath, "settings"), {throws: false});
} catch(err) {};
if(settings) global.settings = Object.assign(global.settings, settings);
if(process.platform !== "darwin" && !global.settings.haccel) app.disableHardwareAcceleration();

app.on("ready", () => {
  if (process.argv.length > 1 && path.isAbsolute(process.argv[1]) && fs.existsSync(process.argv[1])) global.argv = process.argv[1];
  mainWindow = new BrowserWindow({width: 800, height: 560, minWidth: 800, minHeight: 560, icon:path.join(__dirname, "icons/icon.png"), show: false});
  splash = new BrowserWindow({width: 600, height: 450, icon:path.join(__dirname, "icons/icon.png"), center: true, alwaysOnTop: true, frame: false, title: "Loading...", parent: mainWindow, show: false});
  splash.loadURL("file://" + path.join(__dirname, "splash/splash.html"));
  initialize();

  splash.webContents.on("did-finish-load", () => {
    splash.show();
  });

  mainWindow.on("close", (e) => {
    if(global.notSaved.value) {
      if(dialog.showMessageBox(mainWindow, {type:"warning", title: "Warning", message: "Presentation has changed, do you want to continue?", detail: "Your changes will be lost if you continue without saving.", buttons: ["No", "Yes"]}) == 0) {
        e.preventDefault();
      }
    }
  });

  mainWindow.on("closed", () => {mainWindow = null;});

  mainWindow.webContents.on("did-finish-load", () => {
    splash.close();
    if(global.debug) mainWindow.show();
  });

});

app.on("before-quit", (e) => {
  fs.writeJson(path.join(dataPath, "settings"), global.settings, (err) => {
    if(err) dialog.showErrorBox("Couldn't save settings", err.message);
  });
});

app.on("window-all-closed", () => {if (process.platform !== "darwin") app.quit();});

app.on("activate", () => {if (mainWindow === null) createWindow();});

function initialize() {
  function copyToTemp(file, callback) {
    fs.copy(path.join(__dirname, file), path.join(tempPath, path.basename(file)), (err) => {
      if(err) dialog.showErrorBox("Couldn't copy file", err.message);
      else callback();
    });
  }
  tmp.dir({prefix: 'unreel_', unsafeCleanup: true}, (err, tempPath) => {
    if (err) dialog.showErrorBox("Couldn't create directory", err.message);
    else {
      global.tempPath = tempPath;
      fs.emptyDir(tempPath, (err) => {
        copyToTemp("unreel.html", () => {
          copyToTemp("reveal.js/css", () => {
            copyToTemp("reveal.js/js", () => {
              copyToTemp("reveal.js/plugin", () => {
                copyToTemp("reveal.js/lib", () => {
                  mainWindow.loadURL("file://" + path.join(tempPath + "/unreel.html"));
                });
              });
            });
          });
        });
      });
    }
  });
};

app.on("open-file", function(event, pathToOpen) {
  if(path.isAbsolute(pathToOpen) && fs.existsSync(pathToOpen)) global.argv = pathToOpen;
	event.preventDefault();
});
