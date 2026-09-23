const fallbackProducts = [
  {id:'GPU-5070-A',category:'GPU',brand:'NVIDIA',model:'RTX 5070',name:'GeForce RTX 5070 12GB',shop:'JIB',price:25900,original:27900,stock:true,history:[28900,28400,27900,26900,25900],specs:{หน่วยความจำ:'12 GB GDDR7',การรับประกัน:'3 ปี',คะแนนตลาด:'9.1/10'}},
  {id:'GPU-5070-B',category:'GPU',brand:'NVIDIA',model:'RTX 5070',name:'GeForce RTX 5070 Gaming OC',shop:'Advice',price:26500,original:28900,stock:true,history:[29500,28900,28100,27200,26500],specs:{หน่วยความจำ:'12 GB GDDR7',การรับประกัน:'3 ปี',คะแนนตลาด:'8.9/10'}},
  {id:'GPU-7800',category:'GPU',brand:'AMD',model:'RX 7800 XT',name:'Radeon RX 7800 XT 16GB',shop:'Banana',price:22900,original:24900,stock:true,history:[25900,25200,24500,23400,22900],specs:{หน่วยความจำ:'16 GB GDDR6',การรับประกัน:'3 ปี',คะแนนตลาด:'8.8/10'}},
  {id:'CPU-R7',category:'CPU',brand:'AMD',model:'Ryzen 7 9700X',name:'AMD Ryzen 7 9700X',shop:'JIB',price:12900,original:13900,stock:true,history:[14500,14200,13900,13400,12900],specs:{คอร์:'8C / 16T',ซ็อกเก็ต:'AM5',คะแนนตลาด:'9.0/10'}},
  {id:'CPU-I7',category:'CPU',brand:'Intel',model:'Core Ultra 7 265K',name:'Intel Core Ultra 7 265K',shop:'IT City',price:14200,original:14900,stock:true,history:[14900,14700,14600,14400,14200],specs:{คอร์:'20 Cores',ซ็อกเก็ต:'LGA1851',คะแนนตลาด:'8.6/10'}},
  {id:'CPU-R5',category:'CPU',brand:'AMD',model:'Ryzen 5 9600X',name:'AMD Ryzen 5 9600X',shop:'Advice',price:8990,original:9490,stock:true,history:[9900,9750,9490,9190,8990],specs:{คอร์:'6C / 12T',ซ็อกเก็ต:'AM5',คะแนนตลาด:'8.7/10'}},
  {id:'RAM-K32',category:'RAM',brand:'Kingston',model:'Fury Beast 32GB',name:'Kingston Fury Beast DDR5 32GB',shop:'JIB',price:3290,original:3690,stock:true,history:[3790,3690,3490,3390,3290],specs:{ความจุ:'32 GB',ความเร็ว:'6000 MT/s',คะแนนตลาด:'8.8/10'}},
  {id:'RAM-C32',category:'RAM',brand:'Corsair',model:'Vengeance 32GB',name:'Corsair Vengeance DDR5 32GB',shop:'Banana',price:3590,original:3890,stock:true,history:[3990,3890,3790,3690,3590],specs:{ความจุ:'32 GB',ความเร็ว:'6000 MT/s',คะแนนตลาด:'8.7/10'}},
  {id:'RAM-T32',category:'RAM',brand:'TeamGroup',model:'T-Force Delta 32GB',name:'T-Force Delta RGB DDR5 32GB',shop:'Advice',price:3190,original:3490,stock:false,history:[3590,3490,3390,3290,3190],specs:{ความจุ:'32 GB',ความเร็ว:'6000 MT/s',คะแนนตลาด:'8.5/10'}},
  {id:'SSD-S1',category:'SSD',brand:'Samsung',model:'990 EVO Plus 1TB',name:'Samsung 990 EVO Plus 1TB',shop:'IT City',price:2990,original:3490,stock:true,history:[3690,3490,3290,3090,2990],specs:{ความจุ:'1 TB',อ่านสูงสุด:'7,250 MB/s',คะแนนตลาด:'9.2/10'}},
  {id:'SSD-W1',category:'SSD',brand:'WD',model:'Black SN850X 1TB',name:'WD Black SN850X 1TB',shop:'JIB',price:3190,original:3690,stock:true,history:[3890,3690,3490,3290,3190],specs:{ความจุ:'1 TB',อ่านสูงสุด:'7,300 MB/s',คะแนนตลาด:'9.1/10'}},
  {id:'SSD-K1',category:'SSD',brand:'Kingston',model:'KC3000 1TB',name:'Kingston KC3000 NVMe 1TB',shop:'Advice',price:2790,original:3290,stock:true,history:[3390,3290,3090,2890,2790],specs:{ความจุ:'1 TB',อ่านสูงสุด:'7,000 MB/s',คะแนนตลาด:'8.9/10'}},
  {id:'NB-LOQ',category:'Notebook',brand:'Lenovo',model:'LOQ 15IRX9',name:'Lenovo LOQ 15IRX9 RTX 4060',shop:'Lenovo Store',price:32990,original:36990,stock:true,history:[38990,37990,35990,34990,32990],specs:{ซีพียู:'Core i7-13650HX',กราฟิก:'RTX 4060',คะแนนตลาด:'9.0/10'}},
  {id:'NB-TUF',category:'Notebook',brand:'ASUS',model:'TUF A15',name:'ASUS TUF Gaming A15 RTX 4060',shop:'Banana',price:34990,original:38990,stock:true,history:[39990,38990,37990,35990,34990],specs:{ซีพียู:'Ryzen 7 8845HS',กราฟิก:'RTX 4060',คะแนนตลาด:'8.9/10'}},
  {id:'NB-MBA',category:'Notebook',brand:'Apple',model:'MacBook Air M4',name:'MacBook Air M4 13-inch',shop:'Studio 7',price:34900,original:36900,stock:true,history:[36900,36900,35900,34900,34900],specs:{ชิป:'Apple M4',หน่วยความจำ:'16 GB',คะแนนตลาด:'9.3/10'}},
  {id:'MON-LG',category:'Monitor',brand:'LG',model:'27GP850-B',name:'LG UltraGear 27GP850-B',shop:'JIB',price:9990,original:11900,stock:true,history:[12500,11900,10900,10400,9990],specs:{หน้าจอ:'27-inch QHD',รีเฟรชเรต:'180 Hz',คะแนนตลาด:'9.0/10'}},
  {id:'MON-ASUS',category:'Monitor',brand:'ASUS',model:'VG27AQ3A',name:'ASUS TUF VG27AQ3A',shop:'Advice',price:8790,original:9990,stock:true,history:[10900,9990,9490,8990,8790],specs:{หน้าจอ:'27-inch QHD',รีเฟรชเรต:'180 Hz',คะแนนตลาด:'8.8/10'}},
  {id:'MON-MSI',category:'Monitor',brand:'MSI',model:'G274QPF E2',name:'MSI G274QPF E2',shop:'IT City',price:8290,original:9490,stock:false,history:[9990,9490,8990,8490,8290],specs:{หน้าจอ:'27-inch QHD',รีเฟรชเรต:'180 Hz',คะแนนตลาด:'8.7/10'}}
];

