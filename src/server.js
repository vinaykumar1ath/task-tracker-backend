import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import serverless from 'serverless-http'

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
	console.log("Running preflight environment check...")
	var isEnvOK = true
	var envCheck = {}

	envCheck.API_PORT = process.env.API_PORT ? `API_PORT is set as ${process.env.API_PORT}` : "not set"
	envCheck.ORIGIN_URL = process.env.ORIGIN_URL ? `ORIGIN_URL is set as ${process.env.ORIGIN_URL}` : "not set"
	envCheck.MONGODB_URI = process.env.MONGODB_URI ? `MONGODB_URI is set as ${process.env.MONGODB_URI}` : "not set"
	envCheck.JWT_SECRET = process.env.JWT_SECRET ? `JWT_SECRET is set as ${process.env.JWT_SECRET}` : "not set"
	envCheck.message = "todolist is UP and RUNNING"

	return res.status(200).json(envCheck)
})

server.use("/auth",auth)
server.use("/task",taskapi)

const serverlessAWS = serverless(server)

export { server, serverlessAWS }
