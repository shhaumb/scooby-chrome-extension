import React from 'react';

function Query({ query }) {
  return (
    <div className='query'>
      <div className='query-sql'>
        { query.query }
      </div>
      <div className='query-extra'>
        <div className='query-extra-single'>
          Time taken: { Math.round(query.time_taken) } ms
        </div>
        <div className='query-extra-single'>
          using: { query.using }
        </div>
        <div className='clear-fix' />
      </div>
    </div>
  );
}

class SQLTabComponent extends React.Component {
  render() {
    const { httpCall } = this.props;
    const { queries } = httpCall.data.plugins_data.SQL;
    return (
      <div>
        {
          queries.map(query => (
            <Query
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