import { ViewNamePlugin } from './viewname';
import { ProcessTimePlugin } from './processtime';
import { SQLPlugin } from './sql';
import { CustomLogPlugin } from './customlog';

export const plugins = [
  new ViewNamePlugin(),
  new ProcessTimePlugin(),
  new SQLPlugin(),
  new CustomLogPlugin(),
];
