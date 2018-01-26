/**
 * 基础的Http功能封装.
 * Ref: https://developer.mozilla.org/en-US/docs/Web/API/Headers
 * https://developer.mozilla.org/en-US/docs/Web/API/Response
 * node_modules/node-fetch/lib/response.js
 * https://developer.mozilla.org/en-US/docs/Web/API/Request
 * http://www.jianshu.com/p/ccf99a12faf1
 * https://github.com/rebeccahughes/react-native-device-info 设备信息
 *
 * Created by beansoft on 17/5/22.
 */

import HttpAdapter from './HttpAdapter';
import validateAdapter from "./validateAdapter";

export default class HTTP {
    static oldFetchfn = fetch; //拦截原始的fetch方法
    static timeout = 5 * 1000;// 5秒请求超时
    static httpAdapter: HttpAdapter = null;// A child class of HttpAdapter
    static __TEST = false;// 是否为单元测试, 为false时发起真正的数据请求
    static enableLog = false;// 是否启用Http请求日志存储功能
    /**
     * 设置每个App独立的HttpAdapter, 来处理返回值, 参数封装和头修改这些工作.
     * @param httpAdapter
     */
    static setAdapter(httpAdapter: HttpAdapter) {
        validateAdapter(httpAdapter);
        HTTP.httpAdapter = httpAdapter;
    }

    //定义新的fetch方法，封装原有的fetch方法, 支持超时
    static _fetch(input, opts) {
        let urlInfo = HTTP._makeURL(input, opts.body, opts.method);
        input = urlInfo.url;
        opts.body = urlInfo.params;

        if (HTTP.__TEST) {
            return fetch(input, opts);// fix jest, if not, fetch mock will not work, real http will be done
        }

        // let _fetchPromise = HTTP.oldFetchfn(input, opts); // 去掉直接请求
        let fetchDone = false;// 请求是否已正常结束

        // 采用新promise来避免每个接口都会被判断为超时的bug
        let fetchPromise = new Promise(function (resolve, reject) {
            HTTP.oldFetchfn(input, opts)
                .then( (response) => {
                    resolve(response);
                    fetchDone = true;
                })
                .catch((error) => {
                    fetchDone = true;
                    reject(error);
                });// 千万不能加 .done(), 否则后续动作不触发
        });

        if (opts.timeout === undefined) {
            opts.timeout = HTTP.timeout;
        }

        let timeoutPromise = new Promise(function (resolve, reject) {
            let _timer =
                setTimeout(() => {
                    clearTimeout(_timer);
                    // console.log("=====> 超时判断 fetchDone", fetchDone);
                    if(!fetchDone) {
                        console.log('!!!!!!!****', urlInfo.url, " 请求超时!");
                        reject({'code': '408', 'msg': '暂无网络'});
                    }

                }, opts.timeout)
        });

        return Promise.race([fetchPromise, timeoutPromise]);
    }

    /**
     * 支持报文校验处理的GET请求.
     *
     * @param url
     * @param params {} 表单参数
     * @param headers 自定义头信息
     *
     * @return {Promise}
     *
     */
    static async getEx(url, params, headers) {
        return HTTP.httpEx(url, params, "GET", headers);
    }

    /**
     * 支持报文校验处理的POST请求.
     *
     * @param url
     * @param params {} 表单参数
     * @param headers 自定义头信息
     *
     * @return {Promise}
     *
     * */
    static async postEx(url, params, headers) {
        return HTTP.httpEx(url, params, "POST", headers);
    }

    static async putEx(url, params, headers) {
        return HTTP.httpEx(url, params, "PUT", headers);
    }

    static async deleteEx(url, params, headers) {
        return HTTP.httpEx(url, params, "DELETE", headers);
    }

    /**
     * 支持报文校验处理的HTTP请求.
     *
     * @param url
     * @param params {} 表单参数
     * @param headers 自定义头信息
     * @param method 方法, 默认为POST
     * @return {Promise}
     *
     * */
    static async httpEx(url, params = {}, method = 'POST', headers = null) {
        if (HTTP.httpAdapter !== null) {
            if (!HTTP.httpAdapter.isConnected()) {
                return Promise.reject(
                    {'code': '4009', 'msg': '网络错误'}//（错误代码：4009）
                );
            }
        }

        let responseJson = await HTTP.http(url, params, method, headers);
        return HTTP._handleResponse(responseJson);
    }

