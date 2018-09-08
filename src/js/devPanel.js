import React from 'react';
import ReactDOM from 'react-dom';
import jQuery from 'jquery';
import classNames from 'classnames';
import Resizable from 're-resizable';
import jwt from 'jsonwebtoken';
import ToggleButton from 'react-toggle-button';

import { plugins } from './plugins';
import {
  getGeneralData,
  startsWith,
  getDomain,
  getUrlAfterDomain,
  getScoobyDataUrl,
  getScoobyCProfileDataUrl,
  removeProtocol,
} from './utils';

const SCOOBY_COOKIE_NAME = 'scoobydoobydoo';
const ScoobyHeader = 'x-scooby';
const ScoobyOverheadHeader = 'x-scooby-overhead';


function setCookieConfig(config, domain, secret_key) {
  chrome.cookies.set({
    url: domain,
    name: SCOOBY_COOKIE_NAME,
    value: jwt.sign(config, secret_key),
    path: '/',
    expirationDate: (new Date()).getTime()/1000 + 3*60*60,
  });
}

function removeCookie(domain) {
  chrome.cookies.remove({
    url: domain,
    name: SCOOBY_COOKIE_NAME,
  });
}

const TABS = {
  PROFILER: 'profiler',
  SETTINGS: 'settings',
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.getInitialState(props);

    this.setActiveCallIndex = this.setActiveCallIndex.bind(this);
    this.toggleEnabled = this.toggleEnabled.bind(this);
    this.setDomainConfig = this.setDomainConfig.bind(this);
    this.clearResponses = this.clearResponses.bind(this);
  }

  getInitialState(props) {
    return {
      httpCalls: [],
      activeCallIndex: null,
      domainConfig: props.domainConfig,
      currentTab: TABS.PROFILER,
    };
  }

  isEnabled() {
    return this.state.domainConfig.enable;
  }

  toggleEnabled() {
    const nextEnable = !this.state.domainConfig.enable;
    this.setState({
      domainConfig: {
        ...this.state.domainConfig,
        enable: nextEnable,
      },
      ...(
        nextEnable ? {
          httpCalls: [],
          activeCallIndex: null,
        } : {}
      ),
    }, () => {
      setCookieConfig(this.state.domainConfig, this.props.domain, this.props.secret_key);
    });
  }

  clearResponses() {
    this.setState({
      httpCalls: [],
      activeCallIndex: null,
    });
  }

  setDomainConfig(domainConfig) {
    this.setState({
      domainConfig,
    }, () => {
      setCookieConfig(this.state.domainConfig, this.props.domain, this.props.secret_key);
    });
  }

  addHttpListener() {
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
        const scoobyOverheadHeader = headers.filter(header => (
          header.name.toLowerCase() === ScoobyOverheadHeader
        ))[0]
        const uuid = scoobyHeader.value;
        const scoobyOverhead = scoobyOverheadHeader ? scoobyOverheadHeader.value : null;
        this.fetchHttpData(http, uuid, scoobyOverhead);
      }
    });
  }

  componentDidMount() {
    if (!chrome.devtools) {
      return;
    }
    this.addHttpListener();
    // chrome.devtools.network.onNavigated.addListener(() => {});
  }

  componentWillUpdate(nextProps, nextState) {
    if (!this.state.domainConfig.enable && nextState.domainConfig.enable) {
      this.addHttpListener();
    }
  }

  fetchHttpData(http, uuid, scoobyOverhead) {
    const domain = getDomain(http.request.url);
    jQuery.get(getScoobyDataUrl(domain, uuid)).then((data) => {
      this.setState({
        httpCalls: [...this.state.httpCalls, {
          http,
          uuid,
          data,
          scoobyOverhead,
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

  setTab(tab) {
    this.setState({
      currentTab: tab,
    });
  }

  render() {
    const { activeCallIndex, httpCalls } = this.state;
    return (
      <div className='panel-container'>
        <div className='panel-header'>
          <div
            className={classNames('main-tab', {
              active: this.state.currentTab == TABS.PROFILER,
            })}
            onClick={() => { this.setTab(TABS.PROFILER); }}
          >Profiler</div>
          <div
            className={classNames('main-tab', {
              active: this.state.currentTab == TABS.SETTINGS,
            })}
            onClick={() => { this.setTab(TABS.SETTINGS); }}
          >Settings</div>
          <div className='float-right enabler'>
            <ToggleButton
              value={this.isEnabled()}
              onToggle={this.toggleEnabled}
            />
          </div>
        </div>
        {
          this.state.currentTab == TABS.PROFILER
          ? (
            this.isEnabled()
            ?
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
                    clearResponses={this.clearResponses}
                  />
                </Resizable>
                <RightPane
                  domain={this.props.domain}
                  httpCall={(activeCallIndex === null) ? null : httpCalls[activeCallIndex]}
                  domainConfig={this.state.domainConfig}
                  setDomainConfig={this.setDomainConfig}
                />
              </div>
            :
              <div className='panel'>
                <div className='enabler-message'>
                  Enable the profiler to view stats ...
                </div>
              </div>
          )
          :
            <SettingsPane
              domainConfig={this.state.domainConfig}
              domain={this.props.domain}
            />
        }
      </div>
    );
  }
}

const SETTINGS_TABS = {
  MANAGE_SECRET_KEYS: 'manage_secret_keys',
};

class SettingsPane extends React.Component {
  constructor() {
    super();
    this.state = {
      currentTab: SETTINGS_TABS.MANAGE_SECRET_KEYS,
    };
  }

  render() {
    return  (
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
          <div className='left-pane'>
            <div className='settings-tab'>
              Manage Secret Keys
            </div>
          </div>
        </Resizable>
        <SettingsManageSecretKeys
          domainConfig={this.props.domainConfig}
          domain={this.props.domain}
        />
      </div>
    );
  }
}

class SettingsManageSecretKeys extends React.Component {
  constructor() {
    super();
    this.state = {
      domain_secret_key_map: null,
      domains: null,
    };
    this.edit = this.edit.bind(this);
    this.remove = this.remove.bind(this);
  }

  componentDidMount() {
    chrome.storage.local.get(DOMAIN_SECRET_KEY_MAP_KEY, (localData) => {
      const domain_secret_key_map = localData[DOMAIN_SECRET_KEY_MAP_KEY];
      this.setState({
        domain_secret_key_map,
        domains: Object.keys(domain_secret_key_map),
      });
    });
  }

  edit(domain, secret_key) {
    const domain_secret_key_map =  {
      ...this.domain_secret_key_map,
      [domain]: secret_key,
    };

    this.setState({
      domain_secret_key_map,
    });
    this.updateDomainSecretKeyMapInStorage(domain_secret_key_map);
    if (domain == removeProtocol(this.props.domain)) {
      setCookieConfig(this.props.domainConfig, this.props.domain, secret_key);
    }
  }

  remove(domain) {
    const domains = this.state.domains.filter(d => d != domain);
    const domain_secret_key_map = {...this.state.domain_secret_key_map};
    delete domain_secret_key_map[domain];
    this.setState({
      domains,
      domain_secret_key_map,
    });
    this.updateDomainSecretKeyMapInStorage(domain_secret_key_map);
    if (domain == removeProtocol(this.props.domain)) {
      removeCookie(this.props.domain);
    }
  }

  updateDomainSecretKeyMapInStorage(domain_secret_key_map) {
    chrome.storage.local.set({
      [DOMAIN_SECRET_KEY_MAP_KEY]: domain_secret_key_map,
    }, () => {});
  }

  render() {
    if (this.state.domain_secret_key_map == null) {
      return <div className='right-pane' />;
    }
    return (
      <div className='right-pane'>
        <table className='domain-secret-key-table'>
          <tbody>
            <tr>
              <th>Domain</th>
              <th>Secret Key</th>
              <th />
            </tr>
            {
              this.state.domains.map((domain) => (
                <DomainSecretKeyRow
                  key={domain}
                  domain={domain}
                  domain_secret_key_map={this.state.domain_secret_key_map}
                  edit={this.edit}
                  remove={this.remove}
                />
              ))
            }
          </tbody>
        </table>
      </div>
    );
  }
}

class DomainSecretKeyRow extends React.Component {
  constructor() {
    super();
    this.state = {
      editMode: false,
    };
    this.enableEditMode = this.enableEditMode.bind(this);
    this.disableEditMode = this.disableEditMode.bind(this);
    this.onChange = this.onChange.bind(this);
    this.save = this.save.bind(this);
    this.remove = this.remove.bind(this);
  }

  enableEditMode() {
    this.setState({
      editMode: true,
      secret_key: this.props.domain_secret_key_map[this.props.domain],
    });
  }

  disableEditMode() {
    this.setState({
      editMode: false,
    });
  }

  save() {
    if (this.state.secret_key) {
      this.props.edit(this.props.domain, this.state.secret_key);
      this.disableEditMode();
    }
  }

  remove() {
    const saidOK = confirm("Remove secret key for domain "+this.props.domain+"?");
    if (saidOK) {
      this.props.remove(this.props.domain);
    }
  }

  onChange(e) {
    this.setState({
      secret_key: e.target.value,
    });
  }

  render() {
    return (
      <tr>
        <td>{this.props.domain}</td>
        <td>
          {
            this.state.editMode
            ?
              <input onChange={this.onChange} value={this.state.secret_key} />
            :
              <span>
                {this.props.domain_secret_key_map[this.props.domain]}
              </span>
          }
        </td>
        <td>
          {
            this.state.editMode
            ? <span>
                <button onClick={this.save}>
                  Save
                </button>
                <button onClick={this.disableEditMode}>
                  Cancel
                </button>
              </span>
            :
              <span>
                <button onClick={this.enableEditMode}>
                  Edit
                </button>
                <button onClick={this.remove}>
                  Remove
                </button>
              </span>
          }
        </td>
      </tr>
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
          <span>HTTP Calls</span>
          <a
            className='clear-responses'
            onClick={this.props.clearResponses}
          >
            Clear
          </a>
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
    tabs = [
      ...tabs,
      {
        name: 'cprofile',
        label: 'cProfile',
        Component: RightPaneCProfileTab,
      },
    ];
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
          <TabComponent
            domain={this.props.domain}
            httpCall={httpCall}
            domainConfig={this.props.domainConfig}
            setDomainConfig={this.props.setDomainConfig}
          />
        </div>
      </div>
    );
  }
}

class RightPaneCProfileTab extends React.Component {
  constructor() {
    super();
    this.toggleCProfile = this.toggleCProfile.bind(this);
  }

  toggleCProfile() {
    const nextCProfile = !this.props.domainConfig.cprofile;
    this.props.setDomainConfig({
      ...this.props.domainConfig,
      cprofile: nextCProfile,
    });
  }

  isEnabled() {
    return this.props.domainConfig.cprofile;
  }

  getStatsFileName() {
    return `${this.props.httpCall.data.plugins_data.ViewName.view_name}.stats`;
  }

  render() {
    const { domain, httpCall } = this.props;
    const statsFileName = this.getStatsFileName();
    return (
      <div key={httpCall.uuid}>
        <b>To enable/disable</b>
        <div className='margin-top-10'>
          <ToggleButton
            value={this.isEnabled()}
            onToggle={this.toggleCProfile}
          />
        </div>
        {
          this.isEnabled()
          ?
            <div className='margin-top-10'>
              Download
              <a
                style={{ marginLeft: 3 }}
                href={getScoobyCProfileDataUrl(domain, httpCall.uuid, statsFileName)}
                target="_blank"
              >
                {statsFileName}
              </a>
              <div className='margin-top-10'>
                Install <a href="https://jiffyclub.github.io/snakeviz/" target="_blank">snakeviz</a> to view the stats.
                <div className='margin-top-10'>
                  Run this in terminal.
                  <pre className='codeblock'>
                    snakeviz {statsFileName}
                  </pre>
                </div>
              </div>
            </div>
          :
            null
        }
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
    if (httpCall.scoobyOverhead !== null) {
      dataLines.push({
        name: 'Scooby overhead',
        value: `${httpCall.scoobyOverhead} ms`,
      });
    }
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

const DOMAIN_SECRET_KEY_MAP_KEY = 'domain_secret_key_map';

function promptForSecretKey(domain, domain_secret_key_map) {
  const secret_key = prompt('Put Scooby\'s secret key for domain ' + domain) || '';
  if (secret_key) {
    chrome.storage.local.set({
      [DOMAIN_SECRET_KEY_MAP_KEY]: {
        ...domain_secret_key_map,
        [domain]: secret_key,
      },
    }, () => {});
  }
  return secret_key;
}

chrome.storage.local.get(DOMAIN_SECRET_KEY_MAP_KEY, (localData) => {
  let domain_secret_key_map = {};
  if (!localData[DOMAIN_SECRET_KEY_MAP_KEY]) {
    chrome.storage.local.set({
      [DOMAIN_SECRET_KEY_MAP_KEY]: {},
    }, () => {});
  } else {
    domain_secret_key_map = localData[DOMAIN_SECRET_KEY_MAP_KEY];
  }

  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, (tabs) => {
    const domain = getDomain(tabs[0].url);
    const justDomain = removeProtocol(domain);
    let secret_key;
    if (!domain_secret_key_map[justDomain]) {
      secret_key = promptForSecretKey(justDomain, domain_secret_key_map);
    } else {
      secret_key = domain_secret_key_map[justDomain];
    }
    let domainConfig = {
      enable: false,
      cprofile: false,
    }
    if (!secret_key) {
      ReactDOM.render(
        (
          <div style={{ margin: 10 }}>
            You need to set secret key for domain {justDomain} to use Scooby. Reload plugin and set secret key.
          </div>
        ), document.getElementById('root')
      );
    } else {
      chrome.cookies.get({ url: domain, name: SCOOBY_COOKIE_NAME }, (cookie) => {
        if (cookie == null) {
          setCookieConfig(domainConfig, domain, secret_key);
        } else {
          try {
            const config = jwt.verify(cookie.value, secret_key);
            domainConfig = {
              enable: config.enable || false,
              cprofile: config.cprofile || false,
            }
          } catch (e) {}
        }
        ReactDOM.render(
          (
            <App
              domain={domain}
              domainConfig={domainConfig}
              secret_key={secret_key}
            />
          ), document.getElementById('root'),
        );
      });
    }
  });
});
