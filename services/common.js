
const url = require('url')
const { app } = require('electron')
const path = require('path')
module.exports = class Common
{
    static getUrl(globalid,hash)
    {
        if(!hash)hash=''
        
        if(!process.env.IS_DEV)
        {
            var address=process.env.APP_URL;
            var urlData=path.resolve(app.getAppPath(), address);
            return url.format({
                slashes: true,
                protocol: 'file:', 
                pathname: urlData,
                hash:hash,
                query: {
                globalid: globalid//
                }
            }) 
            
            
        }
        else
        {
            var address=process.env.APP_URL+'/#/'+hash+'?globalid='+globalid;
            return address 

        }
    }
}