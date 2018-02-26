import { AsyncStorage, AppState, NetInfo } from "react-native";
import moment from "moment";
import InMemory from "./adapters/in-memory";
import debounce from "debounce";
import stacktraceParser from "stacktrace-parser";
import stringify from "json-stringify-safe";
import StringifyDataWriter from "./StringifyDataWriter";
import guid from "./guid";
import colors from "./colors";


class LoggerService {
    constructor(options) {
        options = options || {};
        options.colors = options.colors || {};
        options.colors = { ...colors, ...options.colors };

        this.logRows = [];
        this.store = new StringifyDataWriter(new InMemory());
        this.listners = [];
        this.options = {
            logToConsole: true,
            maxNumberToRender: 0,
            maxNumberToPersist: 3,
            rowInsertDebounceMs: 200,
            ...options,
        };
    }

    async init(storageAdapter, options = {}) {
        options.colors = options.colors || {};
        options.colors = { ...colors, ...options.colors };

        this.options = {
            ...this.options,
            ...options,
        };

        if (this.options.customDataWriter) {
            this.store = this.options.customDataWriter;
        } else {
            this.store = new StringifyDataWriter(
                storageAdapter || new InMemory()
            );
        }


        this._initalGet();
    }

    async insertStoreRows(rows) {
        if (this.store.readOnly) {
            return;
        }
        this.rowsToInsert = this.rowsToInsert || [];
        this.rowsToInsert = this.rowsToInsert.concat(rows);
        // 删除超出保存范围的数据
        if(this.options.maxNumberToPersist && this.rowsToInsert.length > this.options.maxNumberToPersist) {
            console.log("删除数据");
            this.rowsToInsert = this.rowsToInsert.slice(this.rowsToInsert.length - this.options.maxNumberToPersist, this.rowsToInsert.length);
            console.log("this.rowsToInsert.length", this.rowsToInsert.length);
        }

        if (!this.debouncedInsert) {
            this.debouncedInsert = debounce(() => {
                if (this.store && this.store.insertRows) {
                    const insertArray = this.rowsToInsert;
                    this.rowsToInsert = [];
                    return this.store.insertRows(
                        insertArray,
                        this.getEmittableData(this.logRows)
                    );
                }
            }, this.options.rowInsertDebounceMs);
        }
        this.debouncedInsert();
    }

    async _initalGet() {
        this.initPromise = this.store.getRows();
        const rows = await this.initPromise;
        this.store.setReadOnly(false);
        const newRows = this.logRows;
        this.logRows = this.logRows.concat(rows);
        this.sortLogRows();
        await this.insertStoreRows(newRows);
        if (this.store.initalDataRead) {
            await this.store.initalDataRead(this.logRows);
        }
        return this.emitDebugRowsChanged(this.logRows);
    }

    sortLogRows() {
        this.logRows.sort((left, right) => {
            let dateDiff = moment
                .utc(right.timeStamp)
                .diff(moment.utc(left.timeStamp));
            if (dateDiff === 0) {
                return right.lengthAtInsertion - left.lengthAtInsertion;
            }
            return dateDiff;
        });
    }

    async _getAndEmit() {
        const rows = await this.store.getRows();
        return this.emitDebugRowsChanged(rows);
    }


    async clear() {
        this.logRows = [];
        await this.store.clear();
        return await this._getAndEmit();
    }

    log(...logRows) {
        return this._log("log", undefined, ...logRows);
    }

    debug(...logRows) {
        return this._log("debug", undefined, ...logRows);
    }

    info(...logRows) {
        return this._log("info", undefined, ...logRows);
    }

    error(...logRows) {
        return this._log("error", undefined, ...logRows);
    }

    warn(...logRows) {
        return this._log("warn", undefined, ...logRows);
    }

    fatal(...logRows) {
        return this._log("fatal", undefined, ...logRows);
    }

    success(...logRows) {
        return this._log("success", undefined, ...logRows);
    }

    seperator(name) {
        return this._log("seperator", undefined, name);
    }

    getColorForLogLevel(level) {
        return this.options.colors[level] || "#fff";
    }

    async _log(level, options, ...logRows) {
        let color = this.getColorForLogLevel(level);
        if (options) {
            if (options.color) {
                color = options.color;
            }
        }
        this.logToConsole(level, color, ...logRows);
        let formattedRows = logRows.map((logRow, idx) => ({
            id: guid(),
            lengthAtInsertion: this.logRows.length + idx,
            level,
            message: this._parseDataToString(logRow),
            timeStamp: moment(),
            color,
        }));
        if (this.options.appendToLogRow) {
            formattedRows = formattedRows.map(logRow =>
                this.options.appendToLogRow(logRow)
            );
        }


        if (this.store.logRowCreated) {
            formattedRows.forEach(logRow => this.store.logRowCreated(logRow));
        }

        await this._appendToLog(formattedRows);
        if (!this.initPromise) {
            await this._initalGet();
        }
    }

    logToConsole(level, color, ...logRows) {
        if (
            this.options.logToConsole &&
            (!this.options.disableLevelToConsole ||
                !this.options.disableLevelToConsole.some(
                    disabledLevel => disabledLevel === level
                ))
        ) {
            let avaliableConsoleLogs = ["log", "info", "debug", "error"];
            let consoleLogFunc =
                avaliableConsoleLogs.find(avCL => avCL === level) || "log";
            console[consoleLogFunc](...logRows);
        }
    }

    _parseDataToString(data) {
        if (typeof data === "string" || data instanceof String) {
            return data;
        } else {
             //FYI: spaces > tabs
            // if (dataAsString && dataAsString.length > 12000) {
            //     dataAsString =
            //         dataAsString.substring(0, 12000) +
            //         "...(Cannot display more RN-device-log)";
            // }
            // return stringify(data, null, "  ");
            return JSON.stringify(data);
        }
    }

    _appendToLog(logRows) {
        this.logRows = logRows.concat(this.logRows);
        this.insertStoreRows(logRows);
        this.emitDebugRowsChanged(this.logRows);
    }

    onDebugRowsChanged(cb) {
        this.listners.push(cb);
        cb(this.getEmittableData(this.logRows));
        return () => {
            let i = this.listners.indexOf(cb);
            if (i !== -1) {
                this.listners.splice(i, 1);
            }
        };
    }

    emitDebugRowsChanged(data) {
        this.listners.forEach(cb => cb(this.getEmittableData(data)));
    }

    getEmittableData(rows) {
        if (this.options.maxNumberToRender !== 0) {
            return rows.slice(0, this.options.maxNumberToRender);
        }
        return rows;
    }
}

export default new LoggerService();
