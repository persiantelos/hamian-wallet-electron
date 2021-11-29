const { Api, JsonRpc, RpcError } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');      // development only
const fetch = require('node-fetch');                                    // node only; not needed in browsers
const { TextEncoder, TextDecoder } = require('util'); 
var url='https://mainnet.persiantelos.com'
const ecc = require('eosjs-ecc');
var rest=require('../rest');

const Hasher =require( '../utils/Hasher');
const IdGenerator =require( '../utils/IdGenerator');
module.exports=class EosioPlugin{
    static hash='';
    static async findUser(data)
    {
        var dt =await global.gclass.storage.loadData();
        if(!dt)return false;
        if(!dt.accounts)dt.accounts=[];
       return dt.accounts.filter(p=>p.authority+p.publicKey+p.name == data.authority+data.publicKey+data.name)[0]
    }
    static async checkAccountData(account)
    {
        var pub = ecc.PrivateKey(account.key).toPublic().toString('EOS');
        var data = await rest.post(account.url+'/v1/history/get_key_accounts',{"public_key":pub});
        data.publicKey=pub;
        return data;
    }
    static async getHash()
    {
        
        console.log(IdGenerator)
        if(!this.hash){
            this.hash = Hasher.unsaltedQuickHash(IdGenerator.text(32))
            
        }
        return this.hash;
    }
    static async createAccount(data)
    {  
        //if(!data.hash)data.hash=await this.getHash(); 
        data.publicKey =ecc.PrivateKey(data.privateKey).toPublic().toString('EOS');
        data._id=data.authority+data.publicKey+data.name;
        return data;
    }
    static async makeStandardTransaction(transaction)
    { 
        if(transaction.serializedTransaction)
        {
            
            var rpc = new JsonRpc(url, { fetch });
            var api = new Api({ rpc, signatureProvider:{}, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
            var xx=await api.deserializeTransactionWithActions(transaction.serializedTransaction)            
            return xx.actions;
        }
        else
        {
            return transaction;
        }
    }
    static async runTransaction(network,transaction,account,payload)
    {
        const signatureProvider = new JsSignatureProvider([account.privateKey]);
        var url=network.httpEndpoint;//.replace('https','http'); 
        if(!url)
        {
            url='http://'+network.host;
        }
        // network.httpEndpoint='https://testnet.persiantelos.com/'
        var rpc = new JsonRpc(url, { fetch }); 

        const authorityProvider = {
            getRequiredKeys: (args)=> {
              return Promise.resolve([account.publicKey])
            },
          }
        var api = new Api({ rpc,authorityProvider, signatureProvider,chainId:network.chainId, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
        try{

            var data = await api.transact(
                {
                    "actions" : transaction, 
                } 
                ,{
                    blocksBehind: 3,
                    expireSeconds: 30,  
                    // sign: true 
                }
            );
            console.log('----->>>',data) 
            if(data.transaction_id)
            { 
                // setTimeout(async()=>{
                //     var transaction_data = await rest.post((pre)+'/v1/history/get_transaction',{"block_num_hint":0,id:data.transaction_id});

                //     console.log('||||----->>>',transaction_data.trx.trx) 
                //     console.log('||||----->>>',data.transaction_id) 
                // },1000)
	            return {data:data.signatures} 
            }
            return data
        }catch(exp)
        {
            console.log(exp)
        }
    }
}