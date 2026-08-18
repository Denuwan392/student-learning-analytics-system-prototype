'use strict';
/* ═════════════════════════ 1 · UTILITIES ═════════════════════════ */
const NOW = new Date(2026,7,17,9,0,0), DAY = 864e5;
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pad = n => String(n).padStart(2,'0');
const ds  = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fD  = d => `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
const fDs = s => fD(new Date(s));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
const sd=a=>{if(a.length<2)return 0;const m=mean(a);return Math.sqrt(mean(a.map(x=>(x-m)**2)))};
const round1=x=>Math.round(x*10)/10;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function slope(a){const n=a.length;if(n<2)return 0;const xm=(n-1)/2,ym=mean(a);let nu=0,de=0;a.forEach((y,i)=>{nu+=(i-xm)*(y-ym);de+=(i-xm)**2});return nu/de}
const sg=(a,b)=>a>b?1:-1;

/* ═════════════════════════ 2 · SUBJECT MODEL (extensible) ═════════ */
const SUBJECTS={
  CM:{code:'CM',name:'Combined Mathematics',short:'Comb. Maths',color:'#57B0E8',
      topics:['Algebra','Functions & Graphs','Trigonometry','Differentiation','Integration','Vectors','Statics & Dynamics','Statistics']},
  PH:{code:'PH',name:'Physics',short:'Physics',color:'#F2B84B',
      topics:['Mechanics','Electricity & Magnetism','Waves & Sound','Heat & Thermodynamics','Fields & Gravitation','Modern Physics']},
  CH:{code:'CH',name:'Chemistry',short:'Chemistry',color:'#35D3A2',
      topics:['Physical Chemistry','Organic Chemistry','Inorganic Chemistry','Analytical Chemistry','Electrochemistry','Polymers & Industry']}
};
const SUBJ=['CM','PH','CH'];
const PREREQ={CM:{'Algebra':'Functions & Graphs','Trigonometry':'Differentiation','Differentiation':'Integration'},
              PH:{'Mechanics':'Fields & Gravitation'},CH:{'Physical Chemistry':'Electrochemistry'}};
const A_DATES=['2025-09-12','2026-01-16','2026-02-20','2026-03-20','2026-04-24','2026-05-22','2026-06-19','2026-07-24'];
const A_TYPES=['Term Test','Unit Test','Monthly Test','Unit Test','Term Test','Monthly Test','Mock Exam','Unit Test'];

const SUPPORT=[
 {id:'SP1',name:'Physics Mechanics Workshop',subject:'PH',schedule:'Thu 3:30 PM',capacity:12,taken:9,teacher:'Mr. Sunil Fernando',target:'Mechanics average below 55%',outcome:'+17 avg gain (2025 cohort)'},
 {id:'SP2',name:'Combined Maths Tutoring Circle',subject:'CM',schedule:'Tue & Fri 3:30 PM',capacity:15,taken:11,teacher:'Mr. Nimal Gunawardena',target:'CM below 60%',outcome:'+12 avg gain'},
 {id:'SP3',name:'Study Skills Workshop',subject:'ALL',schedule:'Wed 2:00 PM',capacity:30,taken:17,teacher:'Ms. Amali Wickramasinghe',target:'Organisation / workload issues',outcome:'+8 avg gain'},
 {id:'SP4',name:'Attendance & Wellbeing Counseling',subject:'ALL',schedule:'By appointment',capacity:20,taken:6,teacher:'Counseling Unit',target:'Attendance below 80%',outcome:'Attendance +11pp avg'},
 {id:'SP5',name:'Past Paper Intensive Program',subject:'ALL',schedule:'Sat 9:00 AM',capacity:40,taken:31,teacher:'Subject panel',target:'Exam technique',outcome:'+11 avg gain'},
 {id:'SP6',name:'Peer Mentoring Program',subject:'ALL',schedule:'Flexible',capacity:25,taken:13,teacher:'Senior student mentors',target:'Confidence & consistency',outcome:'+7 avg gain'},
 {id:'SP7',name:'Career Guidance & University Pathways',subject:'ALL',schedule:'Monthly',capacity:50,taken:22,teacher:'Career unit',target:'Pathway planning',outcome:'—'},
 {id:'SP8',name:'Research & Olympiad Program',subject:'ALL',schedule:'Sat 1:00 PM',capacity:12,taken:7,teacher:'Dr. Ruwan Silva',target:'High performers seeking stretch',outcome:'3 national medals 2025'}];

const ICON={
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 chart:'<polyline points="3 17 8 11 12 14 21 5"/><polyline points="15 5 21 5 21 11"/>',
 heat:'<rect x="3" y="3" width="4" height="4" rx="1"/><rect x="10" y="3" width="4" height="4" rx="1"/><rect x="3" y="10" width="4" height="4" rx="1"/><rect x="10" y="10" width="4" height="4" rx="1"/><rect x="17" y="3" width="4" height="4" rx="1"/><rect x="17" y="10" width="4" height="4" rx="1"/><rect x="10" y="17" width="4" height="4" rx="1"/>',
 target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
 star:'<polygon points="12 2 15 9 22 9.3 16.5 14 18.5 21 12 17 5.5 21 7.5 14 2 9.3 9 9"/>',
 check:'<polyline points="4 12.5 9.5 18 20 6"/>',
 loop:'<path d="M21 12a9 9 0 1 1-2.6-6.4"/><polyline points="21 3 21 8 16 8"/>',
 clock:'<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5"/><circle cx="17.5" cy="9" r="2.6"/><path d="M16 15.4c2.7.3 4.8 1.8 5.5 4.6"/>',
 board:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
 badge:'<path d="M12 2l7 3v6c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V5z"/><polyline points="9 12 11.5 14.5 15.5 9.5"/>',
 alert:'<path d="M12 3L2.5 20h19z"/><line x1="12" y1="9.5" x2="12" y2="14"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
 build:'<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-5h6v5"/>',
 spark:'<path d="M12 2l2 5.5L20 9l-6 1.5L12 16l-2-5.5L4 9l6-1.5z"/><path d="M19 15l.9 2.4 2.1.6-2.1.6L19 21l-.9-2.4-2.1-.6 2.1-.6z"/>',
 list:'<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>',
 shield:'<path d="M12 2l7 3v6c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V5z"/>',
 x:'<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
 bell:'<path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9"/><path d="M10 20a2.2 2.2 0 0 0 4 0"/>',
 chat:'<path d="M21 12a8 8 0 0 1-8 8H4l2.4-3.2A8 8 0 1 1 21 12z"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/>',
 plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'};
const ic=(n,s=15)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;

/* ═════════════════════════ 3 · SEED DATA ═════════════════════════ */
let rnd=mulberry32(20260817);
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
const pick=a=>a[Math.floor(rnd()*a.length)];

const FN=['Sachini','Ravindu','Ishara','Chamodi','Lasith','Sanduni','Nuwan','Hashini','Thilina','Kasun','Maleesha','Gayan','Piumi','Ruwan','Sajini','Dineth','Nadeesha','Binura','Achini','Pasindu','Hiruni','Chathura','Dilini','Malith','Shehan','Umesha','Rashmika','Vindula','Nimasha','Lahiru','Sithmi','Ashen','Kavindi','Ramesh','Sewmini','Tharaka','Yasiru','Imasha','Dulaj','Hansi'];
const LN=['Perera','Jayasuriya','Fernando','Bandara','Rajapaksa','Wickramasinghe','Silva','Gunawardena','Samaraweera','Dissanayake','Herath','Ekanayake','Amarasinghe','Weerasinghe','Senanayake','Karunaratne','Wijesinghe','Ratnayake','Alwis','Mendis','Peiris','Zoysa','Kulatunga','Hettiarachchi','Jayawardena','Pathirana','Seneviratne','Abeywickrama','Liyanage','Kodithuwakku'];
const TEACHERS={CM:'Mr. Nimal Gunawardena',PH:'Mr. Sunil Fernando',CH:'Mrs. Kumari Perera'};
const CLASSES=['13-A','13-B','13-C','13-D'];

const FLAGSHIP={
 'ST-001':{name:'Nethmi Perera',cls:'13-A',att:97,asg:95,eng:.85,color:'#57B0E8',label:'A · High performer',
   story:'Strong in Mathematics, consistently improving, highly engaged. The system should recommend stretch opportunities — not remediation.',
   scores:{CM:[78,80,83,82,85,87,88,90],PH:[74,75,78,77,80,82,83,85],CH:[80,81,83,84,86,85,88,89]}},
 'ST-002':{name:'Kavindu Jayasuriya',cls:'13-B',att:93,asg:87,eng:.7,color:'#F2B84B',label:'B · Declining Physics',
   story:'Physics Mechanics declining across four consecutive assessments while attendance stays high. Evidence points to topic mastery, not attendance.',
   scores:{CM:[70,72,69,74,71,73,75,74],PH:[62,66,55,68,49,63,44,60],CH:[64,66,63,67,65,66,68,66]},
   topics:{PH:['Mechanics','Waves & Sound','Mechanics','Electricity & Magnetism','Mechanics','Heat & Thermodynamics','Mechanics','Modern Physics']}},
 'ST-003':{name:'Tharushi Fernando',cls:'13-C',att:68,asg:54,eng:.35,attTrend:'down',color:'#F0654A',label:'C · High risk',
   story:'Attendance falling and marks declining in all three subjects. Multiple risk dimensions active; needs coordinated support, not labels.',
   scores:{CM:[58,56,53,55,50,48,46,44],PH:[54,53,50,52,47,45,43,41],CH:[60,58,56,57,53,51,49,48]}},
 'ST-004':{name:'Dilshan Bandara',cls:'13-D',att:88,asg:82,eng:.65,attTrend:'up',color:'#35D3A2',label:'D · Rapidly improving',
   story:'Average marks, steep upward trajectory. Proof the system rewards growth — completed intervention shows +19 learning gain.',
   scores:{CM:[44,47,48,53,57,60,64,68],PH:[46,49,52,55,58,60,63,66],CH:[50,52,55,58,60,62,65,67]}},
 'ST-005':{name:'Anusha Rajapaksa',cls:'13-A',att:95,asg:92,eng:.8,color:'#C9A6FF',label:'E · Strong + active',
   story:'Strong academics plus Olympiad medal and leadership. Opportunity engine recommends advanced programs.',
   scores:{CM:[80,82,81,84,83,86,85,88],PH:[84,85,87,86,88,89,90,91],CH:[77,79,78,81,80,83,84,85]}}
};

const DB={students:[],byId:{},assessments:[],interventions:[],approvals:[],recs:[],agentRuns:[],audit:[],dq:[],notifs:[],goals:{},activities:{},timeline:{},ivStats:[
 {prog:'Physics Mechanics Workshop',n:42,pre:51,post:68},{prog:'Math Foundations Workshop',n:35,pre:47,post:61},
 {prog:'Past Paper Intensive Program',n:58,pre:55,post:66},{prog:'Study Skills Workshop',n:24,pre:52,post:58},{prog:'Peer Mentoring Program',n:18,pre:50,post:57}]};
let ASID=1000;

function pushAssess(sid,sub,topic,date,type,marks){DB.assessments.push({id:'AS-'+(++ASID),sid,sub,topic,date,type,max:100,marks,teacher:TEACHERS[sub]})}
function buildFlagship(id,cfg){
  const st={id,name:cfg.name,cls:cfg.cls,att:cfg.att,asg:cfg.asg,eng:cfg.eng,color:cfg.color,attTrend:cfg.attTrend||null,
            flagship:cfg.label,stream:'Physical Science',idxNo:'26-'+id.slice(3)};
  SUBJ.forEach((sub,si)=>{const tps=SUBJECTS[sub].topics;
    cfg.scores[sub].forEach((m,i)=>{const topic=(cfg.topics&&cfg.topics[sub])?cfg.topics[sub][i]:tps[(i*2+si)%tps.length];
      pushAssess(id,sub,topic,A_DATES[i],A_TYPES[i],m)})});
  return st;
}
function buildGenerated(i){
  const id='ST-'+String(i).padStart(3,'0');
  const shape=pick(['stable','stable','up','down','volatile','low']);
  const base=shape==='low'?ri(38,52):ri(48,82);
  const tr=shape==='up'?ri(12,26)/10:shape==='down'?-ri(12,26)/10:0;
  const att=clamp(Math.round(base*.55+ri(28,52)+(shape==='down'?-ri(0,14):0)+(shape==='up'?ri(0,8):0)),58,98);
  const asg=clamp(att+ri(-12,8),35,99);
  const st={id,name:pick(FN)+' '+pick(LN),cls:CLASSES[i%4],att,asg,eng:clamp(att/100*.8+rnd()*.2,.2,.95),color:pick(['#57B0E8','#F2B84B','#35D3A2','#8FB7D8']),shape,
            stream:'Physical Science',idxNo:'26-'+String(i).padStart(3,'0')};
  SUBJ.forEach((sub,si)=>{const tps=SUBJECTS[sub].topics;const b2=clamp(base+ri(-7,7),30,90);
    for(let k=0;k<8;k++){let m=b2+tr*k+(shape==='volatile'?((k%2? -1:1)*ri(6,14)):ri(-4,4));
      pushAssess(id,sub,tps[(k*2+si+ri(0,1))%tps.length],A_DATES[k],A_TYPES[k],clamp(Math.round(m),12,98))}});
  return st;
}
Object.keys(FLAGSHIP).forEach(id=>{const st=buildFlagship(id,FLAGSHIP[id]);DB.students.push(st);DB.byId[id]=st});
for(let i=6;i<=108;i++){const st=buildGenerated(i);DB.students.push(st);DB.byId[st.id]=st}

/* interventions */
DB.interventions=[
 {id:'IV-101',sid:'ST-002',program:'Physics Mechanics Workshop',programId:'SP1',status:'proposed',proposedOn:'2026-08-14',by:'Recommendation Agent',pre:52.5,post:null,progress:'0 of 6 sessions',
  why:'Mechanics average 52.5% across 4 assessments; three consecutive declines; attendance high (93%) — issue is topic mastery, not presence.'},
 {id:'IV-094',sid:'ST-004',program:'Math Foundations Workshop',programId:'SP2',status:'completed-effective',proposedOn:'2026-02-24',startedOn:'2026-03-02',completedOn:'2026-05-28',pre:48,post:67,progress:'8 of 8 sessions',why:'CM below 50% in 2026 Jan with improving engagement signals.'},
 {id:'IV-090',sid:'ST-003',program:'Attendance & Wellbeing Counseling',programId:'SP4',status:'proposed',proposedOn:'2026-08-11',by:'Recommendation Agent',pre:68,post:null,progress:'0 of 4 sessions',
  why:'Attendance 68% and falling; declining trajectory in all subjects; engagement risk HIGH.'},
 {id:'IV-088',sid:'ST-005',program:'Research & Olympiad Program',programId:'SP8',status:'active',proposedOn:'2026-05-02',startedOn:'2026-05-15',pre:null,post:null,progress:'3 of 10 sessions',why:'Opportunity: consistent 80%+ with Olympiad achievement.'},
 {id:'IV-079',sid:'ST-031',program:'Past Paper Intensive Program',programId:'SP5',status:'completed-effective',proposedOn:'2026-03-01',completedOn:'2026-06-20',pre:52,post:63,progress:'10 of 10 sessions',why:'Exam technique gaps in mock exams.'}];
DB.approvals=[
 {id:'AP-11',sid:'ST-002',ivId:'IV-101',status:'pending',raised:'2026-08-14'},
 {id:'AP-12',sid:'ST-003',ivId:'IV-090',status:'pending',raised:'2026-08-11'}];

/* recommendations */
DB.recs=[
 {id:'RC-201',sid:'ST-002',aud:'student',title:'Prioritise Mechanics this week',detail:'Complete Mechanics Practice Set 04 (20 targeted past-paper questions) and re-work Q3–Q5 of the June Mock before Thursday.',
  evidence:['Mechanics average: 52.5% across 4 assessments (EV-1041)','Overall Physics average: 61% (EV-1042)','Three consecutive declining Mechanics results: 55 → 49 → 44 (EV-1043)','Attendance is 93% — presence is not the issue (EV-1044)','Assignment completion 87% — effort is consistent (EV-1045)'],
  conclusion:'Current evidence suggests the decline is associated with Mechanics topic mastery rather than attendance or effort.',match:'Physics Mechanics Workshop'},
 {id:'RC-202',sid:'ST-002',aud:'institution',title:'Enrol in Physics Mechanics Workshop',detail:'Thursday 3:30 PM · Mr. Sunil Fernando · 3 of 12 seats remaining. Eligibility: Mechanics < 55%.',
  evidence:['Student Mechanics average 52.5% meets eligibility (<55%)','Programme average learning gain last cohort: +17 points','Schedule does not clash with 13-B timetable'],conclusion:'Resource match is available and within capacity.',match:'Physics Mechanics Workshop'},
 {id:'RC-203',sid:'ST-002',aud:'teacher',title:'Scaffold two Mechanics problems at lesson start',detail:'In the next Physics lesson, walk through one resolved-motion example with Kavindu before independent practice.',
  evidence:['Decline concentrated in applied Mechanics items (Q3–Q5 pattern)','Concept items stable; application items falling'],conclusion:'Difficulty appears at application stage, suggesting scaffolded practice may help.'},
 {id:'RC-204',sid:'ST-002',aud:'parent',title:'Low-pressure home support',detail:'Ask Kavindu to explain one Mechanics problem to you this week. Acknowledge that his attendance and effort remain strong.',
  evidence:['Attendance 93% · assignment completion 87%','Decline is topic-specific, not effort-related'],conclusion:'Supportive, specific conversation is more useful than general pressure.'},
 {id:'RC-211',sid:'ST-003',aud:'institution',title:'Attendance & wellbeing counseling',detail:'Refer to counseling unit; coordinate with parent. Priority: re-establish attendance routine before academic catch-up.',
  evidence:['Attendance 68%, falling over recent months','All three subjects show declining slopes','Assignment completion 54%'],conclusion:'Evidence suggests engagement is the primary lever; academic tutoring alone is unlikely to work first.'},
 {id:'RC-221',sid:'ST-004',aud:'student',title:'Protect the upward trajectory',detail:'Keep the current study rhythm. Add one past-paper timing drill per week to consolidate gains before the term test.',
  evidence:['CM improved 44% → 68% since September','Math Foundations Workshop gain: +19 points'],conclusion:'Current approach is working; recommendation is consolidation, not change.'},
 {id:'RC-231',sid:'ST-005',aud:'student',title:'Apply for National Physics Olympiad',detail:'Preparation begins Saturday 1:00 PM. Past performance suggests strong readiness.',
  evidence:['Physics average 88% and rising','Bronze — Physics Olympiad 2026 (already achieved)'],conclusion:'Stretch opportunity matched to demonstrated strength.'},
 {id:'RC-232',sid:'ST-001',aud:'student',title:'Join Research & Mentoring track',detail:'A supervised mini-research project in statistics is available with Dr. Silva.',
  evidence:['Statistics topic average 90%','Consistency: SD of last 6 assessments < 4'],conclusion:'High consistency + topic strength make this a low-risk stretch opportunity.'}];

/* goals, activities, timelines, quality, audit, agent runs */
DB.goals['ST-002']=[
 {t:'Complete Mechanics Practice Set 04 (20 past-paper questions)',done:false},
 {t:'Attend Thursday Mechanics Workshop',done:false},
 {t:'Review Integration notes — worked examples 1–12',done:false},
 {t:'Submit Chemistry Assignment 06',done:true}];
DB.activities['ST-002']=[{name:'Science Society member',kind:'Engagement'},{name:'Inter-class cricket',kind:'Workload note'}];
DB.activities['ST-005']=[{name:'Physics Olympiad 2026 — Bronze',kind:'Achievement'},{name:'Coding Club lead',kind:'Skill development'},{name:'Research project: solar tracker',kind:'Interest'}];
DB.activities['ST-001']=[{name:'Mathematics quiz champion 2025',kind:'Achievement'}];
DB.timeline['ST-002']=[
 {d:'SEP 2025',t:'Joined A/L programme — Physical Science stream'},
 {d:'JAN 2026',t:'Physics 62% · Mechanics stable'},
 {d:'APR 2026',t:'Mechanics decline detected: 55% → 49% (Analysis Agent)'},
 {d:'JUN 2026',t:'Mock Exam Mechanics 44% — risk raised to MEDIUM-HIGH'},
 {d:'AUG 2026',t:'Physics Mechanics Workshop proposed · pending advisor approval'}];
DB.timeline['ST-004']=[
 {d:'SEP 2025',t:'Joined A/L programme — CM at 44%'},
 {d:'MAR 2026',t:'Math Foundations Workshop started'},
 {d:'MAY 2026',t:'Workshop completed · learning gain +19 points · marked EFFECTIVE'},
 {d:'JUL 2026',t:'CM reached 68% — improving trajectory confirmed'}];
DB.dq=[
 {id:'DQ-01',sev:'HIGH',txt:'Assessment AS-2291 (ST-044 · Physics): obtained 117 / max 100 — impossible value. Record quarantined, not used in analytics.',status:'Quarantined'},
 {id:'DQ-02',sev:'MED',txt:'Duplicate record: ST-071 Term Test 2026-05-22 entered twice. Second entry ignored.',status:'Resolved'},
 {id:'DQ-03',sev:'MED',txt:'14 Chemistry assessments in 13-C missing topic tags — topic mastery for these items estimated from subject mean.',status:'Open'},
 {id:'DQ-04',sev:'LOW',txt:'ST-090 marked present on 2026-07-04 (institution holiday). Flagged for correction.',status:'Open'}];
DB.agentRuns=[
 {t:'09:02',agent:'Data Quality',trig:'ASSESSMENT_ADDED',tools:'get_assessment_history',ms:142,st:'OK',conf:'—'},
 {t:'09:02',agent:'Student Analysis',trig:'ASSESSMENT_ADDED',tools:'calculate_trend · get_topic_performance',ms:480,st:'OK',conf:'0.81'},
 {t:'09:03',agent:'Prediction',trig:'ASSESSMENT_ADDED',tools:'predict_result(model v0.4)',ms:96,st:'OK',conf:'0.72'},
 {t:'09:03',agent:'Risk Engine',trig:'PERFORMANCE_DECLINED',tools:'risk_dimensions',ms:61,st:'OK',conf:'0.77'},
 {t:'09:03',agent:'Recommendation',trig:'PERFORMANCE_DECLINED',tools:'get_available_support · create_intervention',ms:310,st:'OK',conf:'0.74'},
 {t:'09:03',agent:'Guardrail',trig:'REC_CANDIDATE',tools:'policy_check · causal_claim_scan',ms:44,st:'WITHHELD ×3',conf:'—'},
 {t:'08:41',agent:'Parent Communication',trig:'WEEKLY_DIGEST',tools:'simplify_language',ms:220,st:'OK',conf:'0.88'},
 {t:'08:15',agent:'Institutional Analytics',trig:'TERM_CLOSE',tools:'aggregate_gains',ms:720,st:'OK',conf:'0.9'}];
DB.audit=[
 {who:'Mr. Sunil Fernando',role:'TEACHER',act:'Viewed Student 360 · ST-002',when:'14 Aug 2026 09:12',why:'Intervention review'},
 {who:'Recommendation Agent',role:'AGENT',act:'Proposed IV-101 (Physics Mechanics Workshop)',when:'14 Aug 2026 09:03',why:'Mechanics decline evidence RC-201'},
 {who:'Ms. Amali Wickramasinghe',role:'ADVISOR',act:'Opened approval queue',when:'14 Aug 2026 10:02',why:'Weekly triage'},
 {who:'Data Quality Agent',role:'AGENT',act:'Quarantined AS-2291',when:'13 Aug 2026 16:44',why:'Impossible value 117/100'},
 {who:'Mr. Nimal Gunawardena',role:'TEACHER',act:'Uploaded Term Test batch (13-A, 31 rows)',when:'12 Aug 2026 14:20',why:'Term assessment'}];
DB.notifs={
 STUDENT:[{sev:'ATTENTION',t:'Mechanics Workshop proposed for you — pending approval',d:'Today'},
          {sev:'INFO',t:'Mock Exam result recorded: Physics 44%',d:'19 Jun'},
          {sev:'IMPORTANT',t:'Goal reminder: Mechanics Practice Set 04',d:'Today'}],
 PARENT:[{sev:'ATTENTION',t:'Physics performance has changed — see summary',d:'Today'},
         {sev:'INFO',t:'Kavindu\'s attendance remains strong (93%)',d:'This week'}],
 TEACHER:[{sev:'URGENT',t:'ST-003: attendance below 70% and declining',d:'Today'},
          {sev:'ATTENTION',t:'3 students with new declining trajectories this week',d:'Today'}],
 ADVISOR:[{sev:'IMPORTANT',t:'2 intervention proposals awaiting your review',d:'Today'}],
 ADMIN:[{sev:'ATTENTION',t:'Data quality: 1 quarantined record this week',d:'Today'}]};

/* ═════════════════════════ 4 · ANALYTICS ENGINE ══════════════════ */
const series=(st,sub)=>DB.assessments.filter(a=>a.sid===st.id&&a.sub===sub).sort((a,b)=>a.date<b.date?-1:1);
const allMarks=st=>SUBJ.flatMap(s=>series(st,s).map(a=>a.pct??a.marks));
function trendOf(arr){const s=slope(arr);const v=sd(arr.slice(-5));
  if(arr.length<3)return{cls:'info',txt:'Insufficient data',s,v};
  if(s>=1.6)return{cls:'up',txt:'Improving',s,v}; if(s>=.4)return{cls:'up',txt:'Slight gain',s,v};
  if(s<=-1.6)return{cls:'down',txt:'Declining',s,v}; if(s<=-.4)return{cls:'down',txt:'Softening',s,v};
  if(v>=10)return{cls:'warn',txt:'Volatile',s,v}; return{cls:'',txt:'Stable',s,v}}
function topicsOf(st,sub){const map={};series(st,sub).forEach(a=>{(map[a.topic]??=[]).push(a.marks)});
  return Object.keys(map).map(t=>{const v=map[t],tr=trendOf(v);let cls='';const m=mean(v);
    if(m>=70&&tr.s>=-.4)cls='strength';else if(m<55)cls='weakness';
    if(tr.s<=-2&&m>=55)cls='declining';else if(tr.s>=2)cls='recovering';
    if(tr.v>=12&&v.length>=3)cls='volatile';
    return{topic:t,avg:round1(m),n:v.length,slope:round1(tr.s),cls,series:v}}).sort((a,b)=>b.avg-a.avg)}
function subjAvg(st,sub){const s=series(st,sub).map(a=>a.marks);return s.length?round1(mean(s)):null}
function overallAvg(st){const m=SUBJ.map(s=>subjAvg(st,s)).filter(x=>x!=null);return round1(mean(m))}
function weakTopics(st){return SUBJ.flatMap(sub=>topicsOf(st,sub).filter(t=>t.cls==='weakness'||t.cls==='declining').map(t=>({...t,sub})))}
function strongTopics(st){return SUBJ.flatMap(sub=>topicsOf(st,sub).filter(t=>t.cls==='strength').map(t=>({...t,sub})))}
function prereqNote(st,sub){const links=PREREQ[sub]||{};const ts=topicsOf(st,sub);const get=t=>ts.find(x=>x.topic===t);
  for(const[pre,dep]of Object.entries(links)){const p=get(pre),d=get(dep);
    if(p&&d&&p.avg<58&&d.avg<p.avg)return `${pre} (${Math.round(p.avg)}%) is a prerequisite of ${dep} (${Math.round(d.avg)}%) — current evidence suggests difficulty in ${dep} may be partly foundation-related.`}
  return null}
function lvl(v,hi,md){return v>=hi?'LOW':v>=md?'MEDIUM':'HIGH'}
function riskOf(st){const ac=overallAvg(st);
  const acadLv=ac<48?'HIGH':ac<62?'MEDIUM':'LOW';
  const attLv=st.att<75?'HIGH':st.att<87?'MEDIUM':'LOW';
  const engLv=(st.asg<60||st.eng<.4)?'HIGH':st.asg<80?'MEDIUM':'LOW';
  const subs=SUBJ.map(sub=>{const av=subjAvg(st,sub)||0,tr=trendOf(series(st,sub).map(a=>a.marks));
    const lv=av<50?'HIGH':av<62||tr.s<=-1.5?'MEDIUM':'LOW';
    return{sub,lv,av,sl:tr.s,ev:[`${SUBJECTS[sub].short} average ${Math.round(av)}%`,tr.s<=-1?`slope ${round1(tr.s)} per assessment`:`slope ${round1(tr.s)}`]}});
  const overall=['HIGH','HIGH','HIGH'].includes(subs.map(s=>s.lv).sort().pop())||acadLv==='HIGH'||attLv==='HIGH'?'HIGH':
    [acadLv,attLv,engLv,...subs.map(s=>s.lv)].includes('MEDIUM')?'MEDIUM':'LOW';
  return{overall,acadLv,attLv,engLv,subs};
}
function oppOf(st){if(overallAvg(st)>=75&&st.eng>=.65)return['National Olympiad track','Supervised mini-research project','Peer mentoring role','University pathway planning'];
  if(overallAvg(st)>=70)return['Subject enrichment club','Past-paper challenge league'];return[]}
function bandOf(p){return p>=80?'A':p>=68?'B':p>=55?'C':p>=40?'S':'W'}
function predict(st,sub){
  const s=series(st,sub);if(s.length<3)return{insufficient:true,n:s.length};
  const m=s.map(a=>a.marks),recent=mean(m.slice(-3)),hist=mean(m);
  const exams=s.filter(a=>a.type==='Mock Exam'||a.type==='Term Test').map(a=>a.marks);
  const ex=exams.length?mean(exams):hist,sl=slope(m),vol=sd(m.slice(-5));
  let p=clamp(Math.round(recent*.4+ex*.25+hist*.15+(st.att*.75+st.asg*.25)*.2),5,98);
  const confN=s.length>=7?(vol<8?.86:.72):s.length>=5?.6:.42;
  const conf=confN>=.8?'High':confN>=.55?'Moderate':'Low';
  const b=bandOf(p),b2=bandOf(p-(vol>9?7:4));
  const feats=[
   {k:'Recent performance (last 3)',v:Math.round(recent),imp:Math.abs(recent-hist)>3||recent>=70?'HIGH':'MEDIUM',dir:recent>=hist?'+':'-'},
   {k:'Mock & term exam record',v:Math.round(ex),imp:'HIGH',dir:ex>=p?'+':'-'},
   {k:`Attendance (${st.att}%)`,v:st.att,imp:'MEDIUM',dir:st.att>=90?'+':st.att<78?'-':'~'},
   {k:'Assignment completion',v:st.asg,imp:'MEDIUM',dir:st.asg>=85?'+':st.asg<60?'-':'~'},
   {k:'Trajectory slope',v:round1(sl),imp:Math.abs(sl)>=1?'HIGH':'LOW',dir:sl>=.4?'+':sl<=-.4?'-':'~'}];
  const pos=[],neg=[];
  if(sl>=.8)pos.push('Trajectory improving across recent assessments');
  if(sl<=-.8)neg.push('Trajectory declining across recent assessments');
  strongTopics(st).filter(t=>t.sub===sub).slice(0,2).forEach(t=>pos.push(`Strong topic: ${t.topic} (${Math.round(t.avg)}%)`));
  weakTopics(st).filter(t=>t.sub===sub).slice(0,2).forEach(t=>neg.push(`${t.topic} remains weak (${Math.round(t.avg)}%)`));
  const mock=s.find(a=>a.type==='Mock Exam');
  if(mock&&mock.marks<hist-4)neg.push(`Recent mock (${mock.marks}%) below overall level`);
  if(st.att<80)neg.push('Attendance below 80%');
  if(st.att>=93)pos.push('High attendance supports consistency');
  return{p,band:b,range:b===b2?`${b} band`:`${b} / ${b2} range`,conf,confN,feats,pos,neg,n:s.length,vol:round1(vol)};
}
function simPredict(st,sub,delta){const base=predict(st,sub);if(base.insufficient)return base;
  const s=series(st,sub).map(a=>a.marks),recent=clamp(mean(s.slice(-3))+delta,0,100);
  const exams=s.filter(a=>a.type==='Mock Exam'||a.type==='Term Test').map(a=>a.marks);
  const ex=clamp((exams.length?mean(exams):mean(s))+delta*.6,0,100);
  const p=clamp(Math.round(recent*.4+ex*.25+mean(s)*.15+(st.att*.75+st.asg*.25)*.2),5,98);
  return{...base,p,band:bandOf(p),sim:true}}
const learningGain=(pre,post)=>({raw:round1(post-pre),g:pre<100?round1((post-pre)/(100-pre)):null});

/* attendance days */
function genDays(st){if(st.days)return st.days;
  const r=mulberry32(hashStr(st.id)),map={},aBy={};
  DB.assessments.filter(a=>a.sid===st.id).forEach(a=>aBy[a.date]=a);
  for(let i=364;i>=0;i--){const d=new Date(NOW.getTime()-i*DAY),key=ds(d),dow=d.getDay();
    const rec={d,key,dow,att:null,int:0,test:null,asg:false};
    if(dow===0){rec.int=r()<.18?ri? 1+Math.floor(r()*3):1:0;map[key]=rec;continue}
    let p=st.att/100;if(st.attTrend==='down'&&i<110)p-=.16;if(st.attTrend==='up'&&i<110)p+=.08;p=clamp(p,.15,.99);
    const a=aBy[key],present=a?true:r()<p;rec.att=present?1:0;
    if(!present){rec.int=1;map[key]=rec;continue}
    let it=2;if(r()<st.eng)it++;if(r()<st.eng*.7)it++;
    if(a){it=Math.max(it,3);rec.test={sub:a.sub,marks:a.marks}}
    if(r()<.12){rec.asg=true;it++}
    rec.int=Math.min(5,it);map[key]=rec}
  st.days=map;return map}
function heatStats(st){const days=genDays(st);let present=0,active=0,streak=0;const vals=Object.values(days);
  vals.forEach(x=>{if(x.att===1)present++;if(x.int>=2)active++});
  for(let i=364;i>=0;i--){const r=days[ds(new Date(NOW.getTime()-i*DAY))];if(r&&r.int>=2)streak++;else if(i<360)break}
  const schoolDays=vals.filter(x=>x.dow!==0).length;
  return{present,active,streak,rate:Math.round(present/schoolDays*100)}}

/* ═════════════════════════ 5 · STATE + ROUTER ════════════════════ */
const state={role:null,user:null,meId:'ST-002',view:'overview',drawerSid:null,heatFilter:'all',anaSub:'CM',roleTab:'Student',pipelineBusy:false};
const NAVS={
 STUDENT:[['overview','Overview','grid'],['analytics','Analytics','chart'],['heatmap','Learning Activity','heat'],['predictions','A/L Predictions','target'],['recommendations','Recommendations','star'],['goals','My Goals','check'],['interventions','Interventions','loop'],['timeline','My Timeline','clock']],
 PARENT:[['overview','Overview','grid'],['progress','Progress','chart'],['attendance','Attendance','heat'],['alerts','Alerts','alert'],['support','How to Support','star']],
 TEACHER:[['classes','Class Overview','board'],['students','Students','users'],['interventions','Interventions','loop'],['quality','Data Quality','shield']],
 ADVISOR:[['risk','Risk Board','alert'],['students','Students','users'],['approvals','Approvals','badge'],['interventions','Interventions','loop']],
 ADMIN:[['dashboard','Institution','build'],['analytics','Learning Analytics','chart'],['interventions','Interventions','loop'],['support','Support Programs','star'],['ai','AI Observability','spark'],['audit','Audit Log','list']]};
const DEFAULT_V={STUDENT:'overview',PARENT:'overview',TEACHER:'classes',ADVISOR:'risk',ADMIN:'dashboard'};
const ROLE_USERS={STUDENT:{n:'Kavindu Jayasuriya',d:'ST-002 · 13-B'},PARENT:{n:'Mr. Jayasuriya',d:'Parent of Kavindu (ST-002)'},
 TEACHER:{n:'Mr. Sunil Fernando',d:'Physics · Classes 13-A–D'},ADVISOR:{n:'Ms. Amali Wickramasinghe',d:'Academic Advisor'},
 ADMIN:{n:'Dr. Ruwan Silva',d:'Institution Administrator'}};
const $=s=>document.querySelector(s);
function goto(h){location.hash=h}
function route(){const h=location.hash||'#/';
  if(h==='#/'||h===''){show('landing');return}
  if(h.startsWith('#/login')){show('login');return}
  if(h.startsWith('#/app')){if(!state.role){show('login');return}
    state.view=h.split('/')[2]||DEFAULT_V[state.role];show('app');renderApp();return}
  show('landing')}
function show(s){['landing','login','app'].forEach(x=>$('#scr-'+x).classList.toggle('hidden',x!==s));window.scrollTo(0,0)}
addEventListener('hashchange',route);

/* ═════════════════════════ 6 · COMPONENTS ════════════════════════ */
function spark(arr,color,w=96,h=30){if(!arr||arr.length<2)return'';
  const mx=Math.max(...arr,100),mn=Math.min(...arr,0);
  const X=i=>2+(w-4)*i/(arr.length-1),Y=v=>h-2-(h-4)*(v-mn)/((mx-mn)||1);
  const pts=arr.map((v,i)=>`${X(i)},${Y(v)}`).join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/><circle cx="${X(arr.length-1)}" cy="${Y(arr[arr.length-1])}" r="2.6" fill="${color}"/></svg>`}
