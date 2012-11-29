/*! groupvis - v0.0.1 - 2012-11-29
* Copyright (c) 2012 ; Licensed MIT */

(function(global, d3) {

  var Tooltip = global.Tooltip = function(text) {
    this.t = d3.select("body")
      .append("div")
      .classed("bp-tooltip", true)
      .html(text);
  };

  Tooltip.prototype.show = function(event) {  
    this.t.style("visibility", "visible");
    this.update(event);
  };

  Tooltip.prototype.hide = function(event) {  
    this.t.style("visibility", "hidden");
  };

  Tooltip.prototype.remove = function(event) {  
    this.t.remove();
  };

  Tooltip.prototype.update = function(event) {
    this.t
      .style("top", (event.pageY-10)+"px")
      .style("left", (event.pageX+10)+"px");
  };

}(this, this.d3));
(function(global, _, d3) {

  var Tooltip = global.Tooltip;

  var BubbleChart = global.BubbleChart = function(options) {
    options = options || {};

    this.el = options.el;
    this.data = options.data;
    this.users = options.users;
    this.width = options.width || 950;
    this.height = options.height || 440;
    this.color_mode = "collaboratorCount";
    this.max_collaborators = 0;

    this.template = options.template || null;

    // define centers
    // global center
    this.center = {
      x : this.width / 2,
      y : this.height / 2
    };

    // owner vs member
    this.owner_centers = {
      owned : {
        x : this.width / 3,
        y : this.height / 2
      },
      forked : {
        x : (this.width / 3) * 2,
        y : this.height / 2
      }
    };
    
    // per user
    if (this.users) {
      var i;
      this.user_centers = {};
      if (this.users.length < 5) {
        // one row
        for (i = 0; i < this.users.length; i++) {
          this.user_centers[this.users[i]] = {
            x : (this.width / this.users.length) * (i + 1),
            y : this.height / 2
          };
        }
      } else {
        // two rows, get top row
        for (i = 0; i < Math.ceil(this.users.length / 2); i++) {
          this.user_centers[this.users[i]] = {
            x : (this.width / Math.ceil(this.users.length / 2)) * (i + 1),
            y : this.height / 3
          }; 
        }
        // get bottom row
        var counter = 1;
        for (i = Math.ceil(this.users.length / 2); i < this.users.length; i++) {
          this.user_centers[this.users[i]] = {
            x : (this.width / Math.floor(this.users.length / 2)) * counter,
            y : (this.height / 3) * 2
          }; 
          counter++;
        }
      }
    }


    this.layout_gravity = -0.01;
    this.damper = 0.1;

    this.vis = null;
    this.nodes = [];
    this.force = null;
    this.circles = null;

    // for now, count repo by user
    this.fill_color = this.getColors();
    this.fill_color_multi_user = "#ddd"; // for more than one collab.

    // find the max amount (the largest number of collaborators)
    this.max_collaborators = _.max(_.map(
      _.pluck(this.data, "users"), function(a) { return a.length; }
    ));

    this.radius_scale = d3.scale.pow()
      .exponent(0.5)
      .domain([0, this.max_collaborators])
      .range([0, 18]); // TODO: play with max radius here...

    this.createNodes();
    this.createVis();
  };

  BubbleChart.prototype.createNodes = function() {

    _.each(this.data, function(repoInfo, repo) {

      var node = {
        id : repo,
        name : repo,
        value: repoInfo.users.length,
        owner : repoInfo.owner || null,
        collaborators : repoInfo.users,

        // assign radius based on radius scale
        radius : this.radius_scale(repoInfo.users.length),

        // place randomly in space
        x : Math.random() * this.width,
        y : Math.random() * this.height
      };

      if (repoInfo.users.length > this.max_collaborators) {
        this.max_collaborators = repoInfo.users.length;
      }

      // bin into groups based on collaborator count
      if (repoInfo.count === 1) {
        node.group = "one";
      } else if (repoInfo.count === 2) {
        node.group = "two";
      } else {
        node.group = "many";
      }

      this.nodes.push(node);

    }, this);

    this.nodes = _.sortBy(this.nodes, function(a, b) {
      return b.value - a.value;
    });
  };

  BubbleChart.prototype.createVis = function() {
    var self = this;

    this.vis = d3.select(this.el)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("id", "svg_vis");

    this.circles = this.vis.selectAll("circle")
      .data(this.nodes, function(d) {
        return d.id;
      });

    var d_fill = function(d) {
        
      // we are coloring by collaborator.
      if (self.color_mode === "collaboratorCount") {

        return self.fill_color(d.group);

      // we are coloring by user
      } else if (self.color_mode === "user") {
        if (d.count > 1) {
          // if more than one user, just color whatever multi user color we have.
          return self.fill_color_multi_user;
        } else {
          // color by user (always first in collabortor array)
          return self.fill_color(d.collaborators[0]);
        }
      }
      // any other colors? deal wih here.
    };

    this.circles.enter()
      .append("circle")
      .classed("bp-circle", true)
      .attr("r", 0)
      .attr("fill", d_fill)
      .attr("stroke-width", 2)
      .attr("stroke", function(d) {
        return d3.rgb(d_fill(d)).darker();
      })
      .attr('id', function(d) {
        return "bubble_" + d.id;
      })
      .on("mouseover", function(d) { 
        this.tooltip = new Tooltip(
          // compile a template if we have one, otherwise, user name.
          self.template ? self.template({ repo : d }) : d.name
        );
        this.tooltip.show(event);
        // if we have an owner, indicate it's clickable
        if (d.owner !== null) {
          d3.select(this).transition()
            .attr("stroke-width", 5);
        }
      })
      .on("mouseout", function() {
        this.tooltip.hide(event);
        this.tooltip.remove(event);
        d3.select(this).transition().attr("stroke-width", 2);
      })
      .on("mousemove", function() {
        this.tooltip.update(event);
      })
      .on("click", function(d) {
        if (d.owner !== null) {
          window.open("http://github.com/" + d.owner + "/" + d.name);  
        }
        
      });

    this.circles.transition()
      .duration(3000)
      .attr("r", function(d) {
        return d.radius;
      });
  };

  BubbleChart.prototype.charge = function(d) {
    return -Math.pow(d.radius, 2.0) / 6;
  };

  BubbleChart.prototype.start = function() {
    this.force = d3.layout.force()
      .nodes(this.nodes)
      .size([this.width, this.height]);
  };

  BubbleChart.prototype.display = function(move_function) {
    var self = this;
    this.force.gravity(this.layout_gravity)
      .charge(this.charge)
      //.friction(0.9)
      .on("tick", function(e) {
        self.circles.each(self[move_function].apply(self, [e.alpha]))
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
      });

    this.force.start();
    // todo, if viewing per user, hide years.
  };

  BubbleChart.prototype.moveTowardsCenter = function(alpha) {
    var self = this;
    return function(d) {
      d.x = d.x + (self.center.x - d.x) * (self.damper + 0.02) * alpha;
      d.y = d.y + (self.center.y - d.y) * (self.damper + 0.02) * alpha;
    };
  };

  BubbleChart.prototype.moveTowardsOwnerCenters = function(alpha) {
    var self = this;
    return function(d) {
      var center;
      if (d.owner !== null) {
        center = self.owner_centers.owned;
      } else {
        center = self.owner_centers.forked;
      }
      d.x = d.x + (center.x - d.x) * (self.damper + 0.02) * alpha;
      d.y = d.y + (center.y - d.y) * (self.damper + 0.02) * alpha;

    };
  };

  BubbleChart.prototype.moveTowardsUsers = function(alpha) {
    var self = this;
    return function(d) {
      // if we have an owner, move it into place. Otherwise, move it out of view.
      var center;
      if (d.owner !== null) {
        center = self.user_centers[d.owner];
      } else {
        // out of view
        center = {
          x : d.x,
          y : d.y > (self.height/2) ? self.height + 100 : - 100
        };
      }

      d.x = d.x + (center.x - d.x) * (self.damper + 0.02) * alpha;
      d.y = d.y + (center.y - d.y) * (self.damper + 0.02) * alpha;
    };
  };

  // assign each user a color
  BubbleChart.prototype.getColors = function() {
    
    if (this.color_mode === "user") {
    
      return d3.scale.category20()
        .domain(Object.keys(this.users));
    
    } else if (this.color_mode === "size") {

      // change this to custom colors by size
      return d3.scale.category20b()
        .domain(this.histogram);
    } else if (this.color_mode === "collaboratorCount") {
      
      // by number of collaborators
      // one, two or many.
      return d3.scale.ordinal()
        .domain(["one", "two", "many"])
        .range(["#EDD155", "#7aa25c", "#B86CAF"]);
    }
  };

}(this, this._, this.d3));
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