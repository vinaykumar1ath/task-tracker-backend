
import _ from "underscore"      //for isString function

import {connectDB, tasks, taskarchives} from "./database.js"      //import tasks collection from database module

//create task under the username
//req=> {req.session.username:"string",req.body.task:"",_._.description:"",_._.finishDate:Date}
//res=> {message:""}
async function createTask(req,res){
	await connectDB()
	const  data  = req.body
	
	//check if properly logged in user is making request
	if( !req.session.username)
	{
		return res.status(401).json({"message":"You are not logged in"})
	}
	
	//check if data task name and description are in string format
	if((! _.isString(data.task)) || (! _.isString(data.description)))
	{
		return res.status(400).json({"message":"Task or description improper"})
	}
	
	/* check if the dates are proper */
	
	//check if task with that name exists
	try{
		const check = await tasks.findOne({"username":req.session.username,"task":data.task})
		if (check)
		{
			 return res.status(400).json({"message":"Task with this name already exists"})
		}
	} catch(error) {
		return res.status(500).json({"message":`${error}`})
	}
	
	//create task under the username
	//console.log(`create task:${data.finishDate}`)
	let task = {"username":req.session.username,
		"task":data.task,
		"description":data.description,
		"startDate": new Date(),
		"finishDate":new Date(data.finishDate),
		"completed": false
		}
	try{
		await tasks.create(task)
		delete task.username
	} catch (error){
		return res.status(500).json({"message":`${error}`})
	}
	
	return res.status(200).json({"message":"Task created successfully", data: task})
}

//can edit only finish date, description and task name, start date is assumed to be unique to every task
//req=> {req.session.username:"string",req.body.task:"",_._.description:"",_._.finishDate:Date}
//res=> {message:""}
async function editTask(req,res){
	await connectDB()
	
	//check if properly logged in user is making request
	if( !req.session.username)
	{
		return res.status(401).json({"message":"You are not logged in"})
	}
	
	const data = req.body
	
	//check if they are not string
	if((! _.isString(data.task)) || (! _.isString(data.description)))
	{
		return res.status(400).json({"message":"Task or description improper"})
	}
	
	/* check if startDate finishDate is valid */
	
	//find that one task that has same username task name and start date
	//console.log(`edit task:${data.finishDate}`)
	let check = undefined
	try{
		check = await tasks.findOne({"username":req.session.username, "startDate":data.startDate}, {"task":1,"description":1,"finishDate":1,"startDate":1,"completed":1})
		if( !check )
		{
			return res.status(400).json({"message":"Could not find the specific task to edit"})
		}
	
		check.task = data.task
		check.description = data.description
		check.finishDate = data.finishDate

		await check.save()
	} catch(error){
		return res.status(500).json({"message":`server error: ${error} occured`})
	}
	
	res.status(200).json({"message":"Task updated successsfully", data: check})
}

//mark the task status to complete 
//req=> {req.session.username:"", req.body.startDate:Date, _._.task:""}
//res=> {message:""}
async function completeTask(req,res){
	await connectDB()
	
	//check if properly logged in user is making request
	if( !req.session.username)
	{
		return res.status(401).json({"message":"You are not logged in"})
	}
	
	const data = req.body
	
	/* check if startDate finishDate is valid */
	
	//find that one task that has same username task name and start date
	let check = undefined
	try{
		check = await tasks.findOne({"username":req.session.username, "startDate":data.startDate, "completed":false}, {"task":1,"description":1,"finishDate":1,"startDate":1,"completed":1})
		if( !check)
		{
			return res.status(400).json({"message":"Could not find the specific incompleted task to edit"})
		}
		
		check.completed = true
		await check.save()
	} catch(error){
		return res.status(500).json({"message":`${error}`})
	}
	
	return res.status(200).json({"message":"Task completion updated successfullly", data: check})
}

//delete user task independent of whether the task is completed or not
//req=> {req.session.username:"", req.body.startDate:Date, _._.task:""}
//res=> {message:""}
async function deleteTask(req,res){
	await connectDB()
	
	//check if properly logged in user is making request
	if( !req.session.username )
	{
		return res.status(401).json({"message":"You are not logged in"})
	}
	
	const data = req.body
	
	//find that one task that has same username task name and start date
	let check = undefined
	try{
		check = await tasks.findOne({"username":req.session.username, "startDate":data.startDate}, {"task":1,"description":1,"finishDate":1,"startDate":1,"completed":1})
		if( !check )
		{
			return res.status(400).json({"message":"Could not find the specific task to delete"})
		}
		
		await taskarchives.create(check.toJSON())
		await check.deleteOne()
	} catch(error){
		return res.status(500).json({"message":`${error}`})
	}
	
	res.status(200).json({"message":"Task removed successsfully", data: check})
}

//query both remaining and ocmpleted tasks with this function
//req=> {req.session.username:"",_._.completed:boolean(not compulsary)}
async function queryUserTasks(req,res){
	await connectDB()
	
	//check if properly logged in user is making request
	if(!req.session.username)
	{
		return res.status(401).json({"message":"You are not logged in"})
	}
	
	const data = req.query
	let alltasks = false
	
	/*return list of alltasks if and only if completed is not specified
	or specified type of completed is not boolean*/
	if( Object.keys(data).length === 0 ){
		alltasks=true
	} else if(!data.hasOwn("completed")){
		alltasks=true
	}
	//query task according to the specified rule and return result
	let tasklist=[]
	try{
		if(alltasks)
		{
			tasklist = await tasks.find({"username":req.session.username},{"task":1,"description":1,"finishDate":1,"startDate":1,"completed":1})
		}
		else {
			tasklist = await tasks.find({"username":req.session.username,"completed":data.completed},{"task":1,"description":1,"finishDate":1,"startDate":1,"completed":1})
		}
		
		return res.status(200).json({"message":"Fetched tasklist", "data":tasklist})
		
	}catch(error){
		return res.status(500).json({"message":`${error.message}`})
	}
}

export { createTask, editTask, completeTask, deleteTask, queryUserTasks }