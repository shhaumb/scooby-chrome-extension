import { ViewNamePlugin } from './viewname';
import { ProcessTimePlugin } from './processtime';
import { SQLPlugin } from './sql';


export const plugins = [
  new ViewNamePlugin(),
  new ProcessTimePlugin(),
  new SQLPlugin(),
];
