import fs from 'fs'
import envset from 'dotenv'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const envFile = (filePath) => {
	if(!filePath) return;
	try{
		if(!fs.existsSync(filePath)) throw new Error("File not found");
		envset.config({
			path: filePath
		})
		process.env.ENVSET = "true"
	} catch(error){
		console.log("Invalid environemnt filepath")
		console.error(error)
		process.exit(100)
	}
}

const envString = (str) => {
	try{
		Object.assign(process.env, envset.parse(Buffer.from(str, 'base64')))
		process.env.ENVSET = "true"
	} catch(error){
		console.log("Invalid environemnt string")
		console.error(error)
		process.exit(100)
	}
}

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

function parseS3Uri(s3Uri) {
  if (!s3Uri.startsWith("s3://")) throw new Error("Invalid S3 URI");
  const parts = s3Uri.replace("s3://", "").split("/");
  const Bucket = parts.shift();
  const Key = parts.join("/");
  return { Bucket, Key };
}


function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", chunk => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () =>
      resolve(Buffer.concat(chunks).toString("utf-8"))
    );
  });
}

const envS3uri = async (s3Uri) => {
	try{
		const { Bucket, Key } = parseS3Uri(s3Uri);

		const command = new GetObjectCommand({ Bucket, Key });
		const response = await s3.send(command);

		const content = await streamToString(response.Body);
		const s3Env = envset.parse(content);
		for (const [key, value] of Object.entries(s3Env)) {
			if (process.env[key] === undefined) {
				process.env[key] = String(value);
			}
		}
		process.env.ENVSET = "true"
	}catch(error){
		console.log("Invalid S3uri")
		console.error(error)
		process.exit(100)
	}
}

if(process.env.ENVSET){
	console.log("Environment variables already set because process.env.ENVSET, preoceeding with them")
}else if(process.env.ENV_STRING){
	envString(process.env.ENV_STRING)
	console.log("Environment variables set using ENV_STRING")
}else if(process.env.ENV_FILE){
	envFile(process.env.ENV_FILE)
	console.log("Environment variables set using ENV_FILE")
}else if(process.env.ENV_S3URI){
	await envS3uri(process.env.ENV_S3URI)
	console.log("Environment variables set using ENV_S3URI")
}else {
	console.log("No environment variables are provided, so Exiting")
	process.exit(100)
}

import {server} from './server.js'

 server.listen(process.env.API_PORT, ()=>{
   console.log(`listening on ${process.env.API_PORT}`)
 })
