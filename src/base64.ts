export default function base64ToString(base64) {
  const json = JSON.stringify(base64);
  if (json !== "" && json.includes(`{`) && !json.includes(`{"0":`)) {
    return base64;
  }
  const decoded = decodeBase64ToString(base64);
  if (decoded[0] === "{") {
    return JSON.parse(decoded)
  }
  return decoded;
}

function decodeBase64ToString(base64) {
  return Buffer.from(base64, "base64").toString("binary");
}
