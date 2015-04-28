let express = require('express');
let mime = require('mime-types');
let app = express();
let fs = require('fs');
let filePath = process.cwd() +'/index.js';
app.listen(8000);

function sendHeaders(req, res, next) {
  // send headers logic
  console.log("middleware")
  // req.setHeader('x-cat', 'niuniu');
  next();
}

app.get('*', sendHeaders, (req, res) => {
	console.log(">< in get");
   //  let file = fs.readFile(filePath, function(err, file){
			// res.write(file);
			// res.end();

   //  });
   //  TODO:  Support streaming video 
    let stream = fs.createReadStream(filePath);
    stream.on('open', function(){
    	  stream.pipe(res);
    })
    stream.on('error', function(err){
    	 res.end(err);
    })
  
});

//curl --head http://localhost:8000
//TODO it's always hitting get;
app.head('*', sendHeaders, (req, res) => {
	console.log(">< in head")
    let stats = fs.statSync(filePath);
    let fileSizeInBytes = stats["size"]
    let fileMimeType = mime.lookup(filePath);
    // console.log("><fileSizeInBytes", fileSizeInBytes);
    req.setHeader('Content-Length', fileSizeInBytes);
    req.setHeader('Content-Type', 'text/plain');
    req.end();


	// res.setHeader('x-cat', 'niuniu');
});

app.put('*', (req, res) => { 
	let newFilePath = process.cwd() + 'newFile';
	if (fs.existsSync(path)) {
    // Do something
       res.writeHead('405');
       return res.end();
    }
	return req.pipe(fs.createWriteStream(newFilePath));
});

app.post('*', (req, res) => { 
});

app.delete('*', (req, res) => {
   // fs.unlink(path.join(ROOT_DIR, filePath))
});