    // 通用的处理响应报文的方法
    static async _handleResponse(responseJson): Promise {
        if (HTTP.httpAdapter === null) {
            return responseJson;
        }

        return HTTP.httpAdapter.handleResponse(responseJson);
    }

    /**
     * GET请求, 不与当前业务有任何关联
     *
     * @param url
     * @param params {} 表单参数
     * @param headers 自定义头信息
     *
     * @return {Promise}
     *
     * */
    static async getRaw(url, params = {}, headers = null) {
        return await HTTP.httpRaw(url, params, "GET", headers);
    };


    /**
     * GET请求
     *
     * @param url
     * @param params {} 表单参数
     * @param headers 自定义头信息
     *
     * @return {Promise}
     *
     * */
    static async get(url, params = {}, headers = null) {
        return HTTP.http(url, params, "GET", headers);
    }

    /**
     *
     * POST请求
     * @param url
     * @param params {}包装
     * @param headers
     *
     * @return {Promise}
     *
     **/
    static async post(url, params = {}, headers = null) {
        return HTTP.http(url, params, "POST", headers);
    };

    /**
     *
     * POST请求
     * @param url
     * @param params {}包装
     * @param headers
     * @param method 方法, 默认为POST
     * @return {Promise}
     *
     **/
    static async http(url, params = {}, method = 'POST', headers = null) {
        let httpLog = HTTP.enableLog ? {} : null;

        let paramsArray = await HTTP._commonParams(params);


        // POST 方式单独处理
        if (method !== 'GET') {
            let uploadPost = false;
            let formData = new FormData();
            for (let [k, v] of Object.entries(paramsArray)) {
                if (v) {
                    if (v.uri) {
                        uploadPost = true;
                    }
                    formData.append(k, v);
                }
            }

            console.log('文件上传请求:', uploadPost);

            if (uploadPost) {
                params = formData;
                headers = {...headers, 'Content-Type': 'multipart/form-data'};
            } else {
                params = Object.keys(paramsArray).map(key =>
                    encodeURIComponent(key) + '=' + encodeURIComponent(paramsArray[key] ? paramsArray[key] : '')
                ).join('&');
                headers = {...headers, 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'};
            }

        } else {
            params = paramsArray;
        }


        let start = new Date().getTime();
        console.log(method, "======> ", url, "Params", "=\n", paramsArray);
        if(httpLog) httpLog.url = url;
        if(httpLog) httpLog.method = method;
        if(httpLog) httpLog.params = paramsArray;
        if(httpLog) httpLog.start = start;

        let _headers = await HTTP._commonHeaders(headers);
        if(httpLog) httpLog.headers = headers;

        let response = await HTTP._fetch(url, {
            method: method,
            headers: _headers,
            body: params,
            credentials: 'include'
        });
        let end = new Date().getTime();
        console.log("<====== ", url, " 耗时", (end - start) + "毫秒");

        if(httpLog) httpLog.duration = (end - start);
        if(httpLog) httpLog.end = (end - start);
        if(httpLog) httpLog.ok = response.ok;

        // return HTTP._parseHttpResult(response);
        // console.log('_parseHttpResult() response.ok', response.ok, 'response.status=', response.status);
        if (!response.ok) {
            let text = await response.text();
            if(httpLog) httpLog.text = response.text;
            console.log(">>>>> error response:", text);
            // http status 码出错时 不再尝试解析错误文本为json
            let errorMsg = HTTP._makeErrorMsg(response);
            if(httpLog) httpLog.errorMsg = response.errorMsg;
            return Promise.reject(errorMsg);

        }

        console.log('httpLog=', httpLog);

        try {
            let text = await response.text();
            if(httpLog) httpLog.text = response.text;
            console.log("<<<<<< ", response.url, '\n', text);
            try {
                return JSON.parse(text);
            } catch (e) {
                if (text !== '' && text.length > 0) {
                    return Promise.reject(text);
                }
            }
        } catch (e) {
            let errorMsg = HTTP._makeErrorMsg(response);
            if(httpLog) httpLog.errorMsg = response.errorMsg;
            return Promise.reject(errorMsg);
        }
    };

    /**
     * POST请求, 返回原始的response对象, 不进行任何解析.
     * @param url
     * @param params {}包装
     * @param headers
     *
     * @return {Promise}
     *
     **/
    static async postRaw(url, params = {}, headers = null) {
        return HTTP.httpRaw(url, params, 'POST', headers);
    }

    static async putRaw(url, params = {}, headers = null) {
        return HTTP.httpRaw(url, params, 'PUT', headers);
    }

    static async deleteRaw(url, params = {}, headers = null) {
        return HTTP.httpRaw(url, params, 'DELETE', headers);
    }

    /**
     * 发起请求, 返回原始的response对象, 不进行任何解析, 不走 Adapter 处理.
     * @param url
     * @param params {} 参数
     * @param headers
     * @param method 方法, 默认为POST
     * @return {Promise}
     **/
    static async fetchRaw(url, params = {}, method = 'POST', headers = null) {
        // POST 方式单独处理
        if (method !== 'GET') {
            let formData = new FormData();
            for (let [k, v] of Object.entries(params)) {
                if (v !== null) {
                    formData.append(k, v);
                }
            }

            params = formData;
        }

        let urlInfo = HTTP._makeURL(url, params, method);
        url = urlInfo.url;
        params = urlInfo.params;

        console.log(new Date().toString(), "\n\t", method, " ======> ", url, "\n",
            "\t params", params, "\n",
            "\t Headers:", headers, "\n");

        let response = await fetch(url, {
            method,
            headers: headers,
            body: params,
            credentials: 'include'
        });

        console.log(new Date().toString() + " \t <<<<<<== ", response.statusText, "\n",
            "\t Headers:", response.headers, "\n");

        return response;
    };

    /**
     * 发起请求, 返回响应的文本信息.
     * @param url
     * @param params {} 参数
     * @param headers
     * @param method 方法, 默认为POST
     * @return {Promise}
     **/
    static async httpRaw(url, params = {}, method = 'POST', headers = null) {
        let response = await HTTP.fetchRaw(url, params, method, headers);

        if (!response.ok) {
            let text = await response.text();
            console.log("will throw ", text);
            // throw new Error(text);
            return Promise.reject(text);
        }

        let responseText = await response.text();
        console.log("response text:", responseText, "\n");
        return responseText;
    };

    /**
     * 解析URL和参数, 根据请求协议方式返回最终URL和参数. 主要针对GET方式处理.
     * @param url
     * @param params
     * @param method
     * @returns {{url: *, params: {}}}
     * @private
     */
    static _makeURL(url, params = {}, method = 'POST'): { url: *, params: * } {
        if (params && method === 'GET') {
            let paramsArray = [];

            // 获取 params 内所有的 key
            let paramsKeyArray = Object.keys(params);
            // 通过 forEach 方法拿到数组中每个元素,将元素与参数的值进行拼接处理,并且放入 paramsArray 中
            paramsKeyArray.forEach(key => paramsArray.push(key + '=' + params[key]));
            // 网址拼接
            if (url.search(/\?/) === -1) {
                url += '?' + paramsArray.join('&');
            } else {
                url += paramsArray.join('&');
            }

            params = null;// [TypeError: Body not allowed for GET or HEAD requests]
        }

        return {url, params};
    }

    // TODO refactor move out this method
    static async _parseHttpResult(response): Promise {
        // console.log('_parseHttpResult() response.ok', response.ok, 'response.status=', response.status);
        if (!response.ok) {
            let text = await response.text();
            console.log(">>>>> error response:", text);
            // http status 码出错时 不再尝试解析错误文本为json
            return Promise.reject(HTTP._makeErrorMsg(response));
        }

        try {
            let text = await response.text();
            console.log("<<<<<< ", response.url, '\n', text);
            try {
                let responseJson = JSON.parse(text);
                return responseJson;
            } catch (e) {
                if (text !== '' && text.length > 0) {
                    return Promise.reject(text);
                }
            }
        } catch (e) {
            console.log("post() will throw2 error ", e);
            return Promise.reject(HTTP._makeErrorMsg(response));
        }

    }

// 处理默认的Http错误信息, 确保msg不为空
    static _makeErrorMsg(response): Object {
        if (HTTP.httpAdapter === null) {
            return {'code': 0, 'msg': '请求服务出错'}
        }
        return HTTP.httpAdapter.makeErrorMsg(response);
    }

    // 自定义头信息
    static async _commonHeaders(headers): Object {
        if (HTTP.httpAdapter === null) {
            return headers;
        }

        let finalHeaders = await HTTP.httpAdapter.modifyHeaders(headers);
        console.log("======> Header: ", JSON.stringify(finalHeaders), "\n");
        return finalHeaders;
    }

// 添加App的公共表单参数
    static async _commonParams(params) {
        if (HTTP.httpAdapter === null) {
            return params;
        }
        return HTTP.httpAdapter.modifyParams(params);
    }

}

// global.HTTP = HTTP;// 全局可用