import HttpAdapter from './HttpAdapter';

export default function validateAdapter(adapter) {
  if (adapter !== null && !(adapter instanceof HttpAdapter)) {
    throw new Error(
        `
      Http Internal Error: configured http adapter did not inherit from the HttpAdapter. To
      configure an adapter, you should call \`HTTP.setAdapter(new HttpAdapter());\`
      where \`Adapter\` is the adapter
      corresponding to the library currently being tested. For example:

      import {HttpAdapter} from 'react-native-http';

    `
    );
  }
}
