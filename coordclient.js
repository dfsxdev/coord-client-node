var urlParser = require('url');

class ConsulClient {
    constructor() {
        this.cacheServiceData = {};
        this.cacheServiceWatch = {};

        this.cacheKeyData = {};
        this.cacheKeyWatch = {};

        this.cacheKeyValueData = {};
        this.cacheKeyValueWatch = {};
    }

    init(address) {
        let url = urlParser.parse('http://' + address);
        var host = url.hostname;
        var port = url.port;
        this.consul = require('consul')({
            host: host,
            port: port
        });
    }

    log(str, ...args) {
        if (process.env.NODE_ENV != 'production') {
            if (args.length > 0) {
                console.log(str, args);
            } else {
                console.log(str);
            }

        }
    }

    isServiceWatched(type, serviceName) {
        let watched = this.cacheServiceWatch[serviceName];
        return watched != null ? watched : false;
    }

    addServiceWatch(serviceName) {
        let self = this;

        self.cacheServiceWatch[serviceName] = true;

        var watch = this.consul.watch({
            method: this.consul.catalog.service.nodes,
            options: {
                service: serviceName
            }
        });

        watch.on('change', function (result, res) {
            self.log('watch Service data:', result);

            let ret = null;
            if (result.length > 0) {
                ret = {
                    name: result[0].ServiceName,
                    host: result[0].Address,
                    port: result[0].ServicePort
                };
            }

            self.cacheServiceData[serviceName] = ret;
        });

        watch.on('error', function (err) {
            self.log('watch Service error:', err);
            if(self.cacheServiceWatch[serviceName]){
                delete self.cacheServiceWatch[serviceName];
            }
        });
    }

    getService(serviceName) {
        let self = this;
        return new Promise(function (resolve, reject) {
            if (self.isServiceWatched(serviceName)) {
                let data = this.cacheServiceWatch[serviceName];
                reject(data);
                return;
            } else {
                self.addServiceWatch(serviceName);
            }

            self.consul.catalog.service.nodes(serviceName, function (err, result) {
                if (err) {
                    self.log('getService error: \'%s\'', err);
                    reject(err);
                }

                let ret = null;
                if (result.length > 0) {
                    ret = {
                        name: result[0].ServiceName,
                        host: result[0].Address,
                        port: result[0].ServicePort
                    };
                }

                self.cacheServiceData[serviceName] = ret;
                resolve(ret);
            });
        });
    }

    isKeyWatched(type, path) {
        let watched = this.cacheKeyWatch[path];
        return watched != null ? watched : false;
    }

    addKeyWatch(path) {
        let self = this;

        self.cacheKeyWatch[path] = true;

        var watch = this.consul.watch({
            method: this.consul.kv.keys,
            options: {
                key: path
            }
        });

        watch.on('change', function (result, res) {
            self.log('watch key data:', result);

            let ret = result;

            self.cacheKeyData[path] = ret;
        });

        watch.on('error', function (err) {
            self.log('watch Key error:', err);
            if(self.cacheKeyWatch[path]){
                delete self.cacheKeyWatch[path];
            }
        });
    }

    getKeys(path) {
        let self = this;
        return new Promise(function (resolve, reject) {
            if (self.isKeyWatched(path)) {
                let data = this.cacheKeyWatch[path];
                reject(data);
                return;
            } else {
                self.addKeyWatch(path);
            }

            self.consul.kv.keys(path, function (err, result) {
                if (err) {
                    self.log('getKey error: \'%s\'', err);
                    reject(err);
                }

                let ret = result;
                self.cacheKeyData[path] = ret;
                resolve(ret);
            });
        });
    }

    putKeyValue(key, value) {
        let self = this;
        return new Promise(function (resolve, reject) {
            self.consul.kv.set(key, value, function (err, result) {
                if (err) {
                    self.log('setKeyValue error: \'%s\'', err);
                    reject(err);
                }
                resolve(value);
            });
        });
    }

    isKeyValueWatched(type, key) {
        let watched = this.cacheKeyValueWatch[key];
        return watched != null ? watched : false;
    }

    addKeyValueWatch(key) {
        let self = this;

        self.cacheKeyValueWatch[key] = true;

        var watch = this.consul.watch({
            method: this.consul.kv.get,
            options: {
                key: key
            }
        });

        watch.on('change', function (result, res) {
            self.log('watch KeyValue data:', result);

            let ret = null;
            if(result && result.Value){
                ret = result.Value;
            }

            self.cacheKeyValueData[key] = ret;
        });

        watch.on('error', function (err) {
            self.log('watch KeyValue error:', err);
            if(self.cacheKeyValueWatch[key]){
                delete self.cacheKeyValueWatch[key];
            }
        });
    }

    getKeyValue(key) {
        let self = this;
        return new Promise(function (resolve, reject) {
            if (self.isKeyValueWatched(key)) {
                let data = this.cacheKeyValueWatch[key];
                reject(data);
                return;
            } else {
                self.addKeyValueWatch(key);
            }

            self.consul.kv.get(key, function (err, result) {
                if (err) {
                    self.log('getKeyValue error: \'%s\'', err);
                    reject(err);
                }

                let ret = null;
                if(result && result.Value){
                    ret = result.Value;
                }

                self.cacheKeyValueData[key] = ret;
                resolve(ret);
            });
        });
    }
}

exports = module.exports = new ConsulClient();