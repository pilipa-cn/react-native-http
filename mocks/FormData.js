/**
 * @class FormData, mock the fetch api FormData
 */
export default class FormData {
    append(k, v) {
        this[k] = v;
    }
}