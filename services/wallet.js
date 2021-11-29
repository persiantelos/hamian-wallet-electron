

// import ecc from 'eosjs-ecc'
const {ecc} = require('eosjs-ecc');
let {PrivateKey, PublicKey, Signature, Aes, key_utils, config} = require('eosjs-ecc')

var rest=require('./rest');
const CONNECTIONS='connections';
const APPLICATION='applicaion';

const Hasher =require( './utils/Hasher');
const IdGenerator =require( './utils/IdGenerator');
const EosioPlugin=require('./accounts/eosioPlugin')
const HighLevelSockets = require('./socket');
module.exports = class Wallet{
    async checkKey(dt)
    { 
        var chain=dt.chain;
        if(chain=='eos')
        {   
            return await EosioPlugin.checkAccountData(dt);
        }
    }
    async addAccount(dt)
    {  

        dt=await EosioPlugin.createAccount(dt);  
        var data =await global.gclass.storage.loadData(); 
        if(!data)return false;
        if(!data.accounts)data.accounts=[];
        var exist = data.accounts.filter(p=>p._id==dt._id)[0];
        if(exist) return false;
        data.accounts.push(dt);
        await global.gclass.storage.saveData(data);
        return true
    } 

    async makeStandardTransaction(transaction)
    { 
        return await EosioPlugin.makeStandardTransaction(transaction);
        
    }

    async findAccount(id)
    {

    }
    async getAccounts()
    {
        var data =await global.gclass.storage.loadData();
        if(!data)return false;
        if(!data.accounts)data.accounts=[];
        for(var a of data.accounts)
        {
            a.privateKey="";
        } 
        return data.accounts;
    }
    async checkApplication(appKey)
    {
        var data = await global.gclass.storage.getFromJson(APPLICATION,appKey)
        return !!data;
    } 
    async saveApplication(appKey,name)
    {
        await global.gclass.storage.addToJson(APPLICATION,appKey,name); 
    }

    async forgetConnection(id)
    {
        await global.gclass.storage.deleteFromJson(CONNECTIONS,id)
    }
    async checkConnection(id)
    { 
        console.log('-------',id)
        var data = await global.gclass.storage.getFromJson(CONNECTIONS,id)
        if(data)
        {
            data.useTime=new Date().getTime();
            await global.gclass.storage.addToJson(CONNECTIONS,id,{data:data.data,useTime:new Date().getTime()})
            return data.data;
        }
        return null;
    }
    async saveConnection(data)
    { 
        data.result.hash = Hasher.unsaltedQuickHash(IdGenerator.text(32))
        await global.gclass.storage.addToJson(CONNECTIONS,data.key,{data,useTime:new Date().getTime()})
    }
    async acceptTransaction(id)
    {
        if(!global.temp[id])return;
        var payload=global.temp[id];

        var dt= await this.runTransaction(payload)
        var result={}
        if(dt.data)
        {
            result={returnedFields:{},signatures:dt.data}
        }
        console.log('------------------------------------',dt)
        HighLevelSockets.emit(payload.payloadOrigin,payload.payloadId,'api',
        {id:payload.id,result:result});
        delete  global.temp[id];
    }
    async rejectTransaction(id)
    {
        console.log('payload:',id)
        if(!global.temp[id])return;
        var payload=global.temp[id];
        console.log('payload:',payload)
        HighLevelSockets.emit(payload.payloadOrigin,payload.payloadId,'api',
        {id:payload.id,result:{code: 402,isError: true, message: "User rejected the signature request", type: "signature_rejected"}});

        delete  global.temp[id];
    }
     async runTransaction(data)
    {
        var appKey=data.appkey;
        var connection = await this.checkConnection(appKey);
        if(!connection)
        {
            return {error:"connection not found"};
        }
        
        var account = await EosioPlugin.findUser(connection.result.accounts[0]);

 
        var network=data.payload.network;
        var transaction=data.payload.transaction; 
        var res = await EosioPlugin.runTransaction(network,transaction,account,data.payload);
 
        return res
    }
    async generateKeyOffline(){
        var public_key = '';
        var private_key = '';
        console.log('befor try')
        try{
            console.log('try')
            
            let privateWif
            PrivateKey.randomKey().then(privateKey => privateWif = privateKey.toWif())
            
            // Convert to a public key
            pubkey = PrivateKey.fromString(privateWif).toPublic().toString()
            
            console.log('privateWif',privateWif)
            console.log('pubkey',pubkey)

            // ecc.randomKey()
            // .then(privateKey => {
            //     console.log('then')
            //     console.log('Private Key:\t', privateKey) // wif
            //     console.log('Public Key:\t', ecc.privateToPublic(privateKey)) // EOSkey...
            //     private_key = privateKey;
            //     public_key = ecc.privateToPublic(privateKey)
            //     return [{public_key:public_key},{private_key:private_key}]
            // }).catch(err=>{
            //     console.log("err",err)
            // });
        }catch(exp){
            console.log("exp",exp)
        }
        
    }
}