import debugService from "../httpLogger/LoggerService";
import InMemory from "../httpLogger/adapters/in-memory";


it('test insert', () => {
    debugService.init(new InMemory() /* You can send new InMemoryAdapter() if you do not want to persist here*/
        , {
            //Options (all optional):
            logToConsole: true, //Send logs to console as well as device-log
            maxNumberToRender: 2000, // 0 or undefined == unlimited
            maxNumberToPersist: 2 // 0 or undefined == unlimited
        }).then(() => {

        //When the deviceLog has been initialized we can clear it if we want to:
        debugService.clear();
        debugService.log("启动了1");
        debugService.log("启动了2");
        debugService.log("启动了3");
        debugService.log("启动了4");

        console.log('debugService.rowsToInsert', debugService.rowsToInsert);
    });

});