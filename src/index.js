import PropTypes from 'prop-types';
import React from 'react';
import {forceSimulation, forceLink, forceManyBody, forceCenter} from 'd3-force';
import {arc, pie} from 'd3-shape';
import {select} from 'd3-selection';
import {drag} from 'd3-drag';
import {zoom} from 'd3-zoom';
// import {transition} from 'd3-transition';
// import {easeLinear} from 'd3-ease';

const getEvent = () => require('d3-selection').event;

export default class ForcedGraph extends React.Component {
  componentDidMount() {
    window.addEventListener('resize', this.drawGraph);
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.props.treeView !== nextProps.treeView ||
      this.props.fillType !== nextProps.fillType ||
      this.props.nodeLinkObject.nodes.length !==
        nextProps.nodeLinkObject.nodes.length
    ) {
      this.props = nextProps;
      this.reRenderGraph();
    }
  }

  shouldComponentUpdate() {
    // Prevents component re-rendering
    return false;
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.drawGraph);
  }

  setRef = (component) => {
    this.setState({component}, () => {
      setTimeout(() => this.drawGraph(), 500);
    });
  };

  toggleVisibilityOfNodesAndLinks = d => {
    const visibility = !d.showChildren;
    const parents = [d.id];
    let loopCount = 0;
    while (parents.length > 0) {
      const parent = parents.shift();

      for (let index = 0; index < this.graph.nodes.length; index += 1) {
        const node = this.graph.nodes[index];
        if (node.id === parent && loopCount !== 0) {
          // loopCount = 0 for the node itself
          node.show = visibility;
          if (visibility) node.showChildren = true;
          // here all the links related to the node itself will also be deleted
          this.graph.links.forEach(link => {
            if (link.source.id === node.id || link.target.id === node.id) {
              link.show = visibility;
            }
          });
        }
      }

      this.graph.links.forEach(link => {
        if (link.source.id === parent) {
          const addToParent = this.graph.links.some(link1 => {
            if (
              link1.source.id !== parent &&
              link1.target.id === link.target.id &&
              link1.show
            ) {
              return true;
            }
            return false;
          });

          if (!addToParent) {
            parents.push(link.target.id);
          } else {
            link.show = visibility;
          }
        }
      });
      loopCount += 1;
    }

    this.graph.links.forEach(link => {
      if (link.show && (!link.source.show || !link.target.show)) {
        link.show = false;
      }
    });
  };

  reRenderGraph = graph => {
    if (this.forcedContainer) {
      this.forcedContainer.selectAll('.links').remove();
      this.forcedContainer.selectAll('.nodes').remove();
      this.forcedContainer.selectAll('.labels').remove();
    }
    if (this.tooltipContainer)
      this.tooltipContainer.selectAll('.tooltip').remove();
    if (this.outerNodeContainer)
      this.outerNodeContainer.selectAll('.outernode').remove();

    this.simulateGraph(graph);
  };

  dragstarted = d => {
    if (!getEvent().active) this.simulation.alphaTarget(5).restart();
    d.fx = d.x;
    d.fy = d.y;
  };

  dragged = d => {
    d.fx = getEvent().x;
    d.fy = getEvent().y;
  };

  dragended = d => {
    if (!getEvent().active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  };

  drawLink = () =>
    this.forcedContainer
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(this.graph.links.filter(n => n.show))
      .enter()
      .append('line')
      .attr('stroke-width', 1)
      .attr('style', 'stroke: grey; stroke-opacity: 0.6; fill: grey;');

  drawNode = () =>
    this.forcedContainer
      .append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(this.graph.nodes.filter(n => n.show))
      .enter()
      .append('circle')
      .attr(
        'r',
        d =>
          this.circleRadius + (4 - d.group) * (this.props.circleIncreseFactor || 10)
      )
      .attr(
        'fill',
        d =>
          this.props.fillType === 'white'
            ? 'white'
            : this.props.colorFunction(d)
      )
      .style('opacity', 1)
      .style('stroke', d => this.props.colorFunction(d))
      .style('stroke-width', d => (d.showChildren ? 3 : 6))
      .style('cursor', 'pointer')
      .call(
        drag()
          .on('start', d => this.dragstarted(d))
          .on('drag', d => this.dragged(d))
          .on('end', d => this.dragended(d))
      )
      .on('click', d => {
        if (this.props.multiOptionsClick) {
          this.drawOuterNodeSelection(d);
        } else if (this.props.collapseOnClick) {
          this.handleCollapse(d);
        } else if (this.props.nodeClicked) {
          this.props.nodeClicked(d);
        }
      })
      .on('mouseenter', d => {
        if (this.props.showLabelOnHover) {
          this.drawTooltip(d);
        }
      })
      .on('mouseout', d => {
        if (this.props.showLabelOnHover) {
          this.tooltipContainer.selectAll('.tooltip').remove();
        }
      });

  handleCollapse = node => {
    this.toggleVisibilityOfNodesAndLinks(node);
    node.showChildren = !node.showChildren;
    this.reRenderGraph(this.graph);
  };

  generateDataForOuterNode = node => {
    let data = [];
    try {
      const {collapsibles, keyToLookFor} = this.props.multiOptionsClick;
      const nodeValue = node[keyToLookFor];

      if (collapsibles && collapsibles.indexOf(nodeValue) > -1) {
        data.push({
          value: 1,
          name: 'Collapse',
          color: '#5AB5C9',
          funcToCall: this.handleCollapse,
        });
      }

      if (this.props.multiOptionsClick[nodeValue]) {
        Object.keys(this.props.multiOptionsClick[nodeValue]).forEach(key => {
          const funcColorVal = this.props.multiOptionsClick[nodeValue][key];
          data.push({
            value: 1,
            name: key,
            color: funcColorVal.color,
            funcToCall: funcColorVal.func,
          });
        });
      }
    } catch (err) {
      console.error(err.message);
      data = [];
    }
    return data;
  };

  drawOuterNodeSelection = (node, forceRender) => {
    const nodeData = this.generateDataForOuterNode(node);

    if (nodeData.length === 1 && nodeData[0].name === 'Collapse') {
      this.handleCollapse(node);
      return;
    }

    this.outerNodeContainer.selectAll(`.outernode`).remove();
    // if the same node is clicked, only remove the selection and set the node selected to undefined
    if (
      this.nodeCurrentlySelected &&
      this.nodeCurrentlySelected.id === node.id &&
      !forceRender
    ) {
      this.nodeCurrentlySelected = undefined;
      return false;
    }

    const overallFactor = 1 / (this.transformationFactor.k || 1);
    // start rendering outer node
    this.nodeCurrentlySelected = node;
    const radius =
      (4 - node.group) * (this.props.circleIncreseFactor || 10) + this.circleRadius;
    const arcData = arc()
      .innerRadius(radius)
      .outerRadius(radius + 50 * overallFactor)
      .padAngle(0.02);

    const pieGenerator = pie()
      .value(d => d.value)
      .sort(null);

    const yValue = this.props.treeView
      ? (node.group - 1) * this.height / 4 + 60
      : node.y;
    const svgElement = this.outerNodeContainer
      .append('g')
      .attr('transform', `translate(${node.x}, ${yValue})`)
      .attr('class', `outernode`)
      .selectAll('outerNodes')
      .data(pieGenerator(nodeData))
      .enter();

    // outer circles
    svgElement
      .append('path')
      .attr('d', arcData)
      .attr('fill', 'white')
      // .style('pointer-events', 'visible')
      // .attr('stroke-width', 2)
      .attr('stroke-width', 2)
      .attr('stroke', d => d.data.color)
      .style('cursor', 'pointer')
      .on('mousedown', d => {
        this.nodeCurrentlySelected = undefined;
        this.outerNodeContainer.selectAll(`.outernode`).remove();
        d.data.funcToCall(node);
      });

    svgElement
      .append('text')
      .attr('transform', d => `translate(${arcData.centroid(d)})`)
      .attr('dy', '0.5em')
      .text(
        d =>
          d.data.name === 'Collapse' && !node.showChildren
            ? 'Uncollapse'
            : d.data.name
      )
      .style('text-anchor', 'middle')
      .style('font-size', `${0.6 * overallFactor}em`)
      .style('cursor', 'pointer')
      .on('mousedown', d => {
        this.nodeCurrentlySelected = undefined;
        this.outerNodeContainer.selectAll(`.outernode`).remove();
        d.data.funcToCall(node);
      });
  };

  drawTooltip = d => {
    const svgElement = this.tooltipContainer
      .append('g')
      .attr('class', 'tooltip')
      .selectAll('rectangles')
      .data([1])
      .enter();

    const overallFactor = 1 / (this.transformationFactor.k || 1);
    // if (this.props.fontSize) {
    //   overallFactor = this.props.fontSize / 14;
    // }
    const labelKeys = Object.keys(this.props.showLabelOnHover).sort();
    let rectWidth = 0;
    labelKeys.forEach(key => {
      rectWidth = Math.max(d[key].length, rectWidth)
    });
    rectWidth = (rectWidth * 10 + 50) * overallFactor;
    const rectHeight = (labelKeys.length + 1) * 70 * overallFactor
    const xOffset =
      5 +
      this.circleRadius +
      (4 - d.group) * (this.props.circleIncreseFactor || 10);
    const yOffset = rectHeight / 2;
    const textYOffset = 24 * overallFactor;
    const yValue =
      (this.props.treeView ? (d.group - 1) * this.height / 4 + 60 : d.y) -
      yOffset;
    const fontSize = `${1 * overallFactor}em`;

    const tooltip = svgElement
      .append('rect')
      .attr('x', d.x + xOffset)
      .attr('y', yValue)
      .attr('rx', 10 * overallFactor)
      .attr('ry', 10 * overallFactor)
      .attr('width', rectWidth)
      .attr('height', rectHeight)
      .style('fill', 'white')
      .style('stroke', 'steelblue')
      .style('stroke-width', '2');

    labelKeys.forEach((item, index) => {
      svgElement
      .append('text')
      .attr('x', d.x + xOffset + 10)
      .attr('y', yValue + textYOffset * (index+1))
      .style('font-size', fontSize)
      .text(`${this.props.showLabelOnHover[item]}: ${d[item]}`);
    })
  };

  drawLabel = () => {
    const container = this.forcedContainer
      .append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(this.graph.nodes.filter(n => n.show))
      .enter();

    const text = container
      .append('text')
      .attr(
        'dx',
        d =>
          this.circleRadius +
          (4 - d.group) * (this.props.circleIncreseFactor || 10) +
          1
      )
      .attr('dy', `.35em`)
      .style('fill', 'grey')
      .style('font-weight', 'bold')
      .style('font-size', '1em')
      .text(d => {
        if (!this.props.showLabelOnHover) {
          let name = d.name || d.id.split('-')[0] || d.id;
          if (d.version) {
            name += `(${d.version})`;
          }
          return name;
        }
        return '';
      });

    return text;
  };

  drawLegend = () => {
    if (this.props.legend) {
      const legend = this.legendContainer
        .selectAll('.legend')
        .data(Object.keys(this.props.legend))
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', (d, i) => `translate(-10,${i * 20 + 10})`);

      legend
        .append('rect')
        .attr('x', this.width - 15)
        .attr('width', 15)
        .attr('height', 15)
        .style('fill', d => this.props.legend[d]);

      legend
        .append('text')
        .attr('x', this.width - 25)
        .attr('y', 9)
        .attr('dy', '.25em')
        .style('font-size', '0.7em')
        .style('font-family', 'avenir')
        .style('fill', d => this.props.legend[d])
        .style('text-anchor', 'end')
        .text(d => d);
    }
  };

  ticked = () => {
    if (this.link) {
      this.link
        .attr('x1', d => d.source.x)
        .attr(
          'y1',
          d =>
            this.props.treeView
              ? (d.source.group - 1) * this.height / 4 + 60
              : d.source.y
        )
        .attr('x2', d => d.target.x)
        .attr(
          'y2',
          d =>
            this.props.treeView
              ? (d.target.group - 1) * this.height / 4 + 60
              : d.target.y
        );
    }
    if (this.node) {
      this.node.attr('cx', d => d.x).attr('cy', d => {
        if (
          this.nodeCurrentlySelected &&
          this.nodeCurrentlySelected.id === d.id
        ) {
          this.tooltipContainer.selectAll('.tooltip').remove();
          this.drawOuterNodeSelection(d, true);
        }
        return this.props.treeView ? (d.group - 1) * this.height / 4 + 60 : d.y;
      });
    }
    if (this.label) {
      this.label
        .attr('x', d => d.x)
        .attr(
          'y',
          d =>
            this.props.treeView ? (d.group - 1) * this.height / 4 + 60 : d.y
        );
    }
  };

  drawGraph = () => {
    // D3 Code to create the chart
    // using this._rootNode as container
    const root = this.state && this.state.component;
    if (!root) return;

    this.width = root.parentElement.offsetWidth;
    this.height =
      root.parentElement.offsetHeight - (this.props.heightMinusFactor || 0);
    select(root.children[0]).remove();
    this.circleRadius = this.props.circleRadius || 10;
    this.svg = select(root)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.forcedContainer = this.svg.append('g');
    this.legendContainer = this.svg.append('g');
    this.outerNodeContainer = this.svg.append('g');
    this.tooltipContainer = this.svg.append('g');

    this.nodeCurrentlySelected = undefined;

    const zoomVar = zoom().on('zoom', () => {
      const {x, y, k} = getEvent().transform;
      this.transformationFactor = {x, y, k};
      this.forcedContainer.attr(
        'transform',
        `translate(${x}, ${y})scale(${k})`
      );
      this.tooltipContainer.attr(
        'transform',
        `translate(${x}, ${y})scale(${k})`
      );
      this.outerNodeContainer.attr(
        'transform',
        `translate(${x}, ${y})scale(${k})`
      );
    });
    // 12 is a number from trail and error, No link at all
    // or 12 can be the number of nodes that can fit in a single svg
    this.transformationFactor = this.transformationFactor || {};
    this.transformationFactor.k =
      this.transformationFactor.k ||
      Math.min(1 / (this.props.nodeLinkObject.nodes.length / 12), 1);
    zoomVar.scaleTo(this.svg, this.transformationFactor.k);
    this.svg.call(zoomVar);

    this.simulateGraph();
  };

  simulateGraph = graph => {
    if (
      !this.forcedContainer ||
      !this.tooltipContainer ||
      !this.outerNodeContainer
    ) {
      return;
    }
    this.simulation = forceSimulation()
      .force(
        'link',
        forceLink()
          .id(d => d.id)
          .strength(this.props.connectionStrength || 0.05)
      )
      .force('center', forceCenter(this.width / 2, this.height / 2));

    this.graph = graph || this.props.nodeLinkObject;
    this.link = this.drawLink();
    this.node = this.drawNode();
    if (!this.props.showLabelOnHover) {
      this.label = this.drawLabel();
    }
    this.drawLegend();

    this.simulation
      .nodes(this.graph.nodes)
      // .force('charge', forceManyBody())
      .force('charge', forceManyBody().strength(-500))
      // .force('repulsion', forceManyBody().strength(-200))
      .force('repulsion', forceManyBody().strength(-500))
      .on('tick', () => this.ticked());

    this.simulation.force('link').links(this.graph.links);
  };

  render() {
    return <div className="row" ref={this.setRef} />;
  }
}

ForcedGraph.propTypes = {
  nodeLinkObject: PropTypes.shape({
    nodes: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        group: PropTypes.number,
      })
    ),
    links: PropTypes.arrayOf(
      PropTypes.shape({
        source: PropTypes.string,
        target: PropTypes.string,
        value: PropTypes.number,
      })
    ),
  }).isRequired,
  nodeClicked: PropTypes.func.isRequired,
  colorFunction: PropTypes.func.isRequired,
  collapseOnClick: PropTypes.bool.isRequired,
  showLabelOnHover: PropTypes.objectOf(PropTypes.any),
  circleIncreseFactor: PropTypes.number,
  connectionStrength: PropTypes.number,
  legend: PropTypes.objectOf(PropTypes.any),
  treeView: PropTypes.bool,
  heightMinusFactor: PropTypes.number,
  multiOptionsClick: PropTypes.objectOf(PropTypes.any),
  fillType: PropTypes.string,
  circleRadius: PropTypes.number,
};
