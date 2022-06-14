//'http://192.168.1.41:19999/api/v1/'
//charts
var apiService = function(baseAddress) {
    var self = this;
    self.BaseAddress = baseAddress;

    self.Get = function(endpoint) {
        var endpoint = `${self.BaseAddress}/${endpoint}`;
        return $.get(endpoint);
    }

    self.GetMem = function(cgroup){
        var endpoint = `${self.BaseAddress}/data?chart=${cgroup}.mem_usage`;
        return $.get(endpoint);
        // $.ajax({
        //     url: '',
        //     type: 'Get',
        //     data: {x: val},
        //     succes: function(data) {
        //         do something
        //     }
        // })
    }
}

var dashboard = function(){
    var self = this;
    self.ApiService = new apiService('http://192.168.1.41:19999/api/v1');

    self.Init = function() {
        self.GetCharts();

        self.Charts.subscribe(function(charts) {
            console.log("getting charts");
            setInterval(self.GetMems, 1000);
            // self.GetMems();
        })
    }

    self.Charts = ko.observableArray();    

    self.GetCharts = function() {
        self.ApiService.Get('charts').then((fetchedJson) => {
            var cgroups = Object.keys(fetchedJson.charts).filter(c => c.indexOf('cgroup') > -1).map(c => c.split('.')[0]);             
            var cgroupSet = new Set(cgroups);
            var cgroupListItems = Array.from(cgroupSet).map(cgroup => new listItem(cgroup, null));
            self.Charts(cgroupListItems);
        });
    }

    self.GetMems = function() {
        for(const li of self.Charts()) {
            self.ApiService.GetMem(li.Text()).then(info => li.Value(info.data[0][0]));
        }
    }

    self.GetInfo = async function() {
        return 10;
    }   

}

var listItem = function(text, val) {
    var self = this;
    self.Text = ko.observable(text);
    self.Value = ko.observable(val);
}

function getDockers(charts) {
    var keys = Object.keys(charts['charts']);
    //take the list of charts and filter them down to unique charts that contain 'cgroup'
    var trimmedKeys = [];
    keys.forEach(element => {
        trimmedKeys.push(element.split(".")[0]) //remove the specific parameter (e.g. cpu usage)
    });
    trimmedKeys = Array.from(new Set(trimmedKeys)); //remove all duplicates
    var dockers = trimmedKeys.filter(item => item.includes("cgroup")); //add back the 
    //dockers is a list of unique keys that contain cgroup
    // dockers.forEach( docker => {
        
    // })
}
