export class ViewNamePlugin {
  constructor() {
    this.name = 'ViewName';
    this.label = 'View name';
    this.TabComponent = null;
  }

  getGeneralData(pluginData) {
    return [
      {
        name: 'View\'s name',
        value: pluginData.view_name,
      },
    ];
  }
}
