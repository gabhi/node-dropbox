## Dropbox

This is a basic Dropbox clone to sync files across multiple remote folders.

Time spent: `12 hours`

### Features

#### Required

- [x] Client can make GET requests to get file or directory contents
- [x] Client can make HEAD request to get just the GET headers 
- [x] Client can make PUT requests to create new directories and files with content
- [x] Client can make POST requests to update the contents of a file (changed it to using PUT to update per discussion in the forum)
- [x] Client can make DELETE requests to delete files and folders
- [x] Server will serve from `--dir` or cwd as root
- [x] Client will sync from server over TCP to cwd or CLI `dir` argument

### Optional

- [ ] Client and User will be redirected from HTTP to HTTPS
- [ ] Server will sync from client over TCP
- [ ] Client will preserve a 'Conflict' file when pushed changes preceeding local edits
- [ ] Client can stream and scrub video files (e.g., on iOS)
- [ ] Client can download a directory as an archive
- [ ] Client can create a directory with an archive
- [ ] User can connect to the server using an FTP client


### GIF:
## Implemented CRUD for 
Create/Update a new file/folder  using PUT
```shellscript
curl -v "http://localhost:8000/foo" -X PUT
curl -v "http://localhost:8000/foo2/bar2" -X PUT

#create a file with content "niuniu"
curl -v "http://localhost:8000/foo/bar.js" -d "niuniu" -X PUT 

#update a file with content "niuniu2"
curl -v "http://localhost:8000/foo/bar.js" -d "niuniu2" -X PUT
```

GET info from file/folder
```shellscript
 curl -v "http://localhost:8000/" -X GET
 curl -v "http://localhost:8000/foo/bar.js" -X GET
 curl -v "http://localhost:8000/foo/bar.js" --head
```

DELETE file/folder(recursively)
```shellscript
curl -v "http://localhost:8000/foo/bar.js" -X DELETE
curl -v "http://localhost:8000/foo/" -X DELETE
```
#### gif reference

[![solarized dualmode](https://github.com/vanessachem/node-dropbox/blob/master/assets/crud.gif)](#features)


## Implemented client-server tcp connection

There is another TCP server using nssocket that starts with the CRUD server.  The purpose of the TCP server is to sync up with the client server.

1. Every CRUD action on the CRUD server emit a event(create/update or delete)
2. that event get listened by the TCP server
3. When the TCP server catch the event, it pushes the event to the TCP client.(client.js)
4. When TCP client receives the event, it executes file system operations for CRUD on it's local copy of system
5. In my demo. the remote server uses /tmp/server folder. the tcp client uses /tmp/client folder. 

#### gif reference
[![solarized dualmode](https://github.com/vanessachem/node-dropbox/blob/master/assets/tcp.gif)](#features)





### Walkthrough
![Video Walkthrough](https://vimeo.com/user39231823/videos)