let products = fallbackProducts.map(product => ({...product}));
const dataSource = { mode:'loading', provider:'', generatedAt:null, cached:false, stale:false };

const state = {
  view:'dashboard', category:'all', brand:'all', shop:'all', maxPrice:90000,
  search:'', compare:new Set(JSON.parse(localStorage.getItem('itmi-compare') || '[]'))
};
const titles = {dashboard:'ภาพรวมตลาด',explorer:'สำรวจสินค้า',compare:'เปรียบเทียบสินค้า',trends:'แนวโน้มราคา',deals:'ดีลน่าสนใจ',ai:'ประเมินราคา'};
const money = n => new Intl.NumberFormat('th-TH',{style:'currency',currency:'THB',maximumFractionDigits:0}).format(n);
const pct = n => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
const discount = p => p.original > 0 ? ((p.original-p.price)/p.original)*100 : 0;
const movement = p => p.history?.length && p.history[0] > 0 ? ((p.price-p.history[0])/p.history[0])*100 : 0;
const esc = value => String(value ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeUrl = value => { try { const url=new URL(value); return ['http:','https:'].includes(url.protocol)?url.href:null; } catch { return null; } };
const root = document.querySelector('#view-root');

function unique(key){ return [...new Set(products.map(p=>p[key]))].sort(); }
function fillSelect(id,values,firstLabel){
  const select=document.querySelector(id); const selected=select.value; select.innerHTML='';
  const first=document.createElement('option');first.value='all';first.textContent=firstLabel;select.append(first);
  values.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;select.append(o);});
  select.value=[...select.options].some(option=>option.value===selected)?selected:'all';
}
function updateFilterOptions(){
  fillSelect('#category-filter',unique('category'),'ทั้งหมด');
  fillSelect('#brand-filter',unique('brand'),'ทุกแบรนด์');
  fillSelect('#shop-filter',unique('shop'),'ทุกร้านค้า');
  state.category=document.querySelector('#category-filter').value;
  state.brand=document.querySelector('#brand-filter').value;
  state.shop=document.querySelector('#shop-filter').value;
  const max=Math.max(90000,...products.map(p=>p.price)); const slider=document.querySelector('#price-filter');
  slider.max=Math.ceil(max/10000)*10000;
  if(state.maxPrice<max&&state.maxPrice===90000){state.maxPrice=Number(slider.max);slider.value=state.maxPrice;document.querySelector('#price-output').textContent=money(state.maxPrice);}
}
updateFilterOptions();

