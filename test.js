//'http://192.168.1.41:19999/api/v1/'
//charts
var apiService = function (baseAddress) {
    var self = this;
    self.BaseAddress = baseAddress;

    self.Get = function (endpoint) {
        var endpoint = `${self.BaseAddress}/${endpoint}`;
        return $.get(endpoint);
    }

    self.GetDockerMem = function (cgroup) {
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
    
    self.GetDockerCpu = function (cgroup) {
        var endpoint = `${self.BaseAddress}/data?chart=${cgroup}.cpu_limit`;
        return $.get(endpoint);
    }

    self.GetDiskReadWrite = function (disk) {
        var endpoint = `${self.BaseAddress}/data?chart=${disk}`;
        return $.get(endpoint);
    }

    self.GetCpuUsage = function (cpu) {
        var endpoint = `${self.BaseAddress}/data?chart=${cpu}`;
        return $.get(endpoint);
    }

    self.getSensorTemps = function (sensor) {
        var endpoint = `${self.BaseAddress}/data?chart=${sensor}`;
        return $.get(endpoint);
    }

}

var dashboard = function () {
    var self = this;
    self.ApiService = new apiService('http://192.168.1.41:19999/api/v1');

    self.Init = function () {
        self.GetCharts();
        self.GetDisks();
        self.GetCpus();
        self.GetSensors();

        self.Charts.subscribe(function (charts) {
            console.log("getting charts");
            setInterval(() => {
                self.GetDockerMems();
                self.GetDockerCpus();
            }, 1000);
        });

        self.Disks.subscribe(function (disks) {
            setInterval(() => {
                self.GetDiskReadWrites();
            }, 1000);
        });

        self.Cpus.subscribe(function (cpus) {
            setInterval(() => {
                self.GetCpuUsages();
            }, 1000);
        });

        self.Sensors.subscribe(function (sensors) {
            setInterval(() => {
                self.getSensorTemps();
            }, 1000);
        });
        
    }

    self.Charts = ko.observableArray();
    self.Disks = ko.observableArray();
    self.Cpus = ko.observableArray();
    self.GroupedCpus = ko.computed(function () {
        var rows = [];
        self.Cpus.forEach(function (cpu, i) {
            if (i % 2 == 0) {
                rows[i/2] = [];
            }
            rows[Math.floor(i/2)][i%2] = cpu;
        }) ;
        return rows;
    });

    self.Sensors = ko.observableArray();
    /* Get main group items 
    Charts = dockers
    Disks = harddrives*/
    self.GetCharts = () => {
        self.ApiService.Get('charts').then((fetchedJson) => {
            var cgroups = Object.keys(fetchedJson.charts).filter(c => c.includes('cgroup')).map(c => c.split('.')[0]);
            var cgroupSet = new Set(cgroups);
            cgroupSet.delete('disk_space');
            cgroupSet.delete('netdata');
            cgroupSet.delete('disk_inodes');
            var cgroupListItems = Array.from(cgroupSet).map(cgroup => new listItem(cgroup, null));
            self.Charts(cgroupListItems);
        });
    }

    self.GetDockerMems = () => {
        for (const li of self.Charts()) {
            self.ApiService.GetDockerMem(li.Text()).then(info => {
                var dataList = info.data.slice(0, 100);
                var total = 0;
                dataList.forEach(element => {
                    total += parseFloat(element[1]);
                });
                var average = (total / dataList.length).toFixed(2);
                li.Ram(average);
            });
        }
    }

    self.GetDockerCpus = () => {
        for (const li of self.Charts()) {
            self.ApiService.GetDockerCpu(li.Text()).then(info => {
                var dataList = info.data.slice(0, 100);
                var total = 0;
                dataList.forEach(element => {
                    total += parseFloat(element[1]);
                });
                var average = (total / dataList.length).toFixed(2);
                li.Cpu(average);
            })
        }
    }


    /* hard drives*/
    self.GetDisks = () => {
        self.ApiService.Get('charts').then((fetchedJson) => {
            var disks = Object.keys(fetchedJson.charts).filter(c => c.includes('disk.sd'));
            //console.log(disks);
            var diskListItems = Array.from(disks).map(disk => new diskItem(disk, null, null));
            self.Disks(diskListItems);
        })
    }

    self.GetDiskReadWrites = () => {
        for (const di of self.Disks()) {
            self.ApiService.GetDiskReadWrite(di.Text()).then(info => {

                var dataList = info.data.slice(0, 100);
                var totalReads = 0;
                var totalWrites = 0;
                dataList.forEach(element => {
                    totalReads += parseFloat(element[1]);
                    totalWrites += parseFloat(element[2]);
                });
                var averageReads = (totalReads / dataList.length).toFixed(2);
                var averageWrites = (totalWrites / dataList.length).toFixed(2);
                di.Read((averageReads / 1024).toFixed(2));
                di.Write(((averageWrites * -1) / 1024).toFixed(2));
            })

        }
    }

    //cpus
    self.GetCpus = () => {
        self.ApiService.Get('charts').then((fetchedJson) => {
            var cpus = new Set(Object.keys(fetchedJson.charts).filter(c => c.includes('cpu.cpu')).map(c => c.split("_")[0]));
            cpus.delete('cpu.cpufreq');
            var cpuItems = Array.from(cpus).map(text => new cpuItem(text, null, null));
            self.Cpus(cpuItems);
        })
    }

    self.GetCpuUsages = () => {
        for (const ci of self.Cpus()) {
            self.ApiService.GetCpuUsage(ci.Text()).then(info => {
                var dataList = info.data.slice(0, 100);
                var totals = 0;
                dataList.forEach(element => {
                    var sum = 0;
                    element.forEach((element1, i) => {
                        if (i === 0) return;
                        sum += element1;
                    })
                    totals += sum;
                });
                var average = (totals / dataList.length).toFixed(2);
                ci.Usage(average);
            })

        }
    }
    //temp sensors
    self.GetSensors = () => {
        self.ApiService.Get('charts').then((fetchedJson) => {
            var sensors = new Set(Object.keys(fetchedJson.charts).filter(c => c.includes('sensors.coretemp')));
            var sensorItems = Array.from(sensors).map(text => new sensorItem(text));
            self.Sensors(sensorItems);
        })
    }
    //not implemented yet
    self.getSensorTemps = () => {
        for (const si of self.Sensors()) {
            self.ApiService.getSensorTemps(si.Text()).then(info => {
                var dataList = info.data.slice(0,100);
                //console.log(dataList);
                dataList.forEach((element, i) => {
                    if (i === 0 ) return;

                });
                
                //var cpuCore = new cpuCoreTemp(info.labels[i]);
            })
        }
    }


}

var listItem = function (text, ram, val, cpu) {
    var self = this;
    self.Name = ko.observable(text.split("_")[1])
    self.Text = ko.observable(text);
    self.Ram = ko.observable(ram);
    self.Cpu = ko.observable(cpu);
    self.Value = ko.observable(val);
}

var diskItem = function (disk, read, write) {
    var self = this;
    self.Text = ko.observable(disk);
    self.Name = ko.observable(disk.split(".")[1]);
    self.Read = ko.observable(read);
    self.Write = ko.observable(write);
}

var cpuItem = function (text, usage, temp) {
    var self = this;
    self.Text = ko.observable(text);
    self.Name = ko.observable(text.split('.')[1]);
    self.Usage = ko.observable(usage);
    self.Temp = ko.observable(temp);

}

var sensorItem = function (text, core, temp) {
    var self = this;
    self.Text = ko.observable(text);
    self.Core = ko.observable(core);
    self.Temp = ko.observable(temp);
}

var cpuCoreTemp = function (core, temp) {
    var self = this;
    self.Core = core;
    self.Temp = temp;
}