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
  view:'catalog', productId:null, goldDetailsOpen:false, calc:{price:20000,share:.05,usd:null,gold:0,productId:''}, catalogSearch:'', catalogCategory:'all', category:'all', brand:'all', shop:'all', maxPrice:90000,
  search:'', compare:new Set(JSON.parse(localStorage.getItem('itmi-compare') || '[]'))
};
const titles = {catalog:'เทียบราคาร้านค้า',product:'รายละเอียดสินค้า',gold:'ทองและค่าเงิน',equipment:'ราคาอุปกรณ์ตามทองและค่าเงิน',dashboard:'ภาพรวมตลาด',explorer:'สำรวจสินค้า',compare:'เปรียบเทียบสินค้า',trends:'แนวโน้มราคา',deals:'ดีลน่าสนใจ',ai:'ประเมินราคา'};
const money = n => new Intl.NumberFormat('th-TH',{style:'currency',currency:'THB',maximumFractionDigits:0}).format(n);
const pct = n => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
const discount = p => p.original > 0 ? ((p.original-p.price)/p.original)*100 : 0;
const movement = p => p.history?.length && p.history[0] > 0 ? ((p.price-p.history[0])/p.history[0])*100 : 0;
const esc = value => String(value ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeUrl = value => { try { const url=new URL(value); return ['http:','https:'].includes(url.protocol)?url.href:null; } catch { return null; } };
const root = document.querySelector('#view-root');
const safeImage = value => typeof value==='string'&&/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(value)?value:safeUrl(value);
// รูปสินค้า: ใช้ image_url จาก API; ถ้าไม่มีรูปหรือโหลดรูปไม่ได้จะแสดงตัวย่อหมวดแทน
function productThumb(p,size=''){
  const label=esc(p.category.slice(0,3)); const src=safeImage(p.image_url);
  if(!src)return `<span class="product-icon ${size}">${label}</span>`;
  return `<span class="product-thumb ${size}"><img src="${esc(src)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-fallback="${label}"></span>`;
}
const safeLink = value => { try { const url=new URL(value,location.origin); return ['http:','https:'].includes(url.protocol)?url.href:null; } catch { return null; } };
document.addEventListener('error',e=>{
  const img=e.target; if(!(img instanceof HTMLImageElement))return;
  if(img.classList.contains('shop-logo')){img.remove();return;}
  if(!img.dataset.fallback)return;
  const box=img.parentElement; box.classList.replace('product-thumb','product-icon'); box.textContent=img.dataset.fallback;
},true);

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
  return `<div class="deal-list">${[...items].sort((a,b)=>discount(b)-discount(a)).slice(0,limit).map(p=>`<div class="deal-item">${productThumb(p)}<div><b>${esc(p.name)}</b><small>${esc(p.shop)} · ${esc(p.brand)}</small></div><div class="deal-price">${money(p.price)}<span>${discount(p)>0?`ลด ${discount(p).toFixed(1)}%`:'ราคาปัจจุบัน'}</span></div></div>`).join('')}</div>`;
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
  if(!items.length)return empty(); return `<div class="table-wrap"><table><thead><tr><th>สินค้า</th><th>หมวด</th><th>ร้านค้า</th><th>ราคา</th><th>ส่วนลด</th><th>แนวโน้ม</th><th>สถานะ</th><th></th></tr></thead><tbody>${items.map(p=>{const url=safeUrl(p.source_url);const name=url?`<a class="source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(p.name)}</a>`:esc(p.name);return `<tr><td class="product-cell"><div class="product-info">${productThumb(p)}<div><b>${name}</b><small>${esc(p.brand)} · ${esc(p.model)}</small></div></div></td><td>${esc(p.category)}</td><td>${esc(p.shop)}</td><td class="price">${money(p.price)}</td><td class="discount">${discount(p)>0?`-${discount(p).toFixed(1)}%`:'—'}</td><td class="${movement(p)>0?'negative':'positive'}">${pct(movement(p))}</td><td><span class="stock">${esc(p.stock_label||(p.stock==null?'ตรวจสอบที่ร้าน':p.stock?'มีสินค้า':'สินค้าหมด'))}</span></td><td><button class="compare-toggle ${state.compare.has(p.id)?'selected':''}" data-compare="${esc(p.id)}">${state.compare.has(p.id)?'เลือกแล้ว':'เปรียบเทียบ'}</button></td></tr>`;}).join('')}</tbody></table></div>`;
}
function renderExplorer(){
  const items=filteredProducts(); root.innerHTML=`<section class="card card-pad"><div class="toolbar"><input class="search" id="search-products" type="text" placeholder="ค้นหา เช่น RTX 5070 หรือ Kingston" value="${esc(state.search)}" aria-label="ค้นหาสินค้า"><div class="chips">${['all',...unique('category')].map(c=>`<button class="chip ${state.category===c?'active':''}" data-category="${esc(c)}">${c==='all'?'ทั้งหมด':esc(c)}</button>`).join('')}</div></div><div class="card-head"><div><h2>สินค้าในตลาด</h2><p>พบ ${items.length} รายการจาก ${dataSource.mode==='live'?'Google Shopping ประเทศไทย':'ข้อมูลสำรอง'}</p></div><span class="pill">เลือกเทียบได้สูงสุด 4 รายการ</span></div>${productTable(items)}</section>`;
  document.querySelector('#search-products')?.addEventListener('input',e=>{state.search=e.target.value;renderExplorer();setTimeout(()=>document.querySelector('#search-products')?.focus(),0);});
}
function renderCompare(){
  const items=products.filter(p=>state.compare.has(p.id)); if(!items.length){root.innerHTML=empty('ยังไม่ได้เลือกสินค้า','ไปที่ “สำรวจสินค้า” แล้วกดเปรียบเทียบได้สูงสุด 4 รายการ')+`<button class="primary-btn mt-16" data-go="explorer">เลือกสินค้า</button>`;return;}
  root.innerHTML=`<div class="card card-pad"><div class="card-head"><div><h2>เทียบแบบเห็นภาพเดียว</h2><p>${items.length} จาก 4 รายการ · ราคาโหลดจากแหล่งตลาดล่าสุด</p></div><button class="secondary-btn" data-go="explorer">เพิ่มสินค้า</button></div><div class="grid compare-grid">${items.map(p=>`<article class="card compare-card"><button class="remove" data-remove="${esc(p.id)}" aria-label="นำ ${esc(p.name)} ออกจากการเปรียบเทียบ">×</button>${productThumb(p,'large')}<h3>${esc(p.name)}</h3><span class="muted">${esc(p.shop)}</span><div class="kpi-value">${money(p.price)}</div><span class="pill positive">${p.original>p.price?`ประหยัด ${money(p.original-p.price)}`:'ราคาปัจจุบัน'}</span><div class="spec-list"><div class="spec-row"><span>แนวโน้มที่บันทึก</span><b>${pct(movement(p))}</b></div><div class="spec-row"><span>ส่วนลด</span><b>${discount(p).toFixed(1)}%</b></div>${Object.entries(p.specs||{}).map(([k,v])=>`<div class="spec-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div></article>`).join('')}</div></div>`;
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

// ===== หน้าเทียบราคาร้านค้า (หน้าแรก): รายการรุ่นสินค้า → กดเข้าไปดูราคาทุกร้าน → ปุ่มไปที่ร้าน =====
// ข้อมูลมาจาก /api/catalog ใน app/main.py; อยากเพิ่ม/ลบรุ่นให้แก้ TRACKED_PRODUCTS ฝั่ง Python
const catalogState = { status:'loading', items:[], generatedAt:null, error:'' };
const isCatalogView = () => state.view==='catalog'||state.view==='product';
const formatTime = iso => iso?new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso)):'';

function catalogItems(){
  const q=state.catalogSearch.trim().toLowerCase();
  return catalogState.items.filter(p=>(state.catalogCategory==='all'||p.category===state.catalogCategory)&&(!q||`${p.name} ${p.category}`.toLowerCase().includes(q)));
}
function catalogCard(p){
  return `<a class="catalog-card" href="#/product/${encodeURIComponent(p.id)}">${productThumb(p,'card')}<span class="pill">${esc(p.category)}</span><h3>${esc(p.name)}</h3><div class="catalog-price"><small>ราคาเริ่มต้น</small><b>${money(p.lowest_price)}</b></div><div class="catalog-meta">${p.shop_count} ร้านค้า · สูงสุด ${money(p.highest_price)}</div></a>`;
}
function catalogResults(){
  if(catalogState.status==='loading'&&!catalogState.items.length)return `<div class="catalog-grid">${'<div class="skeleton"></div>'.repeat(6)}</div>`;
  if(!catalogState.items.length)return empty('ยังโหลดรายการสินค้าไม่ได้',catalogState.error||'ลองกด “อัปเดตราคา” อีกครั้ง');
  const items=catalogItems();
  return items.length?`<div class="catalog-grid">${items.map(catalogCard).join('')}</div>`:empty('ไม่พบสินค้าที่ค้นหา','ลองพิมพ์ชื่อรุ่นให้สั้นลง หรือเลือกหมวด “ทั้งหมด”');
}
function renderCatalog(){
  const categories=[...new Set(catalogState.items.map(p=>p.category))];
  root.innerHTML=`<section class="card card-pad"><div class="toolbar"><input class="search" id="catalog-search" type="text" placeholder="ค้นหารุ่น เช่น RTX 5070 หรือ Ryzen" value="${esc(state.catalogSearch)}" aria-label="ค้นหาสินค้า"><div class="chips">${['all',...categories].map(c=>`<button class="chip ${state.catalogCategory===c?'active':''}" data-catalog-category="${esc(c)}">${c==='all'?'ทั้งหมด':esc(c)}</button>`).join('')}</div></div><div class="card-head"><div><h2>สินค้าที่ติดตามราคา</h2><p>กดที่สินค้าเพื่อดูราคาของแต่ละร้าน แล้วเลือกร้านที่ต้องการซื้อ</p></div><span class="pill">${catalogState.items.length} รุ่น</span></div><div id="catalog-results">${catalogResults()}</div></section>`;
  document.querySelector('#catalog-search').addEventListener('input',e=>{state.catalogSearch=e.target.value;document.querySelector('#catalog-results').innerHTML=catalogResults();});
  root.querySelectorAll('[data-catalog-category]').forEach(b=>b.addEventListener('click',()=>{state.catalogCategory=b.dataset.catalogCategory;renderCatalog();}));
}
function offerRow(o,i,p){
  const icon=safeImage(o.shop_icon); const buy=safeLink(o.buy_url);
  const logo=icon?`<img class="shop-logo" src="${esc(icon)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:`<span class="shop-initial">${esc(o.shop.slice(0,1))}</span>`;
  const note=o.price<=p.lowest_price?'<span class="best-badge">ถูกที่สุด</span>':`แพงกว่า ${money(o.price-p.lowest_price)}`;
  return `<article class="offer ${i===0?'best':''}"><div class="offer-shop">${logo}<div><b>${esc(o.shop)}</b><small title="${esc(o.title)}">${esc(o.title)}${o.delivery?` · ${esc(o.delivery)}`:''}</small></div></div><div class="offer-price"><b>${money(o.price)}</b><small>${note}</small></div>${buy?`<a class="primary-btn buy-btn" href="${esc(buy)}" target="_blank" rel="noopener noreferrer" aria-label="ไปซื้อที่ ${esc(o.shop)}">ไปที่ร้าน ↗</a>`:''}</article>`;
}
function renderProduct(){
  const p=catalogState.items.find(x=>x.id===state.productId); const back='<a class="back-link" href="#/">← กลับไปหน้ารวมสินค้า</a>';
  if(!p){root.innerHTML=back+(catalogState.status==='loading'?'<div class="skeleton hero-skeleton"></div>':empty('ไม่พบสินค้านี้','สินค้าอาจถูกนำออกจากรายการ หรือยังโหลดราคาไม่สำเร็จ'));return;}
  root.innerHTML=`${back}<section class="card card-pad product-hero">${productThumb(p,'hero')}<div><span class="pill">${esc(p.category)}</span><h2>${esc(p.name)}</h2><p class="muted">พบ ${p.shop_count} ร้านค้า${catalogState.generatedAt?` · อัปเดต ${formatTime(catalogState.generatedAt)}`:''}</p><div class="hero-stats"><div><small>ราคาต่ำสุด</small><b class="best">${money(p.lowest_price)}</b></div><div><small>ราคากลาง</small><b>${money(p.median_price)}</b></div><div><small>ถูกสุด–แพงสุดต่างกัน</small><b>${money(p.highest_price-p.lowest_price)}</b></div></div></div></section><section class="card card-pad section-row"><div class="card-head"><div><h2>ร้านค้าที่ขายสินค้านี้</h2><p>เรียงจากราคาถูกไปแพง · ราคาและสต็อกอาจเปลี่ยน โปรดตรวจสอบที่หน้าร้านก่อนชำระเงิน</p></div></div><div class="offer-list">${p.offers.map((o,i)=>offerRow(o,i,p)).join('')}</div></section>`;
}
function routeFromHash(){
  const match=location.hash.match(/^#\/product\/([\w-]+)$/); const equipment=location.hash.match(/^#\/equipment\/([\w-]+)$/);
  if(match){state.view='product';state.productId=match[1];}
  else if(equipment){state.view='equipment';state.equipmentCode=equipment[1];}
  else if(location.hash==='#/gold')state.view='gold';
  else if(state.view==='product')state.view='catalog';
  else if(state.view==='equipment')state.view='gold';
}
window.addEventListener('hashchange',()=>{routeFromHash();render();window.scrollTo({top:0});});

// จุดดึงข้อมูลหน้าเทียบราคา: force=true เติม ?refresh=1 ให้ข้ามแคช (ใช้โควตา SerpApi 1 ครั้งต่อรุ่น)
async function loadCatalog(force=false){
  const button=document.querySelector('#refresh-live'); if(isCatalogView())button.disabled=true;
  catalogState.status='loading'; setLiveStatus('loading',force?'กำลังขอราคาใหม่จากร้านค้า':'กำลังโหลดราคาจากร้านค้า','catalog');
  try{
    const response=await fetch(`/api/catalog${force?'?refresh=1':''}`,{headers:{accept:'application/json'},...(force?{cache:'no-store'}:{})});
    const payload=await response.json();
    if(!response.ok||!payload.ok||!Array.isArray(payload.products))throw new Error(payload.error||'Catalog unavailable');
    Object.assign(catalogState,{status:'ready',items:payload.products,generatedAt:payload.generated_at,error:''});
    const failed=payload.failed_products||[];
    setLiveStatus('ready',failed.length?`โหลดได้ ${payload.products.length} รุ่น · ยังโหลดไม่ได้ ${failed.length} รุ่น`:`ราคาจากร้านค้า ${payload.products.length} รุ่น · แคชสูงสุด 1 ชั่วโมง`,'catalog');
    if(force)showToast('อัปเดตราคาแล้ว',`${payload.products.length} รุ่นจากร้านค้าในไทย`);
  }catch(error){
    const hasData=catalogState.items.length>0;
    catalogState.status=hasData?'ready':'error';
    catalogState.error=hasData?'':'ตรวจสอบว่าเซิร์ฟเวอร์ตั้งค่า SERPAPI_KEY แล้ว หรือกด “อัปเดตราคา” อีกครั้ง';
    setLiveStatus(hasData?'fallback':'error',hasData?'ยังแสดงราคาล่าสุดที่โหลดสำเร็จไว้':'ไม่สามารถโหลดรายการสินค้าได้','catalog');
    if(force)showToast('รีเฟรชไม่สำเร็จ','ระบบยังคงแสดงข้อมูลล่าสุด');
  }finally{
    button.disabled=false;
    // ถ้าผู้ใช้กำลังพิมพ์ค้นหาอยู่ อัปเดตเฉพาะผลลัพธ์เพื่อไม่ให้ช่องค้นหาหลุดโฟกัส
    if(state.view==='catalog'&&document.activeElement?.id==='catalog-search')document.querySelector('#catalog-results').innerHTML=catalogResults();
    else if(isCatalogView())render();
  }
}

// ===== หน้า "ทองและค่าเงิน": อ่านจาก /api/equipment/* (ฐานข้อมูล EquipmentPriceDB ซึ่งเป็นข้อมูลจำลอง) =====
const equipmentState = { status:'idle', overview:null, details:{}, error:'' };
const isEquipmentView = () => state.view==='gold'||state.view==='equipment';
const liveTarget = () => isCatalogView()?'catalog':isEquipmentView()?'equipment':'market';
const CHART_COLORS = { price:'#235da8', gold:'#ad6c16', fx:'#6955a6' };
const equipmentErrors = {
  DB_NOT_CONFIGURED:'ยังไม่ได้ตั้งค่า EQUIPMENT_DB_CONNECTION ในไฟล์ .env',
  DB_DRIVER_MISSING:'เครื่องเซิร์ฟเวอร์ยังไม่มี pyodbc หรือ ODBC Driver for SQL Server',
  DB_UNAVAILABLE:'เชื่อมต่อ SQL Server ไม่ได้ ตรวจว่าเปิดบริการแล้ว และรัน EquipmentPriceDB.sql แล้ว',
  NOT_FOUND:'ไม่พบรหัสอุปกรณ์นี้ในฐานข้อมูล'
};
const thaiDate = iso => new Intl.DateTimeFormat('th-TH',{day:'numeric',month:'short',year:'numeric'}).format(new Date(`${iso}T00:00:00`));
const thaiMonth = iso => new Intl.DateTimeFormat('th-TH',{month:'short'}).format(new Date(`${iso}T00:00:00`));
const signed = (n,digits=2) => `${n>=0?'+':''}${n.toFixed(digits)}`;

// กราฟเส้นแกนเดียว: หลายเส้นต้องอยู่หน่วยเดียวกัน (เช่น ดัชนีวันฐาน = 100) ห้ามทำสองแกน
const chartRegistry = new Map();
function niceStep(range,count){const raw=range/count;const mag=10**Math.floor(Math.log10(raw));const n=raw/mag;return (n>=7?10:n>=3?5:n>=1.5?2:1)*mag;}
function lineChartSvg(id,dates,series,{height=260,axisFormat=v=>v,valueFormat=v=>v,label=''}={}){
  // วาดตามความกว้างจริงของพื้นที่ เพื่อให้ตัวอักษรบนมือถือไม่ถูกย่อจนอ่านไม่ออก; จอแคบตัดป้ายท้ายเส้นออก (ใช้ legend แทน)
  const w=Math.round(Math.min(760,Math.max(300,(root.clientWidth||760)-48))),narrow=w<560,h=narrow?Math.round(height*.85):height,padL=narrow?44:58,padR=series.length>1&&!narrow?104:14,padT=14,padB=28;
  const values=series.flatMap(s=>s.values);let min=Math.min(...values),max=Math.max(...values);const pad=(max-min||1)*.08;min-=pad;max+=pad;
  const x=i=>padL+i*(w-padL-padR)/Math.max(1,dates.length-1); const y=v=>padT+(max-v)/(max-min)*(h-padT-padB);
  const step=niceStep(max-min,6); const ticks=[]; for(let v=Math.ceil(min/step)*step;v<=max;v+=step)ticks.push(v);
  const grid=ticks.map(v=>`<line class="grid-line" x1="${padL}" x2="${w-padR}" y1="${y(v)}" y2="${y(v)}"/><text class="axis-label" x="${padL-8}" y="${y(v)+4}" text-anchor="end">${axisFormat(v)}</text>`).join('');
  const months=dates.map((d,i)=>[d,i]).filter(([d])=>d.endsWith('-01')).filter((_,k)=>!narrow||k%2===0).map(([d,i])=>`<text class="axis-label" x="${x(i)}" y="${h-8}" text-anchor="middle">${thaiMonth(d)}</text>`).join('');
  const paths=series.map(s=>`<path class="series-line" d="${s.values.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')}" stroke="${s.color}"/>`).join('');
  // ป้ายชื่อท้ายเส้น: ตัวอักษรใช้สีข้อความ ส่วนจุดสีบอกว่าเป็นเส้นไหน; เลื่อนไม่ให้ซ้อนกัน
  let ends='';
  if(series.length>1&&!narrow){
    const placed=series.map(s=>({s,cy:y(s.values.at(-1))})).sort((a,b)=>a.cy-b.cy);
    placed.forEach((p,i)=>{p.ly=i?Math.max(p.cy,placed[i-1].ly+15):p.cy;});
    ends=placed.map(p=>`<circle cx="${x(dates.length-1)}" cy="${p.cy}" r="4" fill="${p.s.color}" stroke="var(--surface)" stroke-width="2"/><text class="end-label" x="${x(dates.length-1)+10}" y="${p.ly+4}">${p.s.name}</text>`).join('');
  }
  const hover=`<line class="hover-line" x1="0" x2="0" y1="${padT}" y2="${h-padB}" visibility="hidden"/>${series.map(s=>`<circle class="hover-dot" r="5" fill="${s.color}" stroke="var(--surface)" stroke-width="2" visibility="hidden"/>`).join('')}<rect class="hover-target" x="${padL}" y="0" width="${w-padL-padR}" height="${h}" fill="transparent"/>`;
  chartRegistry.set(id,{dates,series,x,y,w,valueFormat});
  return `<div class="chart-box" data-chart="${id}"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${grid}${months}${paths}${ends}${hover}</svg><div class="chart-tip" hidden></div></div>`;
}
function chartLegend(series){return series.length>1?`<div class="chart-legend">${series.map(s=>`<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')}</div>`:'';}
function bindCharts(){
  root.querySelectorAll('[data-chart]').forEach(box=>{
    const chart=chartRegistry.get(box.dataset.chart); if(!chart)return;
    const svg=box.querySelector('svg'),tip=box.querySelector('.chart-tip'),line=svg.querySelector('.hover-line'),dots=[...svg.querySelectorAll('.hover-dot')];
    const hide=()=>{line.setAttribute('visibility','hidden');dots.forEach(d=>d.setAttribute('visibility','hidden'));tip.hidden=true;};
    svg.querySelector('.hover-target').addEventListener('pointermove',e=>{
      const rect=svg.getBoundingClientRect(); const vx=(e.clientX-rect.left)*chart.w/rect.width;
      const last=chart.dates.length-1; const i=Math.max(0,Math.min(last,Math.round((vx-chart.x(0))/(chart.x(last)-chart.x(0)||1)*last)));
      const cx=chart.x(i); line.setAttribute('x1',cx); line.setAttribute('x2',cx); line.setAttribute('visibility','visible');
      dots.forEach((d,k)=>{d.setAttribute('cx',cx);d.setAttribute('cy',chart.y(chart.series[k].values[i]));d.setAttribute('visibility','visible');});
      tip.innerHTML=`<b>${thaiDate(chart.dates[i])}</b>${chart.series.map(s=>`<span><i style="background:${s.color}"></i>${s.name}<em>${chart.valueFormat(s.values[i])}</em></span>`).join('')}`;
      tip.hidden=false; const px=cx/chart.w*rect.width; tip.style.left=`${px}px`; tip.classList.toggle('flip',px>rect.width*.6);
    });
    svg.querySelector('.hover-target').addEventListener('pointerleave',hide);
  });
}

function mockNote(overview){
  const range=overview?`${thaiDate(overview.start_date)} – ${thaiDate(overview.latest_date)}`:'';
  return `<div class="data-note mock-note"><span></span><div><b>ข้อมูลจำลองจากฐานข้อมูล EquipmentPriceDB${range?` · ${range}`:''}</b><small>ราคาทอง ค่าเงิน และราคาอุปกรณ์ในหน้านี้สร้างจากสูตร ใช้สาธิตการวิเคราะห์ ไม่ใช่ราคาตลาดจริง</small></div></div>`;
}
function equipmentProblem(){
  if(equipmentState.status==='loading'||equipmentState.status==='idle')return '<div class="skeleton hero-skeleton"></div>';
  return empty('อ่านฐานข้อมูลไม่ได้',equipmentErrors[equipmentState.error]||'ลองกด “อัปเดตราคา” อีกครั้ง');
}
// หมวดในฐานข้อมูลที่เป็นอุปกรณ์คอม/อิเล็กทรอนิกส์ ใช้แสดงในส่วน "อุปกรณ์คอมแพงขึ้นเพราะอะไร"
const IT_CATEGORIES = ['อุปกรณ์ไอทีและเครือข่าย','ชิ้นส่วนอิเล็กทรอนิกส์'];
// แยกการเปลี่ยนแปลงราคาเป็นส่วนจากค่าเงินและส่วนจากทอง (รวมกันได้เท่าราคาที่เปลี่ยนจริงพอดี)
// สูตรราคาในฐานข้อมูล: ราคา ∝ ค่าเงิน × [(1 − w) + w × ราคาทอง]  โดย w = สัดส่วนต้นทุนที่ผูกกับทอง
function priceDrivers(fxPct,goldPct,w){const F=1+fxPct/100,G=1+goldPct/100;return {fx:(F-1)*100,gold:F*w*(G-1)*100};}
const percent = (n,digits=1) => `${n>=0?'+':''}${n.toFixed(digits)}%`;
function driverBar(d,scale){
  const seg=(v,cls)=>v>0?`<span class="${cls}" style="width:${v/scale*100}%"></span>`:'';
  return `<div class="driver-bar">${seg(d.fx,'seg-fx')}${seg(d.gold,'seg-gold')}</div>`;
}
function renderGold(){
  const o=equipmentState.overview; if(!o){root.innerHTML=mockNote(null)+equipmentProblem();return;}
  const g=o.gold, fx=o.fx, usd=fx.USD.change_period_pct;
  const it=o.equipment.filter(e=>IT_CATEGORIES.includes(e.category)).map(e=>({...e,drivers:priceDrivers(e.currency==='THB'?0:fx[e.currency].change_period_pct,g.change_period_pct,e.gold_weight)})).sort((a,b)=>a.gold_weight-b.gold_weight);
  const pcParts=it.filter(e=>e.gold_weight<=.1);
  const goldRange=pcParts.length?`${Math.min(...pcParts.map(e=>e.drivers.gold)).toFixed(1)}–${Math.max(...pcParts.map(e=>e.drivers.gold)).toFixed(1)}%`:'';
  const weightRange=pcParts.length?`${Math.round(Math.min(...pcParts.map(e=>e.gold_weight))*100)}–${Math.round(Math.max(...pcParts.map(e=>e.gold_weight))*100)}%`:'';
  const scale=Math.max(...it.map(e=>Math.max(0,e.drivers.fx)+Math.max(0,e.drivers.gold)),1);
  const since=thaiDate(o.start_date);
  const rows=it.map(e=>`<a class="driver-row" href="#/equipment/${encodeURIComponent(e.code)}"><div class="driver-name"><b>${esc(e.name)}</b><small>ทองคิดเป็น ${Math.round(e.gold_weight*100)}% ของต้นทุน · ${money(e.base_price)} → ${money(e.latest_price)}</small></div>${driverBar(e.drivers,scale)}<div class="driver-total"><b class="${e.pct_change>0?'negative':'positive'}">${percent(e.pct_change)}</b><small>ค่าเงิน ${percent(e.drivers.fx)} · ทอง ${percent(e.drivers.gold)}</small></div></a>`).join('');
  const fxKpi=(code,label,scale=1)=>kpi(label,`฿${(fx[code].rate*scale).toFixed(2)}`,`${signed(fx[code].change_period_pct)}% ตั้งแต่ต้นช่วง`,'var(--cyan)');
  const fullRows=o.equipment.map(e=>`<tr><td class="product-cell"><b><a class="source-link" href="#/equipment/${encodeURIComponent(e.code)}">${esc(e.name)}</a></b><small>${esc(e.code)} · ${esc(e.category)}</small></td><td>${esc(e.currency)}</td><td>${Math.round(e.gold_weight*100)}%</td><td class="price">${money(e.base_price)}</td><td class="price">${money(e.latest_price)}</td><td class="${e.pct_change>0?'negative':'positive'}">${signed(e.pct_change)}%</td><td>${e.corr_gold==null?'—':e.corr_gold.toFixed(2)}</td></tr>`).join('');
  root.innerHTML=`${mockNote(o)}
  <section class="card card-pad section-row"><div class="card-head"><div><h2>ค่าเงินและทองทำให้ราคาคอมขึ้นลงยังไง</h2><p>สรุปจากข้อมูลตั้งแต่ ${since} ถึง ${thaiDate(o.latest_date)}</p></div></div>
    <div class="explain-grid">
      <article class="explain-item main"><span class="explain-icon fx" aria-hidden="true">$</span><b>ค่าเงินบาทคือตัวหลัก</b><p>ชิ้นส่วนคอมเกือบทั้งหมดนำเข้าและตั้งราคาเป็นดอลลาร์ เงินบาทอ่อนลง 1% ราคาคอมจะแพงขึ้นราว 1% ตามไปด้วย</p><em>ช่วงนี้ดอลลาร์แพงขึ้น ${percent(usd)} → ราคาคอมขึ้นจากค่าเงิน ${percent(usd)}</em></article>
      <article class="explain-item"><span class="explain-icon gold" aria-hidden="true">Au</span><b>ราคาทองมีผลน้อย</b><p>ทองใช้แค่ชุบขั้วต่อและหน้าสัมผัสในชิป คิดเป็นราว ${weightRange||'3–8%'} ของต้นทุน ทองขึ้นมากแค่ไหนราคาคอมก็ขยับนิดเดียว</p><em>ทองขึ้น ${percent(g.change_period_pct)} → ราคาคอมขึ้นจากทองแค่ ${goldRange||'~1%'}</em></article>
      <article class="explain-item"><span class="explain-icon tip" aria-hidden="true">✓</span><b>ควรดูอะไรก่อนซื้อ</b><p>ถ้าเห็นข่าวเงินบาทอ่อนค่า ราคาคอมมักขยับตามในไม่กี่สัปดาห์ ส่วนข่าวทองขึ้นแทบไม่กระทบ ยกเว้นชิ้นส่วนที่ชุบทองเยอะ เช่น หัวต่อสัญญาณ</p></article>
    </div></section>
  <section class="card card-pad section-row"><div class="card-head"><div><h2>อุปกรณ์คอมแพงขึ้นเพราะอะไร</h2><p>แยกว่าราคาที่เปลี่ยนตั้งแต่ ${since} มาจากค่าเงินกี่ % และจากทองกี่ % · กดเพื่อดูกราฟรายวัน</p></div></div>
    <div class="chart-legend"><span><i style="background:${CHART_COLORS.fx}"></i>ส่วนที่มาจากค่าเงิน</span><span><i style="background:${CHART_COLORS.gold}"></i>ส่วนที่มาจากราคาทอง</span></div>
    <div class="driver-list">${rows}</div></section>
  <section class="card card-pad section-row"><div class="card-head"><div><h2>ลองคำนวณ: ถ้าค่าเงินหรือทองเปลี่ยน ราคาคอมจะเป็นเท่าไร</h2><p>เลื่อนแถบเพื่อดูผลทันที</p></div></div><div id="gold-calc">${goldCalculator(o)}</div></section>
  <details class="card card-pad section-row more-data"><summary>ดูข้อมูลทั้งหมด: ราคาทองรายวัน ค่าเงิน 4 สกุล และอุปกรณ์ทั้ง ${o.equipment.length} รายการ</summary>
    <section class="grid kpi-grid five section-row">${kpi('ทองคำแท่ง ขายออก',money(g.sell),`${g.change_day>=0?'+':''}${money(g.change_day)} จากวันก่อน · ${signed(g.change_period_pct,1)}% ทั้งช่วง`,'var(--amber)')}${fxKpi('USD','USD / THB')}${fxKpi('EUR','EUR / THB')}${fxKpi('JPY','100 JPY / THB',100)}${fxKpi('CNY','CNY / THB')}</section>
    <div class="section-row"><div class="card-head"><div><h2>ราคาทองคำแท่งขายออก</h2><p>บาทต่อ 1 บาททองคำ (96.5%) รายวัน · ชี้บนกราฟเพื่อดูราคาแต่ละวัน</p></div></div>${lineChartSvg('gold-chart',o.gold_series.map(d=>d.date),[{name:'ราคาทอง',color:CHART_COLORS.gold,values:o.gold_series.map(d=>d.value)}],{axisFormat:v=>`${Math.round(v/1000)}K`,valueFormat:v=>money(v),label:'กราฟราคาทองคำแท่งขายออกรายวัน'})}</div>
    <div class="section-row"><div class="card-head"><div><h2>อุปกรณ์ทั้งหมดในฐานข้อมูล</h2><p>รวมอุปกรณ์การแพทย์ เครื่องมือวัด และวัสดุงานทอง</p></div></div><div class="table-wrap"><table class="equipment-table"><thead><tr><th>อุปกรณ์</th><th>สกุลเงิน</th><th>ผูกกับทอง</th><th>ราคาวันฐาน</th><th>ราคาล่าสุด</th><th>เปลี่ยนแปลง</th><th>สหสัมพันธ์กับทอง</th></tr></thead><tbody>${fullRows}</tbody></table></div><p class="table-note">สหสัมพันธ์ใกล้ 1 = ราคาขึ้นลงตามทอง, ใกล้ 0 = ไม่เกี่ยวกัน</p></div>
  </details>`;
  bindGoldCalculator(o);
  const details=root.querySelector('.more-data'); details.open=state.goldDetailsOpen; details.addEventListener('toggle',()=>{state.goldDetailsOpen=details.open;});
}

// เครื่องคิดเลข "ถ้า...แล้วราคาจะเป็นเท่าไร": ค่าที่เลือกเก็บใน state.calc เพื่อไม่หายเมื่อหน้าวาดใหม่
const GOLD_SHARES = [{value:.03,label:'อุปกรณ์เครือข่าย / SSD (ทอง ~3%)'},{value:.05,label:'แรม / การ์ดจอ / เมนบอร์ด (ทอง ~5%)'},{value:.08,label:'ซีพียู (ทอง ~8%)'}];
function goldCalculator(o){
  const c=state.calc; const usdNow=o.fx.USD.rate;
  if(c.usd==null)c.usd=Number(usdNow.toFixed(2));
  const options=catalogState.items.map(p=>`<option value="${esc(p.id)}" ${c.productId===p.id?'selected':''}>${esc(p.name)} (${money(p.lowest_price)})</option>`).join('');
  return `<div class="calc-grid"><div class="calc-inputs">
    ${options?`<label class="form-field">สินค้า<select id="calc-product"><option value="">กรอกราคาเอง</option>${options}</select></label>`:''}
    <label class="form-field">ราคาตอนนี้ (บาท)<input id="calc-price" type="number" min="1" step="100" value="${c.price}"></label>
    <label class="form-field">ประเภทอุปกรณ์<select id="calc-share">${GOLD_SHARES.map(s=>`<option value="${s.value}" ${c.share===s.value?'selected':''}>${s.label}</option>`).join('')}</select></label>
    <label class="form-field">ค่าเงิน: 1 ดอลลาร์ = <output id="calc-usd-out">฿${c.usd.toFixed(2)}</output> <small>(ตอนนี้ ฿${usdNow.toFixed(2)})</small><input id="calc-usd" type="range" min="30" max="40" step="0.01" value="${c.usd}"></label>
    <label class="form-field">ราคาทองเปลี่ยน <output id="calc-gold-out">${percent(c.gold,0)}</output><input id="calc-gold" type="range" min="-30" max="30" step="1" value="${c.gold}"></label>
  </div><div class="calc-result" id="calc-result" aria-live="polite"></div></div>
  <p class="table-note">ประมาณการแบบง่าย: สมมติต้นทุนทั้งหมดเป็นดอลลาร์และร้านปรับราคาตามต้นทุนทันที ราคาจริงขึ้นกับสต็อก โปรโมชัน และการแข่งขันของร้าน</p>`;
}
function bindGoldCalculator(o){
  const c=state.calc, usdNow=Number(o.fx.USD.rate.toFixed(2)), q=s=>document.querySelector(s);
  const update=()=>{
    const F=c.usd/usdNow, G=1+c.gold/100, newPrice=c.price*F*((1-c.share)+c.share*G);
    const fxPart=c.price*(F-1), goldPart=c.price*F*c.share*(G-1), diff=newPrice-c.price;
    q('#calc-usd-out').textContent=`฿${c.usd.toFixed(2)}`; q('#calc-gold-out').textContent=percent(c.gold,0);
    q('#calc-result').innerHTML=`<small>ราคาโดยประมาณ</small><b class="${diff>0.5?'negative':diff<-0.5?'positive':''}">${money(newPrice)}</b><span class="calc-diff">${Math.abs(diff)<0.5?'เท่าเดิม':`${diff>0?'แพงขึ้น':'ถูกลง'} ${money(Math.abs(diff))} (${percent(diff/c.price*100)})`}</span><div class="calc-split"><span><i style="background:${CHART_COLORS.fx}"></i>จากค่าเงิน<em>${fxPart>=0?'+':'−'}${money(Math.abs(fxPart))}</em></span><span><i style="background:${CHART_COLORS.gold}"></i>จากราคาทอง<em>${goldPart>=0?'+':'−'}${money(Math.abs(goldPart))}</em></span></div>`;
  };
  q('#calc-product')?.addEventListener('change',e=>{c.productId=e.target.value;const p=catalogState.items.find(x=>x.id===c.productId);if(p){c.price=p.lowest_price;q('#calc-price').value=c.price;const s=p.category==='CPU'?.08:p.category==='SSD'?.03:.05;c.share=s;q('#calc-share').value=String(s);}update();});
  q('#calc-price').addEventListener('input',e=>{c.price=Math.max(0,Number(e.target.value)||0);c.productId='';const sel=q('#calc-product');if(sel)sel.value='';update();});
  q('#calc-share').addEventListener('change',e=>{c.share=Number(e.target.value);update();});
  q('#calc-usd').addEventListener('input',e=>{c.usd=Number(e.target.value);update();});
  q('#calc-gold').addEventListener('input',e=>{c.gold=Number(e.target.value);update();});
  update();
}
function renderEquipment(){
  const back='<button class="back-link" data-go="gold">← กลับไปหน้าทองและค่าเงิน</button>';
  const d=equipmentState.details[state.equipmentCode];
  if(!d||d.loading){root.innerHTML=back+mockNote(equipmentState.overview)+(d?.error?empty('อ่านข้อมูลอุปกรณ์ไม่ได้',equipmentErrors[d.error]||d.error):'<div class="skeleton hero-skeleton"></div>');return;}
  const series=[{name:'ราคาอุปกรณ์',color:CHART_COLORS.price,values:d.series.map(r=>r.price_index)},{name:'ราคาทอง',color:CHART_COLORS.gold,values:d.series.map(r=>r.gold_index)}];
  if(d.currency!=='THB')series.push({name:`ค่าเงิน ${d.currency}`,color:CHART_COLORS.fx,values:d.series.map(r=>r.fx_index)});
  const last=d.series.at(-1);
  const drivers=priceDrivers(last.fx_index-100,last.gold_index-100,d.gold_weight);
  const summary=`ราคา${d.pct_change>=0?'ขึ้น':'ลง'} ${percent(d.pct_change,2)} ตั้งแต่วันฐาน: มาจากค่าเงิน ${d.currency==='THB'?'0% (ซื้อเป็นเงินบาท)':percent(drivers.fx,2)} และจากราคาทอง ${percent(drivers.gold,2)}`;
  const months=d.monthly.map(m=>`<tr><td>${new Intl.DateTimeFormat('th-TH',{month:'long',year:'numeric'}).format(new Date(`${m.month}T00:00:00`))}</td><td class="price">${money(m.avg_price)}</td><td>${money(m.min_price)}</td><td>${money(m.max_price)}</td><td>${money(m.avg_gold)}</td></tr>`).join('');
  root.innerHTML=`${back}${mockNote(equipmentState.overview)}<section class="card card-pad section-row product-hero equipment-hero"><div><span class="pill">${esc(d.category)}</span><h2>${esc(d.name)}</h2><p class="muted">${esc(d.code)} · ผู้จำหน่าย ${esc(d.supplier)} · ราคาฐานเป็น ${esc(d.currency)} · ผูกกับทอง ${Math.round(d.gold_weight*100)}%</p><div class="hero-stats"><div><small>ราคาวันฐาน (${thaiDate(d.base_date)})</small><b>${money(d.base_price)}</b></div><div><small>ราคาล่าสุด (${thaiDate(d.latest_date)})</small><b class="${d.pct_change>0?'negative':'positive'}">${money(d.latest_price)}</b></div><div><small>เปลี่ยนแปลง</small><b>${signed(d.pct_change)}%</b></div><div><small>ต่ำสุด – สูงสุด</small><b>${money(d.min_price)} – ${money(d.max_price)}</b></div></div><p class="explain-line">${summary}</p></div></section>
  <section class="card card-pad section-row"><div class="card-head"><div><h2>ราคาขยับตามอะไร</h2><p>ทุกเส้นเริ่มที่ 100 ในวันฐาน เพื่อเทียบเปอร์เซ็นต์การเปลี่ยนแปลงบนแกนเดียวกัน · ล่าสุด: อุปกรณ์ ${last.price_index.toFixed(1)}, ทอง ${last.gold_index.toFixed(1)}${d.currency!=='THB'?`, ค่าเงิน ${last.fx_index.toFixed(1)}`:''}</p></div></div>${chartLegend(series)}${lineChartSvg('equipment-chart',d.series.map(r=>r.date),series,{axisFormat:v=>v.toFixed(0),valueFormat:v=>v.toFixed(1),label:`ดัชนีราคา ${d.name} เทียบราคาทองและค่าเงิน`})}<p class="table-note">สหสัมพันธ์กับทอง ${d.corr_gold==null?'—':d.corr_gold.toFixed(2)}${d.corr_fx==null?'':` · กับค่าเงิน ${d.corr_fx.toFixed(2)}`}</p></section>
  <section class="card card-pad section-row"><div class="card-head"><div><h2>สรุปรายเดือน</h2><p>ราคาขายเฉลี่ย ต่ำสุด สูงสุด และราคาทองเฉลี่ยของแต่ละเดือน</p></div></div><div class="table-wrap"><table class="monthly-table"><thead><tr><th>เดือน</th><th>ราคาเฉลี่ย</th><th>ต่ำสุด</th><th>สูงสุด</th><th>ราคาทองเฉลี่ย</th></tr></thead><tbody>${months}</tbody></table></div></section>`;
}

// จุดดึงข้อมูลหน้าทองและค่าเงิน: อ่านจากฐานข้อมูลในเครื่อง ไม่ใช้โควตา SerpApi
async function fetchEquipment(path){
  const response=await fetch(path,{headers:{accept:'application/json'},cache:'no-store'}); const payload=await response.json();
  if(!response.ok||!payload.ok){const error=new Error(payload.error||'Database unavailable');error.code=payload.code||'DB_UNAVAILABLE';throw error;}
  return payload;
}
async function loadEquipmentOverview(){
  const button=document.querySelector('#refresh-live'); button.disabled=true;
  equipmentState.status='loading'; setLiveStatus('loading','กำลังอ่านฐานข้อมูล EquipmentPriceDB','equipment');
  try{
    equipmentState.overview=await fetchEquipment('/api/equipment/overview'); equipmentState.status='ready'; equipmentState.error='';
    const fromSnapshot=equipmentState.overview.source==='snapshot';
    setLiveStatus('ready',`${fromSnapshot?'ชุดข้อมูลจำลองที่บันทึกไว้':'ข้อมูลจำลองจาก SQL Server'} ถึง ${thaiDate(equipmentState.overview.latest_date)} · ${equipmentState.overview.equipment.length} อุปกรณ์`,'equipment');
  }catch(error){
    equipmentState.status='error'; equipmentState.error=error.code;
    setLiveStatus('error',equipmentErrors[error.code]||'อ่านฐานข้อมูลไม่ได้','equipment');
  }finally{button.disabled=false; if(isEquipmentView())render();}
}
async function loadEquipmentDetail(code){
  equipmentState.details[code]={loading:true};
  try{equipmentState.details[code]=await fetchEquipment(`/api/equipment/${encodeURIComponent(code)}`);}
  catch(error){equipmentState.details[code]={error:error.code};}
  if(state.view==='equipment'&&state.equipmentCode===code)render();
}

function render(){
  const navView=state.view==='product'?'catalog':state.view==='equipment'?'gold':state.view; const current=state.view==='product'?catalogState.items.find(x=>x.id===state.productId):state.view==='equipment'?equipmentState.details[state.equipmentCode]:null;
  document.querySelector('#page-title').textContent=titles[state.view]; document.querySelectorAll('.nav-item,.tab-item[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===navView)); moveTabIndicator();
  document.title=`${current?.name||titles[state.view]} | IT Market Intelligence`;
  document.body.classList.toggle('no-filters',liveTarget()!=='market'); paintLiveStatus();
  // หน้าตลาดเดิมโหลด /api/prices ครั้งแรกเมื่อเปิดหน้านั้นจริง เพื่อไม่ใช้โควตาโดยไม่จำเป็น
  if(liveTarget()==='market'&&!marketRequested){marketRequested=true;loadLiveData(false);}
  if(isCatalogView()&&!catalogRequested){catalogRequested=true;loadCatalog(false);}
  // หน้าทองและค่าเงินโหลดจากฐานข้อมูลเมื่อเปิดหน้าครั้งแรก; หน้าอุปกรณ์โหลดรายละเอียดทีละรหัส
  if(isEquipmentView()&&equipmentState.status==='idle')loadEquipmentOverview();
  if(state.view==='equipment'&&!equipmentState.details[state.equipmentCode])loadEquipmentDetail(state.equipmentCode);
  ({catalog:renderCatalog,product:renderProduct,gold:renderGold,equipment:renderEquipment,dashboard:renderDashboard,explorer:renderExplorer,compare:renderCompare,trends:renderTrends,deals:renderDeals,ai:renderAI}[state.view])(); bindDynamic(); bindCharts();
}
// แคปซูลดำของแถบเมนูล่างเลื่อนไปอยู่ใต้ปุ่มที่เลือก; ถ้าหน้าปัจจุบันไม่มีปุ่มในแถบ (เช่น ดีลน่าสนใจ) ให้ซ่อน
function moveTabIndicator(){
  const indicator=document.querySelector('.tab-indicator'); if(!indicator)return;
  const active=document.querySelector('.tab-item.active');
  if(!active||!active.offsetWidth){indicator.style.opacity='0';return;}
  indicator.style.width=`${active.offsetWidth}px`; indicator.style.transform=`translateX(${active.offsetLeft}px)`; indicator.style.opacity='1';
}
window.addEventListener('resize',moveTabIndicator);
// เบราว์เซอร์มือถือบางตัว (เช่น Safari) มีแถบเครื่องมือลอยทับด้านล่างจอ: ยกแถบเมนูขึ้นให้พ้นส่วนที่ถูกบัง
// ถ้าคีย์บอร์ดเปิดอยู่ (พื้นที่หายไปมาก) ให้ซ่อนแถบเมนูแทน เพื่อไม่ให้บังช่องที่กำลังพิมพ์
function syncTabBar(){
  const bar=document.querySelector('.tab-bar'), vv=window.visualViewport; if(!bar||!vv)return;
  const hidden=Math.max(0,window.innerHeight-vv.height-vv.offsetTop);
  bar.style.transform=hidden>150?'translateY(200%)':hidden?`translateY(${-hidden}px)`:'';
}
window.visualViewport?.addEventListener('resize',syncTabBar);
window.visualViewport?.addEventListener('scroll',syncTabBar);
function switchView(view){if(location.hash.startsWith('#/'))history.pushState(null,'',location.pathname+location.search);state.view=view;state.search='';document.body.classList.remove('menu-open');document.querySelector('#menu-btn').setAttribute('aria-expanded','false');render();window.scrollTo({top:0,behavior:'smooth'});}
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

// แถบสถานะด้านบนแยกสถานะของหน้าเทียบราคา (catalog) กับหน้าตลาดเดิม (market) แล้ววาดตามหน้าที่เปิดอยู่
let marketRequested=false, catalogRequested=false;
const liveStatus={market:{mode:'loading',detail:''},catalog:{mode:'loading',detail:''},equipment:{mode:'loading',detail:''}};
function setLiveStatus(mode,detail='',target='market'){liveStatus[target]={mode,detail};paintLiveStatus();}
function paintLiveStatus(){
  const target=liveTarget(); const {mode,detail}=liveStatus[target];
  const generatedAt=target==='catalog'?catalogState.generatedAt:dataSource.generatedAt;
  const bar=document.querySelector('#live-bar'); const source=document.querySelector('.live-source');
  bar.classList.remove('loading','ready','fallback','error'); source.classList.remove('ready','fallback','error');
  bar.classList.add(mode); source.classList.add(mode);
  const titles=target==='equipment'?{loading:'กำลังอ่านฐานข้อมูล',ready:'โหลดข้อมูล EquipmentPriceDB แล้ว',fallback:'กำลังแสดงข้อมูลที่อ่านไว้ก่อนหน้า',error:'อ่านฐานข้อมูลไม่สำเร็จ'}:target==='catalog'?{loading:'กำลังโหลดราคาจากร้านค้า',ready:'ราคาจากร้านค้าพร้อมแล้ว',fallback:'กำลังแสดงราคาที่โหลดไว้ก่อนหน้า',error:'โหลดราคาจากร้านค้าไม่สำเร็จ'}:{loading:'กำลังโหลดราคาตลาดล่าสุด',ready:'เชื่อมต่อข้อมูลตลาดสดแล้ว',fallback:'กำลังใช้ข้อมูลสำรอง',error:'ไม่สามารถโหลดข้อมูลตลาดได้'};
  document.querySelector('#live-title').textContent=titles[mode]||titles.loading;
  document.querySelector('#live-detail').textContent=detail||'ระบบจะใช้ข้อมูลสำรองหากบริการภายนอกไม่พร้อม';
  if(target==='equipment'){
    document.querySelector('#source-label').textContent='EquipmentPriceDB (ข้อมูลจำลอง)';
    document.querySelector('#source-time').textContent=equipmentState.overview?`${equipmentState.overview.source==='snapshot'?'ชุดที่บันทึกไว้':'SQL Server'} · ถึง ${thaiDate(equipmentState.overview.latest_date)}`:'กำลังโหลด';
    return;
  }
  document.querySelector('#source-label').textContent=mode==='ready'?'Google Shopping ประเทศไทย':mode==='loading'?'กำลังเชื่อมต่อข้อมูลสด':'ข้อมูลสำรอง';
  document.querySelector('#source-time').textContent=generatedAt?`อัปเดต ${formatTime(generatedAt)}`:'รอการอัปเดตครั้งแรก';
}

// จุดดึงข้อมูลของหน้าเว็บ: เรียก Python API /api/prices แล้วนำ JSON ไปแสดง; ไม่มี SerpApi key ในเบราว์เซอร์.
async function loadLiveData(force=false){
  const button=document.querySelector('#refresh-live'); if(liveTarget()==='market')button.disabled=true;
  setLiveStatus('loading',force?'กำลังขอข้อมูลใหม่จาก SerpApi':'กำลังตรวจสอบข้อมูลล่าสุด');
  try{
    const requestOptions={headers:{accept:'application/json'}};
    if(force)requestOptions.cache='no-store';
    // บรรทัดถัดไปคือ fetch จริง; force=true เติม ?refresh=1 เพื่อข้ามแคช CDN.
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
    if(liveTarget()==='market')render();
    if(force)showToast(missing.length?'อัปเดตได้บางหมวด':'อัปเดตราคาแล้ว',missing.length?`ยังไม่มีข้อมูล: ${missing.join(', ')}`:`พบ ${products.length} รายการจาก Google Shopping ประเทศไทย`);
  }catch(error){
    if(dataSource.mode!=='live'){
      products=fallbackProducts.map(product=>({...product}));
      dataSource.mode='fallback'; updateFilterOptions(); if(liveTarget()==='market')render();
    }
    setLiveStatus(dataSource.mode==='live'?'fallback':'error',dataSource.mode==='live'?'ยังแสดงข้อมูลตลาดล่าสุดที่โหลดสำเร็จไว้':'กำลังแสดงข้อมูลสาธิตแทนชั่วคราว');
    if(force)showToast('รีเฟรชไม่สำเร็จ','ระบบยังคงแสดงข้อมูลล่าสุดหรือข้อมูลสำรอง');
  }finally{button.disabled=false;}
}

document.querySelectorAll('.nav-item,.tab-item[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
document.querySelector('#menu-btn').addEventListener('click',()=>{const open=document.body.classList.toggle('menu-open');document.querySelector('#menu-btn').setAttribute('aria-expanded',String(open));});
document.querySelector('#category-filter').addEventListener('change',e=>{state.category=e.target.value;render();});
document.querySelector('#brand-filter').addEventListener('change',e=>{state.brand=e.target.value;render();});
document.querySelector('#shop-filter').addEventListener('change',e=>{state.shop=e.target.value;render();});
document.querySelector('#price-filter').addEventListener('input',e=>{state.maxPrice=Number(e.target.value);document.querySelector('#price-output').textContent=money(state.maxPrice);render();});
document.querySelector('#reset-btn').addEventListener('click',()=>{const maxPrice=Number(document.querySelector('#price-filter').max);Object.assign(state,{category:'all',brand:'all',shop:'all',maxPrice,search:''});document.querySelector('#category-filter').value='all';document.querySelector('#brand-filter').value='all';document.querySelector('#shop-filter').value='all';document.querySelector('#price-filter').value=String(maxPrice);document.querySelector('#price-output').textContent=money(maxPrice);render();showToast('รีเซ็ตแล้ว','กำลังแสดงข้อมูลทุกหมวดสินค้า');});
document.querySelector('#refresh-live').addEventListener('click',()=>{
  const target=liveTarget();
  if(target==='catalog')loadCatalog(true);
  else if(target==='equipment'){equipmentState.details={};loadEquipmentOverview();}
  else loadLiveData(true);
});

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

routeFromHash(); render(); registerWebMCP();
let renderedWidth=root.clientWidth;
window.addEventListener('resize',()=>{clearTimeout(window.resizeTimer);window.resizeTimer=setTimeout(()=>{if(isEquipmentView()&&Math.abs(root.clientWidth-renderedWidth)>40){renderedWidth=root.clientWidth;render();}},200);});
setInterval(()=>{if(catalogRequested)loadCatalog(false);if(marketRequested)loadLiveData(false);},5*60*1000);

// แผนที่แก้ไข JavaScript (อ้างด้วยชื่อแทนเลขบรรทัด; ใช้ Ctrl+F ค้นชื่อ)
// อยากแก้หน้าแรก (เทียบราคาร้านค้า) → renderCatalog/catalogCard; หน้าราคาแต่ละร้าน → renderProduct/offerRow
// อยากแก้การโหลดข้อมูลหน้าแรก → loadCatalog (เรียก /api/catalog)
// อยากแก้คำอธิบาย/การแยกผลค่าเงินกับทอง → renderGold, priceDrivers; เครื่องคิดเลข → goldCalculator/bindGoldCalculator
// อยากแก้แถบเมนูล่างบนมือถือ → .tab-item ใน index.html; การเลื่อนแคปซูลดำ → moveTabIndicator
// อยากแก้หน้าทองและค่าเงิน → renderGold/renderEquipment; โหลดข้อมูล → loadEquipmentOverview/loadEquipmentDetail
// อยากแก้กราฟเส้น (เส้น, แกน, tooltip) → lineChartSvg/bindCharts; สีเส้น → CHART_COLORS
// อยากแก้ข้อมูลตัวอย่างเมื่อ API ล้ม → fallbackProducts
// อยากแก้ตัวกรอง → filteredProducts
// อยากแก้เนื้อหาแต่ละหน้า → renderDashboard/renderExplorer/renderCompare/
//   renderTrends/renderDeals/renderAI
// อยากแก้รูปสินค้า → productThumb (CSS: .product-thumb)
// อยากแก้สูตรคะแนนประเมินราคา → analyze
// อยากแก้วิธีเก็บประวัติราคาในเครื่อง → attachLocalHistory
// อยากแก้ API ที่เบราว์เซอร์เรียก → fetch(`/api/prices ใน loadLiveData;
//   ต้องแก้ @app.get("/api/prices") ใน app/main.py ให้ตรงกัน; ห้ามใส่ SerpApi key ในไฟล์นี้
// อยากแก้ปุ่มรีเฟรช → #refresh-live; HTML ของปุ่มอยู่ใน index.html (id="refresh-live")
// อยากแก้รอบตรวจอัตโนมัติ → setInterval(..., 5*60*1000)
