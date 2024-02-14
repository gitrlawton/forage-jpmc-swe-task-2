import React, { Component } from 'react';
import { Table } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import './Graph.css';

// This is the file that takes care of how the Graph component
// of our App is rendered and reacts to any state changes.

/**
 * Props declaration for <Graph />
 */
interface IProps {
  data: ServerRespond[],
}

/**
 * Perspective library adds load to HTMLElement prototype.
 * This interface acts as a wrapper for Typescript compiler.
 */
interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void,
}

/**
 * React component that renders Perspective based on data
 * parsed from its parent through data property.
 */
class Graph extends Component<IProps, {}> {
  // Perspective table
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  // Note: This method runs after the component output has been rendered to the DOM.
  componentDidMount() {
    // Get element to attach the table from the DOM.
    const elem = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

    const schema = {
      stock: 'string',
      top_ask_price: 'float',
      top_bid_price: 'float',
      timestamp: 'date',
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.
      elem.load(this.table);
      // Add more Perspective configurations here.
      
      // 'view’ is the kind of graph we want to visualize the data with.
      // Since we want a continuous line graph we’re using a y_line.
      elem.setAttribute('view', 'y_line')
      // ‘column-pivots’ is what will allow us to distinguish stock ABC from DEF.
      // ‘[“stock”]’ is its value.
      elem.setAttribute('column-pivots', '["stock"]')
      // ‘row-pivots’ takes care of our x-axis. This allows us to map each
      // datapoint based on its timestamp. Without this, the x-axis would be blank.
      elem.setAttribute('row-pivots', '["timestamp"]')
      // ‘columns’ allows us to focus on a particular part of a stock’s data along the
      // y-axis. Without this, the graph would plot different data points of a stock,
      // i.e.: top_ask_price, top_bid_price, stock, timestamp. For this instance we only
      // care about top_ask_price
      elem.setAttribute('columns', '["top_ask_price"]')
      // ‘aggregates’ allows us to handle the duplicated data we observed earlier and
      // consolidate it into a single data point. In our case we only want to consider a
      // data point unique if it has a unique stock name and timestamp. If there are
      // duplicates, we want to average out the top_bid_prices and the top_ask_prices of
      // these ‘similar’ data points before treating them as one.
      elem.setAttribute('aggregates', `
        {"stock": "distinct count",
        "top_ask_price": "avg",
        "top_bid_price": "avg",
        "timestamp": "distinct count"}`);
    }
  }

  componentDidUpdate() {
    // Everytime the data props is updated, insert the data into Perspective table
    if (this.table) {
      // As part of the task, you need to fix the way we update the data props to
      // avoid inserting duplicated entries into Perspective table again.
      this.table.update(this.props.data.map((el: any) => {
        // Format the data from ServerRespond to the schema
        return {
          stock: el.stock,
          top_ask_price: el.top_ask && el.top_ask.price || 0,
          top_bid_price: el.top_bid && el.top_bid.price || 0,
          timestamp: el.timestamp,
        };
      }));
    }
  }
}

export default Graph;
