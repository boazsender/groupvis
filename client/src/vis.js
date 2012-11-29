(function() {

  var chart = null;
  var BubbleChart = this.BubbleChart;
  var _ = this._;
  var $ = this.$;

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

  // collaborators
  var users;

  // my deferreds.
  var dataDeferred = $.Deferred(),
      dataProcessed = dataDeferred.promise();

  // process data
  $.getJSON("data/bocoup_github.json").then(function(repos) {
    repoCountMap = repos.repos;
    histogram = repos.histogram;
    users = repos.users;

    dataDeferred.resolve();
  }).fail(function(err) {
    dataDeferred.reject(err);
  });

  dataProcessed.then(function() {
    chart = new BubbleChart({
      data : repoCountMap,
      el : '#bp_bubblechart',
      users: users,
      template : _.template("<div class='bp-tooltip-name'><%= repo.name %></div>" +
        "<% if (repo.owner) { %>" +
        "  <div class='bp-tooltip-owner'>by <%= repo.owner %> </div>" +
        "<% } %>" +
        "<% if (repo.collaborators) { %>" +
        "<div>Contributors:</div>" +
        "<div class='bp-tooltip-contributors'><%= repo.collaborators.join(', ') %></div>" +
        "<% } %>")
    });

    chart.start();
    chart.display('moveTowardsCenter'); // start at center.


    $('#bp_controls div').click(function(e) {
      var button = e.target;
      chart.display(button.id);
    });
    
  });

}(this));