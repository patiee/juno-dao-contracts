import { CosmosMessage } from "@subql/types-cosmos";
import base64ToString from "./base64";
import { MsgExecuteContract } from "./types/models/MsgExecuteContract";
import { MsgInstantiateContract } from "./types/models/MsgInstantiateContract";

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
  const codeID = getCodeID(msg.msg.decodedMsg);
  const message = decodeMessageBase64(msg.msg.decodedMsg, 'MsgInstantiateContract', codeID);

  messageRecord.codeID = codeID;
  messageRecord.index = msg.idx;
  messageRecord.height = BigInt(msg.block.block.header.height);
  messageRecord.hash = msg.block.block.id;
  messageRecord.label = message.label;
  messageRecord.txHash = txHash;
  messageRecord.sender = msg.msg.decodedMsg.sender;
  messageRecord.contract = msg.msg.decodedMsg.contract;
  messageRecord.msg = message;

  await messageRecord.save();
}

async function saveMsgExecuteContract(msg): Promise<void> {
  const id = `juno-MsgExecuteContract-${msg.block.block.header.height}-${msg.tx.hash}-${msg.idx}`;
  const txHash = msg.tx.hash;
  const messageRecord = new MsgExecuteContract(id);
  const codeID = getCodeID(msg.msg.decodedMsg);
  const message = decodeMessageBase64(msg.msg.decodedMsg, 'MsgExecuteContract', codeID);
  
  messageRecord.codeID = codeID;
  messageRecord.index = msg.idx;
  messageRecord.height = BigInt(msg.block.block.header.height);
  messageRecord.hash = msg.block.block.id;
  messageRecord.txHash = txHash;
  messageRecord.sender = msg.msg.decodedMsg.sender;
  messageRecord.contract = msg.msg.decodedMsg.contract;
  messageRecord.msg = message;

  await messageRecord.save();
}

function decodeMessageBase64(message, name, id) {
  if (Array.isArray(message)) {
    for (let i = 0; i < message.length; i++) {
      message[i] = decodeMessageBase64(message[i], name, id);
    }
    return message;
  }

  let newMessage = JSON.parse("{}");
  let uniqueMsgID = `${name}-${id}`;
  let newID = id;
  for (const field in message) {
    const value = message[field];
    const type = typeof value;

    if (field == "msg") {
      const codeID = getCodeID(message);
      const codeIDValue = value ? getCodeID(value): null;
      if (codeID) {
        newID = codeID;
      }
  
      if (codeIDValue) {
        newID = codeIDValue;
      }

      if (!codeID && !codeIDValue) {
        const contract = message.contract;
        if (contract) {
          newID = contract;
        }
      }
    }
    
    if (field == "msg" && type == "string" && value != "") {
      newMessage[uniqueMsgID] = base64ToString(value);
    } else if (type == "object" && value !== "" && value != null) {
      let valueToDecode;
      if (field == "msg") {
        const jsonValue = JSON.stringify(value);
        if (jsonValue !== "" && !jsonValue.includes(`{"0":`)) {
          valueToDecode = value;
        } else {
          valueToDecode = base64ToString(value);
        }
      } else {
        valueToDecode = value;
      }
      
      let newName = name;
      if (field !== "msg") {
        newName += `-${field}`
      }
      const idStr = newID ? `-${newID}`: "";
      const newUniqueMsgID = `${newName}${idStr}`
      const val = decodeMessageBase64(valueToDecode, newName, newID);

      const key = field === "codeId" || field == "funds"? field: newUniqueMsgID;
      newMessage[key] = val;
    } else {
      newMessage[field] = value;
    }
  }
  return newMessage;
}

function getCodeID(messageJson) {
  const codeID = messageJson.codeId;
  if (codeID == undefined || codeID.low === undefined) {
    return null;
  }

  if (codeID.low) {
    return codeID.low;
  }

  return codeID;
}
