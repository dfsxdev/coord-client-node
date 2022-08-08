var coordclient = require('../coordclient');
coordclient.init('118.114.172.146:8181');
// coordclient.init('[2001:2001:2001:2001:2001::11]:8500');

function test() {
    coordclient.getService('cms-api').then(
        function (result) {
            console.log('get Service OK, result: ', result);
        },
        function (error) {
            // console.log('get Service error:', error);
        }
    );

    coordclient.getKeys('redis.password').then(
        function (result) {
            console.log('get key OK, result: ', result);
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
