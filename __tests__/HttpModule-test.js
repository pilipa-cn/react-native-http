import 'isomorphic-fetch';

import {Http, HttpAdapter} from '../';
import TestHttpAdapter from "./TestHttpAdapter";

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