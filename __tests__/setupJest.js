import FormData from './mocks/FormData';
import 'isomorphic-fetch';
import HTTP from "../HTTP";

// 修复 FormData 找不到的问题 ReferenceError: FormData is not defined
global.FormData = FormData;
HTTP.__TEST = true;