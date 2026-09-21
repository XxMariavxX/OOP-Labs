"use strict";

import { work1 } from './modules/module1.js';
import { work2 } from './modules/module2.js';
import { clear } from './modules/clear.js';

document.addEventListener('DOMContentLoaded', () => {
  work1();
  work2();
  clear();
});