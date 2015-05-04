let fs = require('fs')
let path = require('path')
let nssocket = require('nssocket')
let mkdirp = require('mkdirp')
let rimraf = require('rimraf')


let outbound = new nssocket.NsSocket()
let ROOT_DIR = '/tmp/client/'


require('songbird')

//TODO: create one reusable routine for file system operation
outbound.data(['dropbox', 'clients', 'create/update'], function(data) {
	console.log('>< data create', data)
	let dirPath = data.type === 'dir'? data.path : path.dirname(data.path)
	dirPath = path.resolve(path.join(ROOT_DIR, dirPath))
	let filename = path.resolve(path.join(ROOT_DIR, data.path))
	async ()=>{
		await mkdirp.promise(dirPath)
		if (data.type === 'dir'){
			return
		}
		console.log(">< not dir")
		if (data.action === 'update') {
           await fs.promise.truncate(filename, 0)
        }
        console.log(">< filename", filename)
        console.log(">< write file", data.contents)
		await fs.promise.writeFile(filename, data.contents)
    }()
})

outbound.data(['dropbox', 'clients', 'delete'], function(data) {
	let dirPath = data.type === 'dir'? data.path : path.dirname(data.path)
	dirPath = path.resolve(path.join(ROOT_DIR, dirPath))
	let filename = path.resolve(path.join(ROOT_DIR, data.path))
    async ()=>{
		if (data.type === 'dir'){
			await rimraf.promise(dirPath)
			return
		}
		await fs.promise.unlink(filename)
	}()
})

outbound.connect(6785)