var Q = require("q");
var fs = require("fs-extra");

var bocoupData = require('./data.js');

var reposCountMap = {}, histogram = [];

var getRepoStats = function(repos) {
  
  function processRepo(repo, user) {
    reposCountMap[repo] = reposCountMap[repo] || { count : 0, users : [] }

    if (reposCountMap[repo].users.indexOf(user) === -1) {
      reposCountMap[repo].count += 1
      reposCountMap[repo].users.push(user);
    }
  };

  Object.keys(repos).forEach(function(user) {
    var repolist = repos[user];
    
    // iterate over each member and each owner repo
    repolist.member.forEach(function(repo) {
      processRepo(repo, user)
    });
    
    repolist.owner.forEach(function(repo) {
      processRepo(repo, user);
      reposCountMap[repo].owner = user;
    });

  });

  Object.keys(reposCountMap).forEach(function(repo) {
    repo = reposCountMap[repo];
    histogram[repo.count] = histogram[repo.count] || 0;
    histogram[repo.count] += 1;
  });

  // fill in histogram
  for(var i = 0; i < histogram.length; i++) {
    if (typeof histogram[i] === "undefined") {
      histogram[i] = 0;
    }
  }
};

// get data
bocoupData.getData().then(function(reposMap) {
  getRepoStats(reposMap);

  var output = {
    repos : reposCountMap,
    histogram : histogram
  };
  fs.writeJSONFileSync("data/bocoup_github.json", output);  
}).fail(function(err) {
  console.log(err);
})


