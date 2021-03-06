function EventForwarder(id, controller) {
    // Call superconstructor first (AutomationModule)
    EventForwarder.super_.call(this, id, controller);
}

inherits(EventForwarder, AutomationModule);

_module = EventForwarder;

// ----------------------------------------------------------------------------
// --- Module instance initialized
// ----------------------------------------------------------------------------

EventForwarder.prototype.init = function (config) {
    EventForwarder.super_.prototype.init.call(this, config);

    var self = this;

    this.devices = {};

    this.handleDevUpdates = function (vDev) {
        self.updateState(vDev);
    };

    this.handleDevCreation = function(vDev) {
        self.createDevice(vDev);
    };

    this.handleDevDeletion = function(vDev) {
        self.deleteDevice(vDev);
    };

    // Determine current configured devices
    self.controller.devices.each(self.handleDevCreation);

    // Setup event listeners
    self.controller.devices.on('change:metrics:level', self.handleDevUpdates);
    self.controller.devices.on('created', self.handleDevCreation);
    self.controller.devices.on('removed', self.handleDevDeletion);
};

EventForwarder.prototype.stop = function () {
    var self = this;

    // Remove event listeners
    self.controller.devices.off('change:metrics:level', self.handleDevUpdates);
    self.controller.devices.off('created', self.handleDevCreation);

    EventForwarder.super_.prototype.stop.call(this);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

EventForwarder.prototype.updateState = function(vDev) {
    var fields,
        meterType,
        self = this;

    debugPrint('EventForwarder: Device update ' + JSON.stringify(vDev));

    if(!self.devices[vDev.id]) {
        debugPrint('EventForwarder: updateStatus: Unknown device ' + vDev.id);
        return;
    }

    // A bug in zway is causing multiple update events to be triggered for each update
    if(self.devices[vDev.id].level !== vDev.get('metrics:level')) {
        self.devices[vDev.id].level = vDev.get('metrics:level');

        fields = vDev.id.replace(/ZWayVDev_zway_/, '').split('-');
        if(fields.length) {

            if(parseInt(fields[2], 10) === 0x32) {
                meterType = global.zway.devices[fields[0]].instances[fields[1]].commandClasses[fields[2]].data[fields[3]].sensorType.value;
            }

            http.request({
                method: 'PUT',
                async: true,
                url: 'http://localhost:8088/razberry/devices/' + vDev.id,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    status: global.zway.devices[fields[0]].data.isFailed.value ? 'offline' : 'online',
                    nodeId: parseInt(fields[0], 10),
                    instanceId: parseInt(fields[1], 10),
                    cmdClass: parseInt(fields[2], 10),
                    meterType: meterType,
                    sensorType: fields[3] ? parseInt(fields[3], 10) : undefined,
                    vDevId: vDev.id,
                    value: vDev.get('metrics:level'),
                    timestamp: vDev.get('updateTime')
                })
            });
        }
    }
};

EventForwarder.prototype.deleteDevice = function(vDev) {
    var fields,
        self = this;

    debugPrint('EventForwarder: Removed device ' + JSON.stringify(vDev));

    fields = vDev.id.replace(/ZWayVDev_zway_/, '').split('-');
    if(fields.length) {
        if(parseInt(fields[2], 10) === 0x32) {
            meterType = global.zway.devices[fields[0]].instances[fields[1]].commandClasses[fields[2]].data[fields[3]].sensorType.value;
        }

        http.request({
            method: 'DELETE',
            async: true,
            url: 'http://localhost:8088/razberry/devices/' + vDev.id,
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                nodeId: parseInt(fields[0], 10),
                instanceId: parseInt(fields[1], 10),
                cmdClass: parseInt(fields[2], 10),
                meterType: meterType,
                sensorType: fields[3] ? parseInt(fields[3], 10) : undefined
            })
        });

        delete self.devices[vDev.id];
    }
};


EventForwarder.prototype.createDevice = function(vDev) {
    var fields,
        meterType,
        self = this;

    debugPrint('EventForwarder: Created new device ' + JSON.stringify(vDev));

    if(!self.devices[vDev.id]) {
        self.devices[vDev.id] = {};
        self.devices[vDev.id].level = vDev.get('metrics:level');
    }

    fields = vDev.id.replace(/ZWayVDev_zway_/, '').split('-');
    if(fields.length) {

        self.devices[vDev.id].status = global.zway.devices[fields[0]].data.isFailed.value;

        if(parseInt(fields[2], 10) === 0x32) {
            meterType = global.zway.devices[fields[0]].instances[fields[1]].commandClasses[fields[2]].data[fields[3]].sensorType.value;
        }

        global.zway.devices[fields[0]].data.isFailed.bind(self.updateStatus, fields[0]);

        http.request({
            method: 'PUT',
            async: true,
            url: 'http://localhost:8088/razberry/devices/' + vDev.id,
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                status: global.zway.devices[fields[0]].data.isFailed.value ? 'offline' : 'online',
                nodeId: parseInt(fields[0], 10),
                instanceId: parseInt(fields[1], 10),
                cmdClass: parseInt(fields[2], 10),
                meterType: meterType,
                sensorType: fields[3] ? parseInt(fields[3], 10) : undefined,
                vDevId: vDev.id,
                value: vDev.get('metrics:level'),
                timestamp: vDev.get('updateTime')
            })
        });
    }
};

EventForwarder.prototype.updateStatus = function(unknown, nodeId) {

    debugPrint('EventForwarder: Status update, node ' + nodeId + ' went ' + (this.value ? 'offline' : 'online'));

    http.request({
        method: 'PUT',
        async: true,
        url: 'http://localhost:8088/razberry/devices/' + nodeId,
        headers: {
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({
            status: this.value ? 'offline' : 'online',
            nodeId: parseInt(nodeId, 10),
            timestamp: this.updateTime
        })
    });
}