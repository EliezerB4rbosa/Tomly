const authRoot=document.querySelector('#auth-root');
const api=async(url,options={})=>{const response=await fetch(url,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});let body={};try{body=await response.json()}catch{}if(!response.ok)throw new Error(body.error||'Não foi possível concluir a operação.');return body};
const bandEmpty=()=>({folders:['Adoração','Celebração','Cantor Cristão'],songs:[],scales:[],sets:[]});
function normalizeBandData(data){return {folders:Array.isArray(data?.folders)?data.folders:['Adoração','Celebração','Cantor Cristão'],songs:Array.isArray(data?.songs)?data.songs:[],scales:Array.isArray(data?.scales)?data.scales:[],sets:Array.isArray(data?.sets)?data.sets:[]}}
function showGate(html){authRoot.innerHTML=`<section class="auth-card">${html}</section>`;authRoot.classList.add('visible')}
function hideGate(){authRoot.classList.remove('visible');authRoot.innerHTML=''}
function authMessage(text,isError=false){let el=document.querySelector('#auth-message');if(el){el.textContent=text;el.className=`auth-message${isError?' error':''}`}}
async function startAuth(){try{let state=await api('/api/me');if(state.setupRequired){showAdminSetup();return}if(state.user){authUser=state.user;if(authUser.role==='admin'){adminBands=(await api('/api/bands')).bands;showBandManager(false)}else await enterBand({id:authUser.bandId,name:authUser.bandName});return}showLogin()}catch{showGate(`<div class="auth-logo">tomly<span>.</span></div><h1>TomLy indisponível</h1><p>Não foi possível conectar ao servidor. Atualize a página para tentar novamente.</p><button class="primary-button" onclick="location.reload()">Tentar novamente</button>`)}}
function showLogin(){showGate(`<div class="auth-logo">tomly<span>.</span></div><div class="auth-kicker">MÚSICA EM SINTONIA</div><h1>Entre na sua banda</h1><p>Use o nome da banda e a senha que o administrador cadastrou.</p><form id="login-form"><label>Nome da banda ou usuário admin</label><input name="username" autocomplete="username" required placeholder="Ex.: Louvor & Vida"><label>Senha</label><input name="password" type="password" autocomplete="current-password" required placeholder="Sua senha"><div id="auth-message" class="auth-message"></div><button class="primary-button" type="submit">Entrar <span>→</span></button></form><small class="auth-footnote">Cada banda acessa somente as próprias cifras e repertórios.</small>`);document.querySelector('#login-form').onsubmit=async e=>{e.preventDefault();let form=new FormData(e.currentTarget);let button=e.currentTarget.querySelector('button');button.disabled=true;try{await api('/api/login',{method:'POST',body:JSON.stringify({username:form.get('username'),password:form.get('password')})});authUser=(await api('/api/me')).user;if(authUser.role==='admin'){adminBands=(await api('/api/bands')).bands;showBandManager(false)}else await enterBand({id:authUser.bandId,name:authUser.bandName})}catch(err){authMessage(err.message,true)}finally{button.disabled=false}}}
function showAdminSetup(){showGate(`<div class="auth-logo">tomly<span>.</span></div><div class="auth-kicker">CONFIGURAÇÃO INICIAL</div><h1>Crie o acesso admin</h1><p>Use o código inicial recebido com o TomLy e escolha a senha do administrador. Depois, o código deixa de funcionar.</p><form id="setup-form"><label>Código inicial</label><input name="token" autocomplete="off" required placeholder="Código de configuração"><label>Senha do administrador</label><input name="password" type="password" autocomplete="new-password" minlength="10" required placeholder="Pelo menos 10 caracteres"><div id="auth-message" class="auth-message"></div><button class="primary-button" type="submit">Criar administrador <span>→</span></button></form><small class="auth-footnote">O login do administrador será <b>admin</b>.</small>`);document.querySelector('#setup-form').onsubmit=async e=>{e.preventDefault();let form=new FormData(e.currentTarget);try{await api('/api/setup',{method:'POST',body:JSON.stringify({token:form.get('token'),password:form.get('password')})});authUser=(await api('/api/me')).user;adminBands=(await api('/api/bands')).bands;showBandManager(false)}catch(err){authMessage(err.message,true)}}}
async function enterBand(band){activeBand=band;try{let data=await api(authUser.role==='admin'?`/api/data?bandId=${encodeURIComponent(band.id)}`:'/api/data');db=normalizeBandData(data.data);localStorage.setItem(`${STORE}.${band.id}`,JSON.stringify(db));authReady=true;hideGate();render();syncBandChrome()}catch(err){activeBand=null;authReady=false;showBandManager(true,err.message)}}
function syncBandChrome(){if(!authReady||!activeBand)return;document.querySelector('.workspace strong').textContent=activeBand.name;document.querySelector('.workspace small').textContent='Banda ativa';document.querySelector('.profile strong').textContent=authUser.role==='admin'?'Admin':activeBand.name;document.querySelector('.profile small').textContent=authUser.role==='admin'?'Administrador':'Integrante';document.querySelector('.avatar-small').textContent=authUser.role==='admin'?'A':initials(activeBand.name).slice(0,1);let actions=document.querySelector('.top-actions');if(!actions)return;actions.querySelector('.auth-actions')?.remove();let root=document.createElement('div');root.className='auth-actions';root.innerHTML=`${authUser.role==='admin'?'<button class="secondary-button" id="manage-bands">Gerenciar bandas</button>':''}<button class="icon-button logout-button" id="signout" title="Sair" aria-label="Sair">↪</button>`;actions.prepend(root);document.querySelector('#manage-bands')?.addEventListener('click',()=>showBandManager(true));document.querySelector('#signout')?.addEventListener('click',logout)}
async function showBandManager(manage=true,error=''){try{adminBands=(await api('/api/bands')).bands}catch(err){showGate(`<div class="auth-logo">tomly<span>.</span></div><h1>Falha ao carregar bandas</h1><p>${esc(err.message)}</p><button class="primary-button" onclick="startAuth()">Tentar novamente</button>`);return}showGate(`<div class="auth-logo">tomly<span>.</span></div><div class="auth-kicker">ADMINISTRAÇÃO</div><h1>${manage?'Gerenciar bandas':'Escolha uma banda'}</h1><p>As cifras, escalas e repertórios são separados para cada banda.</p>${error?`<div class="auth-message error">${esc(error)}</div>`:''}<div class="band-admin-list">${adminBands.length?adminBands.map(b=>`<div class="band-admin-row"><div><b>${esc(b.name)}</b><small>Espaço isolado</small></div><button class="soft-button" data-enter-band="${esc(b.id)}">Abrir</button><button class="icon-button" data-reset-band="${esc(b.id)}" title="Trocar senha">⌑</button><button class="icon-button danger" data-delete-band="${esc(b.id)}" title="Excluir banda">×</button></div>`).join(''):'<div class="band-empty">Nenhuma banda cadastrada ainda.</div>'}</div><form id="new-band-form" class="new-band-form"><h2>Adicionar banda</h2><label>Nome da banda</label><input name="name" required maxlength="80" placeholder="Ex.: Louvor & Vida"><label>Senha inicial</label><input name="password" type="password" minlength="8" required placeholder="Pelo menos 8 caracteres"><button class="primary-button" type="submit">＋ Cadastrar banda</button></form><button class="text-link auth-logout" id="admin-signout">Sair do administrador</button>`);authRoot.querySelectorAll('[data-enter-band]').forEach(b=>b.onclick=()=>enterBand(adminBands.find(x=>x.id===b.dataset.enterBand)));authRoot.querySelector('#new-band-form').onsubmit=async e=>{e.preventDefault();let f=new FormData(e.currentTarget);try{let result=await api('/api/bands',{method:'POST',body:JSON.stringify({name:f.get('name'),password:f.get('password'),data:bandEmpty()})});adminBands=result.bands;await enterBand(result.band)}catch(err){authMessage(err.message,true)}};authRoot.querySelectorAll('[data-reset-band]').forEach(b=>b.onclick=async()=>{let band=adminBands.find(x=>x.id===b.dataset.resetBand),password=prompt(`Nova senha para ${band.name} (mínimo 8 caracteres):`);if(!password)return;try{await api(`/api/bands/${encodeURIComponent(band.id)}/password`,{method:'PUT',body:JSON.stringify({password})});toast('Senha da banda atualizada.')}catch(err){authMessage(err.message,true)}});authRoot.querySelectorAll('[data-delete-band]').forEach(b=>b.onclick=async()=>{let band=adminBands.find(x=>x.id===b.dataset.deleteBand);if(!confirm(`Excluir ${band.name} e todos os dados dessa banda?`))return;try{await api(`/api/bands/${encodeURIComponent(band.id)}`,{method:'DELETE'});adminBands=(await api('/api/bands')).bands;showBandManager(true)}catch(err){authMessage(err.message,true)}});authRoot.querySelector('#admin-signout').onclick=logout}
async function logout(){try{await api('/api/logout',{method:'POST'})}catch{}authUser=null;activeBand=null;authReady=false;adminBands=[];showLogin()}

