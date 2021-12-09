
// import fetch from "node-fetch";
// const fetch = require('node-fetch');
// node only; not needed in browsers


const { app, BrowserWindow , nativeTheme , ipcMain } = require('electron')
// import { app, BrowserWindow, nativeTheme,ipcMain } from 'electron' 
// add "type": "module", in node_module
const common=require('./services/common.js')  
require('dotenv').config()
const url = require('url')

const path = require('path')

console.log('---------------------------------',process.env.APP_URL)
const HighLevelSockets = require('./services/socket');
const Storage = require('./services/storage');
const Wallet = require('./services/wallet');
try {
  if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(require('path').join(app.getPath('userData'), 'DevTools Extensions'))
  }
} catch (_) { }

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = __dirname
}
global.windows={};

let mainWindow

function createWindow () {
	app.setAsDefaultProtocolClient('scatter');
  /**
   * Initial window options
   */ 
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon:'./icons/hamian.ico',
    autoHideMenuBar: !process.env.IS_DEV,
		resizable: !!process.env.IS_DEV,
    useContentSize: true,
    webPreferences: { 
      nodeIntegration: true, 
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      enableRemoteModule: true,
			webviewTag:true,

      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      // preload: path.resolve(__dirname, 'electron-preload.js')
    }
  })
  HighLevelSockets.setMainWindow(mainWindow);
  HighLevelSockets.initialize() 
//   var address=process.env.APP_URL+'?globalid=main'; 
  var address = common.getUrl('main')
  
  console.log(address)
  mainWindow.loadURL(address)
  // if(!process.env.IS_DEV)
  // {
  //   var address=process.env.APP_URL;
  //   var urlData=path.resolve(app.getAppPath(), address);
  //   console.log(urlData)
  //   mainWindow.loadURL(url.format({
  //       slashes: true,
  //       protocol: 'file:', 
  //       pathname: urlData,
  //       query: {
  //         globalid: 'main'
  //       }
  //     }) 
  //   )
     
  // }
  // else
  // {
  //   var address=process.env.APP_URL+'?globalid=main';
  //   mainWindow.loadURL(address)

  // }

  global.windows['main']=mainWindow;
  mainWindow.on('closed', () => {
    mainWindow = null;
    delete global.windows['main'];
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    
    createWindow()
  }
})
global.localTransaction={}
global.temp={};
global.gclass={
  wallet:new Wallet(),
  storage:new Storage()
}; 
ipcMain.on('prompt-response', (_, {event,data,origin,id}) => { 
  HighLevelSockets.emit(origin,id,event,data)
});
ipcMain.on('transfer',async (_, {data,name,id,globalId}) => { 

  var resp={};
  var gclass=global.gclass[name];
  if(gclass)
  {
    var action=data.action;
     
    if(action && gclass[action])
    {
      resp=await gclass[action](data.data)
    }
  }  
  
  if(global.windows[globalId])
  {
    global.windows[globalId].webContents.send('transfer', {id,data:resp}); 
  } 
});
