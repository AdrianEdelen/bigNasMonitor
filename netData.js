"use strict";

function containsOject(obj, list) {
    for (var i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }
    return false;
}
function fetchJson(endpoint) {
    return fetch(endpoint)
        .then(endpointResponse => endpointResponse.json());
}

class netData {
    constructor() {
        this.apiRoot = 'http://192.168.1.41:19999/api/v1/';
        this.chartsList;
        this.dockerInfos = [];
    }
    logger(data) {
        console.log(data);
    }
    updateData(data) {
        document.getElementById("radarr").textContent = `Radarr ${data.radarrCPU.data[0][1].toFixed(2)}% ${data.radarrMEM.data[0][1].toFixed(0) /*+ data.radarrMEM.data[0][2].toFixed(0) The problem is its appending not adding hte numbers*/}MB`
        //Create a string builder for each of the categories (like docker for example)
        document.getElementById("hostname").textContent = data.radarrCPU.hostname;
    }
   

    // async getFile() {
    //     let myPromise = new Promise(function(resolve) {
    //       let req = new XMLHttpRequest();
    //       req.open('GET', "mycar.html");
    //       req.onload = function() {
    //         if (req.status == 200) {
    //           resolve(req.response);
    //         } else {
    //           resolve("File not Found");
    //         }
    //       };
    //       req.send();
    //     });
    //     document.getElementById("demo").innerHTML = await myPromise;
    //   }
      
    //   getFile();



    async getAllCharts() {
        const apiChartsList = this.apiRoot + 'charts';
        fetch(apiChartsList).then(endpointResponse => {
            this.chartsList = endpointResponse.json();
            console.log(this.chartsList);
        });


        // let chartPromise = new Promise(function(resolve) {
        //     let result = fetchJson(apiChartsList);
        //     Promise.resolve(result);
        // });
        // this.chartsList = await chartPromise;        
        // await new Promise(this.fetchJson(apiChartsList)).then(response => {
        //     this.chartsList = response.charts;
    
    }

    getDockers() {
        var keys = Object.keys(this.chartsList);
        //take the list of charts and filter them down to unique charts that contain 'cgroup'
        var trimmedKeys = [];
        keys.forEach(element => {
            trimmedKeys.push(element.split(".")[0]) //remove the specific parameter (e.g. cpu usage)
        });
        trimmedKeys = Array.from(new Set(trimmedKeys)); //remove all duplicates
        var dockers = trimmedKeys.filter(item => item.includes("cgroup")); //add back the 
        dockers.forEach( docker => {
            var dockInfo = new dockerInfo(docker);
            if (!containsOject(dockInfo, dockers)){
                this.dockerInfos.push(new dockerInfo(docker));
            }
        })
    }

    get() {
        return Promise.all([fetchJson(RadarrCPU), fetchJson(RadarrMEM)])
            .then(responses => {
                var data = { radarrCPU: responses[0], radarrMEM: responses[1] };
                //console.log('data in fetch', data); // this logs the json
                this.logData(data);
                this.updateData(data);
                return data;
            });
    }

}

class dockerInfo {
    constructor(name) {
        this.name = name;
        this.cpuEndpoint = apiRoot + 'data?chart=' + this.name + '.cpu';
        this.memEndpoint = apiRoot + 'data?chart=' + this.name + '.mem_usage';
        this.cpu;
        this.mem;
        this.htm;
    }

}

class hostName {
    constructor(apiRoot) {
        this.apiRoot = apiRoot;
        this.name = this.getHostname(apiRoot);
    }
    getHostname(apiRoot) {
        var prom = Promise.resolve(fetchJson(apiRoot + 'info')).then(response => {
            this.name = response.hostName;
        })
    }
}



var nd = new netData();
nd.getAllCharts();



