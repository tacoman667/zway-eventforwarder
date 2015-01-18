This module can be used to forward events from zway to your own server using a REST API.

##Installation
1. Create the 'EventForarder' directory in the automation/userModules directory.
2. Copy the index.js and module.json files to this directory
3. Enable the module via the automation user interface

##REST Server
The server receiving the events can be programmed in the programming language of your preference. The following resources will be used by the EventForwarder module:

###Creation of devices
Resource: http://localhost:8088/razberry/devices/:vDevId  
Method: PUT  
Parameters: The following object will be added to the body of the request:
```
{
  status: <online or offline>,
  nodeId: <ZWave Node Id>,
  instanceId: <ZWave Instance Id>,
  cmdClass: <ZWave Command Class>,
  meterType: <Meter Type>, // This is a conditional field which will only be added in case of a meter device
  sensorType: <Sensor Type>,
  vDevId: <Id of Virtual Device>,
  value: <Value>,
  timestamp: <Timestamp in epoch>
}
```

###Deletion of devices
Resource: http://localhost:8088/razberry/devices/:vDevId  
Method: DELETE  
Parameters: The following object will be added to the body of the request:
```
{
  nodeId: <ZWave Node Id>,
  instanceId: <ZWave Instance Id>,
  cmdClass: <ZWave Command Class>,
  meterType: <Meter Type>, // This is a conditional field which will only be added in case of a meter device
  sensorType: <Sensor Type>
}
```

### Status update
Resource: http://localhost:8088/razberry/devices/:nodeId  
Method: PUT  
Parameters: The following object will be added to the body of the request:
```
{
  status: <online or offline>,
  nodeId: <ZWave Node Id>,
  timestamp: <Timestamp in epoch>
}
```

### State update
Resource: http://localhost:8088/razberry/devices/:vDevId  
Method: PUT  
Parameters: The following object will be added to the body of the request:
```
{
  status: <online or offline>,
  nodeId: <ZWave Node Id>,
  instanceId: <ZWave Instance Id>,
  cmdClass: <ZWave Command Class>,
  meterType: <Meter Type>, // This is a conditional field which will only be added in case of a meter device
  sensorType: <Sensor Type>,
  vDevId: <Id of Virtual Device>,
  value: <Value>,
  timestamp: <Timestamp in epoch>
}
```