function filteredProducts(){
  return products.filter(p => (state.category==='all'||p.category===state.category) && (state.brand==='all'||p.brand===state.brand) && (state.shop==='all'||p.shop===state.shop) && p.price<=state.maxPrice && (!state.search || `${p.name} ${p.brand} ${p.model}`.toLowerCase().includes(state.search.toLowerCase())));
}
function groupAverage(items,key){
  return [...new Set(items.map(i=>i[key]))].map(label=>({label,value:avg(items.filter(i=>i[key]===label).map(i=>i.price))})).sort((a,b)=>b.value-a.value);
}
function kpi(label,value,meta,color){return `<article class="card kpi" style="--accent:${color}"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div><div class="kpi-meta">${meta}</div></article>`;}
function empty(title='ไม่พบข้อมูล',detail='ลองเปลี่ยนตัวกรองหรือช่วงราคา'){return `<div class="card empty"><b>${title}</b>${detail}</div>`;}
function categoryBars(items){
  const data=groupAverage(items,'category').reverse(); if(!data.length)return empty(); const max=Math.max(...data.map(d=>d.value));
  return `<div class="chart">${data.map(d=>`<div class="bar-col"><span class="bar-value">฿${Math.round(d.value/1000)}K</span><div class="bar" style="--h:${Math.max(4,d.value/max*82)}%" title="${d.label}: ${money(d.value)}"></div><span class="bar-label">${d.label}</span></div>`).join('')}</div>`;
}
function lineChart(items){
  if(!items.length)return empty(); const values=[0,1,2,3,4].map(i=>avg(items.map(p=>p.history[i]))); const min=Math.min(...values)*.96,max=Math.max(...values)*1.04, w=640,h=220,pad=34;
  const pts=values.map((v,i)=>({x:pad+i*(w-pad*2)/4,y:h-pad-(v-min)/(max-min||1)*(h-pad*2),v})); const line=pts.map(p=>`${p.x},${p.y}`).join(' '); const area=`${pad},${h-pad} ${line} ${w-pad},${h-pad}`; const labels=['ย้อนหลัง 4','ย้อนหลัง 3','ย้อนหลัง 2','ก่อนหน้า','ล่าสุด'];
  return `<div class="line-chart"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="กราฟแนวโน้มจากราคาที่บันทึก 5 ครั้ง"><defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#76a7dc"/><stop offset="1" stop-color="#76a7dc" stop-opacity="0"/></linearGradient></defs>${[0,1,2,3].map(i=>`<line class="grid-line" x1="${pad}" x2="${w-pad}" y1="${pad+i*(h-pad*2)/3}" y2="${pad+i*(h-pad*2)/3}"/>`).join('')}<polygon class="area" points="${area}"/><polyline class="price-line" points="${line}"/>${pts.map((p,i)=>`<circle cx="${p.x}" cy="${p.y}" r="5"><title>${labels[i]} ${money(p.v)}</title></circle><text x="${p.x}" y="${h-8}" text-anchor="middle">${labels[i]}</text>`).join('')}</svg></div>`;
}
function dealRows(items,limit=5){
  return `<div class="deal-list">${[...items].sort((a,b)=>discount(b)-discount(a)).slice(0,limit).map(p=>`<div class="deal-item"><span class="product-icon">${esc(p.category.slice(0,3))}</span><div><b>${esc(p.name)}</b><small>${esc(p.shop)} · ${esc(p.brand)}</small></div><div class="deal-price">${money(p.price)}<span>${discount(p)>0?`ลด ${discount(p).toFixed(1)}%`:'ราคาปัจจุบัน'}</span></div></div>`).join('')}</div>`;
}
function marketInsight(items){
  if(!items.length)return 'ยังไม่มีข้อมูลเพียงพอสำหรับวิเคราะห์'; const best=[...items].sort((a,b)=>movement(a)-movement(b))[0]; const cat=groupAverage(items,'category').sort((a,b)=>b.value-a.value)[0];
  const trend=movement(best)<0?`ลดลง ${Math.abs(movement(best)).toFixed(1)}% จากข้อมูลที่บันทึกไว้`:'ยังไม่มีการเปลี่ยนแปลงจากข้อมูลที่บันทึกไว้';
  return `<strong>${esc(best.name)}</strong> ${trend} และ ${esc(cat.label)} เป็นหมวดที่มีราคาเฉลี่ยสูงสุดที่ ${money(cat.value)}`;
}
function renderDashboard(){
  const items=filteredProducts(); if(!items.length){root.innerHTML=empty();return;} const prices=items.map(p=>p.price); const drops=items.filter(p=>movement(p)<0);
  root.innerHTML=`<section class="grid kpi-grid">${kpi('รายการที่ติดตาม',items.length.toLocaleString('th-TH'),'จากข้อมูลตลาดที่โหลดล่าสุด','var(--mint)')}${kpi('ราคาเฉลี่ย',money(avg(prices)),'คำนวณจากตัวกรองปัจจุบัน','var(--cyan)')}${kpi('ราคาต่ำสุด',money(Math.min(...prices)),'รายการที่คุ้มที่สุดในชุดข้อมูล','var(--amber)')}${kpi('ราคาปรับลด',`${drops.length} รายการ`,'เทียบประวัติที่บันทึกในอุปกรณ์','var(--violet)')}</section>
  <section class="grid two-col section-row"><article class="card card-pad"><div class="card-head"><div><h2>ราคาเฉลี่ยตามหมวด</h2><p>เปรียบเทียบราคาปัจจุบันในแต่ละกลุ่มสินค้า</p></div><span class="pill">บาท</span></div>${categoryBars(items)}</article><aside class="card card-pad"><div class="card-head"><div><h2>ดีลน่าสนใจ</h2><p>เรียงจากส่วนลดเทียบราคาก่อนลด</p></div><span class="pill positive">${dataSource.mode==='live'?'ข้อมูลล่าสุด':'ข้อมูลตัวอย่าง'}</span></div>${dealRows(items,4)}</aside></section>
  <section class="grid two-col section-row"><article class="card card-pad"><div class="card-head"><div><h2>ประวัติราคาที่บันทึก</h2><p>จุดราคาในอุปกรณ์นี้ ไม่ใช่ข้อมูลย้อนหลังรายเดือน</p></div><span class="pill ${avg(items.map(movement))>0?'negative':'positive'}">${pct(avg(items.map(movement)))}</span></div>${lineChart(items)}</article><aside class="insight"><div class="insight-icon">◎</div><h3>ข้อสังเกตจากตลาด</h3><p>${marketInsight(items)}</p><button class="secondary-btn mt-16" data-go="ai">ประเมินราคาสินค้า</button></aside></section>
  <section class="card card-pad section-row"><div class="card-head"><div><h2>รายการน่าจับตา</h2><p>เรียงตามการเปลี่ยนแปลงราคาจากมากไปน้อย</p></div><button class="secondary-btn" data-go="explorer">ดูสินค้าทั้งหมด</button></div>${productTable([...items].sort((a,b)=>movement(a)-movement(b)).slice(0,6))}</section>`;
}
function productTable(items){
  if(!items.length)return empty(); return `<div class="table-wrap"><table><thead><tr><th>สินค้า</th><th>หมวด</th><th>ร้านค้า</th><th>ราคา</th><th>ส่วนลด</th><th>แนวโน้ม</th><th>สถานะ</th><th></th></tr></thead><tbody>${items.map(p=>{const url=safeUrl(p.source_url);const name=url?`<a class="source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(p.name)}</a>`:esc(p.name);return `<tr><td class="product-cell"><b>${name}</b><small>${esc(p.brand)} · ${esc(p.model)}</small></td><td>${esc(p.category)}</td><td>${esc(p.shop)}</td><td class="price">${money(p.price)}</td><td class="discount">${discount(p)>0?`-${discount(p).toFixed(1)}%`:'—'}</td><td class="${movement(p)>0?'negative':'positive'}">${pct(movement(p))}</td><td><span class="stock">${esc(p.stock_label||(p.stock?'มีสินค้า':'สินค้าหมด'))}</span></td><td><button class="compare-toggle ${state.compare.has(p.id)?'selected':''}" data-compare="${esc(p.id)}">${state.compare.has(p.id)?'เลือกแล้ว':'เปรียบเทียบ'}</button></td></tr>`;}).join('')}</tbody></table></div>`;
}
function renderExplorer(){
  const items=filteredProducts(); root.innerHTML=`<section class="card card-pad"><div class="toolbar"><input class="search" id="search-products" type="text" placeholder="ค้นหา เช่น RTX 5070 หรือ Kingston" value="${esc(state.search)}" aria-label="ค้นหาสินค้า"><div class="chips">${['all',...unique('category')].map(c=>`<button class="chip ${state.category===c?'active':''}" data-category="${esc(c)}">${c==='all'?'ทั้งหมด':esc(c)}</button>`).join('')}</div></div><div class="card-head"><div><h2>สินค้าในตลาด</h2><p>พบ ${items.length} รายการจาก ${dataSource.mode==='live'?'Google Shopping ประเทศไทย':'ข้อมูลสำรอง'}</p></div><span class="pill">เลือกเทียบได้สูงสุด 4 รายการ</span></div>${productTable(items)}</section>`;
  document.querySelector('#search-products')?.addEventListener('input',e=>{state.search=e.target.value;renderExplorer();setTimeout(()=>document.querySelector('#search-products')?.focus(),0);});
}
function renderCompare(){
  const items=products.filter(p=>state.compare.has(p.id)); if(!items.length){root.innerHTML=empty('ยังไม่ได้เลือกสินค้า','ไปที่ “สำรวจสินค้า” แล้วกดเปรียบเทียบได้สูงสุด 4 รายการ')+`<button class="primary-btn mt-16" data-go="explorer">เลือกสินค้า</button>`;return;}
  root.innerHTML=`<div class="card card-pad"><div class="card-head"><div><h2>เทียบแบบเห็นภาพเดียว</h2><p>${items.length} จาก 4 รายการ · ราคาโหลดจากแหล่งตลาดล่าสุด</p></div><button class="secondary-btn" data-go="explorer">เพิ่มสินค้า</button></div><div class="grid compare-grid">${items.map(p=>`<article class="card compare-card"><button class="remove" data-remove="${esc(p.id)}" aria-label="นำ ${esc(p.name)} ออกจากการเปรียบเทียบ">×</button><span class="product-icon">${esc(p.category.slice(0,3))}</span><h3>${esc(p.name)}</h3><span class="muted">${esc(p.shop)}</span><div class="kpi-value">${money(p.price)}</div><span class="pill positive">${p.original>p.price?`ประหยัด ${money(p.original-p.price)}`:'ราคาปัจจุบัน'}</span><div class="spec-list"><div class="spec-row"><span>แนวโน้มที่บันทึก</span><b>${pct(movement(p))}</b></div><div class="spec-row"><span>ส่วนลด</span><b>${discount(p).toFixed(1)}%</b></div>${Object.entries(p.specs||{}).map(([k,v])=>`<div class="spec-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div></article>`).join('')}</div></div>`;
}
function renderTrends(){
  const items=filteredProducts(); const ranked=[...items].sort((a,b)=>movement(a)-movement(b)); const max=Math.max(...ranked.map(p=>Math.abs(movement(p))),1);
  root.innerHTML=`<section class="grid equal-col"><article class="card card-pad"><div class="card-head"><div><h2>ทิศทางตลาด</h2><p>จากจุดราคาที่บันทึกไว้ในอุปกรณ์นี้</p></div><span class="pill positive">${pct(avg(items.map(movement)))}</span></div>${lineChart(items)}</article><article class="card card-pad"><div class="card-head"><div><h2>อันดับการเปลี่ยนแปลง</h2><p>เรียงจากราคาลดมากที่สุด</p></div></div><div class="trend-list">${ranked.map(p=>`<div class="trend-row"><div><b>${esc(p.model)}</b><small>${esc(p.category)} · ${esc(p.shop)}</small></div><div class="track"><div class="fill ${movement(p)>0?'up':''}" style="--w:${Math.abs(movement(p))/max*100}%"></div></div><span class="trend-pct ${movement(p)>0?'up':''}">${pct(movement(p))}</span></div>`).join('')}</div></article></section>`;
}
function renderDeals(){
  const items=[...filteredProducts()].sort((a,b)=>discount(b)-discount(a));
  root.innerHTML=`<section class="grid kpi-grid">${kpi('ดีลทั้งหมด',items.length,'ผ่านตัวกรองปัจจุบัน','var(--mint)')}${kpi('ส่วนลดเฉลี่ย',`${avg(items.map(discount)).toFixed(1)}%`,'เทียบราคาก่อนลด','var(--cyan)')}${kpi('ประหยัดสูงสุด',items.length?money(Math.max(...items.map(p=>p.original-p.price))):'-','ต่อหนึ่งรายการ','var(--amber)')}${kpi('พร้อมตรวจสอบ',`${items.length} รายการ`,'เปิดลิงก์ร้านค้าเพื่อตรวจสต็อก','var(--violet)')}</section><section class="card card-pad section-row"><div class="card-head"><div><h2>ดีลเรียงตามส่วนลด</h2><p>ราคาจากผล Google Shopping ล่าสุด โปรดตรวจสอบกับร้านค้าก่อนซื้อ</p></div></div>${productTable(items)}</section>`;
}
function analyze(product,asking){
  const peers=products.filter(p=>p.category===product.category); const market=avg(peers.map(p=>p.price)); const diff=(asking-market)/market*100; const trend=movement(product); let score=Math.round(86-diff*.9-trend*.35); score=Math.max(20,Math.min(98,score));
  let verdict='ราคาเหมาะสม'; if(diff<-7)verdict='ราคาน่าสนใจมาก'; else if(diff>10)verdict='ราคาสูงกว่าตลาด'; else if(diff<0)verdict='ราคาดีกว่าค่าเฉลี่ย';
  return {score,market,diff,trend,verdict,save:market-asking};
}
function aiResult(product,asking){
  const a=analyze(product,asking); return `<div class="score-ring" style="--score:${a.score}"><span>${a.score}<small>DEAL SCORE</small></span></div><h2>${a.verdict}</h2><p>ราคา ${money(asking)} ${a.diff<=0?'ต่ำกว่า':'สูงกว่า'}ค่าเฉลี่ยของหมวด ${product.category} ${Math.abs(a.diff).toFixed(1)}%</p><div class="grid reason-grid"><div class="reason"><span>ค่าเฉลี่ยหมวด</span><b>${money(a.market)}</b></div><div class="reason"><span>แนวโน้มรุ่นนี้</span><b>${pct(a.trend)}</b></div><div class="reason"><span>${a.save>=0?'ประหยัดเทียบตลาด':'ส่วนต่างสูงกว่า'}</span><b>${money(Math.abs(a.save))}</b></div></div><div class="insight mt-16"><h3>ข้อสังเกตจากสูตรคำนวณ</h3><p>${a.score>=80?'ราคาในภาพรวมดูน่าสนใจ ควรตรวจสอบการรับประกันและสต็อกจริงก่อนชำระเงิน':a.score>=60?'ราคาอยู่ในช่วงตลาด แนะนำเปรียบเทียบร้านค้าเพิ่มเติม':'ราคานี้ค่อนข้างสูง ควรดูรุ่นใกล้เคียงหรือรอให้ราคาปรับลง'}</p></div><button class="primary-btn mt-16" id="alert-btn">บันทึกราคาเป้าหมาย ${money(asking)}</button>`;
}
function renderAI(selectedId=products[0].id,askingPrice=null){
  const p=products.find(x=>x.id===selectedId)||products[0]; const asking=Number(askingPrice)||p.price;
  root.innerHTML=`<section class="grid ai-layout"><article class="card card-pad"><div class="card-head"><div><h2>ประเมินราคาที่พบ</h2><p>เทียบกับข้อมูลสินค้าในหมวดเดียวกัน</p></div><span class="pill">สูตรคำนวณราคา</span></div><form class="analyzer-form" id="ai-form"><label class="form-field">เลือกรุ่นสินค้า<select id="ai-product">${products.map(x=>`<option value="${esc(x.id)}" ${x.id===p.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label><label class="form-field">ราคาที่ต้องการประเมิน<input id="ai-price" type="number" min="1" step="10" value="${asking}" required></label><button class="primary-btn" type="submit">ประเมินราคา</button></form><div class="data-note mt-16"><span></span><div><b>หมายเหตุ</b><small>คะแนนคำนวณจากราคาเฉลี่ยในหมวดและราคาที่บันทึกไว้ ใช้ประกอบการตัดสินใจเท่านั้น</small></div></div></article><article class="card card-pad ai-result" id="ai-result">${aiResult(p,asking)}</article></section>`;
  document.querySelector('#ai-product').addEventListener('change',e=>{const x=products.find(i=>i.id===e.target.value);document.querySelector('#ai-price').value=x.price;});
  document.querySelector('#ai-form').addEventListener('submit',e=>{e.preventDefault();const x=products.find(i=>i.id===document.querySelector('#ai-product').value);const value=Number(document.querySelector('#ai-price').value);document.querySelector('#ai-result').innerHTML=aiResult(x,value);bindAlert(x,value);});
  bindAlert(p,asking);
}
function bindAlert(p,price){ document.querySelector('#alert-btn')?.addEventListener('click',()=>{const alerts=JSON.parse(localStorage.getItem('itmi-alerts')||'[]');alerts.push({id:p.id,name:p.name,price,createdAt:new Date().toISOString()});localStorage.setItem('itmi-alerts',JSON.stringify(alerts));showToast('บันทึกราคาเป้าหมายแล้ว',`${p.model} · ${money(price)} (เก็บไว้ในอุปกรณ์นี้)`);}); }

function render(){
  document.querySelector('#page-title').textContent=titles[state.view]; document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
  ({dashboard:renderDashboard,explorer:renderExplorer,compare:renderCompare,trends:renderTrends,deals:renderDeals,ai:renderAI}[state.view])(); bindDynamic();
}
function switchView(view){state.view=view;state.search='';document.body.classList.remove('menu-open');document.querySelector('#menu-btn').setAttribute('aria-expanded','false');render();window.scrollTo({top:0,behavior:'smooth'});}
function bindDynamic(){
  root.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.go)));
  root.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{state.category=b.dataset.category;document.querySelector('#category-filter').value=state.category;render();}));
  root.querySelectorAll('[data-compare]').forEach(b=>b.addEventListener('click',()=>toggleCompare(b.dataset.compare)));
  root.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{state.compare.delete(b.dataset.remove);saveCompare();renderCompare();bindDynamic();}));
}
function toggleCompare(id){
  if(state.compare.has(id))state.compare.delete(id); else if(state.compare.size<4)state.compare.add(id); else {showToast('เลือกได้สูงสุด 4 รายการ','นำสินค้าเดิมออกก่อนเพิ่มรายการใหม่');return;}
  saveCompare(); render();
}
function saveCompare(){localStorage.setItem('itmi-compare',JSON.stringify([...state.compare]));}
function showToast(title,msg){let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.append(t);}t.innerHTML=`<b>${title}</b><span>${msg}</span>`;requestAnimationFrame(()=>t.classList.add('show'));clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),3200);}

