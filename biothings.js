// class for querying a biothings.api backend

// from SO
function encodeJson(json, encode) {
  return Object.keys(json).sort().map(function(key) {
    return key + '=' + (encode ? encodeURIComponent(json[key]) : json[key])
  })
}

function* batchIterator(batchString, chunkSize) {
    let i = 0;
    let batchArray = batchString.split(',');
    let thisBatch = [];
    for (i=0; i<batchArray.length; i+=chunkSize) {
        thisBatch = batchArray.slice(i, i+chunkSize);
        yield thisBatch.join();
    }
}

function runGenerator(g) {
    var it = g(), ret;

    // asynchronously iterate over generator
    (function iterate(val){
        ret = it.next( val );

        if (!ret.done) {
            // poor man's "is it a promise?" test
            if ("then" in ret.value) {
                // wait on the promise
                ret.value.then( iterate );
            }
            // immediate value: just send right back in
            else {
                // avoid synchronous recursion
                setTimeout( function(){
                    iterate( ret.value );
                }, 0 );
            }
        }
    })();
}

function createAsyncFunction(fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }
        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }
      return step("next");
    });
  };
}



    async function getChunk(endpoint, queryOpts) {
        var res;
        const res2 = await $.post(endpoint, queryOpts).then(function (data) {
            console.log("In here"); 
            res = data;
            console.log("After res");
        });
        console.log("Here");
        return res;
    }
//function spawn(callback) {
//  return function() {
//    var iter = callback.apply(this, arguments);
//
//    return Promise.resolve().then(function onValue(lastValue){
//      var result = iter.next(lastValue);
//
//      var done  = result.done;
//      var value = result.value;
//
//      if (done) return value; // generator done, resolve Promise
//      return Promise.resolve(value).then(onValue, iter.throw.bind(iter)); // repeat
//    });
//  };
//}



    function* spawn(generatorFunc) {
        function continuer(verb, arg) {
            var result;
            try {
                result = generator[verb](arg);
            } catch (err) {
                return Promise.reject(err);
            }
            if (result.done) {
                return result.value;
            } else {
                return Promise.resolve(result.value).then(onFulfilled, onRejected);
            }
        }
        var generator = generatorFunc();
        var onFulfilled = continuer.bind(continuer, "next");
        var onRejected = continuer.bind(continuer, "throw");
        yield onFulfilled();
    }

    function getData(endpoint, queryOpts) {
        return new Promise(function (resolve, reject) {
            $.post(endpoint, queryOpts).then(resolve, reject);
        });
    }


(function( biothings, $, undefined ) {
    /******************************
         Private properties
    *******************************/
    var that = this;

    /******************************
         Public properties
    *******************************/
    biothings.url = '';
    biothings.backendBatchSize = 1000;

    /******************************
         Private methods
    *******************************/
    function spawn(generatorFunc) {
        function continuer(verb, arg) {
            var result;
            try {
                result = generator[verb](arg);
            } catch (err) {
                return Promise.reject(err);
            }
            if (result.done) {
                return result.value;
            } else {
                return Promise.resolve(result.value).then(onFulfilled, onRejected);
            }
        }
        var generator = generatorFunc();
        var onFulfilled = continuer.bind(continuer, "next");
        var onRejected = continuer.bind(continuer, "throw");
        return onFulfilled();
    }

    function getData(endpoint, queryOpts) {
        return new Promise(function (resolve, reject) {
            $.post(endpoint, queryOpts).then(resolve, reject);
        });
    }

    async function getChunk(endpoint, queryOpts) {
        let res;
        await $.post(endpoint, queryOpts).then(function (data) {console.log("In here"); res = data;});
        return res;
    }

    /******************************
         Public methods
    *******************************/

    // Initialize with url, batch size
    biothings.init = function(url, batch_size) {
        if (typeof url != 'string') {
            throw "init failed, url must be a string denoting the service you want to query, e.g., 'http://mygene.info/v3'"
        }
        this.url = url.endsWith('/') ? url : url + '/';
        this.backendBatchSize = batch_size ? batch_size : 1000;
    }

    //biothings.post = function* (endpoint, query_opts) {
    //    for 



    // Execute a generic post
    biothings.post_helper = function* (endpoint, query_opts) {
        let queryOpts = typeof query_opts != 'undefined' ? query_opts : {};
        if (typeof endpoint != 'string') {
            throw "endpoint must be a string with the endpoint you want to post to"
        }

        if (typeof queryOpts != 'object') {
            throw "query_opts must be an object containing the query description, e.g. {'q': 'cdk2', 'fields': 'entrezgene'}"
        }
        let iterableKey = endpoint == 'query' ? 'q' : 'ids';
        let thisEndpoint = this.biothings.url + endpoint;
        let theseIds = queryOpts[iterableKey];
        let batches = batchIterator(theseIds, this.biothings.backendBatchSize);
        let thisChunk = '';
        var chunkRes;

        delete queryOpts[iterableKey];

        //while (true) {

        while (thisChunk = batches.next()) {
            if (thisChunk.done) {break;}
            let thisData = queryOpts;
            thisData[iterableKey] = thisChunk.value;
            yield getData(thisEndpoint, thisData);
            
            //res.then(function(result) {
            //    chunkRes = result;
            //});
            //return res;
            //res.then(function (result) {
            //    console.log("TUTU");
            //    for (var i=0; i<result.length; i++) {
            //        yield result[i];
            //    }
            //});
            //res.resolve().then(function
            //res.then({
            //    for (var i=0; i<res.length; i++) {
            //        yield res[i];
            //    }
            //});
            //console.log("TT"); 
            //for (var i=0; i<res.length; i++) {
            //    yield res[i];
            //}
        }
    }
}( window.biothings = window.biothings || {}, jQuery));
