import React from 'react';

import { Stack } from '../stack';


function LogTab({ httpCall }) {
  const { logs } = httpCall.data.plugins_data.CustomLog;
  if (logs.length == 0) {
    return (
      <div>
        Nothing logged.
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
