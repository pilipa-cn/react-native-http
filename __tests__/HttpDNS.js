import {Http, HttpAdapter} from '../';
// @deprecated 此类暂时未使用
export default class HttpDNS extends Object {
    static async parseDNS(host:string):string {
        try {
            let ip = await Http.httpRaw("http://119.29.29.29/d", {dn:host}, "GET");
            if(ip !== null && ip.length > 0) {
                return ip;
            }
        } catch (e) {
            console.log('tencent httpdns failure', e);
            return host;
        }

        return host;
    }
}