const CHARTS={};let CHN=0;
function lineChart(seriesArr,labels,opts={}){
  const id='ch'+(++CHN),W=660,H=228,P={l:36,r:12,t:14,b:26};
  const n=Math.max(...seriesArr.map(s=>s.data.length));
  const X=i=>P.l+(W-P.l-P.r)*i/((n-1)||1),Y=v=>P.t+(H-P.t-P.b)*(1-clamp(v,0,100)/100);
  let g='';[0,25,50,75,100].forEach(v=>{g+=`<line x1="${P.l}" x2="${W-P.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="rgba(150,190,214,.09)"/><text x="${P.l-7}" y="${Y(v)+3}" font-size="8.5" fill="#5B7280" text-anchor="end" font-family="JetBrains Mono">${v}</text>`;});
  g+=`<line x1="${P.l}" x2="${W-P.r}" y1="${Y(55)}" y2="${Y(55)}" stroke="rgba(242,184,75,.35)" stroke-dasharray="4 4"/>`;
  let paths='';seriesArr.forEach(s=>{const d=s.data.map((v,i)=>`${i?'L':'M'}${X(i)},${Y(v)}`).join(' ');
    paths+=`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.2" stroke-linecap="round"/>`;
    s.data.forEach((v,i)=>paths+=`<circle cx="${X(i)}" cy="${Y(v)}" r="2.7" fill="${s.color}"/>`)});
  let xl='';(labels||[]).forEach((lb,i)=>xl+=`<text x="${X(i)}" y="${H-8}" font-size="8.5" fill="#5B7280" text-anchor="middle" font-family="JetBrains Mono">${lb}</text>`);
  CHARTS[id]={series:seriesArr,labels,X:P.l,W:W-P.l-P.r,n,H};
  return `<svg class="chart" data-cid="${id}" viewBox="0 0 ${W} ${H}">${g}${paths}${xl}</svg>`}