function attachLocalHistory(liveProducts){
  let saved={};
  try{saved=JSON.parse(localStorage.getItem('itmi-price-history')||'{}');}catch{}
  const next={...saved};
  const normalized=liveProducts.map(product=>{
    const previous=Array.isArray(saved[product.id])?saved[product.id].filter(Number.isFinite).slice(-4):[];
    const series=[...previous];
    if(series.at(-1)!==product.price)series.push(product.price);
    while(series.length<5)series.unshift(series[0]??product.price);
    const history=series.slice(-5);
    next[product.id]=history;
    return {...product,history};
  });
  localStorage.setItem('itmi-price-history',JSON.stringify(next));
  return normalized;
}

function setLiveStatus(mode,detail=''){
  const bar=document.querySelector('#live-bar'); const source=document.querySelector('.live-source');
  bar.classList.remove('loading','ready','fallback','error'); source.classList.remove('ready','fallback','error');
  bar.classList.add(mode); source.classList.add(mode);
  const titles={loading:'กำลังโหลดราคาตลาดล่าสุด',ready:'เชื่อมต่อข้อมูลตลาดสดแล้ว',fallback:'กำลังใช้ข้อมูลสำรอง',error:'ไม่สามารถโหลดข้อมูลตลาดได้'};
  document.querySelector('#live-title').textContent=titles[mode]||titles.loading;
  document.querySelector('#live-detail').textContent=detail||'ระบบจะใช้ข้อมูลสำรองหากบริการภายนอกไม่พร้อม';
  document.querySelector('#source-label').textContent=mode==='ready'?'Google Shopping ประเทศไทย':mode==='loading'?'กำลังเชื่อมต่อข้อมูลสด':'ข้อมูลสำรอง';
  document.querySelector('#source-time').textContent=dataSource.generatedAt
    ?`อัปเดต ${new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short'}).format(new Date(dataSource.generatedAt))}`
    :'รอการอัปเดตครั้งแรก';
}

