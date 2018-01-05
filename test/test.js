var coordclient = require('../coordclient');
coordclient.init('192.168.6.30:8500');

function test() {
    coordclient.getService('activemq').then(
        function (result) {
            console.log('get Service OK, result: ' + JSON.stringify(result));
        },
        function (error) {
            // console.log('get Service error:', error);
        }
    );

    coordclient.getKeys('web/').then(
        function (result) {
            console.log('get key OK, result: ' + JSON.stringify(result));

            coordclient.getKeys('web/').then(
                function (result) {
                    console.log('get key OK, result: ' + JSON.stringify(result));
                },
                function (error) {
                    // console.log('get key error:', error);
                }
            );
        },
        function (error) {
            // console.log('get key error:', error);
        }
    );

    // coordclient.putKeyValue('web/main.test', 'testvalue').then(
    //     function (result) {
    //         console.log('putKeyValue OK, result: ' + JSON.stringify(result));
    //     },
    //     function (error) {
    //         // console.log('get KeyValue error:', error);
    //     }
    // );
    //
    // coordclient.getKeyValue('web/main.test').then(
    //     function (result) {
    //         console.log('get KeyValue OK, result: ' + JSON.stringify(result));
    //     },
    //     function (error) {
    //         // console.log('get KeyValue error:', error);
    //     }
    // );
}

test();
