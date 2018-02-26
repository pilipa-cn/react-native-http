import loggerService from "../httpLogger/LoggerService";
import InMemory from "../httpLogger/adapters/in-memory";
import debounce from "debounce";

it('test insert', () => {
    let update = (data) => {
        if (data) {
            console.log("数据:", data);
        }
    };

    let updateDebounced = debounce(update, 150);

    loggerService.init(new InMemory() /* You can send new InMemoryAdapter() if you do not want to persist here*/
        , {
            //Options (all optional):
            logToConsole: true, //Send logs to console as well as device-log
            maxNumberToRender: 2000, // 0 or undefined == unlimited
            maxNumberToPersist: 2 // 0 or undefined == unlimited
        }).then(() => {


        loggerService.onDebugRowsChanged(update);

        //When the deviceLog has been initialized we can clear it if we want to:
        loggerService.clear();
        loggerService.log("启动了1");
        loggerService.log("启动了2");
        loggerService.log("启动了3");
        loggerService.log("启动了4");

        console.log('loggerService.rowsToInsert', loggerService.rowsToInsert);
    });

});