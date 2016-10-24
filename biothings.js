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

(function( biothings, $, undefined ) {
    /******************************
         Private properties
    *******************************/

    /******************************
         Public properties
    *******************************/
    biothings.url = '';
    biothings.backendBatchSize = 1000;

    /******************************
         Private methods
    *******************************/
    function getData(endpoint, query_opts) {
        
    }

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

    // Execute a generic post
    biothings.post = function* (endpoint, query_opts) {
        let queryOpts = typeof query_opts != 'undefined' ? query_opts : {};
        if (typeof endpoint != 'string') {
            throw "endpoint must be a string with the endpoint you want to post to"
        }

        if (typeof queryOpts != 'object') {
            throw "query_opts must be an object containing the query description, e.g. {'q': 'cdk2', 'fields': 'entrezgene'}"
        }
        let iterableKey = endpoint == 'query' ? 'q' : 'ids';
        let thisEndpoint = this.url + endpoint;
        let theseIds = queryOpts[iterableKey];
        let batches = batchIterator(theseIds, this.backendChunkSize);
        let thisChunk = '';

        delete queryOpts[iterableKey];

        while (thisChunk = batches.next()) {
            if (thisChunk.done) {break;}
            let thisData = queryOpts;
            thisData[iterableKey] = thisChunk.value;
            $.when(
                $.post(thisEndpoint, thisData, function(data) {console.log("callback");console.log(data); console.log("AG");})).then( function yieldDocs(data, textStatus, jqXHR) {
                    
            
                for (var i=0; i<data.length; i++) {
                    console.log(data[i]);
                    return data[i];
                }
            });
        }
    }

}( window.biothings = window.biothings || {}, jQuery));