// Add band administration and sign-out controls only to the admin session.
const originalOpenSong=openSong;
openSong=function(id){originalOpenSong(id);const controls=document.querySelector('.editor-actions');if(!controls)return;controls.insertAdjacentHTML('beforeend',`<label class="print-control">Tamanho <select id="print-size"><option value="10">Pequena</option><option value="12" selected>Normal</option><option value="14">Grande</option><option value="16">Maior</option><option value="20">Extra</option></select></label><label class="print-control">Cor dos acordes <input id="chord-color" type="color" value="#27845c"></label>`);document.querySelector('.lyric-pane').insertAdjacentHTML('afterbegin','<div id="ocr-status" class="ocr-status" hidden></div>');const imageButton=document.querySelector('[data-editor="import-image"]');if(imageButton)imageButton.textContent='⌕ Ler imagem e criar cifra';const textButton=document.querySelector('[data-editor="import-lyrics"]');if(textButton)textButton.textContent='⇧ Importar cifra .txt'};
function printSong(){let lyric=$('#song-lyrics')?.value||'',size=$('#print-size')?.value||12,color=$('#chord-color')?.value||'#27845c',title=$('#song-title')?.value||'Cifra',artist=$('#song-artist')?.value||'',instrument=activeInstrument,key=$('#song-key')?.value||'';let lines=lyric.split('\n').map(line=>`<div class="print-line">${line.split(/(\[[^\]]+\])/g).map(part=>part.startsWith('[')&&part.endsWith(']')?`<strong class="print-chord">${esc(part.slice(1,-1))}</strong>`:esc(part)||'&nbsp;').join('')}</div>`).join('');let sheet=document.createElement('section');sheet.className='print-sheet';sheet.innerHTML=`<h1>${esc(title)}</h1><p>${esc(artist)} · ${esc(instrument)} · Tom ${esc(key)}${instrument==='Violão'?` · Capotraste ${esc($('#song-capo')?.value||'0')}`:''}</p><div class="print-lyrics">${lines}</div>`;document.body.append(sheet);document.documentElement.style.setProperty('--print-font-size',`${size}pt`);document.documentElement.style.setProperty('--chord-color',color);window.onafterprint=()=>{sheet.remove();window.onafterprint=null};window.print()}

