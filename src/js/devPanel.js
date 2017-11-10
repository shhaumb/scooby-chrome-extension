import React from 'react';
import ReactDOM from 'react-dom';
import jQuery from 'jquery';
import classNames from 'classnames';


const ScoobyHeader = 'X-Scooby';

function startsWith(string, sub) {
  if (sub !== undefined) {
    return string.substring(0, sub.length) === sub;
  }
  return false;
}

function getDomain(url) {
  if (startsWith(url, 'https')) {
    return `https://${url.substring(8).split('/')[0]}`;
  } else if (startsWith(url, 'http')) {
    return `http://${url.substring(7).split('/')[0]}`;
  }
  return url.split('/')[0];
}

function getUrlAfterDomain(url) {
  const domain = getDomain(url);
  return url.substring(domain.length);
}

function getScoobyDataUrl(domain, uuid) {
  return `${domain}/scooby/get-data/${uuid}/`;
}

class App extends React.Component {
  constructor() {
    super();
    this.state = this.getInitialState();

    this.setActiveCallIndex = this.setActiveCallIndex.bind(this);
  }

  getInitialState() {
    return {
      httpCalls: [],
      activeCallIndex: null,
    };
  }

  componentDidMount() {
    chrome.devtools.network.onRequestFinished.addListener((http) => {
      const { headers } = http.response;
      if (headers.some(header => (
        (header.name === 'Content-Type') && (
          (startsWith(header.value, 'text/html')) ||
          (startsWith(header.value, 'application/json'))
        ))) && headers.some(header => header.name === ScoobyHeader)) {
        const scoobyHeader = headers.filter(header => header.name === ScoobyHeader)[0];
        const uuid = scoobyHeader.value;
        this.fetchHttpData(http, uuid);
      }
    });
    chrome.devtools.network.onNavigated.addListener(() => {
      this.setState(this.getInitialState());
    });
  }

  fetchHttpData(http, uuid) {
    const domain = getDomain(http.request.url);
    jQuery.get(getScoobyDataUrl(domain, uuid)).then((data) => {
      this.setState({
        httpCalls: [...this.state.httpCalls, {
          http,
          uuid,
          data,
        }],
        activeCallIndex: this.state.activeCallIndex || 0,
      });
    });
  }

  setActiveCallIndex(index) {
    this.setState({
      activeCallIndex: index,
    });
  }

  render() {
    const { activeCallIndex, httpCalls } = this.state;
    return (
      <div className='panel'>
        <div className='panel-header'>
        </div>
        <LeftPane
          httpCalls={httpCalls}
          activeCallIndex={activeCallIndex}
          setActiveCallIndex={this.setActiveCallIndex}
        />
        <div className='right-pane'>
          <RightPane
            httpCall={(activeCallIndex === null) ? null : httpCalls[activeCallIndex]}
          />
        </div>
      </div>
    );
  }
}

class LeftPane extends React.Component {
  onClickOnRow(index) {
    this.props.setActiveCallIndex(index);
  }

  render() {
    const { httpCalls, activeCallIndex } = this.props;
    return (
      <div className='left-pane'>
        <div className='left-pane-header'>
          HTTP Calls
        </div>
        <div className='left-pane-content'>
          {
            httpCalls.map((httpCall, index) => (
              <div
                className={classNames('row', {
                  'active-row': index == activeCallIndex,
                })}
                onClick={this.onClickOnRow.bind(this, index)}
              >
                { getUrlAfterDomain(httpCall.http.request.url) }
              </div>
            ))
          }
        </div>
      </div>
    );
  }
}

class RightPane extends React.Component {
  render() {
    const { httpCall } = this.props;
    if (!httpCall) {
      return null;
    }
    return (
      httpCall.data.plugins_data.ViewName.view_name
    );
  }
}

ReactDOM.render(
  (
    <App />
  ), document.getElementById('root'),
);
