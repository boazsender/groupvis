(function(global) {

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

}(this));