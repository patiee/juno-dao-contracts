import { ExecuteEvent, Message, Transaction } from "../types";
import {
  CosmosEvent,
  CosmosBlock,
  CosmosMessage,
  CosmosTransaction,
} from "@subql/types-cosmos";
// import { Coin } from "../types/models/Coin";

export async function handleBlock(block: CosmosBlock): Promise<void> {
  // If you wanted to index each block in Cosmos (Juno), you could do that here
}

export async function handleTransaction(tx: CosmosTransaction): Promise<void> {
  const transactionRecord = new Transaction(tx.hash);
  transactionRecord.blockHeight = BigInt(tx.block.block.header.height);
  transactionRecord.timestamp = tx.block.block.header.time;
  await transactionRecord.save();
}

export async function handleMessage(msg: CosmosMessage): Promise<void> {
  const txHash = msg.tx.hash ? msg.tx.hash : "";
  const id = `${txHash}-${msg.idx}`;
  const contractAddress = msg.msg.decodedMsg.contract;

  if (contractAddress) {
    return;
  }

  const messageRecord = new Message(id);
  messageRecord.txHash = txHash;
  messageRecord.blockHeight = BigInt(msg.block.block.header.height);
  messageRecord.sender = msg.msg.decodedMsg.sender;
  messageRecord.contract = contractAddress;;
  messageRecord.msg = JSON.stringify(msg.msg.decodedMsg);
  // messageRecord.fundsId = saveCoins(id, msg.msg.decodedMsg.funds);
  await messageRecord.save();
}

// function saveCoins(id: string, coins: Array<any>): Array<string> {
//   let coinIDs = Array<string>(coins.length);
//   for (let i=0; i<coins.length; i++) {
//     coinIDs[i] = saveCoin(`${id}-${i}`, coins[i]);
//   }
//   return coinIDs;
// }

// function saveCoin(id: string, c: any): string {
//   const coin = new Coin(id);
//   coin.amount = c.amount;
//   coin.denom = c.denom;
//   coin.save();
//   return id;
// }

export async function handleEvent(event: CosmosEvent): Promise<void> {
  const eventRecord = new ExecuteEvent(
    `${event.tx.hash}-${event.msg.idx}-${event.idx}`
  );
  eventRecord.blockHeight = BigInt(event.block.block.header.height);
  eventRecord.txHash = event.tx.hash;
  for (const attr of event.event.attributes) {
    switch (attr.key) {
      case "_contract_address":
        eventRecord.contractAddress = attr.value;
        break;
      default:
    }
  }
  await eventRecord.save();
}
