const Store = require('electron-store');
const fs =require('fs');
var aesjs = require('aes-js');
var pbkdf2 = require('pbkdf2');
const {app} = require('electron');
const { Console } = require('console');

const Hamian_Setting = 'setting';
var stores={};
var password='';
const store = new Store();
module.exports = class Storage{ 
    
    stringToByteArray(s){
        var result = new Uint8Array(s.length);
        for (var i=0; i<s.length; i++){
            result[i] = s.charCodeAt(i);/* w ww. ja  v  a 2s . co  m*/
        }
        return result;
    }
    async exist()
    {
        const path = `${app.getPath('userData')}/data.json`;
        var exist = fs.existsSync(path);
        return exist;
    }
    async isLogin()
    {
        return !!password;
    }
    async init(dt)
    {
        password=dt.password;
        if(dt.data)
        {

        }
        else
        {
            this.saveData({});
        }
        return true;
    }
    async login(pass)
    {
        password=pass;
        const path = `${app.getPath('userData')}/data.json`;
        var exist = fs.existsSync(path);
        if(!exist) return false;
        try{
            var key=pbkdf2.pbkdf2Sync(password, 'salt', 1, 256 / 8, 'sha512');//this.stringToByteArray(password);
            var text = fs.readFileSync(path,{encoding: 'utf8'})+'';  
            var encryptedBytes = aesjs.utils.hex.toBytes(text);  
            var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
            var decryptedBytes = aesCtr.decrypt(encryptedBytes);
            var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes); 
            return JSON.parse(decryptedText) ;

        }catch(exp){

            //  fs.unlinkSync(path)
        }
        return false
    }
    async loadData()
    { 
        const path = `${app.getPath('userData')}/data.json`;
        console.log(path)
        var exist = fs.existsSync(path);
        if(!exist) return false;
        try{
            var key=pbkdf2.pbkdf2Sync(password, 'salt', 1, 256 / 8, 'sha512');//this.stringToByteArray(password);
            var text = fs.readFileSync(path,{encoding: 'utf8'})+''; 
            var encryptedBytes = aesjs.utils.hex.toBytes(text);  
            var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
            var decryptedBytes = aesCtr.decrypt(encryptedBytes);
            var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
            return JSON.parse(decryptedText) ;

        }catch(exp){}
        return false
    }
    async saveData(data)
    {
        var text=JSON.stringify(data);
        var textBytes = aesjs.utils.utf8.toBytes(text);
        var key=pbkdf2.pbkdf2Sync(password, 'salt', 1, 256 / 8, 'sha512');//this.stringToByteArray(password);
        var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
        var encryptedBytes = aesCtr.encrypt(textBytes);
        var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
        const path = `${app.getPath('userData')}/data.json`; 
        fs.writeFileSync(path,encryptedHex);
    }   
    
    async addToJson(name,key,data)
    { 
        if(!store.get(name))
        {
            store.set(name, {});
        }
        store.set(name+'.'+key,data);
    }
    async getFromJson(name,key)
    {
        return store.get(name+'.'+key); 
    }
    async deleteFromJson(name,key)
    {
        store.delete(name+'.'+key); 
    }

    async getAllFromJson(name)
    {
        store.get(name+'.'+key); 
    }
    async saveSelectedAccount(account)
    {
        await global.gclass.storage.addToJson('selectedAccount',account.chainId,account.name);
        let isTrue = await global.gclass.storage.getFromJson('selectedAccount',account.chainId)
        if(isTrue){
            return {message:isTrue}
        }

    }
    async getSelectedAccount()
    {
        let data = await global.gclass.storage.getvalueFromJson('selectedAccount')
        if(data){
            return {message:data}
        }
    }
    async getvalueFromJson(name){
        return store.get(name)
    }
    async saveSelectedNode(node){
        let text = JSON.stringify(node)
        await global.gclass.storage.addToJson('selectedNetwork',node.name,text);
        let data = await global.gclass.storage.getvalueFromJson('selectedNetwork')
        if(data){
            return {message:'success', data:data}
        }
        else{
            return {message:'failed',data:{}}
        }
    }
    
    async getSelectedChain()
    {
        let data = await global.gclass.storage.getvalueFromJson('selectedNetwork')
        if(data){
            return {message:'success', data:data}
        }
        else{
            return {message:'failed',data:{}}
        }
    }
}