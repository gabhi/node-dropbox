## Dropbox

This is a basic Dropbox clone to sync files across multiple remote folders.

Time spent: `12 hours`

### Features

#### Required

- [-] Client can make GET requests to get file or directory contents
- [-] Client can make HEAD request to get just the GET headers 
- [-] Client can make PUT requests to create new directories and files with content
- [-] Client can make POST requests to update the contents of a file (changed it to using PUT to update per discussion in the forum)
- [-] Client can make DELETE requests to delete files and folders
- [-] Server will serve from `--dir` or cwd as root
- [-] Client will sync from server over TCP to cwd or CLI `dir` argument

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
[![solarized dualmode](https://github.com/vanessachem/node-dropbox/blob/master/assets/crud.gif)](#features)



### Walkthrough

![Video Walkthrough](https://vimeo.com/user39231823/videos)


