import React from 'react';
import ReactDOM from 'react-dom';
import jQuery from 'jquery';
import classNames from 'classnames';
import Resizable from 're-resizable';

import { plugins } from './plugins';
import {
  getGeneralData,
  startsWith,
  getDomain,
  getUrlAfterDomain,
  getScoobyDataUrl,
} from './utils';

const ScoobyHeader = 'x-scooby';


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
    if (!chrome.devtools) {
      return;
    }
    chrome.devtools.network.onRequestFinished.addListener((http) => {
      const { headers } = http.response;
      if (headers.some(header => (
        (header.name.toLowerCase() === 'content-type') && (
          (startsWith(header.value, 'text/html')) ||
          (startsWith(header.value, 'application/json'))
        ))) && headers.some(header => (
          header.name.toLowerCase() === ScoobyHeader
        ))) {
        const scoobyHeader = headers.filter(header => (
          header.name.toLowerCase() === ScoobyHeader
        ))[0];
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
      console.log(data);
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
      <div className='panel-container'>
        <div className='panel'>
          <Resizable
            className='left-pane-container'
            defaultSize={{
              width: 350,
              height: '100%',
            }}
            minWidth={300}
            maxWidth={500}
          >
            <LeftPane
              httpCalls={httpCalls}
              activeCallIndex={activeCallIndex}
              setActiveCallIndex={this.setActiveCallIndex}
            />
          </Resizable>
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
                key={httpCall.uuid}
                className={classNames('row', {
                  'active-row': index == activeCallIndex,
                })}
                onClick={this.onClickOnRow.bind(this, index)}
              >
                <b>
                  { httpCall.http.request.method }
                </b> { getUrlAfterDomain(httpCall.http.request.url) }
              </div>
            ))
          }
        </div>
      </div>
    );
  }
}

class RightPane extends React.Component {
  constructor(props) {
    super(props);
    const { httpCall } = this.props;
    if (!httpCall) {
      this.state = {};
      return;
    }
    this.state = this.getInitialState(this.props);
  }

  getInitialState(props) {
    const { httpCall } = props;
    let tabs = [{
      name: 'general',
      label: 'General',
      Component: RightPaneGeneralTab,
    }];
    const { plugins_data } = httpCall.data;
    plugins.forEach((plugin) => {
      if ((plugin.name in plugins_data) && plugin.TabComponent) {
        tabs = [
          ...tabs,
          {
            name: plugin.name,
            label: plugin.label,
            Component: plugin.TabComponent,
          },
        ];
      }
    });
    const activeTabName = 'general';
    return {
      tabs,
      activeTabName,
    };
  }

  componentWillReceiveProps(nextProps) {
    if ((!this.props.httpCall) && nextProps.httpCall) {
      this.setState(this.getInitialState(nextProps));
    }
  }

  setActiveTabName(tabName) {
    this.setState({
      activeTabName: tabName,
    });
  }

  render() {
    const { httpCall } = this.props;
    let { tabs, activeTabName } = this.state;
    if (!httpCall) {
      return (
        <div className="right-pane" />
      );
    }
    const TabComponent = tabs.filter(t => t.name === activeTabName)[0].Component;

    return (
      <div className="right-pane">
        <div className='right-pane-header'>
          {
            tabs.map(tab => (
              <div
                className={classNames('tab', {
                  'active-tab': tab.name === activeTabName,
                })}
                key={tab.name}
                onClick={this.setActiveTabName.bind(this, tab.name)}
              >
                {tab.label}
              </div>
            ))
          }
        </div>
        <div className='right-pane-content'>
          <TabComponent httpCall={httpCall} />
        </div>
      </div>
    );
  }
}

class RightPaneGeneralTab extends React.Component {
  render() {
    const { httpCall } = this.props;
    const { plugins_data } = httpCall.data;
    const { request, response } = httpCall.http;
    let dataLines = getGeneralData(request, response);
    plugins.forEach((plugin) => {
      if (plugin.name in plugins_data) {
        dataLines = [
          ...dataLines,
          ...plugin.getGeneralData(plugins_data[plugin.name]),
        ];
      }
    });
    return (
      <div className='general-tab-content'>
        {
          dataLines.map((dataLine, i) => (
            <div
              className='general-tab-content-row'
              key={i}
            >
              <b>
                { dataLine.name }
              </b><span>: </span>
              <span
                className='margin-left-5'
              >
                {(dataLine.value == undefined) ? '' : dataLine.value}
              </span>
            </div>
          ))
        }
      </div>
    );
  }
}

ReactDOM.render(
  (
    <App />
  ), document.getElementById('root'),
);
