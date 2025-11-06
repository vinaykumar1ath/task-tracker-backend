import hasher from "crypto"      //module to generate hash of password
import _ from "underscore"     // _ for isString function
import {connectDB, users} from "./database.js" //import only users table
import cookie_parser from 'cookie-parser'
import jwt from 'jsonwebtoken'

function token (username){
	return jwt.sign({username},
		process.env.JWT_SECRET ,
		{expiresIn: '1h'}
	)
}
function auth_jwt(req, res, next){
	req.jwt = {}
	try{
		req.jwt = jwt.verify(req.cookies.token, process.env.JWT_SECRET)
	} catch(error){
		console.log()
	}
	next()
}
function task_jwt(req, res, next){
	req.session = {}
	try{
		req.session = jwt.verify(req.cookies.token, process.env.JWT_SECRET)
	} catch{
		console.log()
	}
	next()
}

//check login status
//req -> {req.jwt.username}
//res -> {message,redirect}
async function check(req, res){
	if(req.jwt.username){
		return res.status(200).json({"message":"Logged In", "redirect":true})
	} else {
		return res.status(401).json({"message":"Not logged in", "redirect":false})
	}
}

//req=> {session:object,...}
//res=> {message:"detail"}
async function login(req,res){
	await connectDB()
	const data = req.body
	
	//check if user is already logged in if yes redirct to /home
	if( req.jwt.username )
	{
	return res.status(400).json({"message":"You are already logged in","redirect":true})
	}
	
	//check the below fields are string
	if( (! _.isString(data.username)) ||(! _.isString(data.password)) )
	{
		return res.status(400).json({"message":"Username or Password is improper"})
	}
	
	//generate hash of password
	const hash = hasher.createHash("sha256")
	await hash.update(data.password)
	const password = await hash.digest("hex")
	
	//check if user already has an account, if yes log them in
	try{
		const check = await users.findOne({"username":data.username,"password":password})
		if ( !check)
		{
			return res.status(400).json({"message":"Matching Username and Password not found  \n" })
		}
	} catch(error) {
		console.log(error)
		return res.status(500).json({"message":`${error}`})
	}
	
	//log user in by creating session cookie
	req.jwt.username = data.username
	res.cookie('token', token(req.jwt.username),{
		maxAge: 1000 * 60 * 60 ,
		httpOnly: true,
		secure: false
	})
	return res.status(200).json({"message":"Successfully logged in","redirect":true})
}

//req=> {session:object,...}
//res=> {message:detail}
async function signup(req,res){
	
	await connectDB()
	//check if user is already logged in, if yes redirect to /home
	if ( req.jwt.username )
	{
		return res.status(400).json({"message":"You are already logged in","redirect":true})
	}
	
	//check if enters fields are proper
	const data = req.body
	if( (! _.isString(data.username)) ||(! _.isString(data.password)) || !validateUsername(data.username) || data.username.length < 5 )
	{
		return res.status(400).json({"message":"Username or Password improper"})
	}
	
	//check if username is already taken 
	try{
		const check = await users.findOne({"username":data.username})
		if(check){
			return res.status(400).json({"message":"User exists with this Username\n Choose a new Username"})
		}
	} catch (error) {
		res.status(500).json({"message":`${error}`})
	}
	
	//generate hash of password
	const hash = hasher.createHash("sha256")
	await hash.update(data.password)
	const password = await hash.digest("hex")
	
	//insert new user and his credentials in database
	try{
		await users.create({ "username": data.username, "password": password})
	} catch(error) {
		return res.status(500).json({"message":`${error}`})
	}
	
	//assign sesssion cookie to always keep the user logged in 
	req.jwt.username = data.username
	res.cookie('token', token(req.jwt.username),{
		maxAge: 1000 * 60 * 60 ,
		httpOnly: true,
		secure: false
	})
	return res.status(200).json({"message":"User registered sucessfully","redirect":true})
}

//req=> {session:object,...}
//res=> {message:detail}
async function logout(req,res){
	
	await connectDB()
	//checking if useris actually logged in to logout
	try{
		if(req.jwt.username)
		{
			req.jwt = null
			res.cookie('token', "<empty>",{
				maxAge: 1000 * 60 * 60 ,
				httpOnly: true
			})
			res.status(200).json({"message":"Successfully logged out"})
		} else {
			res.status(400).json({"message":"You are logged out OR Not logged in "})
		}
	} catch(error){
		res.status(500).json({"message":`${error}`})
	}
}


function validateUsername(username) {
  // This regular expression allows letters (both uppercase and lowercase), digits, underscores, and hyphens
  const regex = /^[a-zA-Z0-9_-]+$/;

  // Test the username against the regex pattern
  if (!regex.test(username)) {
    return false; // Invalid username
  }
  return true; // Valid username
}

export { cookie_parser, auth_jwt, task_jwt, check, login, signup, logout }