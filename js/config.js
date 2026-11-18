import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
// Chave publishable publica. Nunca coloque a service_role aqui.
export const sb=createClient('https://mhqucfsshhmzrzukstlj.supabase.co','sb_publishable_8R_M_Fr5QNNSIjPJZgjwVA_1G4I9tqS');
export const $=id=>document.getElementById(id);
export const state={user:null,subjects:[],subject:'',tasks:[],sessions:[],elapsed:0,running:false,startedAt:0,timerInterval:null,activeTaskId:'',saving:false};
export const pad=n=>String(n).padStart(2,'0');
export const fmt=s=>[Math.floor(s/3600),Math.floor(s%3600/60),Math.floor(s%60)].map(pad).join(':');
export const localDate=(d=new Date())=>[d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
export const formatDate=v=>{if(!v)return '';const p=v.slice(0,10).split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:v};
export const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function errorMessage(error){console.error(error);$('appMessage').textContent='Erro: '+(error?.message||'Não foi possível concluir.');}
export const materia=()=>state.subjects.find(m=>m.nome===state.subject);
export const cor=()=>materia()?.cor||'#bcdcf5';
export async function loadAll(){const u=state.user.id;const [m,a,s]=await Promise.all([sb.from('materias').select('*').eq('user_id',u).order('id'),sb.from('atividades').select('*').eq('user_id',u).order('data_inicio'),sb.from('sessoes_estudo').select('*').eq('user_id',u).order('created_at')]);for(const r of [m,a,s])if(r.error)throw r.error;state.subjects=m.data||[];state.tasks=a.data||[];state.sessions=s.data||[];}
