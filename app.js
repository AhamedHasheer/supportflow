const STORAGE_KEY = 'supportflow_tickets_v1';
const THEME_KEY = 'supportflow_theme';

const seedTickets = [
  {id:'SF-1042',title:'Mobile navigation not opening',category:'Website',priority:'High',status:'Open',updated:'Today, 10:42'},
  {id:'SF-1041',title:'User login session expires too early',category:'Software',priority:'Medium',status:'In Progress',updated:'Today, 09:18'},
  {id:'SF-1040',title:'Contact form confirmation missing',category:'Website',priority:'Low',status:'Resolved',updated:'Yesterday, 16:05'},
  {id:'SF-1039',title:'Account email needs to be updated',category:'Account',priority:'Low',status:'Resolved',updated:'Yesterday, 13:37'},
  {id:'SF-1038',title:'Laptop fan running constantly',category:'Hardware',priority:'Medium',status:'Open',updated:'Sep 25, 15:12'},
  {id:'SF-1037',title:'Checkout page breaks on tablet',category:'Website',priority:'High',status:'In Progress',updated:'Sep 25, 11:24'},
  {id:'SF-1036',title:'CSV import rejects valid rows',category:'Software',priority:'High',status:'Resolved',updated:'Sep 24, 14:03'}
];

let tickets = loadTickets();

const el = id => document.getElementById(id);
const table = el('ticketTable');
const emptyState = el('emptyState');
const dialog = el('ticketDialog');
const form = el('ticketForm');

function loadTickets(){
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : seedTickets;
}
function saveTickets(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets)); }
function counts(){
  const total=tickets.length;
  const open=tickets.filter(t=>t.status==='Open').length;
  const progress=tickets.filter(t=>t.status==='In Progress').length;
  const resolved=tickets.filter(t=>t.status==='Resolved').length;
  return {total,open,progress,resolved};
}
function escapeHtml(value){
  return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));
}
function filteredTickets(){
  const q=el('searchInput').value.trim().toLowerCase();
  const status=el('statusFilter').value;
  const priority=el('priorityFilter').value;
  return tickets.filter(t=>{
    const matchesSearch=!q || [t.id,t.title,t.category,t.priority,t.status].join(' ').toLowerCase().includes(q);
    const matchesStatus=status==='all'||t.status===status;
    const matchesPriority=priority==='all'||t.priority===priority;
    return matchesSearch&&matchesStatus&&matchesPriority;
  });
}
function renderTable(){
  const data=filteredTickets();
  table.innerHTML=data.map(t=>`<tr>
    <td class="ticket-id">${escapeHtml(t.id)}</td>
    <td class="request-title">${escapeHtml(t.title)}</td>
    <td>${escapeHtml(t.category)}</td>
    <td><span class="badge ${t.priority.toLowerCase()}">${escapeHtml(t.priority)}</span></td>
    <td>
      <select class="status-select" data-id="${escapeHtml(t.id)}" aria-label="Change status for ${escapeHtml(t.title)}">
        ${['Open','In Progress','Resolved'].map(s=>`<option ${s===t.status?'selected':''}>${s}</option>`).join('')}
      </select>
    </td>
    <td>${escapeHtml(t.updated)}</td>
  </tr>`).join('');
  emptyState.hidden=data.length>0;
  document.querySelectorAll('.status-select').forEach(select=>select.addEventListener('change',e=>{
    const ticket=tickets.find(t=>t.id===e.target.dataset.id);
    if(ticket){ ticket.status=e.target.value; ticket.updated='Just now'; saveTickets(); render(); showToast('Request status updated'); }
  }));
}
function renderMetrics(){
  const c=counts();
  el('kpiTotal').textContent=c.total; el('kpiOpen').textContent=c.open; el('kpiProgress').textContent=c.progress;
  el('kpiResolved').textContent=c.total?Math.round(c.resolved/c.total*100)+'%':'0%';
  el('donutTotal').textContent=c.total; el('legendOpen').textContent=c.open; el('legendProgress').textContent=c.progress; el('legendResolved').textContent=c.resolved;
  const pOpen=c.total?c.open/c.total*100:0; const pProgress=c.total?c.progress/c.total*100:0;
  el('donutChart').style.background=`conic-gradient(var(--open) 0 ${pOpen}%, var(--progress) ${pOpen}% ${pOpen+pProgress}%, var(--resolved) ${pOpen+pProgress}% 100%)`;
}
function render(){ renderTable(); renderMetrics(); }
function nextId(){
  const nums=tickets.map(t=>Number(t.id.replace('SF-',''))).filter(Number.isFinite);
  return 'SF-'+((nums.length?Math.max(...nums):1042)+1);
}
function showToast(msg){ const toast=el('toast'); toast.textContent=msg; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>toast.classList.remove('show'),2200); }
function clearErrors(){ document.querySelectorAll('.field-error').forEach(x=>x.textContent=''); }
function validateForm(){
  clearErrors(); let ok=true;
  const values={title:el('titleInput').value.trim(),category:el('categoryInput').value,priority:el('priorityInput').value,description:el('descriptionInput').value.trim()};
  const errors={};
  if(values.title.length<5) errors.title='Use at least 5 characters.';
  if(!values.category) errors.category='Select a category.';
  if(!values.priority) errors.priority='Select a priority.';
  if(values.description.length<10) errors.description='Use at least 10 characters.';
  Object.entries(errors).forEach(([k,v])=>{document.querySelector(`[data-error="${k}"]`).textContent=v; ok=false;});
  return ok?values:null;
}
function openDialog(){ clearErrors(); form.reset(); dialog.showModal(); setTimeout(()=>el('titleInput').focus(),0); }
function closeDialog(){ dialog.close(); }

