import { ServiceBusClient, ReceiveMode } from "@azure/service-bus";
import { CompletePurchaseCommand } from "../models/CompletePurchaseCommand";
import { UniqueIdentifier } from "mssql";

const namingSuffix = `-mrj`;
// Define connection string and related Service Bus entity names here
const connectionString:string = "Endpoint=sb://ffthh-unify-services.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=PiEdkmTpw6pT/y885ZJ9FpXmQR7UbllEF/xoZq9JZJA=";
const queueName = `purchasing${namingSuffix}`;
const sbClient: ServiceBusClient = ServiceBusClient.createFromConnectionString(connectionString);

async function main(): Promise<void> {
  try {
    // Sending a message to ensure that there is atleast one message in the main queue
    await sendMessage();
  } finally {
    await sbClient.close();
  }
}

async function sendMessage(): Promise<void> {
  // If sending to a Topic, use `createTopicClient` instead of `createQueueClient`
  const queueClient = sbClient.createQueueClient(queueName);
  const sender = queueClient.createSender();
  const completePurchaseCommand: CompletePurchaseCommand =  {
    orderId: 'ord-1',
    ccToken: 'tok-abc123',
    orderDate: new Date(),
    total: 400
  };
  console.log(`Sending complete purchase command to ${queueName} queue ...`)
  console.log(completePurchaseCommand);

  const message = {
    body: completePurchaseCommand,
    contentType: "application/json",
    label: "Product"
  };
  await sender.send(message);
  await queueClient.close();
}

main().catch((err) => {
    console.log("Error occurred: ", err);
});