import { asTupleString } from '../utils';

export class ViewNamePlugin {
  constructor() {
    this.name = 'ViewName';
    this.label = 'View';
    this.TabComponent = null;
  }

  getGeneralData(pluginData) {
    return [
      {
        name: 'View',
        value: `${pluginData.view_name}(*args=${
          asTupleString(pluginData.args)}, **kwargs=${
          JSON.stringify(pluginData.kwargs, null, 1)})`,
      },
    ];
  }
}