function bindChartHover(root){root.querySelectorAll('svg.chart[data-cid]').forEach(el=>{
  const c=CHARTS[el.dataset.cid];if(el._b)return;el._b=1;
  el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect();
    const fx=(e.clientX-r.left)/r.width*660;const idx=clamp(Math.round((fx-c.X)/(c.W/((c.n-1)||1))),0,c.n-1);
    let rows=c.series.map(s=>`<div class="mono" style="color:${s.color}">${s.name}: <b>${round1(s.data[idx])}%</b></div>`).join('');
    showTip(`<div class="ttd">${c.labels[idx]||('Point '+(idx+1))}</div>${rows}`,e)});
  el.addEventListener('mouseleave',hideTip)})}
function showTip(html,e){const t=$('#tip');t.innerHTML=html;t.classList.remove('hidden');
  const w=t.offsetWidth;let x=e.clientX+14;if(x+w>innerWidth-12)x=e.clientX-w-14;
  t.style.left=x+'px';t.style.top=(e.clientY+14)+'px'}
function hideTip(){$('#tip').classList.add('hidden')}
const heatColor=v=>['v0','v1','v2','v3','v4','v5'][v]||'v0';
function heatVal(rec,f){if(!rec)return null;
  switch(f){case 'attendance':return rec.att===0?'ab':rec.int>=3?4:2;
   case 'assignments':return rec.asg?4:0;
   case 'tests':return rec.test?clamp(Math.round(rec.test.marks/20),1,5):0;
   case 'study':return rec.int>=4?rec.int:rec.int===3?2:0;
   default:return rec.int}}
function heatmap(st,filter,weeks=53){
  const days=genDays(st),start=new Date(NOW.getTime()-(weeks*7-1)*DAY);
  const adj=new Date(start.getTime()-start.getDay()*DAY);
  const total=Math.round((NOW-adj)/DAY)+1,cols=Math.ceil(total/7);
  let months='',prevM=-1,cells='';
  for(let c=0;c<cols;c++){const first=new Date(adj.getTime()+c*7*DAY);
    if(first.getMonth()!==prevM){prevM=first.getMonth();months+=`<span style="left:${c*14}px">${MON[prevM]}</span>`}}
  for(let i=0;i<cols*7;i++){const d=new Date(adj.getTime()+i*DAY);
    if(d>NOW){cells+=`<div class="hcell none"></div>`;continue}
    const rec=days[ds(d)];const v=heatVal(rec,filter);
    const cls=v==='ab'?'ab':heatColor(v==null?0:v);
    cells+=`<div class="hcell ${cls}" data-day="${ds(d)}" data-sid="${st.id}"></div>`}
  return `<div class="heat-scroll"><div class="heat-wrap"><div class="hmonths">${months}</div>
    <div class="hdays"><span style="top:14px">Mon</span><span style="top:56px">Wed</span><span style="top:98px">Fri</span></div>
    <div class="heat">${cells}</div></div></div>`}
const riskChip=lv=>`<span class="chip ${lv==='HIGH'?'hi':lv==='MEDIUM'?'md':'lo'}">${lv}</span>`;
const trendChip=tr=>`<span class="chip ${tr.cls}">${tr.s>=.4?'▲':tr.s<=-.4?'▼':'●'} ${tr.txt}</span>`;
function toast(html,kind=''){const t=document.createElement('div');t.className='toast '+kind;t.innerHTML=html;
  $('#toasts').appendChild(t);setTimeout(()=>{t.style.opacity=0;t.style.transition='opacity .5s';setTimeout(()=>t.remove(),500)},kind==='pipe'?12000:5200)}

/* ═════════════════════════ 7 · VIEWS ═════════════════════════════ */
function subjRowHTML(st,sub){const av=subjAvg(st,sub)||0,tr=trendOf(series(st,sub).map(a=>a.marks));
  const wk=topicsOf(st,sub).filter(t=>t.cls==='weakness'||t.cls==='declining')[0];
  return `<div class="subj-row"><div><div class="sname">${SUBJECTS[sub].name}</div>
    <div class="mono dim" style="font-size:10.5px">${wk?`watch: ${wk.topic} ${Math.round(wk.avg)}%`:'no active watch'}</div></div>
   <div class="sval" style="color:${SUBJECTS[sub].color}">${Math.round(av)}%</div>
   <div>${spark(series(st,sub).map(a=>a.marks),SUBJECTS[sub].color,220,34)}</div>
   <div style="text-align:right">${trendChip(tr)}<div class="mono dim" style="font-size:10px;margin-top:5px">slope ${round1(tr.s)}/assess</div></div></div>`}
function statline(items){return `<div class="statline">${items.map(i=>`<div class="stat"><div class="sl">${i[0]}</div><div class="sv" style="color:${i[2]||'var(--ink)'}">${i[1]}</div>${i[3]?`<div class="sd mono" style="color:var(--dim)">${i[3]}</div>`:''}</div>`).join('')}</div>`}
function recCard(r){return `<div class="panel tight" style="margin-bottom:10px">
  <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
   <div><b style="font:700 13.5px var(--disp)">${r.title}</b><p style="font-size:12.5px;color:var(--mut);margin-top:4px">${r.detail}</p></div>
   <button class="btn ghost sm" data-act="why" data-rec="${r.id}">Why?</button></div>
  ${r.match?`<div style="margin-top:8px"><span class="chip info">matched: ${r.match}</span></div>`:''}</div>`}

/* ---- Student ---- */
function vStuOverview(){const st=DB.byId[state.meId],r=riskOf(st),goals=DB.goals[st.id]||[];
  const topRec=DB.recs.find(x=>x.sid===st.id&&x.aud==='student');
  const imps=SUBJ.map(s=>({s,tr:trendOf(series(st,s).map(a=>a.marks))}));
  const improving=imps.filter(x=>x.tr.s>=.8),declining=imps.filter(x=>x.tr.s<=-.8);
  const strongest=strongTopics(st)[0];
  return `${vh(`Hello, ${st.name.split(' ')[0]}`,`${st.idxNo} · ${st.cls} · ${st.stream} · A/L 2026`,`<span class="chip warn">DEMO DATA</span>`)}
  ${statline([['Overall average',Math.round(overallAvg(st))+'%','var(--amber)','8 assessments × 3 subjects'],
    ['Attendance',st.att+'%','var(--teal)','last 365 days'],['Assignments',st.asg+'%','','completion rate'],
    ['Last learning gain','+19 pts','var(--teal)','Math Foundations (Mar–May)']])}
  <div class="grid g-21">
   <div>
    <div class="panel"><div class="p-head"><h3>Your subjects right now</h3><span class="kick">Q1 · what is happening</span></div>
      ${SUBJ.map(s=>subjRowHTML(st,s)).join('')}</div>
    <div class="panel" style="margin-top:14px"><div class="p-head"><h3>Trajectory — last 8 assessments</h3><span class="chip">demo model v0.4</span></div>
      ${lineChart(SUBJ.map(s=>({name:SUBJECTS[s].short,color:SUBJECTS[s].color,data:series(st,s).map(a=>a.marks)})),A_DATES.map(d=>MON[+d.slice(5,7)-1]))}
      <div class="legend">${SUBJ.map(s=>`<span><i style="background:${SUBJECTS[s].color}"></i>${SUBJECTS[s].name}</span>`).join('')}<span><i style="background:rgba(242,184,75,.5)"></i>C threshold (55)</span></div></div>
   </div>
   <div>
    ${topRec?`<div class="panel"><div class="p-head"><h3>Next recommended action</h3><span class="kick">evidence-based</span></div>
      <b style="font:700 14px var(--disp)">${topRec.title}</b><p style="font-size:12.5px;color:var(--mut);margin:6px 0 10px">${topRec.detail}</p>
      <button class="btn ghost sm" data-act="why" data-rec="${topRec.id}">Why this recommendation?</button></div>`:''}
    <div class="panel" style="margin-top:14px"><div class="p-head"><h3>This week</h3><span class="mono dim" style="font-size:10px">${goals.filter(g=>g.done).length}/${goals.length} done</span></div>
      ${goals.map((g,i)=>`<label class="goal ${g.done?'done':''}"><input type="checkbox" ${g.done?'checked':''} data-act="goal" data-i="${i}"><span>${g.t}</span></label>`).join('')}</div>
    <div class="panel" style="margin-top:14px"><div class="p-head"><h3>Signals</h3></div>
      ${improving.map(x=>`<p style="font-size:13px;padding:4px 0">▲ <b>${SUBJECTS[x.s].short}</b> is improving <span class="mono dim">(${round1(x.tr.s)}/assess)</span></p>`).join('')}
      ${declining.map(x=>`<p style="font-size:13px;padding:4px 0">▼ <b>${SUBJECTS[x.s].short}</b> needs attention <span class="mono dim">(${round1(x.tr.s)}/assess)</span></p>`).join('')}
      ${strongest?`<p style="font-size:13px;padding:4px 0">★ Strongest topic: <b>${strongest.topic}</b> (${SUBJECTS[strongest.sub].short}, ${Math.round(strongest.avg)}%)</p>`:''}
      ${oppOf(st).length?`<div style="margin-top:8px">${oppOf(st).map(o=>`<span class="chip up" style="margin:2px">${o}</span>`).join('')}</div>`:''}</div>
   </div></div>`}
