import 'isomorphic-fetch';

import {Http, HttpAdapter} from '../';
import TestHttpAdapter from "./TestHttpAdapter";
import HttpDNS from "./HttpDNS";

it('default adapter test', () => {
    Http.setAdapter(new HttpAdapter());
    try {
        console.log(Http._commonHeaders(null));
    } catch (e) {
        console.log(e);
        expect(e).toBeDefined();
    }

});

it('customize adapter test', () => {
    Http.setAdapter(new TestHttpAdapter());

    let headers = Http._commonHeaders(null);
    let ua = headers.get('useragent');
    console.log(headers.get('useragent'));
    expect(ua).toBe('testapp');
});

it('httpRaw and getRaw', async () => {
    let host = "app.i-counting.cn";
    let text = await Http.httpRaw("http://119.29.29.29/d", {dn:host}, "GET");
    expect(text).toEqual("47.94.123.10");
    text = await Http.getRaw("http://119.29.29.29/d", {dn:host});
    expect(text).toEqual("47.94.123.10");
    text = await Http.postRaw("http://119.29.29.29/d", {dn:host});
    expect(text).toEqual("47.94.123.10");
});

it('_fetch', async () => {
    let host = "https://app.i-counting.cn/app/v0/about";
    let response = await Http._fetch(host, { params: {dn:host}, method: "POST" });
});

it('httpEx', async () => {
    let host = "https://app.i-counting.cn/app/v0/about";
    let text = await Http.httpEx(host, {'token':'0'}, "POST");
    console.error(text);
    // text = await Http.postEx(host, {}, "POST");
    // expect(text).toEqual("47.94.123.10");
    // text = await Http.getRaw("http://119.29.29.29/d", {dn:host});
    // expect(text).toEqual("47.94.123.10");
});

it('httpEx get', async () => {
    let host = "app.i-counting.cn";
    let text = await Http.httpEx("http://119.29.29.29/d", {dn:host}, "GET");
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
    expect(urlInfos.params).toEqual({});

    urlInfos = Http._makeURL("http://www.test.com", {dn:"host", a:"b"}, "POST");
    console.log(urlInfos);
    expect(urlInfos.url).toEqual('http://www.test.com');
    expect(urlInfos.params).toEqual({dn:"host", a:"b"});
});