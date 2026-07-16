import axios from 'axios'
const api=axios.create({baseURL:import.meta.env.VITE_API_URL??'/api',withCredentials:true})
let refreshing:Promise<unknown>|null=null
api.interceptors.response.use(r=>r,async error=>{
 const original=error.config
 if(error.response?.status===401&&!original?._retried&&!String(original?.url).includes('/auth/token/')){
  original._retried=true
  try{refreshing??=api.post('/auth/token/refresh/');await refreshing;refreshing=null;return api(original)}catch{refreshing=null}
 }
 return Promise.reject(error)
})
export default api