function chordToken(value){return /^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?\d*(?:\([^)]*\))?(?:\/[A-G](?:#|b)?)?$/i.test(value.replace(/[.,;:!?|]/g,''))}
function chordLine(line){let words=(line.words||[]).map(w=>String(w.text||'').trim()).filter(Boolean);return words.length>0&&words.every(chordToken)&&line.text.length<70}
function formatOcrLines(lines){let out=[];for(let i=0;i<lines.length;i++){let current=lines[i];if(chordLine(current)&&lines[i+1]&&!chordLine(lines[i+1])){let lyric=lines[++i],words=(current.words||[]).filter(w=>chordToken(w.text)),start=lyric.bbox?.x0??lyric.words?.[0]?.bbox?.x0??0,end=lyric.bbox?.x1??lyric.words?.at(-1)?.bbox?.x1??start+lyric.text.length*8,width=Math.max(1,end-start),text=lyric.text;let inserts=words.map(w=>({at:Math.max(0,Math.min(text.length,Math.round(((w.bbox?.x0??start)-start)/width*text.length))),chord:w.text})).sort((a,b)=>b.at-a.at);for(const item of inserts)text=text.slice(0,item.at)+`[${item.chord}]`+text.slice(item.at);out.push(text)}else if(chordLine(current)){out.push((current.words||[]).map(w=>`[${w.text}]`).join(' '))}else out.push(current.text||'')}return out.join('\n').replace(/\n{3,}/g,'\n\n').trim()}
async function readCifraImage(file){const status=document.querySelector('#ocr-status');if(status){status.hidden=false;status.textContent='Preparando a imagem…'}if(file.type==='text/plain'||file.name.toLowerCase().endsWith('.txt')){let text=await file.text();$('#song-lyrics').value=text;status.hidden=true;toast('Texto importado. Revise e salve a cifra.');return}if(!window.Tesseract){if(status)status.textContent='O leitor de imagem não carregou. Confira a conexão e tente novamente.';return}let worker;try{worker=await Tesseract.createWorker(['por','eng'],1,{logger:m=>{if(status&&m.status==='recognizing text')status.textContent=`Lendo imagem… ${Math.round((m.progress||0)*100)}%`}});let {data}=await worker.recognize(file,{}, {text:true,blocks:true});let lines=(data.blocks||[]).flatMap(b=>b.paragraphs||[]).flatMap(p=>p.lines||[]).map(l=>({text:l.text||'',words:l.words||[],bbox:l.bbox}));if(!lines.length)lines=(data.text||'').split(/\r?\n/).map(text=>({text,words:[]}));let result=formatOcrLines(lines);if(!result)throw new Error('Não encontrei texto legível nessa imagem.');$('#song-lyrics').value=result;editorSong.images=[];toast('Cifra lida. Revise os acordes e a letra antes de salvar.')}catch(err){if(status)status.textContent=err.message||'Falha ao ler a imagem.';toast('Não consegui interpretar a imagem. Tente uma imagem mais nítida.')}finally{await worker?.terminate();setTimeout(()=>{if(status)status.hidden=true},4000)}}
// Capture before the legacy image-archive handler: uploaded images now become editable chord sheets.
document.querySelector('#hidden-image-input').addEventListener('change',e=>{let file=e.target.files?.[0];e.stopImmediatePropagation();if(!file)return;let target=window.imageTargetSong||editorSong;if(target&&!$('#song-title')?.value&&file.type.startsWith('image/'))$('#song-title').value=file.name.replace(/\.[^.]+$/,'');readCifraImage(file);e.target.value=''},true);

// The OCR result is written into the editor; source images are not saved as a passive album.
function emptyAuthData(){return bandEmpty()}
async function loadBand(){const state=await api('/api/me');if(state.user){authUser=state.user;if(authUser.role==='admin'){adminBands=(await api('/api/bands')).bands;showBandManager(false)}else await enterBand({id:authUser.bandId,name:authUser.bandName})}else showLogin()}
startAuth();

function isChordRow(line){
  const token=/^[A-G](?:#|b)?(?:m|maj|min|M|dim|aug|sus|add)?\d*(?:M)?(?:\([^)]*\))?(?:\/[A-G](?:#|b)?(?:m)?\d*)?$/i;
  const words=String(line||'').trim().split(/\s+/).filter(Boolean);
  return words.length>0&&words.length<=16&&words.every(word=>token.test(word.replace(/[.,;:!?]$/,'')));
}
function cifraClubLyrics(value){
  const rows=Array.isArray(value)?value.map(x=>String(x??'')):typeof value==='string'?value.split(/\r?\n/):[];
  const result=[];
  for(let i=0;i<rows.length;i++){
    const row=rows[i]||'';
    if(isChordRow(row)){
      const next=rows[i+1]||'';
      const isTab=/^[eEADGB]\|/.test(next.trim())||/^\|.*[-0-9].*\|$/.test(next.trim());
      if(next.trim()&&!isChordRow(next)&&!isTab){
        let lyric=next;
        const chords=[...row.matchAll(/\S+/g)].reverse();
        for(const chord of chords){const at=Math.min(lyric.length,chord.index);lyric=lyric.slice(0,at)+`[${chord[0]}]`+lyric.slice(at)}
        result.push(lyric);i++;
      }else result.push(row.trim().split(/\s+/).map(chord=>`[${chord}]`).join(' '));
    }else result.push(row);
  }
  return result.join('\n').replace(/\n{3,}/g,'\n\n').trim();
}
function applyCifraClubJson(source){
  const data=source?.data||source?.result||source;
  const lyrics=cifraClubLyrics(data?.cifra??data?.lyrics??data?.chords);
  if(!lyrics)throw new Error('O JSON não contém uma cifra reconhecida.');
  if(data.name||data.title)$('#song-title').value=String(data.name||data.title);
  if(data.artist)$('#song-artist').value=String(data.artist);
  const link=data.cifraclub_url||data.url||'';
  if(link)$('#song-link-input').value=String(link);
  $('#song-lyrics').value=lyrics;
  saveInstrumentDraft();
  $('#modal-root').innerHTML='';
  toast('Cifra importada. Revise os acordes e salve.');
}
function openCifraClubImport(){
  modal(`<h2>Importar cifra via JSON</h2><p>Busque pelo link do Cifra Club usando o serviço Selenium configurado para o TomLy, ou selecione um JSON salvo.</p><form id="cifraclub-url-form"><div class="field"><label>Link da cifra</label><input id="cifraclub-source-url" type="url" required placeholder="https://www.cifraclub.com.br/artista/musica"></div><div id="cifraclub-import-error" class="auth-message"></div><div class="modal-footer"><button class="secondary-button" type="button" id="choose-cifraclub-json">Escolher JSON</button><button class="primary-button" type="submit">Buscar cifra</button></div></form><small class="auth-footnote">O serviço Selenium precisa estar hospedado em uma URL HTTPS pública. Você também pode carregar um JSON retornado por ele.</small>`);
  $('#choose-cifraclub-json').onclick=()=>$('#hidden-json-input').click();
  $('#cifraclub-url-form').onsubmit=async event=>{
    event.preventDefault();
    const button=event.currentTarget.querySelector('button[type="submit"]');
    button.disabled=true;
    try{
      const response=await api('/api/import/cifraclub',{method:'POST',body:JSON.stringify({url:$('#cifraclub-source-url').value.trim()})});
      applyCifraClubJson(response.data);
    }catch(error){const node=$('#cifraclub-import-error');if(node){node.textContent=error.message;node.classList.add('error')}}
    finally{button.disabled=false}
  };
}
const cifraClubJsonInput=$('#hidden-json-input');
cifraClubJsonInput.addEventListener('change',async event=>{
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  if(file.size>1_500_000){toast('O arquivo JSON excede 1,5 MB.');return}
  try{applyCifraClubJson(JSON.parse(await file.text()))}catch(error){toast(error.message||'Não consegui ler esse JSON.')}
});
const openSongWithCifraClubImport=openSong;
openSong=function(id){
  openSongWithCifraClubImport(id);
  const controls=document.querySelector('.editor-actions');
  if(!controls||controls.querySelector('#import-cifraclub-json'))return;
  controls.insertAdjacentHTML('afterbegin','<button type="button" class="secondary-button" id="import-cifraclub-json">Importar JSON</button>');
  document.querySelector('#import-cifraclub-json').onclick=openCifraClubImport;
};
