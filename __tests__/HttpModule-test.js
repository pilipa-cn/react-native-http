import 'isomorphic-fetch';
import fetchMock from 'fetch-mock';

import {Http, HttpAdapter} from '../';
import TestHttpAdapter from "../mocks/TestHttpAdapter";
import HttpDNS from "../mocks/HttpDNS";
import HTTP from "../HTTP";


it('default adapter test', async () => {
    Http.setAdapter(new HttpAdapter());
    try {
        console.log(await Http._commonHeaders(null));
    } catch (e) {
        console.log(e);
        expect(e).toBeDefined();
    }

});

it('customize adapter test', async () => {
    HTTP.setEnableLog(true, null);
    Http.setAdapter(new TestHttpAdapter());

    let headers = await Http._commonHeaders(null);
    let ua = headers.get('useragent');
    console.log(headers.get('useragent'));
    expect(ua).toBe('testapp');
    Http.setAdapter(null);
});

it('httpRaw and getRaw', async () => {
    fetchMock.get('*', '47.94.123.10');
    fetchMock.post('*', '47.94.123.10');

    let host = "app.i-counting.cn";
    let text = await Http.httpRaw("http://119.29.29.29/d", {dn:host}, "GET");
    expect(text).toEqual("47.94.123.10");
    text = await Http.getRaw("http://119.29.29.29/d", {dn:host});
    expect(text).toEqual("47.94.123.10");
    text = await Http.postRaw("http://119.29.29.29/d", {dn:host});
    expect(text).toEqual("47.94.123.10");
});

it('status code test', () => {
    fetchMock.get('*', {status:401});
    fetchMock.post('*', 500);
    // fetchMock.get('*', JSON.parse('{"success":true, "status": 500, "code":200,"msg":null,"data":null, "jest": true}'));
    Http.setAdapter(new TestHttpAdapter());

    let host = "app.i-counting.cn";
    Http.getEx("http://"+host).then(
        v => { console.log("返回值", v)},
        e => { console.log("出错了", e)}
    )
});

it('_fetch', async () => {
    let host = "https://app.i-counting.cn/app/v0/about";
    let response = await Http._fetch(host, { params: {dn:host}, method: "POST" });
});

it('httpEx', () => {
    // fetchMock._unMock();
    HTTP.setEnableLog(true, null);
    Http.setAdapter(new TestHttpAdapter());
    let host = "https://app.i-counting.cn/app/v0/about";

    try {
        Http.httpEx(host, {token:'0'}, "POST");
    } catch (e) {
        console.error(e);
    }

    // console.log(text);
    // expect(text).toEqual('请求非法，没有Authorize头信息！');
});

it('httpEx get', async () => {
    HTTP.enableLog = true;
    // fetchMock.get('*', '47.94.123.10');

    let host = "app.i-counting.cn";
    try {
        let text = await Http.httpEx("http://119.29.29.29/d", {dn:host}, "GET");
        console.log(text);
    } catch(e) {
        expect(e).toBe("47.94.123.10");
    }

    // expect(text).toEqual({Failed: "47.94.123.10"});
});

it('http log test', async () => {
    // HTTP.enableLog = true;
    HTTP.setEnableLog(true, null);
    // fetchMock.get('*', '47.94.123.10');

    let urlInfo = HTTP._makeURL("https://x-www.i-counting.cn/api/v1.01/verificodes/sms?mobile=13810397064&type=1&imgcode=Whcs&device=53692450803", {version:'2.1.0', client:'app'},
        'GET');

    console.log(urlInfo.url);

    // expect(text).toEqual({Failed: "47.94.123.10"});
});


it('httpRaw and getRaw', async () => {
    let host = "app.i-counting.cn";
    let text = await Http.httpRaw("http://119.29.29.29/d", {dn:host}, "GET");
    expect(text).toEqual("47.94.123.10");
    text = await Http.getRaw("http://119.29.29.29/d", {dn:host});
    expect(text).toEqual("47.94.123.10");
    // text = await Http.postRaw("http://119.29.29.29/d", {dn:host});
    // expect(text).toEqual("47.94.123.10");
});

it('make url test', () => {
    let urlInfos = Http._makeURL("http://www.test.com", {dn:"host", a:"b"}, "GET");
    console.log(urlInfos);
    expect(urlInfos.url).toEqual('http://www.test.com?dn=host&a=b');
    expect(urlInfos.params).toEqual(null);

    urlInfos = Http._makeURL("http://www.test.com", {dn:"host", a:"b"}, "POST");
    console.log(urlInfos);
    expect(urlInfos.url).toEqual('http://www.test.com');
    expect(urlInfos.params).toEqual({dn:"host", a:"b"});
});