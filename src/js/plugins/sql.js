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
        (
          this.state.compact
          ?
            this.getCompactQuery()
          :
            text
        ) + ';'
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
        {
          query.queries_count !== undefined
          ?
            <div className='query-row-single'>
              <strong>Queries count</strong>: {query.queries_count}
            </div>
          :
            null
        }
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
  constructor() {
    super();
    this.state = {
      group_similar_queries: false,
      sort_by_time_taken: false,
    };
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value,
    });
  }

  get_queries_to_show() {
    const { httpCall } = this.props;
    let { queries } = httpCall.data.plugins_data.SQL;
    queries = queries.slice();

    if (this.state.group_similar_queries) {
      const grouped_queries = [];
      const queries_map_by_template = {};
      for (let i = 0; i < queries.length; i += 1) {
        const query = queries[i];
        let grouped_query;
        if (query.query_template in queries_map_by_template) {
          grouped_query = queries_map_by_template[query.query_template];
          grouped_query.time_taken += query.time_taken;
          grouped_query.queries_count += 1;
        } else {
          grouped_query = {
            query: query.query_template,
            query_template: query.query_template,
            time_taken: query.time_taken,
            stack: query.stack,
            using: query.using,
            queries_count: 1,
          };
          queries_map_by_template[query.query_template] = grouped_query;
          grouped_queries.push(grouped_query);
        }
      }
      queries = grouped_queries;
    }

    if (this.state.sort_by_time_taken) {
      queries.sort((a, b) => b.time_taken - a.time_taken);
    }

    return queries;
  }

  render() {
    const { httpCall } = this.props;
    const { queries } = httpCall.data.plugins_data.SQL;
    const queries_to_show = this.get_queries_to_show();
    return (
      <div key={httpCall.uuid}>
        {
          queries.length == 0
          ?
            <div>
              No SQL queries.
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
              <label>
                <b>Count</b>: {queries_to_show.length}
              </label>
              <label>
                <b>Group similar queries</b>
                <input
                  name='group_similar_queries'
                  type='checkbox'
                  checked={this.state.group_similar_queries}
                  onChange={this.handleInputChange}
                />
              </label>
              <label>
                <b>Sort by time taken</b>
                <input
                  name='sort_by_time_taken'
                  type='checkbox'
                  checked={this.state.sort_by_time_taken}
                  onChange={this.handleInputChange}
                />
              </label>
              {
                queries_to_show.map((query, index) => (
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
