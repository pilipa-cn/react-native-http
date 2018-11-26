# react-native-http
A common Http fetch API library used by all pilipa app

封装了 Http Fetch 的基本使用, 并提供了扩展Adapter来让每个App定制自己的通用头信息和表单参数的处理.

Usage:

`npm install --save pilipa-cn/react-native-http`

基础使用:

```javascript
import {Http} from "react-native-http";
let ip = await Http.getRaw("http://119.29.29.29/d", {dn:'google.com'});
```

设置Adapter:

```javascript
import {Http, HttpAdapter} from "react-native-http";
Http.setAdapter(new TestHttpAdapter());

class TestHttpAdapter extends HttpAdapter {
    // 自定义头信息
    modifyHeaders (headers, url) : Object {
        let finalHeaders = new Headers();
        finalHeaders.append('userAgent', 'testapp'); // TODO 登录时的头信息, userAgent
        // 这里也可根据 url 来决定是否不同的header
        if(headers) {
            // 获取 headers 内所有的 key
            let headersKeyArray = Object.keys(headers);
            // 通过 forEach 方法拿到数组中每个元素,将元素与参数的值进行拼接处理,并且放入 paramsArray 中
            headersKeyArray.forEach(key => finalHeaders.append(key, headers[key]));
        }
        return finalHeaders;
    }

}
```

更多代码参考 HttpAdapter 中的方法注释.