## Dropbox [(raw)](https://gist.github.com/CrabDude/040af9c1b93e350608ff/raw)

This is a basic Dropbox clone to sync files across multiple remote folders.

Time spent: `10 hours`

### Features

#### Required

- [ DONE] Client can make GET requests to get file or directory contents
- [ DONE] Client can make HEAD request to get just the GET headers 
- [ DONE] Client can make PUT requests to create new directories and files with content
- [ DONE] Client can make POST requests to update the contents of a file // I'm changing it to using PUT to update per discussion in the forum
- [ DONE] Client can make DELETE requests to delete files and folders
- [ DONE] Server will serve from `--dir` or cwd as root
- [ DONE] Client will sync from server over TCP to cwd or CLI `dir` argument

### Optional

- [ ] Client and User will be redirected from HTTP to HTTPS
- [ ] Server will sync from client over TCP
- [ ] Client will preserve a 'Conflict' file when pushed changes preceeding local edits
- [ ] Client can stream and scrub video files (e.g., on iOS)
- [ ] Client can download a directory as an archive
- [ ] Client can create a directory with an archive
- [ ] User can connect to the server using an FTP client


### Walkthrough

![Video Walkthrough](https://vimeo.com/user39231823/videos)


