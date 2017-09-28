import {HttpAdapter} from "../index";

export default class TestHttpAdapter extends HttpAdapter {
    // 自定义头信息
    modifyHeaders (headers) : Object {
        let finalHeaders = new Headers();
        finalHeaders.append('userAgent', 'testapp'); // TODO 登录时的头信息, userAgent
        if(headers) {
            // 获取 headers 内所有的 key
            let headersKeyArray = Object.keys(headers);
            // 通过 forEach 方法拿到数组中每个元素,将元素与参数的值进行拼接处理,并且放入 paramsArray 中
            headersKeyArray.forEach(key => finalHeaders.append(key, headers[key]));
        }
        return finalHeaders;
    }

    isConnected() : boolean {
        return true;
    }

}