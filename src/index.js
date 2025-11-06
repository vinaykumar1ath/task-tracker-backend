import fsp from 'fs/promises'
import express from "express"
import cors from 'cors'
import envset from "dotenv"
import morgan from 'morgan'

const env =async (filePath) => {
	if(filePath){
		try{
			await fsp.access(filePath, fsp.constants.F_OK)
			return filePath
		} catch(error){
			console.log("Invalid environemnt filepath")
			process.exit(100)
		}
	}else if (process.env.NODE_ENV === 'test')
		return '.env.test'
	else if(process.env.NODE_ENV === 'container')
		return '.env.container'
	else if(process.env.NODE_ENV === 'production')
		return '.env.production'
	else
		return '.env.test'
}
envset.config({
	path: await env(process.env.ENV_FILE)
})

const port = process.env.API_PORT

import {cookie_parser, auth_jwt, task_jwt, check, login, signup, logout } from "./auth.js"

import { createTask, editTask, completeTask, deleteTask, queryUserTasks } from "./task.js"

const server = express()
const auth = express.Router()
const taskapi = express.Router()
server.use(cors({
  origin: process.env.ORIGIN_URL,
  credentials: true,
}));

auth.use(cookie_parser())
auth.use(express.json())
auth.use(auth_jwt)
auth.get("/check",check)
auth.post("/login",login)
auth.post("/signup",signup)
auth.post("/logout",logout)

taskapi.use(cookie_parser())
taskapi.use(express.json())
taskapi.use(task_jwt)
taskapi.post("/create",createTask)
taskapi.put("/edit",editTask)
taskapi.put("/complete",completeTask)
taskapi.get("/query",queryUserTasks)
taskapi.delete("/delete",deleteTask)

server.use(morgan('dev'))
server.get("/",(req, res) => {
	return res.status(200).send("todolist is UP and RUNNING")
})
server.use("/auth",auth)
server.use("/task",taskapi)

 server.listen(port, ()=>{
   console.log(`listening on ${port}`)
 })
