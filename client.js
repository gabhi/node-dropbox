let fs = require('fs')
let path = require('path')
let nssocket = require('nssocket')
let mkdirp = require('mkdirp')
let rimraf = require('rimraf')

let outbound = new nssocket.NsSocket()
let ROOT_DIR = '/tmp/client/'


require('songbird')

//TODO: create one reusable routine for file system operation
outbound.data(['dropbox', 'clients', 'create/update'], (data) => {
    console.log('>< data create', data)
    let dirPath = data.type === 'dir' ? data.path : path.dirname(data.path)
    dirPath = path.resolve(path.join(ROOT_DIR, dirPath))
    let filename = path.resolve(path.join(ROOT_DIR, data.path))
    async() => {
        await mkdirp.promise(dirPath)
        if (data.type === 'dir') {
            return
        }
        let hasFile = false
        await fs.promise.stat(filename) //catch errors and do nothing
        .then(
            //success
            () => hasFile = true,
            //error
            () => hasFile = false
        )
        if (hasFile) {
            await fs.promise.truncate(filename, 0)
        }
        await fs.promise.writeFile(filename, data.contents)
    }().catch(e => console.log(e))
})

// curl -v "http://localhost:8000/foo2/foo2.js" -X DELETE
outbound.data(['dropbox', 'clients', 'delete'], (data) => {
    let dirPath = data.type === 'dir' ? data.path : path.dirname(data.path)
    dirPath = path.resolve(path.join(ROOT_DIR, dirPath))
    let filename = path.resolve(path.join(ROOT_DIR, data.path))
    async() => {
        if (data.type === 'dir') {
            await rimraf.promise(dirPath)
            return
        }
        await fs.promise.unlink(filename)
    }()
})

outbound.connect(6785)
