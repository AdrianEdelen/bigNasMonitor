"use strict";

function containsOject(obj, list) {
    for (var i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }
    return false;
}

//intent: Get updated information periodically and update the page

//create one of these and then have a 'update data' function that continously updates the page
class netData {
    constructor() {
        this.apiRoot = 'http://192.168.1.41:19999/api/v1/';
        this.chartsList;
        this.dockerInfos = [];
    }


    //would be called to actually generate specific htm tags (not implemented)
    updateData(data) {
        //not used currently
        document.getElementById("radarr").textContent = `Radarr ${data.radarrCPU.data[0][1].toFixed(2)}% ${data.radarrMEM.data[0][1].toFixed(0) /*+ data.radarrMEM.data[0][2].toFixed(0) The problem is its appending not adding hte numbers*/}MB`
        //Create a string builder for each of the categories (like docker for example)
        document.getElementById("hostname").textContent = data.radarrCPU.hostname;
    }
   
    //gets a list of all available data sets from netdata (netdata keeps them in the form of charts)
    //we would use this to establish what modules are available (e.g. what dockers are running)
    async getAllCharts() {
        const apiChartsList = this.apiRoot + 'charts';
        fetch(apiChartsList).then(endpointResponse => {
            this.chartsList = endpointResponse.json();
            console.log(this.chartsList);
        });
    }

    //docker containers are referenced as cgroups in linux and therefore netdata. 
    //typically the cgroup will be in a form like 'cgroup_redis.mem_usage'
    //there may be ten or more specific charts for each cgroup, so in order to have a clean list of unique running containers, we use
    //this function to get and create 'docker objects' for each running and available container.
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
}

async function fetchData(endpoint) {
    fetch(endpoint).then(response => {return response;})
}
//we would call the specific api endpoint for cpu usage etc for each docker here to update the page
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


//testing
var nd = new netData();
nd.getAllCharts();



