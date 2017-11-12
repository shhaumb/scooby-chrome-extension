import React from 'react';

import { Stack } from '../stack';


function Query({ query }) {
  return (
    <div className='query'>
      <div className='query-sql'>
        { query.query }
      </div>
      <div className='query-extra'>
        <div className='query-row-single'>
          <strong>{ Math.round(query.time_taken) } ms</strong>
        </div>
        <div className='query-row-single'>
          using: { query.using }
        </div>
        <div className='clear-fix' />
      </div>
      <Stack stack={query.stack} embedded />
    </div>
  );
}

class SQLTabComponent extends React.Component {
  render() {
    const { httpCall } = this.props;
    const { queries } = httpCall.data.plugins_data.SQL;
    return (
      <div key={httpCall.uuid}>
        {
          queries.map((query, index) => (
            <Query
              key={index}
              query={query}
            />
          ))
        }
      </div>
    );
  }
}

export class SQLPlugin {
  constructor() {
    this.name = 'SQL';
    this.label = 'SQL';
    this.TabComponent = SQLTabComponent;
  }

  getGeneralData(pluginData) {
    return [
      {
        name: 'SQL queries count',
        value: pluginData.queries.length,
      },
      {
        name: 'SQL queries total time',
        value: `${Math.round(pluginData.queries.map(q =>
          q.time_taken).reduce(((a, b) => a + b), 0))} ms`,
      },
    ];
  }
}
