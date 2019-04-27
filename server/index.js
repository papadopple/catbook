// load environment variables from .env file, if it exists
require('dotenv').config();

// import dependencies
const path = require('path');
const util = require('util');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { ImageAnnotatorClient } = require('@google-cloud/vision');

// promisify the filesystem functions we need
const readdirAsync = util.promisify(fs.readdir);
const statAsync = util.promisify(fs.stat);
const unlinkAsync = util.promisify(fs.unlink);

fs.writeFileSync(path.join(__dirname, 'gcloud-credentials.json'), process.env.SERVICE_ACCOUNT_JSON);

// create Cloud Vision client
const visionClient = new ImageAnnotatorClient();

// create express app
const app = express();

// define path for file uploads
const uploadPath = path.join(__dirname, 'uploads');

// create the upload folder if it doesn't exist
if (!fs.existsSync(uploadPath)) {
 fs.mkdirSync(uploadPath);
}

// configure multer to use the uploads folder
const upload = multer({ dest: 'uploads/' });

// handle post requests with images to the /upload path
app.post('/api/upload', upload.single('image'), async(req, res)=>{
	try{
		
		if(!req.file){
			res.sendStatus(500);
			return;
		}
	

		//get file path uploaded
		const filePath = req.file.path;

		//send image to gcloud for label detect
		const results = await visionClient.labelDetection(filePath);

		//get label data from google response
		const labels = results[0].labelAnnotations.map(x => x.description.toLowerCase());

		//check if label is cat
		const hasCat = labels.includes('cat');

		if(hasCat){
			res.status(201).json({message : 'Thanks for cat.'});
		}
		else{
			//remove non cat
			await unlinkAsync(filePath);
			res.status(400).json({message : 'No Cat!'});
		}
	}
	catch(err){
		res.sendStatus(500);
	}
});

//handle requests to individual cats
app.get('/api/cats/:id', (req, res)=>{
	const {id} = req.params;
	const catPath = path.join(uploadPath, id);
	res.sendFile(catPath);
});

// handle get requests to retrieve the last uploaded cat
app.get('/api/cats', async(req, res) => {
	try{
		//read uploads dir for files
		const files = await readdirAsync(uploadPath);

		//read file stats asynchronously
		const stats = await Promise.all(
			files.map(filename =>
				statAsync(path.join(uploadPath, filename))
				.then(stat => ({filename, stat}))
			)
		);

		//sort files chrono and slice last 20
		const cats = stats
			.sort((a,b) => a.stat.mtime.getTime() - b.stat.mtime.getTime())
			.map(stat => stat.filename)
		
		res.status(200).json({cats, message : 'Here is cat'});

	}
	catch(err){
		console.error(err);
		res.sendStatus(500).json({cats:[], message : 'Internal server error'});
	}
});

// serve static frontend from all other routes
app.use(express.static(path.join(__dirname, '../client/build')));

// start the server
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Server listening on port ${port}`));