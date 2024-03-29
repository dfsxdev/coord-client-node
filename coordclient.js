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
        let url = new URL('http://' + address);
        var host = url.hostname;
        var port = url.port;

        let defaults = {};
        if (process.env.CONSUL_TOKEN) {
            defaults = {
                token: process.env.CONSUL_TOKEN
            }

            // console.log('CONSUL_TOKEN=', process.env.CONSUL_TOKEN);
        }

        this.consul = require('consul')({
            host: host,
            port: port,
            defaults: defaults
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
                    host: result[0].ServiceAddress || result[0].Address,
                    port: result[0].ServicePort
                };
            }

            self.cacheServiceData[serviceName] = ret;
        });

        watch.on('error', function (err) {
            self.log('watch Service error:', err);
            if (self.cacheServiceWatch[serviceName]) {
                delete self.cacheServiceWatch[serviceName];
            }
        });
    }

    getService(serviceName, isWatch = false, isCache = true) {
        let self = this;
        return new Promise(function (resolve, reject) {
            if (isWatch === true) {
                isCache = isWatch;
            }
            if (isWatch === true) {
                if (self.isServiceWatched(serviceName)) {
                    let data = this.cacheServiceWatch[serviceName];
                    reject(data);
                    return;
                } else {
                    self.addServiceWatch(serviceName);
                }
            }

            if (isCache === true && self.cacheServiceData[serviceName]) {
                resolve(self.cacheServiceData[serviceName]);
            } else {
                self.consul.health.service({
                    'service': serviceName,
                    'passing': true
                }, function (err, result) {
                    if (err) {
                        self.log('getService error:', err);
                        reject(err);
                        return;
                    }

                    let ret = null;
                    if (result.length > 0) {
                        ret = {
                            name: result[0].Service.Service,
                            host: result[0].Service.Address.length > 0 ? result[0].Service.Address : result[0].Node.Address,
                            port: result[0].Service.Port
                        };
                    }

                    if (isCache === true) {
                        self.cacheServiceData[serviceName] = ret;
                    }
                    resolve(ret);
                });
            }
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
            if (self.cacheKeyWatch[path]) {
                delete self.cacheKeyWatch[path];
            }
        });
    }

    getKeys(path, isWatch = false, isCache = true) {
        let self = this;
        return new Promise(function (resolve, reject) {
            if (isWatch === true) {
                isCache = isWatch;
            }
            if (isWatch === true) {
                if (self.isKeyWatched(path)) {
                    let data = this.cacheKeyWatch[path];
                    reject(data);
                    return;
                } else {
                    self.addKeyWatch(path);
                }
            }

            if (isCache === true && self.cacheKeyData[path]) {
                resolve(self.cacheKeyData[path]);
            } else {
                self.consul.kv.keys(path, function (err, result) {
                    if (err) {
                        self.log('getKey error:', err);
                        reject(err);
                        return;
                    }

                    let ret = result;
                    if (isCache === true) {
                        self.cacheKeyData[path] = ret;
                    }
                    resolve(ret);
                });
            }
        });
    }

    putKeyValue(key, value) {
        let self = this;
        return new Promise(function (resolve, reject) {
            self.consul.kv.set(key, value, function (err, result) {
                if (err) {
                    self.log('setKeyValue error:', err);
                    reject(err);
                    return;
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
            if (result && result.Value) {
                ret = result.Value;
            }

            self.cacheKeyValueData[key] = ret;
        });

        watch.on('error', function (err) {
            self.log('watch KeyValue error:', err);
            if (self.cacheKeyValueWatch[key]) {
                delete self.cacheKeyValueWatch[key];
            }
        });
    }

    getKeyValue(key, isWatch = false, isCache = true) {
        let self = this;
        return new Promise(function (resolve, reject) {
            if (isWatch === true) {
                isCache = isWatch;
            }
            if (isWatch === true) {
                if (self.isKeyValueWatched(key)) {
                    let data = this.cacheKeyValueWatch[key];
                    reject(data);
                    return;
                } else {
                    self.addKeyValueWatch(key);
                }
            }

            if (isCache === true && self.cacheKeyValueData[key]) {
                resolve(self.cacheKeyValueData[key]);
            } else {
                self.consul.kv.get(key, function (err, result) {
                    if (err) {
                        self.log('getKeyValue error:', err);
                        reject(err);
                        return;
                    }

                    let ret = null;
                    if (result && result.Value) {
                        ret = result.Value;
                    }

                    if (isCache === true) {
                        self.cacheKeyValueData[key] = ret;
                    }
                    resolve(ret);
                });
            }
        });
    }
}

exports = module.exports = new ConsulClient();