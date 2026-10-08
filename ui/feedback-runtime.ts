// Port of pinned Geistdocs feedback transport, replacing only Next headers.
import {CHAT_FEEDBACK_URL_LIMIT,formatChatMessageFeedbackNote,normalizeChatMessageFeedback} from './lib/feedback/message-feedback';
export async function feedbackResponse(request:Request){
 try{
  const {kind,input}=await request.json();let note,url,emotion,thumbs,max=2048;
  if(kind==='page'){const emotions={cry:'😭',sad:'😕',happy:'🙂',amazed:'🤩'};emotion=emotions[input.feedback.emotion];note=input.feedback.message;url=input.url;}
  else if(kind==='chat'){const normalized=normalizeChatMessageFeedback(input.feedback);if(!normalized)return Response.json({success:false});note=formatChatMessageFeedbackNote(normalized);url=normalized.pageUrl;thumbs=normalized.vote;max=CHAT_FEEDBACK_URL_LIMIT;}
  else return Response.json({success:false});
  const response=await fetch('https://geistdocs.com/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({note,url:new URL(url,'https://ai-sdk.dev').toString().slice(0,max),emotion,thumbs,ua:request.headers.get('user-agent')??undefined,ip:request.headers.get('x-real-ip')||request.headers.get('x-forwarded-for')||undefined,label:typeof input.siteId==='string'?input.siteId:undefined})});
  return Response.json({success:response.ok});
 }catch{return Response.json({success:false});}
}
