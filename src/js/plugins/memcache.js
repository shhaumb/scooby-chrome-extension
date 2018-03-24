import React from 'react';

import { Stack } from '../stack';

class QueryText extends React.Component {
  constructor() {
    super();
    this.state = {
      compact: true,
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
    const { func_name, arg } = this.props;
    let argToShow = arg;
    if (Array.isArray(arg) && arg.length > 10 && this.state.compact) {
      argToShow = `<${arg.length} items>`;
    } else {
      argToShow = JSON.stringify(arg);
    }
    return (
      <div
        className='query-sql cursor-pointer'
        onClick={this.toggleCompact}
      >
        <b>{func_name}</b>: {argToShow}
      </div>
    );
  }
}

function Query({ query }) {
  return (
    <div className='query'>
      <QueryText func_name={query.func_name} arg={query.arg} />
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

class MemcacheTabComponent extends React.Component {
  render() {
    const { httpCall } = this.props;
    const { queries } = httpCall.data.plugins_data.Memcache;
    return (
      <div key={httpCall.uuid}>
        {
          queries.length == 0
          ?
            <div>
              No Memcache queries.
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

export class MemcachePlugin {
  constructor() {
    this.name = 'Memcache';
    this.label = 'Memcache';
    this.TabComponent = MemcacheTabComponent;
  }

  getGeneralData(pluginData) {
    return [
      {
        name: 'Memcache queries count',
        value: pluginData.queries.length,
      },
      {
        name: 'Memcache queries total time',
        value: `${Math.round(pluginData.queries.map(q =>
          q.time_taken).reduce(((a, b) => a + b), 0))} ms`,
      },
    ];
  }
}
