var Q = require("q");
var fs = require("fs-extra");

var reposMap, reposCountMap = {}, histogram = [];

var readReposMap = function(fileName) {
  reposMap = fs.readJSONFileSync(fileName);
};

var getRepoStats = function(repos) {
  Object.keys(repos).forEach(function(user) {
    var repolist = repos[user];
    repolist.forEach(function(repo) {
      reposCountMap[repo] = reposCountMap[repo] || { count : 0, users : [] }
      reposCountMap[repo].count += 1
      reposCountMap[repo].users.push(user);
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

  console.log("Total repos " + Object.keys(reposCountMap).length);
};

var buildD3Graph = function(repos) {
  var graph = {
    nodes : [],
    links : []
  };

  Object.keys(repos).forEach(function(repo) {
    repoObj = repos[repo];

    graph.nodes.push({
      name : repo,
      group : repoObj.count
    });
  });

  return graph;
};

var buildCSV = function(repos) {
  var csv = "name,collaborators\n";

  Object.keys(repos).forEach(function(repo) {
    repoObj = repos[repo];
    csv += repo + "," + repoObj.count + "\n";
  });  

  var fs = require('fs');
  fs.writeFile("repos.csv", csv, function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }
  });

  return csv;
};

readReposMap("repos.json");
getRepoStats(reposMap);
console.log(buildCSV(reposCountMap));