['searchInput','statusFilter','priorityFilter'].forEach(id=>el(id).addEventListener(id==='searchInput'?'input':'change',renderTable));
el('newTicketBtn').addEventListener('click',openDialog); el('closeDialog').addEventListener('click',closeDialog); el('cancelDialog').addEventListener('click',closeDialog);
form.addEventListener('submit',e=>{ e.preventDefault(); const values=validateForm(); if(!values)return; tickets.unshift({id:nextId(),title:values.title,category:values.category,priority:values.priority,status:'Open',updated:'Just now'}); saveTickets(); render(); closeDialog(); showToast('New request created'); });

el('quickHigh').addEventListener('click',()=>{el('priorityFilter').value='High';renderTable();});
el('quickOpen').addEventListener('click',()=>{el('statusFilter').value='Open';renderTable();});
el('resetFilters').addEventListener('click',()=>{el('searchInput').value='';el('statusFilter').value='all';el('priorityFilter').value='all';renderTable();});

el('exportBtn').addEventListener('click',()=>{
  const rows=[['ID','Title','Category','Priority','Status','Updated'],...tickets.map(t=>[t.id,t.title,t.category,t.priority,t.status,t.updated])];
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='supportflow_requests.csv'; a.click(); URL.revokeObjectURL(url); showToast('CSV exported');
});

el('themeToggle').addEventListener('click',()=>{ document.body.classList.toggle('dark'); localStorage.setItem(THEME_KEY,document.body.classList.contains('dark')?'dark':'light'); });
if(localStorage.getItem(THEME_KEY)==='dark') document.body.classList.add('dark');

el('mobileMenuBtn').addEventListener('click',()=>el('sidebar').classList.toggle('open'));
document.addEventListener('click',e=>{ if(window.innerWidth<=820 && !el('sidebar').contains(e.target) && !el('mobileMenuBtn').contains(e.target)) el('sidebar').classList.remove('open'); });

document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));btn.classList.add('active'); if(btn.dataset.view==='tickets') document.querySelector('.panel-large').scrollIntoView({behavior:'smooth'}); if(btn.dataset.view==='analytics') document.querySelector('.chart-panel').scrollIntoView({behavior:'smooth'}); if(btn.dataset.view==='dashboard') window.scrollTo({top:0,behavior:'smooth'});}));

render();
