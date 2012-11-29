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
  $.getJSON("data/bocoup_github.json").then(function(repos) {
    repoCountMap = repos.repos;
    histogram = repos.histogram;

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