
import { CompletePurchaseHandler } from "./handlers/CompletePurchaseHandler";



async function main(): Promise<void> {
    try {
        var completePurchaseHandler= new CompletePurchaseHandler();

        await Promise.all(
            [
                completePurchaseHandler.StartHandling(), 

        ]);
    } finally {
     // await sbClient.close();
    }
  }


main().catch((err) => {
    console.log("Error occurred: ", err);
});