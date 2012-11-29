var GitHubApi = require("github");
var Q = require("q");
var fs = require('fs-extra');

var github = new GitHubApi({
    version: "3.0.0"
});

// get credentials from config.json. Should have:
// { github : { username : "username", password: "password" } }
// var config = fs.readJSONFileSync("config.json");

// github.authenticate({
//     type: "basic",
//     username : config.github.username,
//     password: config.github.password
// });

// -- get bocoup users
var getBocoupUsers = function() {
  var deferred = Q.defer();
  var users = [];

  github.orgs.getPublicMembers({ org : "Bocoup"}, function(err, res) {
    res.forEach(function(user) {
      users.push(user.login);
    });
    deferred.resolve(users);
  });
  return deferred.promise;
};

// get user repos
var getUserRepos = function(user) {
  var all = Q.defer(),
      member_d = Q.defer(),
      owner_d = Q.defer(),
      repos = { member : [], owner : [] };

  console.log("Fetching repos for " + user);
      
  // get member repos
  github.repos.getFromUser({
    user : user,
    type : "member",
    per_page: 100
  }, function(err, res) {
    if (err) {
      member_d.reject(err);
    } else {
      res.forEach(function(repo) {
        repos.member.push(repo.name);
      });
      member_d.resolve(repos);
    }
  });

  // get owner repos
  github.repos.getFromUser({
    user : user,
    type : "owner",
    per_page: 100
  }, function(err, res) {
    if (err) {
      owner_d.reject(err);
    } else {
      res.forEach(function(repo) {
        if (repo.fork) {
          repos.member.push(repo.name);
        } else {
          repos.owner.push(repo.name);
        }
        
      });
      owner_d.resolve(repos);
    }
  });

  var deferred = Q.defer();
  Q.all([member_d.promise, owner_d.promise]).then(function() {
    deferred.resolve(repos);
  });

  return deferred.promise;
};

// get repos for an array of users
var getAllUserRepos = function(users) {

  var queue = [], deferred = Q.defer(), repos = {};

  users.forEach(function(user) {
    repoPromise = getUserRepos(user);
    queue.push(repoPromise);

    repoPromise.then(function(userRepos) {
      repos[user] = userRepos;
    });

  });

  Q.all(queue).then(function() {
    deferred.resolve(repos);
  });

  return deferred.promise;
};

exports.getData = function() {
  
  var deferred = Q.defer();

  // all the things.
  getBocoupUsers().then(function(users) {
    getAllUserRepos(users).then(function(repos) {
      deferred.resolve(repos);
    }).fail(function(err) {
      deferred.reject(err);
    });
  }).fail(function(err) {
    deferred.reject(err);
  });

  return deferred.promise;

};


