// import {  BrowserWindow  } from 'electron';

const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const net = require('net');
const fs = require('fs')
const {BrowserWindow} =require('electron')
let mainWindow;
const sendToEmbed = async(payload) =>{
	//
			// console.log('>>>>>>>>>>>>>>>',payload)
	if(payload.type=='api')
	{
		if(payload.request.data && payload.request.data.type=='identityFromPermissions'){
			var id=payload.request.data.id;
			var appkey=payload.request.data.appkey;
			var existData = await global.gclass.wallet.checkConnection(appkey)
			if(existData)
			{
				HighLevelSockets.emit(payload.origin,payload.id,'api',{id,result:existData.result})
			}
			else
			{
				HighLevelSockets.emit(payload.origin,payload.id,'api',{id,result:null})
			}
		}
		if(payload.request.data && payload.request.data.type=='requestAddNetwork'){
			var id=payload.request.data.id;
			HighLevelSockets.emit(payload.origin,payload.id,'api',{id,result:true})
		}
		if(payload.request.data && payload.request.data.type=='forgetIdentity')
		{
			var appkey=payload.request.data.appkey;
			//var chinid=payload.request.data.payload.fields.accounts[0].chainId
			var existData = await global.gclass.wallet.forgetConnection(appkey)

		}
		if(payload.request.data && payload.request.data.type=='requestSignature'){
			var appkey=payload.request.data.appkey;
			var existData = await global.gclass.wallet.checkConnection(appkey)
			if(existData)
			{
				var id=payload.request.data.id;
				var wind = new BrowserWindow({
					width: 700, 
					height: 900,
    				icon:'./icons/hamian.ico',
					useContentSize: true,
					webPreferences: { 
					//   nodeIntegration: process.env.QUASAR_NODE_INTEGRATION,
					//   nodeIntegrationInWorker: process.env.QUASAR_NODE_INTEGRATION, 
					nodeIntegration: true,
					nodeIntegrationInWorker: true,
					contextIsolation: false,
					enableRemoteModule: true,
					}
				  }) 
				  var id=Math.random().toString();
				  global.windows[id]=wind;
				  console.log('id: ',id)
					  wind.on('closed', () => { 
						delete global.windows[id];
					})
				//   wind.loadURL(process.env.APP_URL+'?globalid='+id+'#/popup/signature')
				  wind.loadURL(process.env.APP_URL+'Signature'+'?globalid='+id)
				  setTimeout(async ()=>{  
					payload.request.data.payload.buf=payload.request.data.payload.transaction.abis[0].abi
					payload.request.data.payload.signData=payload.request.data.payload.transaction
					var dt=await global.gclass.wallet.makeStandardTransaction(payload.request.data.payload.transaction);
					  payload.request.data.payload.transactionData = dt.actions; 
					  payload.request.data.payload.transactionStandard = dt; 
					  payload.request.data.payloadId = payload.id;
					  payload.request.data.payloadOrigin = payload.origin;
					  global.temp[payload.request.data.id]=payload.request.data
					  
					  console.log('---------------------------------------',payload)
					wind.webContents.send('socketResponse', payload);
	
				  },3000)

			}
			
		}
		if(payload.request.data && payload.request.data.type=='getOrRequestIdentity')
		{
			
			var appkey=payload.request.data.appkey;
			var chinid=payload.request.data.payload.fields.accounts[0].chainId
			var existData = await global.gclass.wallet.checkConnection(appkey)
			//HighLevelSockets.emit(payload.origin,payload.id,'api',{id,result:global.gclass.wallet.checkConnection(id)})
			console.log('----->>>>>',existData)
			if(existData)
			{
				var id=payload.request.data.id;
				var acc=existData.result.accounts[0]
				if(acc.chainId== chinid)
				{
					existData.id=id
					HighLevelSockets.emit(payload.origin,payload.id,'api',existData)
				}
				return
			}
			var id=payload.request.data.id;
			// var wind = new BrowserWindow({
			// 	width: 500, 
			// 	height: 700,
			// 	useContentSize: true,
			// 	webPreferences: { 
			// 	  nodeIntegration: process.env.QUASAR_NODE_INTEGRATION,
			// 	  nodeIntegrationInWorker: process.env.QUASAR_NODE_INTEGRATION, 
			// 	}
			//   }) 
			var wind = new BrowserWindow({
				width: 700, 
				height: 900,
				useContentSize: true,
				icon:'./icons/hamian.ico',
				webPreferences: {
				  // Change from /quasar.conf.js > electron > nodeIntegration;
				  // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
				  // nodeIntegration: process.env.QUASAR_NODE_INTEGRATION,
				  nodeIntegration: true,
				  // nodeIntegrationInWorker: process.env.QUASAR_NODE_INTEGRATION,
				  nodeIntegrationInWorker: true,
				  contextIsolation: false,
				  enableRemoteModule: true,
			
				  // More info: /quasar-cli/developing-electron-apps/electron-preload-script
				  // preload: path.resolve(__dirname, 'electron-preload.js')
				}
			  })
			
			  var id=Math.random().toString();
			  global.windows[id]=wind;
			  console.log('id: ',id)
			  	wind.on('closed', () => { 
					delete global.windows[id];
				}) 
			//   wind.loadURL(process.env.APP_URL+'?globalid='+id+'#/LocalLogin')
			  wind.loadURL(process.env.APP_URL+'LocalLogin'+'?globalid='+id)
			  setTimeout(()=>{

				  wind.webContents.send('socketResponse', payload);

			  },3000)

		}


	}
	else if(payload.type=='pair')
	{
		//mainWindow.webContents.send('socketResponse', payload); 
  		HighLevelSockets.emit(payload.origin,payload.id,'paired',await global.gclass.storage.isLogin())
	}
} 

