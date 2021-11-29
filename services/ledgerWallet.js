
const foreach = (arr, callback) => {
	function iterate(index, array, result) {
		if (index >= array.length) {
			return result;
		} return callback(array[index], index).then((res) => {
			result.push(res);
			return iterate(index + 1, array, result);
		});
	}
	return Promise.resolve().then(() => iterate(0, arr, []));
}



module.exports = class LedgerWallet
{
    
    serialize (chainId, transaction, types){
        const writer = new asn1.BerWriter();

        encode(writer, types.checksum256.prepare(chainId));
        encode(writer, types.time_point_sec.prepare(transaction.expiration));
        encode(writer, types.uint16.prepare(transaction.ref_block_num));
        encode(writer, types.uint32.prepare(transaction.ref_block_prefix));
        encode(writer, types.uint8.prepare(0));
        encode(writer, types.uint8.prepare(transaction.max_cpu_usage_ms));
        encode(writer, types.uint8.prepare(transaction.delay_sec));
        encode(writer, types.uint8.prepare(0));
        encode(writer, types.uint8.prepare(transaction.actions.length));

        for (let i = 0; i < transaction.actions.length; i +=1) {
            const action = transaction.actions[i];

            encode(writer, types.name.prepare(action.account));
            encode(writer, types.name.prepare(action.name));
            encode(writer, types.uint8.prepare(action.authorization.length));

            for (let i = 0; i < action.authorization.length; i += 1) {
                const authorization = action.authorization[i];
                encode(writer, types.name.prepare(authorization.actor));
                encode(writer, types.name.prepare(authorization.permission));
            }

            if(action.data){
                const data = Buffer.from(action.data, 'hex');
                encode(writer, types.uint8.prepare(data.length));
                encode(writer, data);
            }
            else {
                try {
                    encode(writer, types.uint8.prepare(0))
                    encode(writer, new Buffer(0));
                } catch(e){
                    //console.log('err', e);
                }
            }
        }

        encode(writer, types.uint8.prepare(0));
        encode(writer, types.checksum256.prepare(Buffer.alloc(32, 0).toString('hex')));

        return writer.buffer;
    }

}