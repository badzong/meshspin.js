function MeshSpin(fig, scale) {
  this.fig = fig;
  this.scaleFactor = scale;
  this.fps = 60;
  this.viewBox = [-100, -100, 200, 200];
  this.fake3D = false;
  this.debug = false;
  this.edgeSeperator = ',';
  this.background = false;
  this.fillColor = null;

  this.staticRotation = {
    x: 0.01,
    y: 0.01,
    z: 0.01,
  };

  this.scale = function() {
    this.fig.nodes = this.fig.nodes.map(n => (
      {x: n.x*this.scaleFactor,y: n.y * this.scaleFactor, z: n.z * this.scaleFactor}
    ));
  };

  this.rotate = r => this.fig.nodes.map(n => ({
      // X-Axis
      x: n.x * Math.cos(r.x) - n.z * Math.sin(r.x),
      y: n.y,
      z: n.z * Math.cos(r.x) + n.x * Math.sin(r.x),
    })).map(n => ({
      // Y-Axis
      x: n.x,
      y: n.y * Math.cos(r.y) - n.z * Math.sin(r.y),
      z: n.z * Math.cos(r.y) + n.y * Math.sin(r.y),
    })).map(n => ({
      // Z-Axis
      x: n.x * Math.cos(r.z) - n.y * Math.sin(r.z),
      y: n.y * Math.cos(r.z) + n.x * Math.sin(r.z),
      z: n.z,
    }));

  this.sortEdges = function(edges) {
    for(i = 0; i < edges.length; ++i) {
      edges[i].sort();
    }
    var strEdges = edges
      .map(n => n.join(this.edgeSeperator))
      .filter((v, i, a) => a.indexOf(v) === i);

    strEdges.sort()
    return strEdges;
  }
  
  this.setup = function(parentId) {
    this.fig.edges = this.sortEdges(this.fig.edges);

    // Setup SVG
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute('viewBox', this.viewBox.join(' '));
    this.ns = this.svg.namespaceURI;

    var parentElement = document.getElementById(parentId);
    parentElement.appendChild(this.svg);

    this.scale();

    document.addEventListener('mousemove', this.mouseUpdate(), false);
    document.addEventListener('mouseenter', this.mouseUpdate(), false);
  };

  this.nextOutlineNode = function(current, prev) {
    function vecSub(v1, v2) {
      return { x: v1.x - v2.x, y: v1.y - v2.y };
    }
    function alpha(v1, v2) {
      return Math.acos((v1.x*v2.x + v1.y*v2.y) / (Math.sqrt(v1.x*v1.x+v1.y*v1.y) * Math.sqrt(v2.x*v2.x+v2.y*v2.y)));
    }

    if (prev === null) {
      prevNode = { x: this.fig.nodes[current].x - 1, y: this.fig.nodes[current].y };
    } else {
      prevNode = this.fig.nodes[prev];
    }

    prevVector = vecSub(this.fig.nodes[current], prevNode);
    var angles = this.fig.nodes
      .map(n => vecSub(n, this.fig.nodes[current]))
      .map(n => alpha(prevVector, n))
      .map((n, i) => i == current || i == prev || isNaN(n)? 7: n); // 7 > 2PI

    return angles.indexOf(Math.min.apply(Math, angles));
  }

  this.outlineEdges = function() {
    var nodes = [];
    var outline = [];

    // Get node with max value of x
    var x = this.fig.nodes.map(n => n.x);
    var start = x.indexOf(Math.max.apply(Math, x));

    var last = null;
    var current = start;
    do {
      next = this.nextOutlineNode(current, last)
      nodes.push(current);
      outline.push([current, next]);
      last = current;
      current = next;
    } while (current != start);

    outline = this.sortEdges(outline);

    if (this.background)
    {
		this.backgroundPoly = nodes.map(x => this.fig.nodes[x].x.toString() + ',' + this.fig.nodes[x].y.toString())
    }

    return [nodes, outline];
  }

  this.fake3Dedges = function() {
    var outline = this.outlineEdges();
    outlineNodes = outline[0];

    var edges = outline[1].concat(this.fig.edges
      .map(x => x.split(this.edgeSeperator).map(y => parseInt(y)))
      .filter(x =>
          (this.fig.nodes[x[0]].z >= 0 && this.fig.nodes[x[1]].z >= 0) ||
          (this.fig.nodes[x[0]].z >= this.fig.nodes[x[1]].z && outlineNodes.indexOf(x[1]) >= 0 && outlineNodes.indexOf(x[0]) == -1) ||
          (this.fig.nodes[x[1]].z >= this.fig.nodes[x[0]].z && outlineNodes.indexOf(x[0]) >= 0 && outlineNodes.indexOf(x[1]) == -1)
      )
      .map(x => x.join(this.edgeSeperator)))
      .filter((v, i, a) => a.indexOf(v) === i);

    edges.sort();

    return edges;
  }

  this.draw = function() {
    // Remove all elements
    while (this.svg.lastChild) {
      this.svg.removeChild(this.svg.lastChild);
    }

    var r = this.getRotationOffset();
    this.fig.nodes = this.rotate(r);

    var edges = this.fake3D? this.fake3Dedges(): this.fig.edges;

    if (this.background) {
      var poly = document.createElementNS(this.ns,'polygon');
      poly.setAttribute('points', this.backgroundPoly.join(' '));
      poly.setAttribute('class', 'meshspin-background');
      if (this.fillColor) {
        poly.setAttribute('fill', this.fillColor);
      }
      this.svg.appendChild(poly);
    }

    for (n = 0; n < edges.length; n++) {
      var edge = edges[n].split(this.edgeSeperator);
      var line = document.createElementNS(this.ns,'line');
      line.setAttribute('x1', this.fig.nodes[edge[0]].x);
      line.setAttribute('y1', this.fig.nodes[edge[0]].y);
      line.setAttribute('x2', this.fig.nodes[edge[1]].x);
      line.setAttribute('y2', this.fig.nodes[edge[1]].y);
      line.setAttribute('stroke', this.color());
      line.setAttribute('class', 'meshspin-line');
      this.svg.appendChild(line);
    }

    if (this.debug) {
      this.drawDebugNodes();
    }
  };

  this.drawDebugNodes = function() {
    for (n = 0; n < this.fig.nodes.length; n++) {
      var text = document.createElementNS(this.ns,'text');
      text.setAttribute('x', this.fig.nodes[n].x);
      text.setAttribute('y', this.fig.nodes[n].y);
      text.appendChild(document.createTextNode(n));
      this.svg.appendChild(text);

      var circle = document.createElementNS(this.ns,'circle');
      circle.setAttribute('cx', this.fig.nodes[n].x);
      circle.setAttribute('cy', this.fig.nodes[n].y);
      circle.setAttribute('r', '3px');
      circle.setAttribute('stroke', 'transparent');
      circle.setAttribute('fill', this.fig.nodes[n].z < 0? '#666': 'black');
      this.svg.appendChild(circle);
    }
  };

  this.animationFrameCallback = function() {
    var ref = this;
    return function animate(now) {
      requestAnimationFrame(animate);

      if (!ref.lastFrame) {
        ref.lastFrame = now;
      }

      if ((now - ref.lastFrame) < 1000 / ref.fps) {
        return;
      }

      if (!ref.currentFrame) {
        ref.currentFrame = 0;
      }
      ++ref.currentFrame;

      ref.lastFrame = now;
      ref.draw();
    }
  };

  this.run = function() {
    requestAnimationFrame(this.animationFrameCallback());
  };

  this.getRotationOffset = function() {
    return this.staticRotation;
  };

  this.rotateByMouse = function() {
    var deltaFactor = 0.01;
    return {
      x: this.Mouse.delta.x * deltaFactor,
      y: this.Mouse.delta.y * deltaFactor,
      z: 0,
    }
  }

  this.colorStatic = function(color) {
    return function() {
      return color;
    }
  }

  this.color = this.colorStatic('currentColor');

  this.Mouse = {
    x: 0,
    y: 0,
    delta: { x: 0, y: 0, },
  };
  this.mouseInterval = null;
  this.mouseUpdate = function() {
    var ref = this;
    return function(e) {
      var clearDeltaTimeout = 100;
      var delta = {
        x: ref.Mouse.x - e.pageX,
        y: ref.Mouse.y - e.pageY,
      }
      ref.Mouse = {
        x: e.pageX,
        y: e.pageY,
        delta: delta,
      }

      if (ref.mouseInterval) {
        clearInterval(ref.mouseInterval);
        ref.mouseInterval = false;
      }

      ref.mouseInterval = setInterval(function() {
        ref.Mouse.delta = { x: 0, y: 0, }
      }, clearDeltaTimeout);
    }
  }
}