async function loadLiveData(force=false){
  const button=document.querySelector('#refresh-live'); button.disabled=true;
  setLiveStatus('loading',force?'กำลังขอข้อมูลใหม่จาก SerpApi':'กำลังตรวจสอบข้อมูลล่าสุด');
  try{
    const requestOptions={headers:{accept:'application/json'}};
    if(force)requestOptions.cache='no-store';
    const response=await fetch(`/api/prices${force?'?refresh=1':''}`,requestOptions);
    const payload=await response.json();
    const edgeCache=(response.headers.get('x-vercel-cache')||'').toUpperCase();
    if(edgeCache==='HIT'||edgeCache==='STALE')payload.cached=true;
    if(!response.ok||!payload.ok||!Array.isArray(payload.products)||!payload.products.length)throw new Error(payload.error||'No live products');
    products=attachLocalHistory(payload.products);
    Object.assign(dataSource,{mode:'live',provider:payload.provider,generatedAt:payload.generated_at,cached:Boolean(payload.cached),stale:Boolean(payload.stale)});
    state.compare=new Set([...state.compare].filter(id=>products.some(product=>product.id===id))); saveCompare();
    updateFilterOptions();
    const missing=payload.failed_categories||[];
    const reasons=payload.failed_category_reasons||{};
    const reasonLabels={SERPAPI_LIMIT_REACHED:'โควตาหรือจำนวนคำขอเกิน',SERPAPI_TIMEOUT:'บริการตอบช้า',SERPAPI_UPSTREAM_ERROR:'บริการค้นหาขัดข้อง',SERPAPI_BAD_REQUEST:'คำค้นถูกปฏิเสธ',SERPAPI_INVALID_KEY:'คีย์ไม่ถูกต้อง',SERPAPI_UNREACHABLE:'เชื่อมต่อบริการไม่ได้',SERPAPI_INVALID_RESPONSE:'คำตอบจากบริการไม่ถูกต้อง',NO_PRODUCTS:'ไม่พบสินค้าที่มีราคา'};
    const missingDetail=missing.map(category=>`${category}: ${reasonLabels[reasons[category]]||reasons[category]||'ยังไม่ทราบสาเหตุ'}`).join(', ');
    setLiveStatus('ready',payload.stale?`แสดงข้อมูลล่าสุดที่บันทึกไว้ · ${reasonLabels[payload.refresh_error_code]||payload.refresh_error_code||'รีเฟรชไม่สำเร็จ'}`:missing.length?`อัปเดตได้บางหมวด · ${missingDetail}`:payload.cached?'ข้อมูลแคช · ตรวจสอบอัตโนมัติทุก 5 นาที':'ข้อมูลใหม่จากตลาด · แคชสูงสุด 1 ชั่วโมง');
    render();
    if(force)showToast(missing.length?'อัปเดตได้บางหมวด':'อัปเดตราคาแล้ว',missing.length?`ยังไม่มีข้อมูล: ${missing.join(', ')}`:`พบ ${products.length} รายการจาก Google Shopping ประเทศไทย`);
  }catch(error){
    if(dataSource.mode!=='live'){
      products=fallbackProducts.map(product=>({...product}));
      dataSource.mode='fallback'; updateFilterOptions(); render();
    }
    setLiveStatus(dataSource.mode==='live'?'fallback':'error',dataSource.mode==='live'?'ยังแสดงข้อมูลตลาดล่าสุดที่โหลดสำเร็จไว้':'กำลังแสดงข้อมูลสาธิตแทนชั่วคราว');
    if(force)showToast('รีเฟรชไม่สำเร็จ','ระบบยังคงแสดงข้อมูลล่าสุดหรือข้อมูลสำรอง');
  }finally{button.disabled=false;}
}

