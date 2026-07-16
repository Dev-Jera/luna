import {defineConfig,devices} from '@playwright/test'
export default defineConfig({testDir:'./e2e',fullyParallel:true,retries:1,use:{baseURL:'http://127.0.0.1:5173',trace:'retain-on-failure'},webServer:{command:'npm run dev -- --host 127.0.0.1',url:'http://127.0.0.1:5173',reuseExistingServer:true,timeout:300000},projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}]})
