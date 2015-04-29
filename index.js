/**
 * Node Dropbox
 * @since April, 2015
 * @author  Linghua
 */

let path = require('path')
let fs = require('fs')
let express = require('express')
let nodeify = require('bluebird-nodeify')  //to convert promise to callbacks
let morgan = require('morgan')
let mime = require('mime-types')

//to allow use of promise
require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = path.resolve(process.cwd())

let app = express()

//morgan runs first, then run other app.get, or actions
//depends on declear sequence
if (NODE_ENV === 'development'){
	app.use(morgan('dev'))
}

app.listen(PORT, () => console.log(`LISTENING http://localhost:${PORT}`))

app.get('*', sendHeaders, (req, res) => {
	//if directory, we set it to body 
	//ToDO: improve so less hacky
	if (res.body){
		return res.json(res.body)
	}

	fs.createReadStream(req.filePath).pipe(res);
})
// curl -v http://localhost:8000/ -X HEAD
app.head('*', sendHeaders, (req, res) => {

});
/**
 * send headers serves as middleware
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function sendHeaders(req, res, next){
	//convert promise back to callback
	//take this promise and connect to next callback
	nodeify(async ()=> {
		//TODO: handle if there is not url
		let filePath = path.resolve(path.join(ROOT_DIR, req.url));
		req.filePath = filePath;//so you can pass via middle ware to next actions(middleware)
		if (filePath.indexOf(ROOT_DIR)!==0){
			return res.send(400, 'invalid path')
		}

		let stat = await fs.promise.stat(filePath)
		if (stat.isDirectory()){
			let files = await fs.promise.readdir(filePath)
			res.body = JSON.stringify(files);
			res.setHeader('Content-Length',res.body.length);
			res.setHeader('Content-Type', 'application/json')
			return
		}
		//if stat is file
		else{
			let contentType = mime.contentType(path.extname(filePath))
			res.setHeader('Content-Length',stat.size)
			res.setHeader('Content-Type', contentType)
		}
	}(), next);
}
// function sendHeaders(req, res, next) {
//   // send headers logic
//   console.log("middleware")
//   // req.setHeader('x-cat', 'niuniu');
//   next();
// }

// app.get('*', sendHeaders, (req, res) => {
// 	console.log(">< in get");
//    //  let file = fs.readFile(filePath, function(err, file){
// 			// res.write(file);
// 			// res.end();

//    //  });
//    //  TODO:  Support streaming video 
//     let stream = fs.createReadStream(filePath);
//     stream.on('open', function(){
//     	  stream.pipe(res);
//     })
//     stream.on('error', function(err){
//     	 res.end(err);
//     })
  
// });

// //curl --head http://localhost:8000
// //TODO it's always hitting get;
// app.head('*', sendHeaders, (req, res) => {
// 	console.log(">< in head")
//     let stats = fs.statSync(filePath);
//     let fileSizeInBytes = stats["size"]
//     let fileMimeType = mime.lookup(filePath);
//     // console.log("><fileSizeInBytes", fileSizeInBytes);
//     req.setHeader('Content-Length', fileSizeInBytes);
//     req.setHeader('Content-Type', 'text/plain');
//     req.end();


// 	// res.setHeader('x-cat', 'niuniu');
// });

// app.put('*', (req, res) => { 
// 	let newFilePath = process.cwd() + 'newFile';
// 	if (fs.existsSync(path)) {
//     // Do something
//        res.writeHead('405');
//        return res.end();
//     }
// 	return req.pipe(fs.createWriteStream(newFilePath));
// });

// app.post('*', (req, res) => { 
// });

// app.delete('*', (req, res) => {
//    // fs.unlink(path.join(ROOT_DIR, filePath))
// });