class LowLevelSocketService {

	constructor(){
		this.rekeyPromise = null;
		this.openConnections = {};
		this.websockets = [];
		this.ports = {};
	}

	async getNewKey(origin, id){
		return new Promise((resolve, reject) => {
			this.rekeyPromise = {resolve, reject};
			this.emit(origin, id, 'rekey');
			return this.rekeyPromise;
		})
	}

	async emit(origin, id, path, data){
		const socket = this.openConnections[origin+id];
		// console.log('-----------------------');
		// console.log(origin+id);
		// console.log(Object.keys(this.openConnections) );
		return this.emitSocket(socket, path, data);
	}

	async emitSocket(socket, path, data){
		if(!socket) return console.error('No socket found');
		socket.send('42/scatter,' + JSON.stringify([path, data ? data : false]))
	}

	async initialize(_certs){

		const socketHandler = socket => {
			let origin = null;

			socket.send("40");
			socket.send("40/scatter");
			socket.send(`42/scatter,["connected"]`);

			const id = Math.round(Math.random() * 999999999).toString();

			// Just logging errors for debugging purposes (dev only)
			//if(isDev) 
			socket.on('error', async request => console.log('error', request));

			// Different clients send different message types for disconnect (ws vs socket.io)
			socket.on('close',      () => delete this.openConnections[origin+id]);
			socket.on('disconnect', () => delete this.openConnections[origin+id]);

			socket.on('message', msg => {
				msg=msg+'';
				if(msg.indexOf('42/scatter') === -1) return false;
				const [type, request] = JSON.parse(msg.replace('42/scatter,', ''));

				const killRequest = () => this.emitSocket(socket, 'api', {id:request.data.id, result:null});

				if(!request.plugin || request.plugin.length > 100) return killRequest();
				request.plugin = request.plugin.replace(/\s/g, "").trim();

				if(request.plugin.toLowerCase() === 'scatter') return killRequest();

				let requestOrigin;
				if(request.data.hasOwnProperty('payload')){
					request.data.payload.origin = request.data.payload.origin.replace(/\s/g, "").trim();
					if(request.data.payload.origin.toLowerCase() === 'scatter') return killRequest();
					requestOrigin = request.data.payload.origin;

				} else requestOrigin = request.data.origin.replace(/\s/g, "").trim();

				if(!origin) origin = requestOrigin;
				else if(origin && requestOrigin !== origin) return killRequest();

				if(!this.openConnections.hasOwnProperty(origin+id)) this.openConnections[origin+id] = socket;

				console.log('------->>>>>>>>',origin+id);
				switch(type){
					case 'pair':        return sendToEmbed({type:'pair', request, id,origin});
					case 'rekeyed':     return this.rekeyPromise.resolve(request);
					case 'api':         return sendToEmbed({type:'api', request, id,origin});
				}

			});
		}

		if(this.websockets.length) return this.websockets;

		await this.findOpenPorts();
		// sendToEmbed({type:'ports', ports:this.ports});

		const requestHandler = (_, res) => {
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Request-Method', '*');
			res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
			res.setHeader('Access-Control-Allow-Headers', '*');
			res.setHeader('Content-Type', 'application/json');
			res.end('scatter');
		}

		await Promise.all(Object.keys(this.ports).map(async port => {
			const server = this.ports[port] ? https.createServer(_certs, requestHandler) : http.createServer(requestHandler);
			this.websockets.push(new WebSocket.Server({ server }));
			server.listen(port); 
			return true;
		}));

		this.websockets.map(ws => ws.on('connection', socketHandler));
		return this.websockets;
	}

	async close(){
		this.websockets.map(ws => {
			if(typeof ws.clients.map === 'function') ws.clients.map(ws => ws.terminate());
		})

		return true;
	}

	sendEvent(event, payload, origin){
		const sockets = Object.keys(this.openConnections).filter(x => x.indexOf(origin) === 0).map(x => this.openConnections[x]);
		sockets.map(x => this.emitSocket(x, 'event', {event, payload}));
		return true;
	}

	broadcastEvent(event, payload){
		Object.keys(this.openConnections).map(origin => this.sendEvent(event, payload, origin));
		return true;
	}

	async findOpenPorts(){
		const isPortAvailable = (port = 0) => {
			return new Promise(async resolve => {
				const server = net.createServer();

				server.once('error', err => resolve(err.code !== 'EADDRINUSE'));

				server.once('listening', () => {
					server.close();
					resolve(true);
				});

				server.listen(port);
			})
		}

		const findPort = async (delta=0) => {
			let port = 50005+delta;
			while(!await isPortAvailable(port)) port+=1500;
			return port;
		};

		const http = await findPort();
		const https = await findPort(1);
		this.ports = {[http]:false, [https]:true};
		return true;
	}

}

let sockets = new LowLevelSocketService();
class HighLevelSockets {

	static setMainWindow(w){
		mainWindow = w;
	}

	static async initialize(){
		const certs ={
            key: fs.readFileSync('./cert/key.pem'),
            cert:fs.readFileSync('./cert/cert.pem')
          };
		return sockets.initialize(certs);
	}

	static async close(){
		return sockets.close();
	}

	static async sendEvent(event, payload, origin){
		return sockets.sendEvent(event, payload, origin);
	}

	static async broadcastEvent(event, payload){
		return sockets.broadcastEvent(event, payload);
	}

	static async emit(origin, id, path, data){
		return sockets.emit(origin, id, path, data);
	}

	static async getNewKey(origin, id){
		return sockets.getNewKey(origin, id);
	}
}

module.exports = HighLevelSockets;
