import {configureStore,createAsyncThunk,createSlice,PayloadAction} from '@reduxjs/toolkit'
import api from './lib/api'; import type {Conversation,Match,Profile} from './types'
type State={profile:Profile|null;matches:Match[];conversations:Conversation[];loading:boolean;error:string|null}
const initialState:State={profile:null,matches:[],conversations:[],loading:false,error:null}
export const loadDashboard=createAsyncThunk('luna/dashboard',async()=>{const [p,m,c]=await Promise.all([api.get('/profiles/me/'),api.get('/matches/'),api.get('/conversations/')]);return {profile:p.data,matches:m.data.results??m.data,conversations:c.data.results??c.data}})
const slice=createSlice({name:'luna',initialState,reducers:{setProfile:(s,a:PayloadAction<Profile>)=>{s.profile=a.payload},addMessage:(s,a:PayloadAction<{conversationId:number;message:any}>)=>{const c=s.conversations.find(x=>x.id===a.payload.conversationId);if(c&&c.messages&&a.payload.message&&!c.messages.some(m=>m.id===a.payload.message.id))c.messages.push(a.payload.message)}},extraReducers:b=>b.addCase(loadDashboard.pending,s=>{s.loading=true;s.error=null}).addCase(loadDashboard.fulfilled,(s,a)=>{Object.assign(s,a.payload);s.loading=false}).addCase(loadDashboard.rejected,(s,a)=>{s.loading=false;s.error=a.error.message??'Unable to load Luna'})})
export const {setProfile,addMessage}=slice.actions
export const store=configureStore({reducer:{luna:slice.reducer}})
export type RootState=ReturnType<typeof store.getState>; export type AppDispatch=typeof store.dispatch
