/**
 * Node Dropbox
 * @since April, 2015
 * @author  Linghua
 */

//TODO:
// separate middle ware to a lib file

let path = require('path')
let fs = require('fs')
let express = require('express')
    //to convert promise to callbacks
let nodeify = require('bluebird-nodeify')
let mime = require('mime-types')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
let moment = require('moment')
let args = require('yargs').argv
let nssocket = require('nssocket')
    //to process express req body. other wise req is a stream
let bodyParser = require('body-parser')
    //send events from crud server to tcp server
let events = require('events')
let eventEmitter = new events.EventEmitter()

//to allow use of promise
require('songbird')

// const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000

let ROOT_DIR = args.dir ? path.resolve(args.dir) : path.resolve(process.cwd())
console.log(">< ROOT DIR", ROOT_DIR)


// Create an `nssocket` TCP server
let tcpServer = nssocket.createServer(function(socket) {
        // this only works when there is a incoming connection;
        eventEmitter.on('create/update', function(data) {
            socket.send(['dropbox', 'clients', 'create/update'], data)
        })
        eventEmitter.on('delete', function(data) {
            socket.send(['dropbox', 'clients', 'delete'], data)
        })
    })
    // Tell the server to listen on port `6785` and then connect to it
    // using another NsSocket instance.
tcpServer.listen(6785)
console.log('TCP Server LISTENING http://localhost:', '6785')


let app = express()
app.listen(PORT, () => console.log(`CRUD Server LISTENING http://localhost:${PORT}`))

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: true
})) // for parsing application/x-www-form-urlencoded

/**
 *  curl -v 'http://localhost:8000/' --get
 */
app.get('*', setFileMeta, sendHeaders, (req, res) => {
    //res.body is already set from sendHeaders
    if (req.stat && req.stat.isDirectory()) {
        return res.json(res.body)
    }
    console.log(">< req.filePath", req.filePath)
    fs.createReadStream(req.filePath).pipe(res)
})

// curl -v http://localhost:8000/ -X HEAD
app.head('*', setFileMeta, sendHeaders, (req, res) => {
    res.end()
})


app.delete('*', setFileMeta, (req, res, next) => {
    //only call next if fails
    async() => {
        if (!req.stat) return res.status(400).send('invalid path')
        if (req.stat.isDirectory()) {
            await rimraf.promise(req.filePath)
        } else {
            await fs.promise.unlink(req.filePath)
        }
        eventEmitter.emit('delete', {
            action: 'delete',
            path: req.filePath.replace(ROOT_DIR, ''), //emit relative path
            type: req.stat.isDirectory() ? "dir" : "file",
            timestamp: moment().utc()
        })
        return res.end()
    }().catch(next) //only want to call next if it fails, since it is the last
})

//as discussed in forum, we'll use put for both create and update
app.put('*', setFileMeta, (req, res, next) => {
    // eventEmitter.emit('put', {name: 'niuniu'})
    let filePath = req.filePath
    let isEndWithSlash = req.filePath.charAt(filePath.length - 1) === path.sep
    let isFile = path.extname(req.filePath) !== ''
    let isDirectory = isEndWithSlash || !isFile
    let dirPath = isDirectory ? req.filePath : path.dirname(filePath)
         // when execute curl -v "http://localhost:8000/foo5/foo.js" -d 'niuniu'  -X PUT
        // 'niuniu' appears in the key location
        // we need to extract 'niuniu' out
    let content = Object.keys(req.body)[0]
    async() => {
        await mkdirp.promise(dirPath)
        if (!isDirectory) {
            //if file exist, truncate first. meaning replace with new content, do a update.
            if (req.stat) {
                await fs.promise.truncate(req.filePath, 0)
            }
            await fs.promise.writeFile(filePath, content)
            // req.pipe(fs.createWriteStream(filePath))
            // Q: How can we use pipe in this case even for emitter?
            // Q: how can we handle big file here?
        }
        res.end()

        eventEmitter.emit('create/update', {
            action: req.stat ? 'update' : 'create',
            path: req.filePath.replace(ROOT_DIR, ''), //emit relative path
            type: isDirectory ? "dir" : "file",
            contents: isDirectory ? null : content,
            timestamp: moment().utc()
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
                    console.log(">< files", files)
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
        }(), next)
}
