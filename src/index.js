import fsp from 'fs/promises'
import express from "express"
import cors from 'cors'
import envset from "dotenv"
import morgan from 'morgan'

import {cookie_parser, auth_jwt, task_jwt, check, login, signup, logout } from "./auth.js"

import { createTask, editTask, completeTask, deleteTask, queryUserTasks } from "./task.js"

import { envString, envFile, envS3uri } from "./env.js"

if(process.env.ENVSET){
	console.log("Environment variables already set because process.env.ENVSET, preoceeding with them")
}else if(process.env.ENV_STRING){
	envString(process.env.ENV_STRING)
	console.log("Environment variables set using ENVSTRING")
}else if(process.env.ENV_FILE){
	envFile(process.env.ENV_FILE)
	console.log("Environment variables set using ENV FILE")
}else if(process.env.ENV_S3URI){
	await envS3uri(process.env.ENV_S3URI)
	console.log("Environment variables set using S3 URI")
}else {
	console.log("No environment variables are provided, so Exiting")
	process.exit(100)
}

const port = process.env.API_PORT

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
