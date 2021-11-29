const Rest =require('rest');

module.exports=class OptionService
{
    static server="https://megaapi.hamian-wallet.com/"
    static async getNetworks()
    {
        return await Rest.post(this.server+'web/getOptions',{table:'networks'})
    }
}