document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
document.querySelector('#menu-btn').addEventListener('click',()=>{const open=document.body.classList.toggle('menu-open');document.querySelector('#menu-btn').setAttribute('aria-expanded',String(open));});
document.querySelector('#category-filter').addEventListener('change',e=>{state.category=e.target.value;render();});
document.querySelector('#brand-filter').addEventListener('change',e=>{state.brand=e.target.value;render();});
document.querySelector('#shop-filter').addEventListener('change',e=>{state.shop=e.target.value;render();});
document.querySelector('#price-filter').addEventListener('input',e=>{state.maxPrice=Number(e.target.value);document.querySelector('#price-output').textContent=money(state.maxPrice);render();});
document.querySelector('#reset-btn').addEventListener('click',()=>{const maxPrice=Number(document.querySelector('#price-filter').max);Object.assign(state,{category:'all',brand:'all',shop:'all',maxPrice,search:''});document.querySelector('#category-filter').value='all';document.querySelector('#brand-filter').value='all';document.querySelector('#shop-filter').value='all';document.querySelector('#price-filter').value=String(maxPrice);document.querySelector('#price-output').textContent=money(maxPrice);render();showToast('รีเซ็ตแล้ว','กำลังแสดงข้อมูลทุกหมวดสินค้า');});
document.querySelector('#refresh-live').addEventListener('click',()=>loadLiveData(true));

