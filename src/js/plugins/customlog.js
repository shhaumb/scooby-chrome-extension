import React from 'react';

import { Stack } from '../stack';


function LogTab({ httpCall }) {
  const { logs } = httpCall.data.plugins_data.CustomLog;
  if (logs.length == 0) {
    return (
      <div>
        Nothing logged.<br />
        Do following in python code to log or inspect stack.
        <pre className='codeblock'>
          import scooby<br />
          scooby.log("foo", "bar")<br />
          # or<br />
          scooby.log()         # It works without giving any argument too.<br />
        </pre>
      </div>
    );
  }
  return (
    <div key={httpCall.uuid}>
      {
        logs.map((log, i) => (
          <div key={i}>
            <div>
              { log.s || '----' }
            </div>
            <Stack stack={log.stack} />
          </div>
        ))
      }
    </div>
  );
}

export class CustomLogPlugin {
  constructor() {
    this.name = 'CustomLog';
    this.label = 'Scooby logs';
    this.TabComponent = LogTab;
  }

  getGeneralData() {
    return [];
  }
}
