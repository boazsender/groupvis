(function(global) {

  var BubbleChart = global.BubbleChart = function(options) {
    options = options || {};

    this.el = options.el;
    this.data = options.data;
    this.width = options.width || 950;
    this.height = options.height || 440;
    this.color_mode = "collaboratorCount";
    this.max_collaborators = 0;

    this.colorMode
    this.center = {
      x : this.width / 2,
      y : this.height / 2
    };

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
      .range([0, 25]); // TODO: play with max radius here...

    this.createNodes();
    this.createVis();
  };

  BubbleChart.prototype.createNodes = function() {

    _.each(this.data, function(repoInfo, repo) {

      var node = {
        id : repo,
        radius : this.radius_scale(repoInfo.users.length),
        value: repoInfo.users.length,
        name : repo,
        x : Math.random() * this.width,
        y : Math.random() * this.height,
        collaborators : repoInfo.users
      };

      if (repoInfo.users.length > this.max_collaborators) {
        this.max_collaborators = repoInfo.users.length;
      }

      if (repoInfo.count === 1) {
        node.group = "one";
      } else if (repoInfo.count === 2) {
        node.group = "two";
      } else {
        node.group = "many";
      };

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
      .attr("r", 0)
      .attr("fill", d_fill)
      .attr("stroke-width", 2)
      .attr("stroke", function(d) {
        return d3.rgb(d_fill(d)).darker();
      })
      .attr('id', function(d) {
        return "bubble_" + d.id;
      });
      // todo attach mouse overs!

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

  BubbleChart.prototype.display = function() {
    var self = this;
    this.force.gravity(this.layout_gravity)
      .charge(this.charge)
      //.friction(0.9)
      .on("tick", function(e) {
        self.circles.each(self.moveTowardsCenter(e.alpha))
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; })
      });

    this.force.start();
    // todo, if viewing per user, hide years.
  };

  BubbleChart.prototype.moveTowardsCenter = function(alpha) {
    var self = this;
    return function(d) {
      d.x = d.x + (self.center.x - d.x) * (self.damper + 0.02) * alpha
      d.y = d.y + (self.center.y - d.y) * (self.damper + 0.02) * alpha
    };
  };

  // assign each user a color
  BubbleChart.prototype.getColors = function() {
    
    if (this.color_mode === "user") {
    
      return d3.scale.category20()
        .domain(Object.keys(repos));
    
    } else if (this.color_mode === "size") {

      // change this to custom colors by size
      return d3.scale.category20b()
        .domain(histogram);
    } else if (this.color_mode === "collaboratorCount") {
      
      // by number of collaborators
      // one, two or many.
      return d3.scale.ordinal()
        .domain(["one", "two", "many"])
        .range(["#EDD155", "#7aa25c", "#B86CAF"]);
    }
  };

}(this));