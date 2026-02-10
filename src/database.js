import mongoose from "mongoose"

let connection = undefined 
const connectDB = async () =>{
	const mongouri = process.env.MONGODB_URI
	if(connection) return connection
	try{
		connection = await mongoose.connect(mongouri)
		console.log("Database Connected")
		return connection
	} catch(error){
		console.error(error)
		process.exit(1)
	}
}

		
		 
 //unique records id of task is: combination of username, task name and startDate in ISO format
 //username and task also make unique documents
 const taskSchema = new mongoose.Schema(
 {
	 username:{ type:String, require:true},
	 task:{ type:String, require:true },
	 description:{ type:String, require:true },
	 startDate:{ type:Date, require: true  },
	 finishDate:{ type:Date, require:true },
	 completed:{ type:Boolean, default:false }
 },
 {
	 timestamps: true
 })
 
 //unique id of a user is username
 const userSchema = new mongoose.Schema(
 {
	 username:{ type:String, require:true },
	 password:{ type:String, require:true }
 },
 {
	 timestamps:true
 })

const { users, tasks, userarchives, taskarchives } = {
  users: mongoose.model("user", userSchema),
  tasks: mongoose.model("task", taskSchema),
  taskarchives: mongoose.model("taskarchive",new mongoose.Schema({}, { strict: false }))
}

const databaseCollectionMap = {
	"users":users,
	"tasks":tasks,
	"taskarchives":taskarchives,
	"userarchives":userarchives
}

export {connectDB, users, tasks, taskarchives}
