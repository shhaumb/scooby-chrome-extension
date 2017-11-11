import React from 'react';

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
    <div>
      {
        logs.map(log => (
          <div>
            { log.s }
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
