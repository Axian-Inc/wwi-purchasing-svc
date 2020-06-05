import * as azure from "azure";

const namingSuffix = '-mrj';

const connectionString:string = "Endpoint=sb://ffthh-unify-services.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=PiEdkmTpw6pT/y885ZJ9FpXmQR7UbllEF/xoZq9JZJA="
const serviceBusService = azure.createServiceBusService(connectionString);

let queueName =  `fulfillment${namingSuffix}`;
serviceBusService.createQueueIfNotExists(queueName, function(result){
    console.log(`Created queue named '${queueName}`);
});

queueName =  `purchasing${namingSuffix}`;
serviceBusService.createQueueIfNotExists(queueName, function(result){
    console.log(`Created queue named '${queueName}`);
});
var topicOptions = {
    MaxSizeInMegabytes: '5120',
    DefaultMessageTimeToLive: 'PT1M'
};

let topicName = `purchasecompleted${namingSuffix}`;
serviceBusService.createTopicIfNotExists(topicName,topicOptions, function(result){
    console.log(`Created queue named '${topicName}`);
});

serviceBusService.createSubscription(topicName,'AllMessages',function(result){
    if(!result){
        console.log(`Created subscription to topic '${topicName}' named 'AllMessages'`);
    }
});

topicName = `purchasefailed${namingSuffix}`;
serviceBusService.createTopicIfNotExists(topicName,topicOptions, function(result){
    console.log(`Created queue named '${topicName}`);
});

serviceBusService.createSubscription(topicName,'AllMessages',function(result){
    if(!result){
        console.log(`Created subscription to topic '${topicName}' named 'AllMessages'`);
    }
});