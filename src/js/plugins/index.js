import { ViewNamePlugin } from './viewname';
import { ProcessTimePlugin } from './processtime';
import { SQLPlugin } from './sql';
import { CustomLogPlugin } from './customlog';
import { MemcachePlugin } from './memcache';
import { ThriftpyPlugin } from './thriftpy';

export const plugins = [
  new ViewNamePlugin(),
  new ProcessTimePlugin(),
  new CustomLogPlugin(),
  new SQLPlugin(),
  new MemcachePlugin(),
  new ThriftpyPlugin(),
];
