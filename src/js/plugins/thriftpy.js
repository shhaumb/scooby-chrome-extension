import React from 'react';

import { Stack } from '../stack';

class QueryText extends React.Component {
  constructor() {
    super();
    this.state = {
      compact: false,
    };
    this.toggleCompact = this.toggleCompact.bind(this);
  }

  toggleCompact() {
    const { arg } = this.props;
    this.setState({
      compact: !this.state.compact,
    });
  }

  render() {
    const { service_name, func_name, args, kwargs } = this.props;
    return (
      <div
        className='query-sql cursor-pointer'
        onClick={this.toggleCompact}
      >
        <b>{service_name}</b>.<b>{func_name}</b>(
        {
          (!this.state.compact)
          ?
            `${args.join(', ')}${
              Object.keys(kwargs).length !== 0 ? `, **${JSON.stringify(kwargs)}`: ''
            }`
          :
            '...'
        })
      </div>
    );
  }
}

function Query({ query }) {
  return (
    <div className='query'>
      <QueryText
        service_name={query.service_name}
        func_name={query.func_name}
        args={query.args}
        kwargs={query.kwargs}
      />
      <div className='query-extra'>
        <div className='query-row-single'>
          <strong>{ Math.round(query.time_taken) } ms</strong>
        </div>
        <div className='clear-fix' />
      </div>
      <Stack stack={query.stack} embedded />
    </div>
  );
}

class ThriftpyTabComponent extends React.Component {
  render() {
    const { httpCall } = this.props;
    const { queries } = httpCall.data.plugins_data.Thriftpy;
    return (
      <div key={httpCall.uuid}>
        {
          queries.length == 0
          ?
            <div>
              No Thriftpy queries.
            </div>
          :
            <div>
              <label>
                <b>Total queries</b>: {queries.length}
              </label>
              <label>
                <b>Total time taken</b>: {Math.round(queries.map(q =>
                q.time_taken).reduce(((a, b) => a + b), 0))} ms
              </label>
              <br />
              <br />
              {
                queries.map((query, index) => (
                    <Query
                      key={index}
                      query={query}
                    />
                ))
              }
            </div>
        }
      </div>
    );
  }
}

export class ThriftpyPlugin {
  constructor() {
    this.name = 'Thriftpy';
    this.label = 'Thriftpy';
    this.TabComponent = ThriftpyTabComponent;
  }

  getGeneralData(pluginData) {
    return [
      {
        name: 'Thriftpy queries count',
        value: pluginData.queries.length,
      },
      {
        name: 'Thriftpy queries total time',
        value: `${Math.round(pluginData.queries.map(q =>
          q.time_taken).reduce(((a, b) => a + b), 0))} ms`,
      },
    ];
  }
}