function vStuAnalytics(){const st=DB.byId[state.meId],sub=state.anaSub,ts=topicsOf(st,sub),pr=prereqNote(st,sub);
  const s=series(st,sub).map(a=>a.marks),tr=trendOf(s),gain=learningGain(s[0],s[s.length-1]);
  const filterHtml=`<div class="filters">${SUBJ.map(x=>(`<button class="rtab ${x===sub?'on':''}" data-act="anasub" data-sub="${x}">${SUBJECTS[x].short}</button>`)).join('')}</div>`;
  const sl = statline([['Subject average',Math.round(mean(s))+'%',SUBJECTS[sub].color],['Trend',tr.txt+' ('+round1(tr.s)+')',tr.s>=0?'var(--teal)':'var(--coral)'],['Volatility (σ)',round1(tr.v),tr.v>=10?'var(--amber)':''],['Learning gain since Sep',(gain.raw>=0?'+':'')+gain.raw+' pts',gain.raw>=0?'var(--teal)':'var(--coral)']]);
  return `${vh('Subject analytics','Topic mastery · trajectory · learning gain',filterHtml)}
  ${sl}
  <div class="grid g-21">
   <div class="panel"><div class="p-head"><h3>Topic mastery — ${SUBJECTS[sub].name}</h3><span class="kick">classified, not ranked</span></div>
    ${ts.map(t=>{const c=t.cls==='strength'?'var(--teal)':t.cls==='weakness'?'var(--coral)':t.cls==='declining'?'var(--amber)':'var(--sky)';
      const tag=t.cls==='strength'?'<span class="chip up">strength</span>':t.cls==='weakness'?'<span class="chip down">weakness</span>':
        t.cls==='declining'?'<span class="chip warn">declining</span>':t.cls==='recovering'?'<span class="chip up">recovering</span>':
        t.cls==='volatile'?'<span class="chip warn">volatile</span>':'';
      return `<div class="barrow"><span>${t.topic} <span class="mono dim" style="font-size:10px">×${t.n}</span></span>
        <div class="bar"><i style="width:${t.avg}%;background:${c}"></i></div><span class="bv">${Math.round(t.avg)}%</span>${tag||'<span></span>'}</div>`}).join('')}
    ${pr?`<div style="margin-top:14px;padding:12px;border:1px dashed rgba(242,184,75,.4);border-radius:10px;font-size:12.5px"><span class="kick">prerequisite link</span><br>${pr}</div>`:''}</div>
   <div class="panel"><div class="p-head"><h3>Assessment history</h3></div>
    ${lineChart([{name:SUBJECTS[sub].short,color:SUBJECTS[sub].color,data:s}],A_DATES.map(d=>MON[+d.slice(5,7)-1]))}
    <div style="margin-top:12px">${series(st,sub).map((a,i)=>`<div class="mono" style="font-size:11px;color:var(--mut);padding:3px 0;display:flex;justify-content:space-between"><span>${fDs(a.date)} · ${a.type} · ${a.topic}</span><b style="color:var(--ink)">${a.marks}%</b></div>`).join('')}</div></div></div>`}
function vHeatmap(st,isParent){st=st||DB.byId[state.meId];const hs=heatStats(st);
  return `${vh(isParent?'Attendance & activity':'365-day learning activity','Each cell is one day · hover for the full record',
   `<div class="filters">${[['all','All activity'],['attendance','Attendance'],['assignments','Assignments'],['tests','Tests'],['study','Study']].map(f=>
     `<button class="rtab ${state.heatFilter===f[0]?'on':''}" data-act="heatf" data-f="${f[0]}">${f[1]}</button>`).join('')}</div>`)}
  ${statline([['Days present',hs.present,'var(--teal)',hs.rate+'% of school days'],['Active learning days',hs.active],['Current streak',hs.streak+' days','var(--amber)'],['Legend','0 → 5','','no record → strong engagement']])}
  <div class="panel"><div class="p-head"><h3>${st.name} · Aug 2025 – Aug 2026</h3>
    <div class="hleg">less <span class="hcell" style="display:inline-block"></span><span class="hcell v2" style="display:inline-block"></span><span class="hcell v3" style="display:inline-block"></span><span class="hcell v5" style="display:inline-block"></span> more · <span class="hcell ab" style="display:inline-block"></span> absent</div></div>
   ${heatmap(st,state.heatFilter)}</div>`}
function vPredictions(){const st=DB.byId[state.meId];
  return `${vh('Estimated A/L outcomes','Baseline deterministic model · predictions are estimates, not certainties','<span class="chip warn">DEMO MODEL v0.4</span>')}
  <div style="display:flex;flex-direction:column;gap:14px">${SUBJ.map(sub=>{const p=predict(st,sub);
   if(p.insufficient)return `<div class="panel"><b>${SUBJECTS[sub].name}</b> — not enough evidence for a reliable prediction.</div>`;
   return `<div class="panel"><div class="grid g-21">
    <div><div class="p-head"><h3>${SUBJECTS[sub].name}</h3><span class="kick">confidence ${p.conf.toLowerCase()} · ${p.confN}</span></div>
      <div class="pred-scores">
       <div><div class="mono dim" style="font-size:10px">CURRENT</div><div class="mono" style="font-size:30px;font-weight:700">${Math.round(mean(series(st,sub).map(a=>a.marks)))}%</div></div>
       <div><div class="mono dim" style="font-size:10px">ESTIMATED OUTCOME</div><div class="mono amberc" style="font-size:30px;font-weight:700">${p.range}</div></div>
       <div><div class="mono dim" style="font-size:10px">MODEL SCORE</div><div class="mono" style="font-size:30px;font-weight:700">${p.p}%</div></div></div>
      <div class="pred-signals">
       <div><div class="kick" style="color:var(--teal)">positive signals</div>${p.pos.map(x=>`<p style="font-size:12.5px;padding:3px 0">+ ${x}</p>`).join('')||'<p class="dim" style="font-size:12.5px">none detected</p>'}</div>
       <div><div class="kick" style="color:var(--coral)">negative signals</div>${p.neg.map(x=>`<p style="font-size:12.5px;padding:3px 0">− ${x}</p>`).join('')||'<p class="dim" style="font-size:12.5px">none detected</p>'}</div></div></div>
    <div><div class="kick" style="margin-bottom:10px">feature influence</div>
     ${p.feats.map(f=>`<div class="barrow"><span style="font-size:12px">${f.k}</span>
       <div class="bar"><i style="width:${clamp(f.v,4,100)}%;background:${f.dir==='+'?'var(--teal)':f.dir==='-'?'var(--coral)':'var(--sky)'}"></i></div>
       <span class="chip">${f.imp}</span></div>`).join('')}
     <div style="margin-top:12px">
      <div class="kick" style="margin-bottom:6px">what-if · scenario simulation</div>
      <input type="range" min="-15" max="15" value="0" style="width:100%;accent-color:var(--amber)" data-act="whatif" data-sub="${sub}">
      <div class="mono dim" id="wif-${sub}" style="font-size:11px;margin-top:6px">Drag to simulate a change in this subject.</div>
      <div class="mono dim" style="font-size:9.5px;margin-top:6px;letter-spacing:.08em">SCENARIO SIMULATION — NOT A GUARANTEED OUTCOME</div></div></div></div></div>`}).join('')}</div>`}
function vRecs(st){st=st||DB.byId[state.meId];const rs=DB.recs.filter(r=>r.sid===st.id);
  const groups=[['student','For you'],['teacher','For your teachers'],['institution','For the institution'],['parent','For your parents']];
  return `${vh('Recommendations','Every recommendation carries an evidence trail — open “Why?”','')}
  ${groups.map(g=>{const list=rs.filter(r=>r.aud===g[0]);if(!list.length)return'';
    return `<div style="margin-bottom:18px"><div class="kick" style="margin-bottom:8px">${g[1]}</div>${list.map(recCard).join('')}</div>`}).join('')}`}
function vGoals(){const st=DB.byId[state.meId],goals=DB.goals[st.id]||(DB.goals[st.id]=[{t:'Review this week\'s weakest topic for 40 minutes',done:false},{t:'Complete one past-paper section under timed conditions',done:false}]);
  const done=goals.filter(g=>g.done).length;
  return `${vh('My goals','Small, specific, trackable — checked goals feed the engagement model','')}
  <div class="grid g-21"><div class="panel"><div class="p-head"><h3>This week</h3><span class="mono dim" style="font-size:11px">${done}/${goals.length}</span></div>
   <div class="progbar"><i style="width:${goals.length?done/goals.length*100:0}%"></i></div>
   ${goals.map((g,i)=>`<label class="goal ${g.done?'done':''}"><input type="checkbox" ${g.done?'checked':''} data-act="goal" data-i="${i}"><span>${g.t}</span></label>`).join('')}
   <div style="display:flex;gap:8px;margin-top:14px"><input id="newGoal" placeholder="Add a goal…" style="flex:1;background:var(--bg2);border:1px solid var(--line2);border-radius:9px;color:var(--ink);padding:9px 12px;font:500 13px var(--body)"><button class="btn pri sm" data-act="addgoal">Add</button></div></div>
  <div class="panel"><div class="p-head"><h3>Why goals matter here</h3></div><p style="font-size:13px;color:var(--mut)">Goal completion is one of the engagement signals the analysis agent weighs — alongside attendance and assignment completion. It is evidence of momentum, not a judgement of character.</p></div></div>`}
function ivCard(iv,st){st=st||DB.byId[iv.sid];
  const steps=['Proposed','Approved','Active','Completed','Measured'];
  const idx={proposed:0,approved:1,active:2,completed:3,'completed-effective':4,'completed-partial':4,'completed-review':4,rejected:0}[iv.status]??0;
  return `<div class="panel" style="margin-bottom:12px">
   <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
    <div><b style="font:700 14px var(--disp)">${iv.program}</b>
     <div class="mono dim" style="font-size:11px;margin-top:3px">${st?st.name+' · ':''}${iv.id} · proposed ${fDs(iv.proposedOn)}${iv.by?' · by '+iv.by:''}</div></div>
    <div>${iv.status.includes('effective')?'<span class="chip up">EFFECTIVE</span>':iv.status.includes('partial')?'<span class="chip warn">PARTIAL GAIN</span>':iv.status.includes('review')?'<span class="chip down">NEEDS REVIEW</span>':iv.status==='active'?'<span class="chip info">ACTIVE</span>':iv.status==='approved'?'<span class="chip info">APPROVED</span>':'<span class="chip warn">PROPOSED</span>'}</div></div>
   <div class="stepper">${steps.map((s,i)=>`<div class="step ${i<idx?'done':i===idx&&iv.status!=='rejected'?(iv.status.includes('completed')?'done':'now'):''}">${s}</div>`).join('')}</div>
   <p style="font-size:12.5px;color:var(--mut)">${iv.why||''}</p>
   <div style="display:flex;gap:12px;align-items:center;margin-top:10px;flex-wrap:wrap">
    <span class="mono dim" style="font-size:11px">${iv.progress||''}</span>
    ${iv.pre!=null?`<span class="mono" style="font-size:11px">pre: <b>${iv.pre}%</b></span>`:''}
    ${iv.post!=null?`<span class="mono" style="font-size:11px">post: <b>${iv.post}%</b></span>
      <span class="gain-badge ${iv.post-iv.pre<0?'neg':''}">learning gain ${iv.post-iv.pre>=0?'+':''}${round1(iv.post-iv.pre)} pts</span>`:
      (iv.status==='active'||iv.status==='approved')?`<button class="btn sm" data-act="recordpost" data-iv="${iv.id}">Record post-assessment</button>`:''}
   </div></div>`}
function vInterventions(){const st=DB.byId[state.meId];
  return `${vh('Interventions','The full chain: proposed → approved → active → measured','')}
  ${DB.interventions.filter(i=>i.sid===st.id).map(i=>ivCard(i)).join('')||'<div class="panel">No interventions recorded.</div>'}`}
function vTimeline(){const st=DB.byId[state.meId],tl=DB.timeline[st.id]||[{d:'SEP 2025',t:'Joined A/L programme'}];
  return `${vh('Growth timeline',st.name+' — the story so far','')}
  <div class="panel"><div class="tl">${tl.map(e=>`<div class="tl-item"><div class="td">${e.d}</div><p>${e.t}</p></div>`).join('')}</div></div>`}

