import { ServiceBusClient, ReceiveMode, SendableMessageInfo } from "@azure/service-bus";
import { isNullOrUndefined } from "util";
import { PurchaseCompletedEvent } from "../models/PurchaseCompletedEvent";
import { PurchaseFailedEvent } from "../models/PurchaseFailedEvent";
import { CompletePurchaseCommand } from "../models/CompletePurchaseCommand";

export class CompletePurchaseHandler {

    // Define connection string and related Service Bus entity names here
    private namingSuffix = '-mrj';
    private pollIntervalSec = 15;
    private connectionString: string = "Endpoint=sb://ffthh-unify-services.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=PiEdkmTpw6pT/y885ZJ9FpXmQR7UbllEF/xoZq9JZJA=";
    private queueName = `purchasing${this.namingSuffix}`;
    private failedTopicName = `purchasefailed${this.namingSuffix}`;
    private completedTopicName = `purchasecompleted${this.namingSuffix}`;
    private sbClient: ServiceBusClient;

    public async StartHandling(): Promise<void> {
        this.sbClient = ServiceBusClient.createFromConnectionString(this.connectionString);
        const queueClient = this.sbClient.createQueueClient(this.queueName);
        console.log(`Creating queue receiver for ${this.queueName} ...`);
        const receiver = queueClient.createReceiver(ReceiveMode.receiveAndDelete);

        while (true) {
            console.log(`Waiting ${this.pollIntervalSec} seconds for command messages from the queue '${this.queueName}' ...`);
            const messages = await receiver.receiveMessages(1, this.pollIntervalSec);
            if (messages.length == 0) {
                continue;
            } else {
                console.log(`Received ${messages.length} message from the queue '${this.queueName}'`);
            }

            for (var i = 0; i < messages.length; i++) {
                const message = messages[i];
                const completePurchaseCommand: CompletePurchaseCommand = message.body;
                if (isNullOrUndefined(completePurchaseCommand.ccToken) || completePurchaseCommand.ccToken === '') {
                    console.error(
                        "No Credit Card token was provided",
                        completePurchaseCommand
                    );
                    this.publishPurchaseFailedEvent(this.sbClient, {
                        failureDate: new Date(),
                        orderId: completePurchaseCommand.orderId,
                        reason: "No credit card token"
                    });
                    // Deadletter the message received
                    await message.deadLetter({
                        deadletterReason: "NoCreditCardToken",
                        deadLetterErrorDescription: "A credit card token is required to complete this order"
                    });
                } else {
                    
                    console.log(`Received CompletePurchase command.`);
                    
                    this.publishPurchaseCompletedEvent(this.sbClient, {
                        dateCompleted: new Date(),
                        orderId: completePurchaseCommand.orderId
                    });
                }
            }
        }
        await queueClient.close();
    }

    private async publishPurchaseCompletedEvent(sbClient: ServiceBusClient,
        purchaseCompletedEvent: PurchaseCompletedEvent): Promise<void> {
        console.log(`Publishing a PurchaseCompletedEvent message to the topic '${this.completedTopicName}'`);
        await this.publishEvent(sbClient, purchaseCompletedEvent, this.completedTopicName);
    }

    private async publishPurchaseFailedEvent(sbClient: ServiceBusClient,
        purchaseFailedEvent: PurchaseFailedEvent): Promise<void> {
        console.log(`Publishing a PurchaseFailedEvent message to the topic '${this.failedTopicName}'`);
        await this.publishEvent(sbClient, purchaseFailedEvent, this.failedTopicName);
    }

    private async publishEvent(sbClient: ServiceBusClient,
        eventData: object, topicName: string): Promise<void> {

        const sender = sbClient.createTopicClient(topicName).createSender();

        const priority = Math.ceil(Math.random() * 4);

        const message: SendableMessageInfo = {
            body: eventData,
            userProperties: { priority: priority }
        };

        console.log(` Sending event  ${message.body} with priority ${priority} to topic '${topicName}'`);
        await sender.send(message);

    }
}