function registerWebMCP(){
  const ctx=document.modelContext; if(!ctx?.registerTool)return; const lifecycle=new AbortController();
  const tools=[
    {name:'get_market_summary',title:'Get market summary',description:'Return the current filtered IT market KPI summary without changing the dashboard.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(){const x=filteredProducts(),ps=x.map(p=>p.price);return {items:x.length,average_price:Math.round(avg(ps)),lowest_price:ps.length?Math.min(...ps):null,highest_price:ps.length?Math.max(...ps):null,filters:{category:state.category,brand:state.brand,shop:state.shop,max_price:state.maxPrice}};}},
    {name:'filter_market',title:'Filter IT market',description:'Apply category, brand, shop, and maximum price filters to the visible market dashboard.',inputSchema:{type:'object',properties:{category:{type:'string'},brand:{type:'string'},shop:{type:'string'},maxPrice:{type:'number',minimum:1}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(input.category && input.category!=='all'&&!unique('category').includes(input.category))throw new Error('Unknown category');if(input.brand&&input.brand!=='all'&&!unique('brand').includes(input.brand))throw new Error('Unknown brand');if(input.shop&&input.shop!=='all'&&!unique('shop').includes(input.shop))throw new Error('Unknown shop');if(input.maxPrice!==undefined&&(!Number.isFinite(input.maxPrice)||input.maxPrice<1))throw new Error('Invalid maxPrice');Object.assign(state,{category:input.category??state.category,brand:input.brand??state.brand,shop:input.shop??state.shop,maxPrice:input.maxPrice??state.maxPrice});document.querySelector('#category-filter').value=state.category;document.querySelector('#brand-filter').value=state.brand;document.querySelector('#shop-filter').value=state.shop;document.querySelector('#price-filter').value=Math.min(90000,state.maxPrice);document.querySelector('#price-output').textContent=money(state.maxPrice);render();return {status:'applied',visible_items:filteredProducts().length};}},
    {name:'analyze_product_price',title:'Analyze a product price',description:'Open the AI price analysis view and score a supplied asking price for a known product id.',inputSchema:{type:'object',properties:{productId:{type:'string'},askingPrice:{type:'number',exclusiveMinimum:0}},required:['productId','askingPrice'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){const p=products.find(x=>x.id===input.productId);if(!p)throw new Error('Unknown productId');if(!Number.isFinite(input.askingPrice)||input.askingPrice<=0)throw new Error('Invalid askingPrice');state.view='ai';document.querySelector('#page-title').textContent=titles.ai;document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view==='ai'));renderAI(p.id,input.askingPrice);const result=analyze(p,input.askingPrice);return {product:p.name,asking_price:input.askingPrice,deal_score:result.score,verdict:result.verdict,market_average:Math.round(result.market)};}},
    {name:'refresh_live_prices',title:'Refresh live IT prices',description:'Refresh the visible Thailand IT market data from the server and update the dashboard.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},async execute(){await loadLiveData(true);return {status:dataSource.mode,provider:dataSource.provider||'fallback',generated_at:dataSource.generatedAt,items:products.length};}}
  ];
  tools.forEach(tool=>{try{void Promise.resolve(ctx.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}});
}

render(); registerWebMCP(); loadLiveData(false); setInterval(()=>loadLiveData(false),5*60*1000);
