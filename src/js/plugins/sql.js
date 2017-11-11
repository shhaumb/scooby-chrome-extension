import React from 'react';

function Query({ query }) {
  return (
    <div className='query'>
      <div className='query-location'>
        <div className='query-row-single'>
          <strong>File:</strong> { query.location.filename }
        </div>
        <div className='query-row-single'>
          <strong>line no:</strong> { query.location.lineno }
        </div>
        <div className='query-row-single'>
          In <strong>{ query.location.name }()</strong>
        </div>
        <br />
        <br />
        <div className='query-row-single'>
          { query.location.line }
        </div>
        <div className='clear-fix' />
      </div>
      <div className='query-sql'>
        { query.query }
      </div>
      <div className='query-extra'>
        <div className='query-row-single'>
          Time taken: { Math.round(query.time_taken) } ms
        </div>
        <div className='query-row-single'>
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
