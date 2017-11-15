import React from 'react';
import classNames from 'classnames';


class CodeContext extends React.Component {
  getPaddedLineNo(lineno) {
    let s = lineno.toString();
    for (let i=0; i<(2 - s.length); i++) {
      s = ' ' + s;
    }
    return s;
  }
  render() {
    const { code_context, lineno, line_index } = this.props;
    const startLineNo = lineno - line_index;
    return (
      <div className='code-context'>
        {
          code_context.map((code, index) => (
            <div
              className='code-line-div'
              key={index}
            >
              <pre
                className={classNames('code-line', {
                  active: (startLineNo + index === lineno),
                })}
              ><span>{ this.getPaddedLineNo(startLineNo + index) }. </span> <code>{ code }</code></pre>
            </div>
          ))
        }
      </div>
    );
  }
}

class LocalVars extends React.Component {
  render() {
    const { local_vars } = this.props;
    return (
      <div>
        {
          Object.keys(local_vars).map((key, index) => (
            <div
              key={index}
              className='var-row'
            >
              <div className='var-name'>
                {key}
              </div>
              <div className='var-value'>
                {local_vars[key]}
              </div>
              <div className='clear-fix' />
            </div>
          ))
        }
      </div>
    );
  }
}

class Frame extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showContent: this.props.showInitially,
    };

    this.toggleShow = this.toggleShow.bind(this);
  }

  toggleShow() {
    this.setState({
      showContent: !this.state.showContent,
    });
  }

  render() {
    const { frame } = this.props;
    return (
      <div className='frame'>
        <div className='frame-header text-nowrap'
          onClick={this.toggleShow}
        >
          <span
            className='frame-content-toggler'
          >
            { this.state.showContent ? '-' : '+' }
          </span>
          <strong> { frame.filename }</strong>
          <span className='margin-left-5'> in <strong>{ frame.function }</strong></span>
          <span className='margin-left-5'> at line <strong>{ frame.lineno }</strong></span>
        </div>
        {
          this.state.showContent
          ?
            <div className='frame-content'>
              <CodeContext
                code_context={ frame.code_context }
                lineno={ frame.lineno }
                line_index={ frame.line_index }
              />
              <div className='clear-fix' />
              <LocalVars
                local_vars={ frame.local_vars }
              />
              <div className='clear-fix' />
            </div>
          :null
        }
      </div>
    );
  }
}

export class Stack extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      includeLib: false,
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

  getFrames() {
    const { stack } = this.props;
    let frames = stack;
    if (!this.state.includeLib) {
      frames = frames.filter(frame => (
        (frame.filename.indexOf('dist-packages') == -1) &&
        (frame.filename.indexOf('site-packages') == -1) &&
        (frame.filename.indexOf('/usr/lib/python') == -1)
      ));
    }
    return frames;
  }

  render() {
    const frames = this.getFrames();
    const frameElements = frames.map((frame, index) => (
      <Frame
        key={`${frame.filename}${index}`}
        frame={frame}
        showInitially={(!this.props.embedded) && index == 0}
      />
    ));
    return (
      <div
        className={classNames('stack', {
          wrapped: (!this.props.embedded),
        })}
      >
        <div className='stack-header'>
          <span
            className={classNames({
              bold: (!this.props.embedded),
            })}
          >
            Stack
          </span>
          <label>
            All packages
            <input
              name='includeLib'
              type='checkbox'
              checked={this.state.includeLib}
              onChange={this.handleInputChange}
            />
          </label>
        </div>
        { frameElements }
      </div>
    );
  }
}
Stack.defaultProps = {
  embedded: false,
};
