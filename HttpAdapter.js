function unimplementedError(methodName, classname) {
    return new Error(
        `${methodName} is a required method of ${classname}, but was not implemented.`,
    );
}

/**
 * A HttpAdapter interface.
 */
export default class HttpAdapter {

    /**
     * 自定义头信息, 异步方法
     * @param headers 原始头信息, 可能为空
     * @returns 修改后的头信息
     */
    async modifyHeaders (headers) : Object {
        throw unimplementedError('modifyHeaders', 'HttpAdapter');
    }

    /**
     * 自定义表单参数
     * @param params 原始参数信息, 可能为空
     * @returns 修改后的表单参数
     */
    async modifyParams(params): Object {
        throw unimplementedError('modifyParams', 'HttpAdapter');
    }

    /**
     * 通用的处理响应报文的业务逻辑
     * @param responseJson 解析后的JSON
     * @returns {Promise.<Object>}
     */
    async handleResponse(responseJson): Object {
        throw unimplementedError('handleResponse', 'HttpAdapter');
    }

    /**
     * 返回是否已连接网络.
     */
    isConnected() : boolean {
        throw unimplementedError('isConnected', 'HttpAdapter');
    }


    /**
     * 处理默认的Http错误信息, 确保msg不为空, 子类可以覆盖此行为.
     * @param response Response对象
     * @returns {{code: *, msg: *}}
     */
    makeErrorMsg (response) : Object {
        let {status, statusText} = response;
        if (statusText === undefined) {
            let errorMap = new Map();
            errorMap.set(200, '成功');
            errorMap.set(400, '请求不正确');
            errorMap.set(401, '没有权限');
            errorMap.set(404, '找不到文件或目录');
            errorMap.set(413, '发送内容过大');
            errorMap.set(500, '服务器内部错误');
            errorMap.set(502, '服务暂时不可用');
            errorMap.set(504, '服务器处理超时');

            statusText= errorMap.get(status);
            if (statusText === undefined) {
                statusText = '请求服务出错';
            }
        }
        return {'code':  status, 'msg':  statusText}
    }
}