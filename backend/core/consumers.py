from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import Conversation,ConversationReadState,Message,Notification
from .moderation import inspect_message
from .serializers import MessageSerializer
class ChatConsumer(AsyncJsonWebsocketConsumer):
 async def connect(self):
  self.conversation_id=self.scope['url_route']['kwargs']['conversation_id'];self.group=f'chat_{self.conversation_id}'
  if self.scope['user'].is_anonymous or not await self.allowed():return await self.close(code=4403)
  self.display_name=await self.get_display_name();await self.channel_layer.group_add(self.group,self.channel_name);await self.accept();await self.channel_layer.group_send(self.group,{'type':'presence.event','user_id':self.scope['user'].id,'display_name':self.display_name,'online':True})
 @database_sync_to_async
 def allowed(self):
  conversation=Conversation.objects.filter(pk=self.conversation_id,participants__user=self.scope['user']).first()
  if not conversation:return False
  profile=self.scope['user'].profile;others=conversation.participants.exclude(pk=profile.pk)
  return not (profile.blocks_made.filter(blocked__in=others).exists() or profile.blocks_received.filter(blocker__in=others).exists())
 @database_sync_to_async
 def get_display_name(self):return self.scope['user'].profile.display_name
 async def disconnect(self,code):
  if hasattr(self,'group'):
   if not self.scope['user'].is_anonymous:await self.channel_layer.group_send(self.group,{'type':'presence.event','user_id':self.scope['user'].id,'display_name':getattr(self,'display_name','Someone'),'online':False})
   await self.channel_layer.group_discard(self.group,self.channel_name)
 async def receive_json(self,content,**kwargs):
  if content.get('type')=='typing':await self.channel_layer.group_send(self.group,{'type':'typing.event','user_id':self.scope['user'].id,'display_name':self.display_name,'typing':bool(content.get('typing'))})
  elif content.get('type')=='message':
   body=str(content.get('body','')).strip()
   if not body or len(body)>2000:return await self.send_json({'event':'error','detail':'Messages must be between 1 and 2000 characters.'})
   message=await self.create_message(body)
   await self.channel_layer.group_send(self.group,{'type':'chat.message','message':message})
  elif content.get('type')=='webrtc':
   await self.channel_layer.group_send(self.group,{'type':'webrtc.event','sender_id':self.scope['user'].id,'signal':content.get('signal')})
 @database_sync_to_async
 def create_message(self,body):
  conversation=Conversation.objects.get(pk=self.conversation_id,participants__user=self.scope['user'])
  message=Message.objects.create(conversation=conversation,sender=self.scope['user'],body=body)
  inspect_message(message)
  Notification.objects.bulk_create([Notification(profile=p,conversation=conversation,title=self.display_name,body=body[:240]) for p in conversation.participants.exclude(user=self.scope['user'])])
  ConversationReadState.objects.update_or_create(conversation=conversation,profile=self.scope['user'].profile,defaults={'last_read_at':timezone.now()})
  return MessageSerializer(message).data
 async def chat_message(self,event):await self.send_json({'message':event['message']})
 async def presence_event(self,event):await self.send_json({'event':'presence','user_id':event['user_id'],'display_name':event['display_name'],'online':event['online']})
 async def typing_event(self,event):await self.send_json({'event':'typing','user_id':event['user_id'],'display_name':event['display_name'],'typing':event['typing']})
 async def webrtc_event(self,event):
  if event['sender_id']!=self.scope['user'].id:
   await self.send_json({'event':'webrtc','sender_id':event['sender_id'],'signal':event['signal']})
