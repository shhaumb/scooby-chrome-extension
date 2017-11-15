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
    this.setState({
      compact: !this.state.compact,
    });
  }

  getCompactQuery() {
    const { text } = this.props;
    const regex = /^(SELECT) .* (FROM .*)/;
    if (regex.test(text)) {
      return text.replace(regex, "$1 ... $2");
    }
    return text;
  }

  render() {
    const { text } = this.props;
    return (
      <div
        className='query-sql cursor-pointer'
        onClick={this.toggleCompact}
      >
      {
        this.state.compact
        ?
          this.getCompactQuery()
        :
          text
      }
      </div>
    );
  }
}

function Query({ query }) {
  return (
    <div className='query'>
      <QueryText text={query.query} />
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
          queries.length == 0
          ?
            <div>
              No SQL queries.
            </div>
          :
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
