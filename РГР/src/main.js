import { Analysis } from './modules/Analysis.js';
import { Manager } from './modules/Manager.js';

document.addEventListener('DOMContentLoaded', () => {
  const analysis = new Analysis();
  new Manager(analysis);
})