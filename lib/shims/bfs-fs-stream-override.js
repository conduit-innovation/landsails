var bfs = BrowserFS.BFSRequire('fs');

// The following allows us to bypass errors in fs-extra, because streams aren't yet implemented by BFS.

bfs.ReadStream = function(){};
bfs.WriteStream = function(){};

module.exports = bfs;
