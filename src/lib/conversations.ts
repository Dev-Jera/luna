import type {Conversation} from '../types'
export const unreadTotal=(conversations:Conversation[])=>conversations.reduce((sum,conversation)=>sum+conversation.unread_count,0)