/* ---- Parent ---- */
function vParOverview(){const st=DB.byId[state.meId],wk=weakTopics(st)[0];
  return `${vh('A calm summary of Kavindu\'s progress','Written by the Parent Communication Agent — plain language, no jargon','<span class="chip info">parent view</span>')}
  <div class="panel" style="border-left:3px solid var(--amber)"><p style="font-size:15px;line-height:1.7">
   Kavindu's attendance and effort remain <b class="tealc">strong</b> (${st.att}% attendance, ${st.asg}% assignment completion).
   Combined Mathematics and Chemistry are <b>steady</b>. Physics performance has <b class="coral">gradually decreased</b> across recent assessments,
   and the decline is concentrated in <b>Mechanics</b>. A targeted support session has been proposed and is awaiting approval.
   ${wk?`Current evidence suggests this is about one topic, not about Kavindu's overall ability or effort.`:''}</p></div>
  <div class="grid g-21" style="margin-top:14px">
   <div class="panel"><div class="p-head"><h3>Subject trend</h3></div>
    ${lineChart(SUBJ.map(s=>({name:SUBJECTS[s].short,color:SUBJECTS[s].color,data:series(st,s).map(a=>a.marks)})),A_DATES.map(d=>MON[+d.slice(5,7)-1]))}
    <div class="legend">${SUBJ.map(s=>`<span><i style="background:${SUBJECTS[s].color}"></i>${SUBJECTS[s].short}</span>`).join('')}</div></div>
   <div><div class="panel"><div class="p-head"><h3>Good news</h3></div>
     <p style="font-size:13.5px;padding:3px 0">★ High attendance — ${st.att}% this year</p>
     <p style="font-size:13.5px;padding:3px 0">★ Assignment completion ${st.asg}%</p>
     <p style="font-size:13.5px;padding:3px 0">★ Chemistry trending gently upward</p></div>
    <div class="panel" style="margin-top:14px"><div class="p-head"><h3>How you can help</h3><span class="kick">gentle, specific</span></div>
     ${DB.recs.filter(r=>r.sid===st.id&&r.aud==='parent').map(r=>`<p style="font-size:13px;padding:6px 0">• ${r.detail}</p>`).join('')}
     <p class="mono dim" style="font-size:10px;margin-top:8px">SUGGESTIONS, NOT PRESSURE</p></div></div></div>`}
function vParProgress(){const st=DB.byId[state.meId];
  return `${vh('Academic progress','Term-by-term, in plain terms','')}
  <div class="grid g-3">${SUBJ.map(sub=>{const s=series(st,sub).map(a=>a.marks),tr=trendOf(s);
   return `<div class="panel"><div class="kick">${SUBJECTS[sub].name}</div>
    <div class="mono" style="font-size:34px;font-weight:700;color:${SUBJECTS[sub].color};margin:8px 0">${Math.round(mean(s))}%</div>
    ${trendChip(tr)}<div style="margin-top:10px">${spark(s,SUBJECTS[sub].color,200,40)}</div>
    <p style="font-size:12.5px;color:var(--mut);margin-top:8px">${tr.s<=-.8?'Performance has gradually decreased across recent assessments.':tr.s>=.8?'Performance has improved steadily.':'Performance has been consistent.'}</p></div>`}).join('')}</div>`}
function vParAlerts(){return `${vh('Alerts','Only important items — we do not spam','')}
  <div class="panel">${DB.notifs.PARENT.map(n=>`<div class="nd-item" style="padding:14px 4px"><span class="sev" style="background:${sevColor(n.sev)}"></span><div><b style="font-size:13.5px">${n.t}</b><div class="mono dim" style="font-size:10.5px">${n.d} · ${n.sev}</div></div></div>`).join('')}</div>`}
function vParSupport(){const st=DB.byId[state.meId];
  return `${vh('Support at home','Evidence-based, reasonable suggestions','')}
  <div class="grid g-2">${DB.recs.filter(r=>r.sid===st.id&&r.aud==='parent').map(recCard).join('')}
   <div class="panel tight"><b style="font:700 13.5px var(--disp)">Things to avoid</b>
    <p style="font-size:13px;color:var(--mut);margin-top:6px">• Prescribing fixed study hours without context<br>• Comparing with other students<br>• Treating one test result as a verdict</p></div></div>`}

/* ---- Teacher ---- */
function classStats(cls){const sts=DB.students.filter(s=>s.cls===cls);let imp=0,dec=0,stab=0,hi=0;
  sts.forEach(s=>{const tr=trendOf(SUBJ.flatMap(x=>series(s,x).map(a=>a.marks)));
    if(tr.s>=.8)imp++;else if(tr.s<=-.8)dec++;else stab++;if(overallAvg(s)>=75&&s.eng>=.65)hi++});
  return{sts,imp,dec,stab,hi}}
function vClasses(){const cls=state.cls||'13-B',c=classStats(cls);
  const classSeries=i=>round1(mean(c.sts.map(s=>{const arr=series(s,'PH');return arr[i]?arr[i].marks:0})));
  return `${vh('Class overview','Aggregate signals for your classes — evidence-based, never teacher-ranking',
   `<div class="filters">${CLASSES.map(x=>`<button class="rtab ${x===cls?'on':''}" data-act="class" data-c="${x}">${x}</button>`).join('')}</div>`)}
  ${statline([['Students',c.sts.length,''],['Improving',c.imp,'var(--teal)'],['Stable',c.stab],['Needs attention',c.dec,'var(--coral)'],['High potential',c.hi,'var(--amber)']])}
  <div class="grid g-21">
   <div class="panel"><div class="p-head"><h3>${cls} · Physics cohort average</h3><span class="kick">8 assessments</span></div>
    ${lineChart([{name:'Class avg',color:'#F2B84B',data:A_DATES.map((_,i)=>classSeries(i))}],A_DATES.map(d=>MON[+d.slice(5,7)-1]))}</div>
   <div class="panel"><div class="p-head"><h3>Topic heatmap · Physics</h3><span class="kick">class mastery</span></div>
    ${SUBJECTS.PH.topics.map(t=>{const vals=c.sts.map(s=>{const ts=topicsOf(s,'PH').find(x=>x.topic===t);return ts?ts.avg:null}).filter(x=>x!=null);
      const m=vals.length?mean(vals):0;const chip=m<55?'<span class="chip down">weak</span>':m<70?'<span class="chip warn">medium</span>':'<span class="chip up">strong</span>';
      return `<div class="barrow"><span style="font-size:12.5px">${t}</span><div class="bar"><i style="width:${m}%;background:${m<55?'var(--coral)':m<70?'var(--amber)':'var(--teal)'}"></i></div><span class="bv">${Math.round(m)}%</span>${chip}</div>`}).join('')}
    <p class="mono dim" style="font-size:10px;margin-top:10px">COHORT DIFFERENCES MAY REFLECT PRIOR KNOWLEDGE & ASSESSMENT DIFFICULTY — NOT TEACHER QUALITY</p></div></div>`}
function studentTable(list,extra){return `<div class="panel tight" style="padding:6px 10px"><table class="tbl">
  <tr><th>Student</th><th>Class</th><th>CM</th><th>PH</th><th>CH</th><th>Trend</th><th>Att.</th><th>Risk</th><th></th></tr>
  ${list.map(s=>{const r=riskOf(s),tr=trendOf(SUBJ.flatMap(x=>series(s,x).map(a=>a.marks)));
   return `<tr class="clk" data-act="open-student" data-sid="${s.id}">
    <td><div class="t-name"><span class="avatar sm" style="--c:${s.color}">${s.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</span><div><b>${s.name}</b><span class="mono dim" style="font-size:10px;display:block">${s.id}</span></div></div></td>
    <td class="num">${s.cls}</td>${SUBJ.map(x=>{const a=subjAvg(s,x);return `<td class="num" style="color:${a<55?'var(--coral)':a>=75?'var(--teal)':'var(--ink)'}">${Math.round(a)}</td>`}).join('')}
    <td>${trendChip(tr)}</td><td class="num">${s.att}%</td><td>${riskChip(r.overall)}</td>
    <td class="mono dim" style="font-size:11px">view →</td></tr>`}).join('')}</table></div>`}
function vStudents(){const f=state.filter||'all';
  let list=[...DB.students];
  if(f==='risk')list=list.filter(s=>riskOf(s).overall==='HIGH');
  else if(f==='improving')list=list.filter(s=>trendOf(SUBJ.flatMap(x=>series(s,x).map(a=>a.marks))).s>=.8);
  else if(f==='potential')list=list.filter(s=>overallAvg(s)>=75&&s.eng>=.65);
  const q=(state.q||'').toLowerCase();if(q)list=list.filter(s=>s.name.toLowerCase().includes(q)||s.id.toLowerCase().includes(q));
  return `${vh('Students',list.length+' students · click any row for the full 360 profile',
   `<div class="filters">${[['all','All'],['risk','At risk'],['improving','Improving'],['potential','High potential']].map(x=>`<button class="rtab ${f===x[0]?'on':''}" data-act="filter" data-f="${x[0]}">${x[1]}</button>`).join('')}</div>`)}
  ${studentTable(list.slice(0,40))}`}
function vTeachInterventions(){return `${vh('Interventions','Across your classes — advisors approve, you record outcomes','')}
  ${DB.interventions.map(iv=>ivCard(iv)).join('')}`}
function vQuality(){return `${vh('Data quality','Data Quality Agent — bad data is quarantined, never silently averaged','')}
  ${DB.dq.map(d=>`<div class="panel tight" style="margin-bottom:10px;border-left:3px solid ${d.sev==='HIGH'?'var(--coral)':d.sev==='MED'?'var(--amber)':'var(--sky)'}">
   <div style="display:flex;justify-content:space-between;gap:10px"><b class="mono" style="font-size:12px">${d.id} · ${d.sev}</b><span class="chip">${d.status}</span></div>
   <p style="font-size:13px;margin-top:6px;color:var(--mut)">${d.txt}</p>
   ${d.status==='Open'?`<button class="btn ghost sm" style="margin-top:8px" data-act="resolvedq" data-id="${d.id}">Mark resolved</button>`:''}</div>`).join('')}`}

/* ---- Advisor ---- */
function vRisk(){const hi=DB.students.filter(s=>riskOf(s).overall==='HIGH'),md=DB.students.filter(s=>riskOf(s).overall==='MEDIUM').slice(0,14);
  const sCard=s=>{const r=riskOf(s);return `<div class="panel tight" style="cursor:pointer" data-act="open-student" data-sid="${s.id}">
   <div class="t-name"><span class="avatar sm" style="--c:${s.color}">${s.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</span><div><b>${s.name}</b><span class="mono dim" style="font-size:10px;display:block">${s.cls} · avg ${Math.round(overallAvg(s))}% · att ${s.att}%</span></div></div>
   <div style="margin-top:8px;display:flex;gap:5px;flex-wrap:wrap">${r.subs.filter(x=>x.lv!=='LOW').map(x=>`<span class="chip ${x.lv==='HIGH'?'hi':'md'}">${SUBJECTS[x.sub].short}</span>`).join('')}${r.attLv!=='LOW'?`<span class="chip ${r.attLv==='HIGH'?'hi':'md'}">attendance</span>`:''}</div></div>`};
  return `${vh('Risk board','Multi-dimensional risk — each signal carries its own evidence','')}
  <div class="grid g-2"><div><div class="kick" style="margin-bottom:8px">HIGH — prioritise (${hi.length})</div>${hi.slice(0,8).map(sCard).join('')}</div>
  <div><div class="kick" style="margin-bottom:8px">MEDIUM — monitor (${md.length})</div>${md.map(sCard).join('')}</div></div>`}
function vApprovals(){const pend=DB.approvals.filter(a=>a.status==='pending');
  return `${vh('Approvals','Human-in-the-loop: you approve, modify or reject AI proposals','<span class="chip">'+pend.length+' pending</span>')}
  ${pend.map(a=>{const iv=DB.interventions.find(i=>i.id===a.ivId),st=DB.byId[a.sid];
   const rc=DB.recs.find(r=>r.sid===a.sid&&r.aud==='institution');
   return `<div class="panel" style="margin-bottom:14px"><div class="p-head"><h3>${iv.program}</h3><span class="chip warn">pending review</span></div>
   <div class="mono dim" style="font-size:11px;margin-bottom:8px">${st.name} · ${st.cls} · raised ${fDs(a.raised)} · ${iv.id}</div>
   <p style="font-size:13px;color:var(--mut)">${iv.why}</p>
   ${rc?`<div style="margin-top:10px;border:1px dashed var(--line2);border-radius:10px;padding:12px">
     <div class="kick" style="margin-bottom:6px">evidence (verified by Evidence Agent)</div>
     ${rc.evidence.map(e=>`<div class="mono" style="font-size:11px;color:var(--mut);padding:2.5px 0">• ${e}</div>`).join('')}</div>`:''}
   <div style="display:flex;gap:10px;margin-top:14px">
    <button class="btn pri sm" data-act="approve" data-ap="${a.id}">Approve intervention</button>
    <button class="btn danger sm" data-act="reject" data-ap="${a.id}">Reject</button>
    <span class="mono dim" style="font-size:10px;align-self:center">AI assists — you decide</span></div></div>`}).join('')||'<div class="panel">Queue clear — no pending proposals.</div>'}`}
function vAdvInterventions(){return `${vh('Intervention tracking','Outcome measurement is the point — gains close the loop','')}
  ${DB.interventions.map(iv=>ivCard(iv)).join('')}`}

/* ---- Admin ---- */
function vAdminDash(){const avgA=Math.round(mean(DB.students.map(s=>s.att)));
  const hi=DB.students.filter(s=>riskOf(s).overall==='HIGH').length;
  const act=DB.interventions.filter(i=>i.status==='active'||i.status==='approved').length;
  const gains=DB.ivStats.map(x=>x.post-x.pre);
  return `${vh('Institution overview','Aggregated analytics · no unnecessary PII at this level','<span class="chip warn">DEMO DATA</span>')}
  ${statline([['Students',DB.students.length,''],['Avg attendance',avgA+'%','var(--teal)'],['Assessments',DB.assessments.length.toLocaleString(),'var(--sky)'],['Active interventions',act,'var(--amber)'],['Avg learning gain','+'+round1(mean(gains))+' pts','var(--teal)','completed programs'],['High-risk students',hi,'var(--coral)','aggregated count']])}
  <div class="grid g-21">
   <div class="panel"><div class="p-head"><h3>Subject averages · cohort 2026</h3></div>
    ${SUBJ.map(sub=>{const m=round1(mean(DB.students.map(s=>subjAvg(s,sub)||0)));
     return `<div class="barrow"><span>${SUBJECTS[sub].name}</span><div class="bar"><i style="width:${m}%;background:${SUBJECTS[sub].color}"></i></div><span class="bv">${m}%</span><span></span></div>`}).join('')}
    <div class="p-head" style="margin-top:20px"><h3>Support utilisation</h3></div>
    ${SUPPORT.slice(0,6).map(p=>`<div class="barrow"><span style="font-size:12px">${p.name}</span><div class="bar"><i style="width:${p.taken/p.capacity*100}%;background:var(--sky)"></i></div><span class="bv">${p.taken}/${p.capacity}</span><span class="mono dim" style="font-size:10px">${p.schedule}</span></div>`).join('')}</div>
   <div><div class="panel"><div class="p-head"><h3>Risk distribution</h3></div>
     ${['HIGH','MEDIUM','LOW'].map(lv=>{const n=DB.students.filter(s=>riskOf(s).overall===lv).length;
      return `<div class="barrow"><span>${lv}</span><div class="bar"><i style="width:${n/DB.students.length*100}%;background:${lv==='HIGH'?'var(--coral)':lv==='MEDIUM'?'var(--amber)':'var(--teal)'}"></i></div><span class="bv">${n}</span><span></span></div>`}).join('')}
     <p class="mono dim" style="font-size:10px;margin-top:8px">SMALL CELLS SUPPRESSED · NO INDIVIDUAL PII</p></div>
    <div class="panel" style="margin-top:14px"><div class="p-head"><h3>System signal</h3></div>
     <p style="font-size:13px;color:var(--mut)">Learning gains differ between support programs (+7 to +17 points). Current evidence suggests reviewing Mechanics Workshop capacity — demand exceeds seats.</p></div></div></div>`}
function vAdminAnalytics(){return `${vh('Learning analytics · intervention effectiveness','Students who participated improved by… — participation, not causation, unless methodology supports it','')}
  <div class="panel tight" style="padding:6px 12px"><table class="tbl">
   <tr><th>Program</th><th>Participants</th><th>Avg before</th><th>Avg after</th><th>Avg gain</th><th>Signal</th></tr>
   ${DB.ivStats.map(x=>{const g=x.post-x.pre;return `<tr><td><b>${x.prog}</b></td><td class="num">${x.n}</td><td class="num">${x.pre}%</td><td class="num">${x.post}%</td>
    <td class="num" style="color:var(--teal);font-weight:700">+${g}</td>
    <td>${x.n<20?'<span class="chip warn">small sample</span>':g>=14?'<span class="chip up">strong gain</span>':'<span class="chip info">moderate</span>'}</td></tr>`}).join('')}</table></div>
  <p class="mono dim" style="font-size:10px;margin-top:10px">WORDING IS DELIBERATE: “PARTICIPANTS IMPROVED” ≠ “THE PROGRAM CAUSED IMPROVEMENT” WITHOUT A COMPARISON DESIGN.</p>`}
function vAdminSupport(){return `${vh('Support programs','Knowledge base the Recommendation Agent matches against','')}
  <div class="grid g-3">${SUPPORT.map(p=>`<div class="panel"><div class="kick">${p.subject}</div>
   <b style="font:700 14px var(--disp);display:block;margin:6px 0">${p.name}</b>
   <p style="font-size:12px;color:var(--mut)">Target: ${p.target}<br>${p.schedule} · ${p.teacher}</p>
   <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center">
    <span class="mono" style="font-size:11px">${p.taken}/${p.capacity} seats</span>
    <span class="chip ${p.capacity-p.taken<=3?'warn':'lo'}">${p.capacity-p.taken} left</span></div>
   <div class="mono dim" style="font-size:10px;margin-top:8px">OUTCOME: ${p.outcome}</div></div>`).join('')}</div>`}
function vAdminAI(){return `${vh('AI observability','Structured traces only — no private chain-of-thought is stored','<span class="chip">9 agents · routed events</span>')}
  <div class="panel" style="margin-bottom:14px"><div class="p-head"><h3>Orchestration</h3></div>
   <div class="loopline" style="margin-top:6px">${['USER / EVENT','ORCHESTRATOR','SPECIALIST AGENTS','REASONING','GUARDRAIL','FINAL OUTPUT'].map((s,i)=>`<div class="lstage"><div class="n">0${i+1}</div><h4>${s}</h4></div>`).join('')}</div></div>
  ${statline([['Agent runs today',DB.agentRuns.length,''],['Withheld by guardrail',3,'var(--amber)','insufficient evidence'],['Causal-claim blocks',3,'var(--coral)'],['Avg latency','262 ms','var(--teal)']])}
  <div class="panel tight" style="padding:6px 12px"><table class="tbl">
   <tr><th>Time</th><th>Agent</th><th>Trigger</th><th>Tools</th><th>Latency</th><th>Status</th></tr>
   ${DB.agentRuns.map(r=>`<tr><td class="num">${r.t}</td><td><b>${r.agent}</b></td><td class="mono dim" style="font-size:11px">${r.trig}</td><td class="mono dim" style="font-size:11px">${r.tools}</td><td class="num">${r.ms} ms</td><td>${r.st.startsWith('OK')?'<span class="chip up">OK</span>':'<span class="chip warn">'+r.st+'</span>'}</td></tr>`).join('')}</table></div>`}
function vAudit(){return `${vh('Audit log','Who did what, when, to which student, and why','')}
  <div class="panel tight" style="padding:6px 12px"><table class="tbl">
   <tr><th>Actor</th><th>Role</th><th>Action</th><th>When</th><th>Why</th></tr>
   ${DB.audit.map(a=>`<tr><td><b>${a.who}</b></td><td><span class="chip">${a.role}</span></td><td style="font-size:12.5px">${a.act}</td><td class="mono dim" style="font-size:11px">${a.when}</td><td style="font-size:12.5px;color:var(--mut)">${a.why}</td></tr>`).join('')}</table></div>`}
function vh(t,sub,right=''){return `<div class="vh"><div><div class="kick">${ROLE_LABEL[state.role]||''} workspace</div><h2>${t}</h2>${sub?`<div class="sub">${sub}</div>`:''}</div><div class="vh-actions">${right}</div></div>`}
const ROLE_LABEL={STUDENT:'Student',PARENT:'Parent',TEACHER:'Teacher',ADVISOR:'Advisor',ADMIN:'Administrator'};

function renderApp(){
  const nav=NAVS[state.role];$('#sbNav').innerHTML='<div class="nv-sec">'+ROLE_LABEL[state.role]+' · Pragna</div>'+
    nav.map(n=>`<button class="nv ${state.view===n[0]?'on':''}" data-act="nav" data-v="${n[0]}">${ic(n[2])}<span>${n[1]}</span></button>`).join('');
  const u=ROLE_USERS[state.role];
  $('#sbUser').innerHTML=`<span class="avatar" style="--c:var(--amber)">${u.n.split(' ').map(x=>x[0]).join('').slice(0,2)}</span><div><b>${u.n}</b><span class="mono dim">${u.d}</span></div>`;
  const item=nav.find(n=>n[0]===state.view);$('#crumb').innerHTML=`PRAGNA / ${ROLE_LABEL[state.role].toUpperCase()} / <b>${item?item[1]:''}</b>`;
  $('#btnAddAssess').classList.toggle('hidden',!['TEACHER','ADMIN'].includes(state.role));
  $('#bellBtn').innerHTML=ic('bell')+((DB.notifs[state.role]||[]).length?'<span class="bdot"></span>':'');
  $('#chatBtn').innerHTML=ic('chat');
  const V=state.role+':'+state.view;let html='';
  if(state.role==='STUDENT')html={overview:vStuOverview,analytics:vStuAnalytics,heatmap:()=>vHeatmap(),predictions:vPredictions,recommendations:()=>vRecs(),goals:vGoals,interventions:vInterventions,timeline:vTimeline}[state.view]?.()||vStuOverview();
  else if(state.role==='PARENT')html={overview:vParOverview,progress:vParProgress,attendance:()=>vHeatmap(DB.byId[state.meId],true),alerts:vParAlerts,support:vParSupport}[state.view]?.()||vParOverview();
  else if(state.role==='TEACHER')html={classes:vClasses,students:vStudents,interventions:vTeachInterventions,quality:vQuality}[state.view]?.()||vClasses();
  else if(state.role==='ADVISOR')html={risk:vRisk,students:vStudents,approvals:vApprovals,interventions:vAdvInterventions}[state.view]?.()||vRisk();
  else html={dashboard:vAdminDash,analytics:vAdminAnalytics,interventions:vTeachInterventions,support:vAdminSupport,ai:vAdminAI,audit:vAudit}[state.view]?.()||vAdminDash();
  const v=$('#view');v.innerHTML=html;bindChartHover(v);
  requestAnimationFrame(()=>v.querySelectorAll('.bar i,.progbar i').forEach(el=>{const w=el.style.width;el.style.width='0%';requestAnimationFrame(()=>el.style.width=w)}))}

/* ═════════════════════════ 8 · DRAWER / MODALS / CHAT ════════════ */
function openDrawer(sid){const st=DB.byId[sid];if(!st)return;state.drawerSid=sid;
  const r=riskOf(st),opps=oppOf(st),acts=DB.activities[sid]||[],tl=DB.timeline[sid];
  $('#drawer').innerHTML=`
   <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div class="t-name"><span class="avatar" style="--c:${st.color}">${st.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</span>
     <div><b style="font:700 18px var(--disp)">${st.name}</b><span class="mono dim" style="font-size:11px;display:block">${st.id} · ${st.cls} · ${st.stream} · A/L 2026</span></div></div>
    <button class="icon-btn" data-act="close-drawer">${ic('x')}</button></div>
   <div style="display:flex;gap:6px;margin:14px 0;flex-wrap:wrap">${riskChip(r.overall)}${['HIGH','MEDIUM'].includes(r.overall)?'':'<span class="chip lo">no urgent flags</span>'}${opps.length?'<span class="chip up">high potential</span>':''}${st.flagship?`<span class="chip info">scenario ${st.flagship}</span>`:''}</div>
   <div class="panel tight">${SUBJ.map(s=>subjRowHTML(st,s)).join('')}</div>
   <div class="kick" style="margin:16px 0 8px">risk dimensions · with evidence</div>
   <div class="panel tight">${[['Academic',r.acadLv],['Attendance',r.attLv],['Engagement',r.engLv]].map(x=>`<div class="barrow"><span>${x[0]}</span><span></span>${riskChip(x[1])}</div>`).join('')}
    ${r.subs.map(x=>`<div class="barrow"><span>${SUBJECTS[x.sub].short}</span><span class="mono dim" style="font-size:10.5px">${x.ev.join(' · ')}</span>${riskChip(x.lv)}</div>`).join('')}</div>
   ${opps.length?`<div class="kick" style="margin:16px 0 8px">opportunity engine</div><div class="panel tight">${opps.map(o=>`<p style="font-size:13px;padding:3px 0">✦ ${o}</p>`).join('')}</div>`:''}
   <div class="kick" style="margin:16px 0 8px">predictions · demo model v0.4</div>
   <div class="panel tight">${SUBJ.map(sub=>{const p=predict(st,sub);return p.insufficient?
     `<div class="barrow"><span>${SUBJECTS[sub].short}</span><span class="dim" style="font-size:12px">insufficient evidence</span></div>`:
     `<div class="barrow"><span>${SUBJECTS[sub].short}</span><span></span><span class="mono amberc" style="font-weight:700">${p.range}</span><span class="chip">${p.conf}</span></div>`}).join('')}</div>
   ${tl?`<div class="kick" style="margin:16px 0 8px">timeline</div><div class="panel tight"><div class="tl">${tl.map(e=>`<div class="tl-item"><div class="td">${e.d}</div><p>${e.t}</p></div>`).join('')}</div></div>`:''}
   ${acts.length?`<div class="kick" style="margin:16px 0 8px">activities · treated as evidence, not credit</div><div class="panel tight">${acts.map(a=>`<p style="font-size:13px;padding:3px 0">${a.name} <span class="chip" style="margin-left:6px">${a.kind}</span></p>`).join('')}</div>`:''}
   ${DB.recs.filter(x=>x.sid===sid).length?`<div class="kick" style="margin:16px 0 8px">recommendations</div>${DB.recs.filter(x=>x.sid===sid).map(recCard).join('')}`:''}
   <div style="display:flex;gap:10px;margin-top:16px">${['TEACHER','ADVISOR','ADMIN'].includes(state.role)?`<button class="btn pri sm" data-act="view-heatmap" data-sid="${sid}">365-day activity</button>`:''}
    <button class="btn ghost sm" data-act="close-drawer">Close</button></div>`;
  $('#drawerWrap').classList.remove('hidden');
  DB.audit.unshift({who:ROLE_USERS[state.role].n,role:state.role,act:`Viewed Student 360 · ${sid}`,when:'17 Aug 2026 '+new Date().toTimeString().slice(0,5),why:'Profile review'});
  bindChartHover($('#drawer'))}
function openWhy(recId){const r=DB.recs.find(x=>x.id===recId);if(!r)return;const st=DB.byId[r.sid];
  openModal(`<div class="m-head"><div><div class="kick">Evidence · Explainability Agent</div><h3 style="font:700 17px var(--disp);margin-top:4px">Why this recommendation?</h3></div>
   <button class="icon-btn" data-act="close-modal">${ic('x')}</button></div>
   <p style="font-size:13.5px;margin-bottom:12px"><b>${r.title}</b> — for ${st?st.name:'student'}</p>
   ${r.evidence.map((e,i)=>`<div class="ev-li" style="display:flex;gap:10px;padding:8px 0;border-bottom:1px dashed var(--line);font-size:13px"><span class="mono amberc" style="font-size:11px">${i+1}.</span><span style="color:var(--mut)">${e}</span></div>`).join('')}
   <div style="margin-top:14px;padding:12px;border:1px solid rgba(53,211,162,.3);border-radius:10px;background:rgba(53,211,162,.05)">
    <div class="kick" style="color:var(--teal)">conclusion</div><p style="font-size:13px;margin-top:4px">${r.conclusion}</p></div>
   <div class="mono dim" style="font-size:10px;margin-top:12px;letter-spacing:.1em">EVIDENCE IDS EV-1041… LOGGED TO AUDIT · GUARDRAIL PASSED · NO CAUSAL CLAIMS BEYOND EVIDENCE</div>`)}
function openModal(html){$('#modal').innerHTML=html;$('#modalWrap').classList.remove('hidden')}
function closeModal(){$('#modalWrap').classList.add('hidden')}
function closeDrawer(){$('#drawerWrap').classList.add('hidden');state.drawerSid=null}

/* assessment modal + agent pipeline */
function openAssessModal(){const st=DB.byId[state.meId]||DB.students[0];
  openModal(`<div class="m-head"><div><div class="kick">Assessment entry</div><h3 style="font:700 17px var(--disp);margin-top:4px">Add assessment result</h3></div>
   <button class="icon-btn" data-act="close-modal">${ic('x')}</button></div>
   <div class="form-row"><label>Student</label><select id="fSt">${DB.students.slice(0,30).map(s=>`<option value="${s.id}" ${s.id===state.meId?'selected':''}>${s.name} (${s.id})</option>`).join('')}</select></div>
   <div class="form-row"><label>Subject</label><select id="fSub">${SUBJ.map(s=>`<option value="${s}">${SUBJECTS[s].name}</option>`).join('')}</select></div>
   <div class="form-row"><label>Topic</label><select id="fTop">${SUBJECTS.CM.topics.map(t=>`<option>${t}</option>`).join('')}</select></div>
   <div class="form-row"><label>Type</label><select id="fType">${['Unit Test','Monthly Test','Term Test','Mock Exam','Quiz','Assignment'].map(t=>`<option>${t}</option>`).join('')}</select></div>
   <div style="display:flex;gap:10px"><div class="form-row" style="flex:1"><label>Max marks</label><input id="fMax" type="number" value="100"></div>
   <div class="form-row" style="flex:1"><label>Obtained</label><input id="fGot" type="number" value="45"></div></div>
   <button class="btn pri" style="width:100%;justify-content:center" data-act="submit-assess">Save & run analysis pipeline</button>
   <p class="mono dim" style="font-size:10px;margin-top:10px">VALIDATION BY DATA QUALITY AGENT · IMPOSSIBLE VALUES ARE QUARANTINED, NEVER AVERAGED</p>`)}
function syncTopics(){const sel=$('#fSub');if(!sel)return;$('#fTop').innerHTML=SUBJECTS[sel.value].topics.map(t=>`<option>${t}</option>`).join('')}
function submitAssess(){const sid=$('#fSt').value,sub=$('#fSub').value,topic=$('#fTop').value,type=$('#fType').value;
  const max=+$('#fMax').value||100,got=+$('#fGot').value;
  if(got>max){DB.dq.unshift({id:'DQ-'+ri(10,99),sev:'HIGH',txt:`Assessment (${sid} · ${SUBJECTS[sub].name}): obtained ${got} / max ${max} — impossible value. Quarantined by Data Quality Agent.`,status:'Quarantined'});
    closeModal();toast(`<b>Data Quality Agent</b><br>Impossible value ${got}/${max} detected — record quarantined, nothing was averaged.`,'coral');return}
  const pct=Math.round(got/max*100);
  pushAssess(sid,sub,topic,'2026-08-17',type,pct);
  closeModal();runPipeline(sid,sub,topic,pct)}
function runPipeline(sid,sub,topic,pct){if(state.pipelineBusy)return;state.pipelineBusy=true;
  const t=document.createElement('div');t.className='toast pipe';
  const steps=['Data Quality Agent · validate record','Student Analysis Agent · recalculate trends','Prediction Agent · update trajectory (model v0.4)','Risk Engine · re-evaluate dimensions','Recommendation Agent · match institutional support','Guardrail · evidence & policy check'];
  t.innerHTML=`<b>ASSESSMENT_ADDED → agent pipeline</b><div class="mono dim" style="font-size:10px;margin:2px 0 6px">Analysis in progress…</div>`+steps.map((s,i)=>`<div class="pstep" id="ps${i}">○ ${s}</div>`).join('');
  $('#toasts').appendChild(t);
  steps.forEach((s,i)=>setTimeout(()=>{const el=t.querySelector('#ps'+i);if(el){el.classList.add('ok');el.innerHTML='✓ '+s.split('·')[0]+'<span class="dim">· '+s.split('·')[1]+'</span>'}},450*(i+1)));
  setTimeout(()=>{state.pipelineBusy=false;finishPipeline(sid,sub,topic,pct)},450*steps.length+300)}
function finishPipeline(sid,sub,topic,pct){const st=DB.byId[sid];
  const ts=topicsOf(st,sub).find(x=>x.topic===topic);
  DB.agentRuns.unshift({t:'now',agent:'Orchestrator',trig:'ASSESSMENT_ADDED',tools:'6 agents · routed',ms:ri(600,900),st:'OK',conf:'0.78'});
  DB.audit.unshift({who:'Pipeline',role:'AGENT',act:`Processed new ${sub} assessment for ${sid} (${pct}%)`,when:'17 Aug 2026',why:'ASSESSMENT_ADDED event'});
  if(ts&&ts.avg<55&&ts.slope<=-0.5){
    const ivId='IV-'+ri(110,199),prog=SUPPORT.find(p=>p.subject===sub)||SUPPORT[4];
    DB.interventions.unshift({id:ivId,sid,program:prog.name,programId:prog.id,status:'proposed',proposedOn:'2026-08-17',by:'Recommendation Agent',pre:round1(ts.avg),post:null,progress:'0 of 6 sessions',
      why:`${topic} average ${round1(ts.avg)}% with negative slope (${round1(ts.slope)}); new ${sub} result ${pct}% continues the pattern.`});
    DB.approvals.unshift({id:'AP-'+ri(20,99),sid,ivId,status:'pending',raised:'2026-08-17'});
    DB.recs.unshift({id:'RC-'+ri(300,399),sid,aud:'institution',title:`Enrol in ${prog.name}`,detail:`${prog.schedule} · ${prog.teacher}. Eligibility met: ${topic} below threshold.`,
      evidence:[`${topic} average ${round1(ts.avg)}%`,`Latest assessment ${pct}% on 17 Aug 2026`,`Trend slope ${round1(ts.slope)} per assessment`],conclusion:'Resource match available; awaiting human approval.',match:prog.name});
    toast(`<b>Pipeline complete</b><br>Decline detected in ${topic} (${round1(ts.avg)}%). Intervention proposed → sent to advisor approvals.`,'teal');
  } else toast(`<b>Pipeline complete</b><br>${st.name} · ${SUBJECTS[sub].short} ${topic}: ${pct}% recorded. Profile, trends and predictions updated.`,'teal');
  if(location.hash.startsWith('#/app'))renderApp()}

/* post-assessment → learning gain */
function openPostModal(ivId){const iv=DB.interventions.find(x=>x.id===ivId);
  openModal(`<div class="m-head"><div><div class="kick">Outcome measurement</div><h3 style="font:700 17px var(--disp);margin-top:4px">Record post-assessment</h3></div>
   <button class="icon-btn" data-act="close-modal">${ic('x')}</button></div>
   <p style="font-size:13px;color:var(--mut);margin-bottom:12px">${iv.program} · pre-intervention baseline: <b class="mono">${iv.pre}%</b></p>
   <div class="form-row"><label>Post-intervention score (%)</label><input id="fPost" type="number" value="${Math.min(98,(iv.pre||50)+12)}"></div>
   <button class="btn pri" style="width:100%;justify-content:center" data-act="submit-post" data-iv="${ivId}">Calculate learning gain</button>`)}
function submitPost(ivId){const iv=DB.interventions.find(x=>x.id===ivId),post=clamp(+$('#fPost').value||0,0,100);
  iv.post=post;const g=learningGain(iv.pre,post);
  iv.status=g.raw>=3?'completed-effective':g.raw>0?'completed-partial':'completed-review';iv.completedOn='2026-08-17';
  const stat=DB.ivStats.find(x=>x.prog===iv.program);
  if(stat){stat.post=round1((stat.post*stat.n+post)/(stat.n+1));stat.n++}
  closeModal();
  DB.agentRuns.unshift({t:'now',agent:'Intervention Tracking',trig:'INTERVENTION_COMPLETED',tools:'calculate_learning_gain',ms:88,st:'OK',conf:'0.9'});
  DB.audit.unshift({who:ROLE_USERS[state.role].n,role:state.role,act:`Recorded post-assessment ${post}% for ${ivId}`,when:'17 Aug 2026',why:'Outcome measurement'});
  toast(`<b>Closed loop ✓</b><br>${iv.program}: ${iv.pre}% → ${post}% · learning gain <b>${g.raw>=0?'+':''}${g.raw} pts</b> (normalized g=${g.g??'—'}). Marked ${iv.status.toUpperCase().replace('COMPLETED-','')}.`,'teal');
  renderApp()}

/* approvals */
function approve(apId){const ap=DB.approvals.find(a=>a.id===apId);if(!ap||ap.status!=='pending')return;
  ap.status='approved';const iv=DB.interventions.find(i=>i.id===ap.ivId);
  if(iv){iv.status='active';iv.startedOn='2026-08-17';iv.progress='0 of 6 sessions'}
  DB.audit.unshift({who:ROLE_USERS[state.role].n,role:state.role,act:`Approved intervention ${iv.id} (${iv.program})`,when:'17 Aug 2026',why:'Human-in-the-loop review'});
  DB.agentRuns.unshift({t:'now',agent:'Intervention Tracking',trig:'INTERVENTION_STARTED',tools:'link_support_program',ms:64,st:'OK',conf:'—'});
  toast(`<b>Intervention approved</b><br>${iv.program} is now ACTIVE for ${DB.byId[iv.sid].name}. The student and parent have been notified.`,'teal');renderApp()}
function reject(apId){const ap=DB.approvals.find(a=>a.id===apId);ap.status='rejected';
  const iv=DB.interventions.find(i=>i.id===ap.ivId);iv.status='rejected';
  toast('Proposal rejected — decision recorded in the audit log.','');renderApp()}

/* ═════════════════════════ 9 · CHAT (tool-grounded) ══════════════ */
const SUGG={STUDENT:['What should I focus on this week?','Why is my Physics declining?','What is my predicted A/L result?'],
 PARENT:['Why has Physics performance changed?','How can I support Kavindu?'],
 TEACHER:['Which students need attention this week?','Why is Kavindu\'s Physics declining?'],
 ADVISOR:['Which interventions should I prioritise?','Who is highest risk right now?'],
 ADMIN:['Which programs produced the largest gains?','Any data quality issues?']};
function chatStudent(){return state.drawerSid?DB.byId[state.drawerSid]:DB.byId[state.meId]||DB.students[0]}
function mentionSub(q){if(/math|comb/.test(q))return'CM';if(/phy|mech/.test(q))return'PH';if(/chem/.test(q))return'CH';return null}
function chatAnswer(q){const Q=q.toLowerCase(),st=chatStudent(),sub=mentionSub(Q);
  const tools=[],blk=[];let agent='Student Analysis Agent';
  const add=(t,res)=>tools.push(`⚙ ${t} → ${res}`);
  if(state.role==='ADMIN'&&/gain|program|effective/.test(Q)){agent='Institutional Analytics Agent';
    add('aggregate_gains(by=program)',DB.ivStats.length+' programs');
    const best=[...DB.ivStats].sort((a,b)=>(b.post-b.pre)-(a.post-a.pre))[0];
    blk.push({h:'Observation',t:`Across completed programs, average learning gains range from +${Math.min(...DB.ivStats.map(x=>x.post-x.pre))} to +${Math.max(...DB.ivStats.map(x=>x.post-x.pre))} points.`},
     {h:'Evidence',l:DB.ivStats.map(x=>`${x.prog}: ${x.pre}% → ${x.post}% (+${x.post-x.pre}, n=${x.n})`)},
     {h:'Interpretation',t:`“${best.prog}” shows the largest observed gain. Participation improved — causality not claimed without a comparison design.`},
     {h:'Recommendation',t:'Consider expanding capacity for the highest-gain program; review small-sample programs before scaling.'});
    return{tools,blk,conf:'High'}}
  if(state.role==='ADVISOR'&&/priorit|intervention/.test(Q)){agent='Intervention Recommendation Agent';
    add('get_intervention_history(status=pending)',DB.approvals.filter(a=>a.status==='pending').length+' pending');
    blk.push({h:'Observation',t:`${DB.approvals.filter(a=>a.status==='pending').length} proposals await review.`},
     {h:'Recommendation',l:DB.approvals.filter(a=>a.status==='pending').map(a=>{const iv=DB.interventions.find(i=>i.id===a.ivId);return `${DB.byId[a.sid].name}: ${iv.program} (${iv.id})`})},
     {h:'Expected outcome',t:'Approved interventions start this week; outcome measured at next assessment.'});
    return{tools,blk,conf:'High'}}
  if(['TEACHER','ADVISOR'].includes(state.role)&&/attention|risk|need/.test(Q)){agent='Risk Engine';
    const hi=DB.students.filter(s=>riskOf(s).overall==='HIGH').slice(0,5);
    add('risk_dimensions(cohort)',hi.length+' HIGH');
    blk.push({h:'Observation',t:`${hi.length} students currently carry HIGH overall risk.`},
     {h:'Evidence',l:hi.map(s=>{const r=riskOf(s);return `${s.name} (${s.cls}): avg ${Math.round(overallAvg(s))}%, attendance ${s.att}%, ${r.subs.filter(x=>x.lv==='HIGH').map(x=>SUBJECTS[x.sub].short+' high risk').join(', ')||'multi-dimension'}`})},
     {h:'Recommendation',t:'Open each profile from the Risk Board; prioritise students with concurrent attendance and academic signals.'});
    return{tools,blk,conf:'High'}}
  if(sub){const p=predict(st,sub),ts=topicsOf(st,sub),weak=ts.filter(t=>t.cls==='weakness'||t.cls==='declining');
    add('get_assessment_history(' + st.id + ', ' + sub + ')',series(st,sub).length+' records');
    add('get_topic_performance(' + st.id + ', ' + sub + ')',ts.length+' topics');
    add('calculate_trend(window=last 4)','slope '+round1(slope(series(st,sub).map(a=>a.marks))));
    agent='Evidence Agent';
    const trS=slope(series(st,sub).map(a=>a.marks));
    blk.push({h:'Observation',t:`${SUBJECTS[sub].name} average moved to ${Math.round(mean(series(st,sub).map(a=>a.marks)))}% (${trS<=-.5?'declining':trS>=.5?'improving':'stable'} across ${series(st,sub).length} assessments).`},
     {h:'Evidence',l:[...weak.slice(0,3).map(t=>`${t.topic}: average ${Math.round(t.avg)}%, slope ${t.slope}`),`Attendance ${st.att}% · assignments ${st.asg}%`]},
     {h:'Interpretation',t:trS<=-.5&&st.att>=90?'The pattern is more closely associated with topic mastery than attendance — current evidence suggests targeted topic work rather than attendance measures.':trS>=.5?'The improvement is consistent across assessments, not a single-test anomaly.':'Performance is broadly stable; monitor the flagged topics.'},
     {h:'Recommendation',t:weak.length?('Prioritise '+weak[0].topic+'; '+(SUPPORT.find(s=>s.subject===sub)?('institution offers '+SUPPORT.find(s=>s.subject===sub).name+' ('+SUPPORT.find(s=>s.subject===sub).schedule+').'):'complete targeted past-paper practice.')):'Maintain current rhythm; add stretch material.'},
     {h:'Expected outcome',t:'Improved performance in the next assessment, measured as learning gain.'},
     {h:'Confidence',t:p.insufficient?'Insufficient evidence for numeric prediction.':p.conf});
    return{tools,blk,conf:p.conf}}
  if(/focus|week|do/.test(Q)&&state.role==='STUDENT'){agent='Intervention Recommendation Agent';
    add('get_student_goals()','weekly plan');add('get_recommendations(aud=student)','top match');
    const r=DB.recs.find(x=>x.sid===st.id&&x.aud==='student');const g=DB.goals[st.id]||[];
    blk.push({h:'Recommendation',l:[...(r?[r.title+' — '+r.detail]:[]),...g.filter(x=>!x.done).map(x=>'Goal: '+x.t)]},
     {h:'Expected outcome',t:'Completing these moves the weakest topic above threshold by the next assessment.'});
    return{tools,blk,conf:'Moderate'}}
  if(/predict|result|outcome|a\/l/.test(Q)){agent='Prediction Agent';add('predict_result(model v0.4)','deterministic');
    blk.push({h:'Observation',t:'Estimated outcomes based on current evidence (demo model v0.4):'},
     {h:'Evidence',l:SUBJ.map(s=>{const p=predict(st,s);return p.insufficient?SUBJECTS[s].short+': insufficient evidence':SUBJECTS[s].short+': '+p.range+' · confidence '+p.conf.toLowerCase()})},
     {h:'Interpretation',t:'These are estimates with stated confidence — never certainties, never labels.'});
    return{tools,blk,conf:'Moderate'}}
  add('get_student_profile('+st.id+')','loaded');
  const overallTr = trendOf(SUBJ.flatMap(x=>series(st,x).map(a=>a.marks))).txt.toLowerCase();
  blk.push({h:'Observation',t:st.name+': overall '+Math.round(overallAvg(st))+'%, attendance '+st.att+'%, '+overallTr+' trajectory.'},
   {h:'Recommendation',t:'Ask about a specific subject (e.g. “Why is Physics declining?”), weekly focus, or predictions.'});
  return{tools,blk,conf:'Moderate'}}
function chatPush(role,text){const b=$('#chatBody');const d=document.createElement('div');d.className='msg '+role;d.innerHTML=text;b.appendChild(d);b.scrollTop=b.scrollHeight;return d}
function chatSend(){const inp=$('#chatIn'),q=inp.value.trim();if(!q)return;inp.value='';
  chatPush('user',q.replace(/</g,'&lt;'));
  const a=chatAnswer(q);
  const holder=chatPush('ai','<span class="mono dim" style="font-size:11px">retrieving evidence…</span>');
  a.tools.forEach((t,i)=>setTimeout(()=>{
    holder.innerHTML=a.tools.slice(0,i+1).map(x=>'<div class="toolstep"><span class="ok">✓</span>'+x.slice(2)+'</div>').join('');
  },250*(i+1)));
  setTimeout(()=>{
    const blkHtml = a.blk.map(b => {
      const content = b.l ? '<ul>' + b.l.map(x => '<li>' + x + '</li>').join('') + '</ul>' : '<div>' + b.t + '</div>';
      return '<div class="blk"><div class="bh">' + b.h + '</div>' + content + '</div>';
    }).join('');
    const confStr = a.conf === 'High' ? 'confidence high' : 'confidence ' + (a.conf || 'moderate').toLowerCase();
    holder.innerHTML = a.tools.map(x => '<div class="toolstep"><span class="ok">✓</span>' + x.slice(2) + '</div>').join('') +
      '<div class="msg-inner" style="margin-top:8px">' + blkHtml +
      '<div class="evfoot"><span class="chip">' + confStr + '</span><span class="chip up">guardrail passed</span><span class="chip">evidence logged</span></div></div>';
    $('#chatBody').scrollTop=1e6;
  },250*a.tools.length+350);}
function openChat(){const c=$('#chat');c.classList.toggle('hidden');
  if(!c.classList.contains('hidden')&&!c._init){c._init=1;
    chatPush('ai','Hello — I am the Pragna Assistant for your <b>'+(ROLE_LABEL[state.role]||'')+'</b> role. I only answer from the demo database with tool calls; I never invent numbers.<div class="evfoot" style="margin-top:8px"><span class="chip warn">demo</span></div>');
    $('#chatSugg').innerHTML=SUGG[state.role].map(s=>'<button data-act="sugg" data-q="'+s+'">'+s+'</button>').join('')}}

/* ═════════════════════════ 10 · LANDING BUILD ════════════════════ */
const LOOP=['OBSERVE','UNDERSTAND','PREDICT','RECOMMEND','INTERVENE','MEASURE','LEARN'];
const QA=[['What is happening?','Current academic and engagement state','Live subject averages, attendance, topic mastery and engagement — updated on every assessment.'],
 ['Why is it happening?','Evidence, not labels','Trend slopes, topic-level breakdowns, prerequisite links and attendance patterns — each claim cites data.'],
 ['What is likely to happen?','Trajectory & estimated A/L outcome','A deterministic baseline model with confidence levels. Insufficient data means “insufficient evidence” — never a fabricated guess.'],
 ['What should happen next?','Student · teacher · institution · parent','Actionable recommendations matched to real institutional support programs, each with a “Why?” trail.'],
 ['Did the intervention work?','Learning gain closes the loop','Pre/post comparison, normalized gain, and effectiveness analytics per program.']];
function initLanding(){
  const desc = ['assessments · attendance · activity','trends · topic mastery · prerequisites','trajectory · confidence · risk','matched to real support programs','human approval · sessions tracked','pre vs post · learning gain','update priors · observe again'];
  $('#loopLine').innerHTML=LOOP.map((s,i)=>'<div class="lstage"><div class="n">0'+(i+1)+'</div><h4>'+s+'</h4><p>'+desc[i]+'</p></div>').join('')+
   '<div class="lstage" style="border-left-color:var(--amber)"><div class="n">∞</div><h4>REPEAT</h4><p>the loop runs on every new event.</p></div>';
  $('#qaRows').innerHTML=QA.map((q,i)=>'<div class="qa-row rv"><div class="qn">0'+(i+1)+'</div><h4>'+q[0]+'<div class="mono dim" style="font-size:10px;letter-spacing:.14em;margin-top:6px">'+q[1].toUpperCase()+'</div></h4><p>'+q[2]+'</p></div>').join('');
  const roles=[['Student','Motivational, never punitive. Position, trajectory, goals, next action.'],
   ['Parent','Calm plain-language summaries. No jargon, no pressure, no sensitive internal notes.'],
   ['Teacher','Class analytics, topic heatmaps, at-risk and high-potential lists, intervention management.'],
   ['Advisor','360 profiles, risk board, human-in-the-loop approvals, outcome tracking.'],
   ['Administrator','Aggregated cohort analytics, intervention effectiveness, AI observability, audit.']];
  $('#rTabs').innerHTML=roles.map((r,i)=>'<button class="rtab '+(i===0?'on':'')+'" data-act="rtab" data-i="'+i+'">'+r[0]+'</button>').join('');
  renderRolePrev(0);
  $('#scenGrid').innerHTML=Object.keys(FLAGSHIP).map(id=>{const f=FLAGSHIP[id];
    return '<div class="panel scen-card rv" data-act="scen-login" data-sid="'+id+'">'+
     '<span class="avatar" style="--c:'+f.color+'">'+f.name.split(' ').map(x=>x[0]).join('').slice(0,2)+'</span>'+
     '<div class="tag"><span class="chip info">'+f.label+'</span></div><h4>'+f.name+'</h4><p>'+f.story+'</p>'+
     spark(f.scores.CM,f.color,180,30)+'<div class="go">ENTER DEMO AS THIS STUDENT →</div></div>'}).join('');
  const wr=DB.recs[0];
  $('#whyDemo').innerHTML='<div class="p-head"><h3>“Why are we recommending Physics support?”</h3><span class="chip">UI sample</span></div>'+
   wr.evidence.map((e,i)=>'<div class="ev-li"><span class="ev-id">EV-'+(1041+i)+'</span><b>•</b><span>'+e+'</span></div>').join('')+
   '<div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:rgba(53,211,162,.06);border:1px solid rgba(53,211,162,.3);font-size:12.5px"><b class="tealc">Conclusion:</b> '+wr.conclusion+'</div>';
  $('#heroSpark').innerHTML=spark(FLAGSHIP['ST-002'].scores.PH,'#F0654A',300,44);
  $('#heroLoop').innerHTML=LOOP.map(l=>'<span class="lnode">'+l+'</span>').join('');
  const lines=['OBSERVATION · Physics average declined 67% → 54%','EVIDENCE · 3 consecutive declining assessments','INTERPRETATION · persistent, not a single-test anomaly','RECOMMENDATION · prioritise Mechanics revision + Thu workshop','CONFIDENCE · moderate'];
  let li=0,ci=0;const te=$('#heroType');
  setInterval(()=>{if(li>=lines.length){li=0;te.innerHTML=''}
    ci++;const cur=lines[li].slice(0,ci);
    te.innerHTML=lines.slice(0,li).join('<br>')+(li?'<br>':'')+cur;
    if(ci>=lines[li].length){li++;ci=0}},34);
  let lp=0;setInterval(()=>{document.querySelectorAll('.ec-loop .lnode').forEach((n,i)=>n.classList.toggle('lit',i===lp));lp=(lp+1)%LOOP.length},900);
  const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in')),{threshold:.12});
  document.querySelectorAll('.rv').forEach(el=>io.observe(el))}
function renderRolePrev(i){const st=DB.byId['ST-002'];
  const subjHtml = SUBJ.map(s=>subjRowHTML(st,s)).join('');
  const slHtml = statline([['Students',32,''],['Improving',18,'var(--teal)'],['Needs attention',5,'var(--coral)'],['High potential',7,'var(--amber)']]);
  const ivStatsHtml = DB.ivStats.slice(0,4).map(x=>'<div class="barrow"><span style="font-size:12px">'+x.prog+'</span><div class="bar"><i style="width:'+((x.post-x.pre)*4)+'%;background:var(--teal)"></i></div><span class="bv">+'+(x.post-x.pre)+'</span><span class="mono dim" style="font-size:10px">n='+x.n+'</span></div>').join('');
  const mocks=[
   '<div class="p-head"><h3>Your current position</h3><span class="kick">student · motivational</span></div>'+subjHtml+
    '<div style="margin-top:10px"><span class="chip up">▲ Maths improving</span> <span class="chip down">▼ Mechanics needs attention</span> <span class="chip warn">next: Practice Set 04</span></div>',
   '<div class="p-head"><h3>This week in plain language</h3><span class="kick">parent · calm</span></div>'+
    '<p style="font-size:14px;line-height:1.7">Kavindu\'s attendance and effort remain <b class="tealc">strong</b>. Physics has <b class="coral">gradually decreased</b>, concentrated in Mechanics. A support session is proposed. Current evidence suggests this is about one topic — not ability or effort.</p>'+
    '<div style="margin-top:10px"><span class="chip up">★ attendance '+st.att+'%</span> <span class="chip info">support suggestion ready</span></div>',
   '<div class="p-head"><h3>Class 13-B</h3><span class="kick">teacher · intelligence</span></div>'+
    slHtml+
    '<p style="font-size:12.5px;color:var(--mut)">Topic heatmap flags Mechanics as the class-wide weak point · click any student for the full 360 profile.</p>',
   '<div class="p-head"><h3>Approvals</h3><span class="kick">advisor · human-in-the-loop</span></div>'+
    '<div class="panel tight"><b>Physics Mechanics Workshop</b> — Kavindu Jayasuriya<div class="mono dim" style="font-size:11px;margin:4px 0">evidence verified · 5 items</div>'+
    '<button class="btn pri sm">Approve</button> <button class="btn danger sm">Reject</button></div>',
   '<div class="p-head"><h3>Intervention effectiveness</h3><span class="kick">admin · aggregated</span></div>'+
    ivStatsHtml];
  $('#rPrev').innerHTML=mocks[i]}
function initLogin(){const roles=[['STUDENT','Kavindu Jayasuriya','Your subjects, trajectory, goals and recommendations — motivational, never punitive.','user'],
 ['PARENT','Mr. Jayasuriya','A calm summary of your child\'s progress, attendance and how to support at home.','users'],
 ['TEACHER','Mr. Sunil Fernando','Class analytics, topic heatmaps, at-risk lists and assessment entry.','board'],
 ['ADVISOR','Ms. Amali Wickramasinghe','360 profiles, risk board and human-in-the-loop intervention approvals.','badge'],
 ['ADMIN','Dr. Ruwan Silva','Aggregated institutional analytics, AI observability, audit and data quality.','build']];
 $('#roleCards').innerHTML=roles.map(r=>{
   const color = r[0]==='TEACHER'?'#F2B84B':r[0]==='STUDENT'?'#57B0E8':r[0]==='PARENT'?'#35D3A2':r[0]==='ADVISOR'?'#F0654A':'#C9A6FF';
   return '<button class="role-card" data-act="login" data-role="'+r[0]+'">'+
    '<span class="avatar" style="--c:'+color+'">'+ic(r[3],16)+'</span>'+
    '<div><span class="rr">'+r[0]+'</span><b>'+r[1]+'</b><p>'+r[2]+'</p></div></button>';
 }).join('')}
function login(role,meId){state.role=role;if(meId)state.meId=meId;
  if(role==='STUDENT'&&meId)DB.byId[meId];
  state.view=DEFAULT_V[role];goto('#/app/'+state.view)}

/* ═════════════════════════ 11 · EVENTS ═══════════════════════════ */
function sevColor(s){return s==='URGENT'?'var(--coral)':s==='IMPORTANT'?'var(--amber)':s==='ATTENTION'?'#F2B84B':'var(--sky)'}
document.addEventListener('click',e=>{
  if(e.target.closest('.lnav-links a'))$('#lnavLinks')?.classList.remove('open');
  const t=e.target.closest('[data-act]');
  if(!e.target.closest('.gsearch'))$('#searchDrop')?.classList.add('hidden');
  if(!e.target.closest('.bell-wrap'))$('#notifDrop')?.classList.add('hidden');
  if(!t)return;const a=t.dataset;
  switch(a.act){
   case 'toggle-sidebar':$('#appSidebar')?.classList.toggle('open');$('#sbBackdrop')?.classList.toggle('hidden');break;
   case 'close-sidebar':$('#appSidebar')?.classList.remove('open');$('#sbBackdrop')?.classList.add('hidden');break;
   case 'toggle-lnav':$('#lnavLinks')?.classList.toggle('open');break;
   case 'goto':$('#lnavLinks')?.classList.remove('open');goto(a.to);break;
   case 'login':login(a.role);break;
   case 'scen-login':login('STUDENT',a.sid);break;
   case 'logout':state.role=null;goto('#/');break;
   case 'nav':state.view=a.v;$('#appSidebar')?.classList.remove('open');$('#sbBackdrop')?.classList.add('hidden');goto('#/app/'+a.v);break;
   case 'open-student':openDrawer(a.sid);break;
   case 'close-drawer':closeDrawer();break;
   case 'close-modal':closeModal();break;
   case 'why':openWhy(a.rec);break;
   case 'rtab':document.querySelectorAll('#rTabs .rtab').forEach((b,i)=>b.classList.toggle('on',i==a.i));renderRolePrev(+a.i);break;
   case 'anasub':state.anaSub=a.sub;renderApp();break;
   case 'heatf':state.heatFilter=a.f;renderApp();break;
   case 'class':state.cls=a.c;renderApp();break;
   case 'filter':state.filter=a.f;renderApp();break;
   case 'goal':{const g=DB.goals[state.meId][+a.i];g.done=t.checked;renderApp();
     if(g.done)toast('Goal completed ✓ — logged as an engagement signal.','teal');break}
   case 'addgoal':{const v=$('#newGoal').value.trim();if(v){DB.goals[state.meId].push({t:v,done:false});renderApp()}break}
   case 'chat-toggle':openChat();break;
   case 'chat-send':chatSend();break;
   case 'sugg':$('#chatIn').value=a.q;chatSend();break;
   case 'approve':approve(a.ap);break;
   case 'reject':reject(a.ap);break;
   case 'recordpost':openPostModal(a.iv);break;
   case 'submit-post':submitPost(a.iv);break;
   case 'resolvedq':{const d=DB.dq.find(x=>x.id===a.id);d.status='Resolved';toast('Marked resolved · logged to audit.','teal');renderApp();break}
   case 'view-heatmap':closeDrawer();if(state.role==='TEACHER'){};toast('Open the Learning Activity view for the 365-day heatmap.','');break;
   case 'whatif':break;
  }});
document.addEventListener('input',e=>{
  if(e.target.id==='fSub')syncTopics();
  if(e.target.dataset.act==='whatif'){const st=DB.byId[state.meId],sub=e.target.dataset.sub,d=+e.target.value;
    const base=predict(st,sub),sim=simPredict(st,sub,d);
    const sign = d>=0?'+':'';
    $('#wif-'+sub).innerHTML='If '+SUBJECTS[sub].short+' moves '+sign+d+' pts → estimated outcome shifts <b class="amberc">'+base.range+'</b> → <b style="color:var(--teal)">'+sim.range+'</b> (score '+sim.p+'%). Scenario simulation — not a guaranteed outcome.';}
  if(e.target.id==='gSearch'){const q=e.target.value.toLowerCase(),drop=$('#searchDrop');
    if(q.length<2){drop.classList.add('hidden');return}
    const hits=state.role==='STUDENT'||state.role==='PARENT'?[]:DB.students.filter(s=>s.name.toLowerCase().includes(q)||s.id.toLowerCase().includes(q)).slice(0,6);
    const progs=SUPPORT.filter(p=>p.name.toLowerCase().includes(q)).slice(0,3);
    const hitsHtml = hits.map(s=>'<div class="sd-item" data-act="open-student" data-sid="'+s.id+'"><span class="avatar sm" style="--c:'+s.color+'">'+s.name.split(' ').map(x=>x[0]).join('').slice(0,2)+'</span><div><b style="font-size:13px">'+s.name+'</b><span class="mono dim" style="font-size:10px;display:block">'+s.id+' · '+s.cls+'</span></div></div>').join('');
    const progsHtml = progs.map(p=>'<div class="sd-item"><span class="avatar sm" style="--c:var(--sky)">SP</span><div><b style="font-size:13px">'+p.name+'</b><span class="mono dim" style="font-size:10px;display:block">'+p.schedule+'</span></div></div>').join('');
    drop.innerHTML=(hitsHtml+progsHtml)||'<div class="sd-item dim">No matches for your role.</div>';
    drop.classList.remove('hidden')}
  if(e.target.id==='chatIn'&&e.inputType===undefined){}});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.id==='chatIn')chatSend();
  if(e.key==='Escape'){closeModal();closeDrawer();$('#chat').classList.add('hidden')}});
$('#bellBtn')?.addEventListener('click',()=>{const d=$('#notifDrop');
  d.innerHTML=(DB.notifs[state.role]||[]).map(n=>'<div class="nd-item"><span class="sev" style="background:'+sevColor(n.sev)+'"></span><div><b style="font-size:12.5px">'+n.t+'</b><div class="mono dim" style="font-size:10px">'+n.d+' · '+n.sev+'</div></div></div>').join('')||'<div class="nd-item dim">No notifications.</div>';
  d.classList.toggle('hidden')});
$('#btnAddAssess')?.addEventListener('click',openAssessModal);
$('#chatBtn')?.addEventListener('click',openChat);
$('#modalWrap')?.addEventListener('click',e=>{if(e.target.id==='modalWrap')closeModal()});
$('#drawerWrap')?.addEventListener('click',e=>{if(e.target.id==='drawerWrap')closeDrawer()});
/* heatmap tooltip (delegated) */
document.addEventListener('mouseover',e=>{const c=e.target.closest('.hcell[data-day]');if(!c)return;
  const st=DB.byId[c.dataset.sid],rec=genDays(st)[c.dataset.day];if(!rec)return;
  const d=new Date(c.dataset.day);
  let rows='<div class="mono">Attendance: '+(rec.att===1?'Present':rec.att===0?'Absent':'—')+'</div>';
  if(rec.test)rows+='<div class="mono">Test: '+SUBJECTS[rec.test.sub].short+' · '+rec.test.marks+'%</div>';
  if(rec.asg)rows+='<div class="mono">Assignment: 1 completed</div>';
  rows+='<div class="mono">Engagement: '+['none','absent','attended','participated','active','strong'][rec.int]+'</div>';
  showTip('<div class="ttd">'+fD(d)+'</div>'+rows,e)});
document.addEventListener('mouseout',e=>{if(e.target.closest('.hcell'))hideTip()});

/* ═════════════════════════ 12 · INIT ═════════════════════════════ */
initLanding();initLogin();route();
console.log('%cPRAGNA · synthetic demo environment · no real student data','color:#F2B84B;font-weight:bold');