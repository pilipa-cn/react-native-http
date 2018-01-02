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

    // 自定义表单参数
    async modifyParams(params): Object {
        return params;
    }

    isConnected() : boolean {
        return true;
    }

    /**
     * 处理默认的Http错误信息, 确保msg不为空, 子类可以覆盖此行为.
     * @param response Response对象
     * @returns {{code: *, msg: *}}
     */
    makeErrorMsg (response) : Object {
        let json = super.makeErrorMsg(response);
        let {status, statusText} = response;

        if(status === 401) {
            // 401 转向登录页面
            console.log('goLoginPage', true);
        }

        if(status === 500) {
            return {'code':  500, 'msg':  '内部错误,请稍后重试'}
        }

        return json;
    }
}