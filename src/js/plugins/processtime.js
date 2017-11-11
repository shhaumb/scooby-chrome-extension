export class ProcessTimePlugin {
  constructor() {
    this.name = 'ProcessTime';
    this.label = 'Process time';
    this.TabComponent = null;
  }

  getGeneralData(pluginData) {
    return [
      {
        name: 'Total processing time',
        value: `${pluginData.process_time} ms`,
      },
    ];
  }
}
