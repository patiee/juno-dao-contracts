export default function base64ToString(base64){
    const json = JSON.stringify(base64);
    if (json !== ""){
      if (json.includes(`{"0":`)) {
        return decodeBase64ToString(base64);
      } else if (json.includes(`{`)) {
        return base64;
      }
    } 
    return decodeBase64ToString(base64);
  }
  
function decodeBase64ToString(base64) {
    return Buffer.from(base64, 'base64').toString('binary');
}
  