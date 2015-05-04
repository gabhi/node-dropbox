/**
 * Node Dropbox
 * @since April, 2015
 * @author  Linghua
 */

//TODO:
//connection not closed after put a file
//contents are hardcoded

let path = require('path')
let fs = require('fs')
let express = require('express')
let nodeify = require('bluebird-nodeify') //to convert promise to callbacks
let morgan = require('morgan')
let mime = require('mime-types')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
let args = require('yargs').argv
let nssocket = require('nssocket')

let events = require('events')
let eventEmitter = new events.EventEmitter()

//to allow use of promise
require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000

let ROOT_DIR = args.dir ? path.resolve(args.dir): path.resolve(process.cwd())
console.log(">< ROOT DIR", ROOT_DIR)




// Create an `nssocket` TCP server
let tcpServer = nssocket.createServer(function(socket) {
    // Here `socket` will be an instance of `nssocket.NsSocket`.
    // let createInfo = {
    // "action": "update",                        // "update" or "delete"
    // "path": "/foo/bar.js",
    // "type": "file",                            // or "file"
    // "contents": "niuniu2",                            // or the base64 encoded file contents
    // "pdated": 1427851834642                    // time of creation/deletion/update
    // }
    // let deleteInfo = {
    // "action": "delete",                        // "update" or "delete"
    // "path": "/foo/bar.js",
    // "type": "file",                            // or "file"
    // "contents": "niuniu2",                            // or the base64 encoded file contents
    // "pdated": 1427851834642                    // time of creation/deletion/update
    // }
    // this only works when there is a incoming connection;
    eventEmitter.on('create/update', function(data){
      socket.send(['dropbox', 'clients', 'create/update'], data)
	})

	eventEmitter.on('delete', function(data){
		socket.send(['dropbox', 'clients', 'delete'], data)
	})

})
// Tell the server to listen on port `6785` and then connect to it
// using another NsSocket instance.
tcpServer.listen(6785)



let app = express()

//morgan runs first, then run other app.get, or actions
//depends on declear sequence
if (NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

app.listen(PORT, () => console.log(`LISTENING http://localhost:${PORT}`))

/**
 *  curl -v 'http://localhost:8000/' --get
 */
app.get('*', setFileMeta, sendHeaders, (req, res) => {
    //if directory, we set it to body
    //ToDO: improve so less hacky
    if (req.stat && req.stat.isDirectory) {
        res.json(res.body)
        return
    }

    fs.createReadStream(req.filePath).pipe(res)
})

// curl -v http://localhost:8000/ -X HEAD
app.head('*', setFileMeta, sendHeaders, (req, res) => {
    res.end()
})


app.delete('*', setFileMeta, (req, res, next) => {

	console.log("><req.filePath", req.filePath)
    //only call next if fails
    async() => {
        if (!req.stat) return res.status(400).send('invalid path')
        if (req.stat.isDirectory()) {
            console.log(">< is dir")
            await rimraf.promise(req.filePath)
        } else {
            console.log(">< is not dir")
            await fs.promise.unlink(req.filePath)
        }
        eventEmitter.emit('delete', {
            action: 'delete',
            path: req.filePath.replace(ROOT_DIR, ''),
            type: req.stat.isDirectory()? "dir" : "file"
        })
        return res.end()
    }().catch(next) //only want to call next if it fails, since it is the last
})

//as discussed in forum, we'll use put for both create and update
app.put('*', setFileMeta, (req, res, next) =>{
	// eventEmitter.emit('put', {name: 'niuniu'})
    let filePath = req.filePath
    let isEndWithSlash = req.filePath.charAt(filePath.length-1) === path.sep
    let isFile = path.extname(req.filePath) !== ''
    let isDirectory = isEndWithSlash || !isFile
    let dirPath = isDirectory? req.filePath : path.dirname(filePath)
    async() => {
        await mkdirp.promise(dirPath)
        if (!isDirectory){
            //if file exist, truncate first. meaning replace with new content, do a update.
            if (req.stat) {
                await fs.promise.truncate(req.filePath, 0)
            }
            req.pipe(fs.createWriteStream(filePath))
        }else{
          res.end()
        }
          eventEmitter.emit('create/update', {
            action: req.stat? 'update': 'create',
            path: req.filePath.replace(ROOT_DIR, ''),
            type: isDirectory? "dir" : "file",
            contents: 'hard coded' //TODO
          })
    }().catch(next)
   //error automatic catched
})

/**
 * pull the file info
 * set file path and file stat
 * @param {[type]}   req  [description]
 * @param {[type]}   res  [description]
 * @param {Function} next [description]
 */
function setFileMeta(req, res, next) {
    let filePath = path.resolve(path.join(ROOT_DIR, req.url))
    if (filePath.indexOf(ROOT_DIR) !== 0) {
        return res.status(400).send('invalid path')
    }
    req.filePath = filePath //so you can pass via middle ware to next actions(middleware)
    fs.promise.stat(filePath) //catch errors and do nothing
    .then(
        //success
        stat => req.stat = stat,
        //error
        () => {
            req.stat = null
        }
    )
    //bluebird promises nodeify
    //chain promise to resolve cb.
    //nodeify will pass the results and error to next
    .nodeify(next)
}
/**
 * send headers serves as middleware
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function sendHeaders(req, res, next) {
    //convert promise back to callback
    //since no matter error or succss, always go next
    nodeify(
        //async is not returning bluebird promise, so we cannot direct chain .nodeify
        async() => {
            if (req.stat) {
                //TODO: handle if there is not url
                if (req.stat.isDirectory()) {
                    let files = await fs.promise.readdir(req.filePath) //await always combos with async
                    res.body = JSON.stringify(files)
                    res.setHeader('Content-Length', res.body.length) //res get closed when reach that byte of length
                    res.setHeader('Content-Type', 'application/json')
                    return
                }
                //if stat is file
                else {
                    let contentType = mime.contentType(path.extname(req.filePath))
                    res.setHeader('Content-Length', req.stat.size)
                    res.setHeader('Content-Type', contentType)
                }
            }
        }()
        , next)
}
