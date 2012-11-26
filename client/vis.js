$(function() {

  var chart = null;
  
  // map:
  // { userName : [their, repos] }
  var repos;

  // map: 
  // { repo : numberOfUsers }
  var repoCountMap = {};

  // histogram:
  // number of repos with that many users. Uses index position as shared
  // counter.
  var histogram = [];

  // my deferreds.
  var dataDeferred = $.Deferred(),
      dataProcessed = dataDeferred.promise();

  // process data
  $.getJSON("data/repos.json").then(function(repos) {
    
    Object.keys(repos).forEach(function(user) {
      var repolist = repos[user];
      repolist.forEach(function(repo) {
        repoCountMap[repo] = repoCountMap[repo] || { count : 0, users : [] }
        repoCountMap[repo].count += 1
        repoCountMap[repo].users.push(user);
      });
    });

    // build up histogram
    Object.keys(repoCountMap).forEach(function(repo) {
      repo = repoCountMap[repo];
      histogram[repo.count] = histogram[repo.count] || 0;
      histogram[repo.count] += 1;
    });

    // fill in histogram
    for(var i = 0; i < histogram.length; i++) {
      if (typeof histogram[i] === "undefined") {
        histogram[i] = 0;
      }
    }

    dataDeferred.resolve();

  }).fail(function(err) {

    dataDeferred.reject(err);

  });

  dataProcessed.then(function() {
    chart = new BubbleChart({
      data : repoCountMap,
      el : '#container'
    });

    chart.start();
    chart.display();
  });

}(this));