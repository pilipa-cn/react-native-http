import FormData from './mocks/FormData';

// 修复 FormData 找不到的问题 ReferenceError: FormData is not defined
global.FormData = FormData;