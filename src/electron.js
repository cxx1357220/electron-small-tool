// Modules to control application life and create native browser window

// const { app, BrowserWindow } = require('electron');
const electron = require('electron')

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const { fork } = require('child_process');
const path = require('path')
const fs = require('fs')
const xlsx = require('node-xlsx');
const ipc = electron.ipcMain;
const dialog = electron.dialog;
// const excelPort = require('excel-export');
// const json2xls = require('json2xls');





// import { dialog } from 'electron'



// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false, //禁止放大缩小
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, //允许前端集成node
      // nodeIntegrationInWorker: true
    }
  })
  // webFrame.executeJavaScript('window.path = __dirname;')

  console.log(process.env.NODE_ENV, 13)
  // and load the index.html of the app.
  if (process.env.NODE_ENV === 'development') {

    mainWindow.webContents.openDevTools()
    mainWindow.loadURL(`http://localhost:4000`)
  } else {
    // mainWindow.webContents.openDevTools()
    mainWindow.loadFile('./static/index.html')
  }



  // mainWindow.loadFile('./dist/index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})
ipc.on('hasPath', function (event, path) {
  event.returnValue = fs.existsSync(path) //同步返回值
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipc.on('open-path-dialog', function (event, p) {
  dialog.showOpenDialog({
    properties: ['openDirectory'],
    // properties: ['openFile','multiSelections'],
    // filters: [
    //   // { name: 'Images', extensions: ['jpg', 'png', 'gif',"tif"] },
    //   // { name: 'All Files', extensions: ['json'] },
    // ]
  }, function (files) {
    if (files) { event.sender.send('path', files[0]); console.log(files[0]) }
  })
    .then(files => {
      if (files) { event.sender.send('path', files.filePaths[0]); console.log(files.filePaths[0]) }
    }).catch(err => {
      console.log(err)
    });
  // 很奇怪，loadURL走内部function，loadFILE走外部promise
})

ipc.on('export', function (event, list, expPath, platform) {
  // let fileList = fs.readdirSync(path.join(process.resourcesPath, 'app.asar'))
  // event.sender.send('console.log', fileList);



  let isDev = process.env.NODE_ENV === 'development' //判断是否为测试环境，生产环境需要更改获取路径
  let scriptPath = isDev ? './src/worker/change.js' : path.join(process.resourcesPath, 'app.asar/src/worker/change.js'); //有一说一，这个asar就很弱智,路径极其奇怪
  const forked = fork(scriptPath);
  let len = 0;
  // event.sender.send('console.log', forked); //f发送到前端log
  // console.log(forked,'forked') //查看占用端口
  forked.on('message', function (e) {
    if (e[1] == 100 || e[1] == 'error') {
      len++;
      if (len == list.length) {
        forked.disconnect() //解析完毕关闭子进程
      }
    }
    event.sender.send('files-progress', ...e);
  })
  forked.on('close', function (code) {
    event.sender.send('console.log', 'close');
    console.log('子进程已退出，退出码 ' + code);
  });
  forked.on('exit', function (code) {
    event.sender.send('console.log', 'exit');
    console.log('子进程已关闭，退出码 ' + code);
  });
  forked.send({ list, expPath, platform })
})

ipc.on('open-directory-dialog', function (event, p) {
  // dialog.showOpenDialog({
  //   properties: [p]
  // }, function (files) {
  //   console.log(files, 0000)
  //   if (files) {// 如果有选中
  //     // 发送选择的对象给子进程

  //     event.sender.send('selectedItem', files[0])
  //   }
  // })

  // dialog.showMessageBox({
  //   type: 'info',
  //   title: 'message',
  //   message: 'hello',
  //   buttons: ['ok', 'cancel']
  // }, (index) => {
  //   if (index == 0) {
  //     console.log('You click ok.');
  //   } else {
  //     console.log('You click cancel');
  //   }
  // })

  let extensions;
  if (p == 'xlsx') {
    extensions = ['xlsx', 'xls', 'json', 'csv']
  } else {
    extensions = ['json']
  }
  dialog.showOpenDialog({
    // properties: ['openFile', 'openDirectory']
    properties: ['openFile', 'multiSelections'],
    filters: [
      // { name: 'Images', extensions: ['jpg', 'png', 'gif',"tif"] },
      { name: 'All Files', extensions: extensions },
    ]
  }, function (files) {
    if (files) { event.sender.send('files', files); }
  })
    .then(files => {
      if (files) { event.sender.send('files', files.filePaths); }
    }).catch(err => {
      console.log(err)
    });
  // 很奇怪，loadURL走内部function，loadFILE走外部promise

});