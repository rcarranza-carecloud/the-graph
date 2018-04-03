// Component library functionality
function mergeComponentDefinition(component, definition) {
  // In cases where a component / subgraph ports change,
  // we don't want the connections hanging in middle of node
  // TODO visually indicate that port is a ghost
  if (component === definition) {
    return definition;
  }
  var _i, _j, _len, _len1, exists;
  var cInports = component.inports;
  var dInports = definition.inports;

  if (cInports !== dInports) {
    for (_i = 0, _len = cInports.length; _i < _len; _i++) {
      var cInport = cInports[_i];
      exists = false;
      for (_j = 0, _len1 = dInports.length; _j < _len1; _j++) {
        var dInport = dInports[_j];
        if (cInport.name === dInport.name) {
          exists = true;
        }
      }
      if (!exists) {
        dInports.push(cInport);
      }
    }
  }

  var cOutports = component.outports;
  var dOutports = definition.outports;

  if (cOutports !== dOutports) {
    for (_i = 0, _len = cOutports.length; _i < _len; _i++) {
      var cOutport = cOutports[_i];
      exists = false;
      for (_j = 0, _len1 = dOutports.length; _j < _len1; _j++) {
        var dOutport = dOutports[_j];
        if (cOutport.name === dOutport.name) {
          exists = true;
        }
      }
      if (!exists) {
        dOutports.push(cOutport);
      }
    }
  }

  if (definition.icon !== 'cog') {
    // Use the latest icon given
    component.icon = definition.icon;
  } else {
    // we should use the icon from the library
    definition.icon = component.icon;
  }
  // a component could also define a svg icon
  definition.iconsvg = component.iconsvg;

  return definition;
}

function componentsFromGraph(fbpGraph) {
  var components = [];

  fbpGraph.nodes.forEach(function (node) {
    var component = {
      name: node.component,
      icon: 'cog',
      description: '',
      inports: [],
      outports: []
    };

    Object.keys(fbpGraph.inports).forEach(function (pub) {
      var exported = fbpGraph.inports[pub];
      if (exported.process === node.id) {
        for (var i = 0; i < component.inports.length; i++) {
          if (component.inports[i].name === exported.port) {
            return;
          }
        }
        component.inports.push({
          name: exported.port,
          type: 'all'
        });
      }
    });
    Object.keys(fbpGraph.outports).forEach(function (pub) {
      var exported = fbpGraph.outports[pub];
      if (exported.process === node.id) {
        for (var i = 0; i < component.outports.length; i++) {
          if (component.outports[i].name === exported.port) {
            return;
          }
        }
        component.outports.push({
          name: exported.port,
          type: 'all'
        });
      }
    });
    fbpGraph.initializers.forEach(function (iip) {
      if (iip.to.node === node.id) {
        for (var i = 0; i < component.inports.length; i++) {
          if (component.inports[i].name === iip.to.port) {
            return;
          }
        }
        component.inports.push({
          name: iip.to.port,
          type: 'all'
        });
      }
    });

    fbpGraph.edges.forEach(function (edge) {
      var i;
      if (edge.from.node === node.id) {
        for (i = 0; i < component.outports.length; i++) {
          if (component.outports[i].name === edge.from.port) {
            return;
          }
        }
        component.outports.push({
          name: edge.from.port,
          type: 'all'
        });
      }
      if (edge.to.node === node.id) {
        for (i = 0; i < component.inports.length; i++) {
          if (component.inports[i].name === edge.to.port) {
            return;
          }
        }
        component.inports.push({
          name: edge.to.port,
          type: 'all'
        });
      }
    });
    components.push(component);
  });
  return components;
}

function libraryFromGraph(fbpGraph) {
    var library = {};
    var components = componentsFromGraph(fbpGraph);
    components.forEach(function(c) {
        library[c.name] = c;
    });
    return library;
}

/**
 * Returns offsets for mouse position.
 *
 * This function need to calculate correct offset in case the-graph
 * used as positioned in not (0, 0) coordinates.
 *
 * @param initialElement - event target.
 * @param upperElement - upper the-graph element (see usages for example).
 * @returns {{top: number, left: number}}
 */
function getOffsetUpToElement(initialElement, upperElement) {
  var offset = {top: 0, left: 0};
  var offsetParent = initialElement;

  while (offsetParent != null && offsetParent != upperElement) {
    offset.left += offsetParent.offsetLeft || 0;
    offset.top  += offsetParent.offsetTop || 0;
    offsetParent = offsetParent.parentElement;
  }

  return offset;
}


/**
 * Returns the position {y: Y, x: X} where the provided event was triggered.
 *
 * @param event - event triggered from the UI.
 * @returns {{y: number, x: number}}
 */
function getEventPosition(event) {
  var offset = getOffsetUpToElement(event.currentTarget, event.target);

  // The offset should be applied only to clientX/Y if layerX/Y don't exist.
  // TODO: Check if there is another way of doing this without using layerX/Y.
  // The use of clientX/Y work in most cases except when there are margin/padding in parent elements
  // That affect the value of `offset`
  return {
    y: event.layerY || (event.clientY - offset.top) || 0,
    x: event.layerX || (event.clientX - offset.left) || 0
  };
}


module.exports = {
  mergeComponentDefinition: mergeComponentDefinition,
  componentsFromGraph: componentsFromGraph,
  libraryFromGraph: libraryFromGraph,
  getOffsetUpToElement: getOffsetUpToElement,
  getEventPosition: getEventPosition,
};
