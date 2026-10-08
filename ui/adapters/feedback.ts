// Standalone transport boundary. Tests serve deterministic local fixtures;
// no upstream feedback is submitted during this migration campaign.
async function submit(kind:string,input:unknown){
 try{
  const response=await fetch('/api/docs-feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({kind,input})});
  if(!response.ok)return {success:false};
  return {success:(await response.json()).success===true};
 }catch{return {success:false};}
}
export const sendFeedback=(input:unknown)=>submit('page',input);
export const sendChatMessageFeedback=(input:unknown)=>submit('chat',input);
