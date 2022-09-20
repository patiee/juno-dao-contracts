import { CosmosMessage } from "@subql/types-cosmos";
import { MsgExecuteContract } from "../types/models/MsgExecuteContract";
import { MsgInstantiateContract } from "../types/models/MsgInstantiateContract";

export async function handleMessage(msg: CosmosMessage): Promise<void> {
  const typeURL = msg.msg.typeUrl;
  if (typeURL.includes(`cosmwasm`)) {
    switch (typeURL) {
      case "/cosmwasm.wasm.v1.MsgInstantiateContract":
        await saveMsgInstantiateContract(msg);
        break;
      case "/cosmwasm.wasm.v1.MsgExecuteContract":
        await saveMsgExecuteContract(msg);
        break;
      default:
        logger.info(
          `unknown typeUrl: ${typeURL} height: ${msg.block.block.header.height}`
        );
        break;
    }
  }
}

async function saveMsgInstantiateContract(msg): Promise<void> {
  const id = `juno-MsgInstantiateContract-${msg.block.block.header.height}-${msg.tx.hash}-${msg.idx}`;
  const txHash = msg.tx.hash;
  const messageRecord = new MsgInstantiateContract(id);
  const messageJson = msg.msg.decodedMsg;

  messageRecord.codeID = getCodeID(messageJson);
  messageRecord.index = msg.idx;
  messageRecord.height = BigInt(msg.block.block.header.height);
  messageRecord.hash = msg.block.block.id;
  messageRecord.txHash = txHash;
  messageRecord.sender = msg.msg.decodedMsg.sender;
  messageRecord.contract = msg.msg.decodedMsg.contract;
  messageRecord.msg = messageJson;

  await messageRecord.save();
}

async function saveMsgExecuteContract(msg): Promise<void> {
  const id = `juno-MsgExecuteContract-${msg.block.block.header.height}-${msg.tx.hash}-${msg.idx}`;
  const txHash = msg.tx.hash;
  const messageRecord = new MsgExecuteContract(id);
  const messageJson = msg.msg.decodedMsg;

  messageRecord.codeID = getCodeID(messageJson);
  messageRecord.index = msg.idx;
  messageRecord.height = BigInt(msg.block.block.header.height);
  messageRecord.hash = msg.block.block.id;
  messageRecord.txHash = txHash;
  messageRecord.sender = msg.msg.decodedMsg.sender;
  messageRecord.contract = msg.msg.decodedMsg.contract;
  messageRecord.msg = messageJson;

  await messageRecord.save();
}

function getCodeID(messageJson) {
  const codeID = messageJson.codeId;
  if (codeID == undefined || codeID.low === undefined) {
    return null;
  }

  return codeID.low;
}