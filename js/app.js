import {initAuth} from './auth.js';
import {initCronograma,renderTasks} from './cronograma.js';
import {initCronometro} from './cronometro.js';
import {initHistorico,renderHistory} from './historico.js';
import {draw} from './grafico.js';
export function render(){renderTasks();renderHistory();draw();}
initCronograma();initCronometro();initHistorico();initAuth();
