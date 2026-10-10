(() => {
  'use strict';
  if (new URL(location.href).searchParams.get('initialRoute') === '/avatar-overlay') return;
  const themes = DOKI_THEMES;
  const key = 'codex-doki-settings-v1';
  const defaults = {theme: 'Senko', variant: 'default', opacity: 0.75, dark: true, enabled: true, active: true, language: 'en', themeReading: true, readingOpacity: 0.11};
  let settings = {...defaults};
  try { settings = {...settings, ...JSON.parse(localStorage.getItem(key) || '{}')}; } catch {}
  const root = document.documentElement;
  const messages = {
    en:{description:'Original Doki themes and artwork. Colors adapted for Codex.',language:'Language',search:'Search character or anime',theme:'Theme',variant:'Artwork',brightness:'Start screen brightness',reading:'Behind text',themeReading:"Use Doki’s opacity for each theme",dark:'Dark base for all themes',enabled:'Show character',reset:'Reset',primary:'Primary',alternate:'Alternative',settings:'Doki Theme settings',failed:'Could not load artwork.',themes:'themes',readingStatus:'Reading mode',homeStatus:'Start screen'},
    ru:{description:'Оригинальные темы и изображения Doki. Цвета адаптированы для Codex.',language:'Язык',search:'Поиск персонажа или аниме',theme:'Тема',variant:'Иллюстрация',brightness:'Яркость на стартовом экране',reading:'Яркость за текстом',themeReading:'Прозрачность Doki для каждой темы',dark:'Тёмная основа для всех тем',enabled:'Показывать персонажа',reset:'Сбросить',primary:'Основная',alternate:'Альтернативная',settings:'Настройки Doki Theme',failed:'Не удалось загрузить иллюстрацию.',themes:'тем',readingStatus:'Режим чтения',homeStatus:'Стартовый экран'}
  };
  Object.assign(messages.en,{visualStyle:'Visual style',wallpaper:'Wallpaper',general:'General',chooseTheme:'Choose a theme',empty:'No themes found',close:'Close',notSelected:'Not selected'});
  Object.assign(messages.ru,{visualStyle:'Визуальный стиль',wallpaper:'Фон',general:'Общие',chooseTheme:'Выберите тему',empty:'Темы не найдены',close:'Закрыть',notSelected:'Не выбрана'});
  Object.assign(messages,DOKI_LOCALES);
  // Keep the more descriptive Doki-specific labels for English and Russian.
  Object.assign(messages['ru-RU'],messages.ru);
  function codexLanguage() {
    const locale=(root.lang||'en').replaceAll('_','-');
    const aliases={'zh-Hans':'zh-CN','zh-Hant':'zh-TW','es':'es-419','fr':'fr-FR','pt':'pt-BR'};
    if(messages[locale])return locale;
    if(aliases[locale])return aliases[locale];
    if(/^zh(?:-|$)/i.test(locale))return /(?:HK|MO)(?:-|$)/i.test(locale)?'zh-HK':/(?:Hant|TW)(?:-|$)/i.test(locale)?'zh-TW':'zh-CN';
    const language=locale.split('-')[0].toLowerCase();
    return Object.keys(messages).find(key=>key.split('-')[0].toLowerCase()===language)||'en';
  }
  settings.language=codexLanguage();
  const tr = key => messages[settings.language]?.[key] ?? messages.en[key];
  function variantCount(count) {
    const locale=host.lang||settings.language;
    const number=new Intl.NumberFormat(locale).format(count);
    const language=settings.language.split('-')[0];
    if(language==='ru'){
      const category=new Intl.PluralRules('ru').select(count);
      return `${number} ${{one:'вариант',few:'варианта',many:'вариантов',other:'варианта'}[category]}`;
    }
    if(language==='en')return `${number} ${count===1?'variant':'variants'}`;
    return `${tr('variant')} × ${number}`;
  }
  const style = document.createElement('style');
  style.id = 'doki-theme-style';
  document.head.append(style);
  const host = document.createElement('div');
  host.id = 'doki-controls';
  host.hidden = true;
  const shadow = host.attachShadow({mode: 'open'});
  shadow.innerHTML = `<style>
    :host{display:block;font:13px system-ui;color:var(--color-text,#eee)}:host([hidden]){display:none!important}
    *{box-sizing:border-box}button,input,select{font:inherit;color:inherit}button,select{cursor:pointer}
    button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--doki-accent);outline-offset:3px}
    h2{font-size:13px;font-weight:600;margin:10px 0 16px}h2:not(:first-child){margin-top:28px}
    .group{background:var(--color-surface-elevated,#232323);border:1px solid var(--color-border,#ffffff20);border-radius:16px;padding:0 16px}
    .row{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:48px;padding:8px 0}.row+.row{border-top:1px solid var(--color-border,#ffffff20)}
    .row>label,.row>.label{font-weight:600;font-size:12px;flex:1}.chip,select{border:1px solid var(--color-border);border-radius:20px;background:var(--color-surface);padding:5px 12px;max-width:260px;min-height:28px}
    .chip{display:flex;align-items:center;gap:8px}.chip:hover,select:hover{background:var(--color-surface-secondary)}.chevron{width:6px;height:6px;border-right:1px solid;border-bottom:1px solid;transform:rotate(45deg);margin:0 3px 3px 10px;opacity:.65}
    #theme-thumb,#variant-thumb{width:28px;height:20px;border-radius:4px;object-fit:cover;object-position:right;background:var(--color-surface-secondary)}
    input[type=checkbox]{appearance:none;width:30px;height:18px;flex:none;border-radius:20px;border:1px solid var(--color-border);background:var(--color-surface);margin:0;cursor:pointer;position:relative}
    input[type=checkbox]:before{content:'';position:absolute;width:12px;height:12px;border-radius:50%;background:var(--color-text-secondary);left:2px;top:2px;transition:transform .15s}
    input[type=checkbox]:checked{background:var(--doki-accent);border-color:transparent}input[type=checkbox]:checked:before{background:var(--doki-switch-thumb,#fff);transform:translateX(12px)}
    .range{display:flex;align-items:center;gap:12px;width:230px}input[type=range]{width:180px;min-width:60px;accent-color:var(--doki-accent);cursor:pointer}.range output{font-size:12px;text-align:right;min-width:34px;color:var(--color-text-secondary);font-variant-numeric:tabular-nums}
    .previews{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}.preview{height:144px;border:1px solid var(--color-border);border-radius:12px;position:relative;overflow:hidden;background-color:var(--preview-bg)}
    .art{position:absolute;inset:0;background-size:cover;background-position:right center}.mock{position:absolute;left:14px;top:38px;width:46%;color:var(--preview-fg)}.mock i{display:block;height:4px;background:currentColor;border-radius:4px;margin:9px 0;opacity:.7}.mock i:nth-child(2){width:70%}.mock i:nth-child(3){width:84%}.mock b{display:block;width:24px;height:8px;background:var(--doki-accent);border-radius:4px;margin-bottom:15px}
    .preview-title{position:absolute;left:12px;bottom:10px;font-size:11px;padding:4px 7px;background:var(--preview-bg);color:var(--preview-fg);border-radius:6px}
    footer{display:flex;justify-content:space-between;align-items:center;margin-top:18px;font-size:11px;color:var(--color-text-secondary)}#status{display:block;margin-top:6px;font-size:11px;color:var(--color-text-secondary)}#reset{font-size:12px}#toggle,#theme,#variant{display:none}
    dialog{color:var(--color-text);background:var(--color-surface);border:1px solid var(--color-border);border-radius:16px;padding:0;width:min(760px,calc(100vw - 48px));max-height:min(740px,calc(100vh - 64px));box-shadow:0 24px 90px #0008}dialog::backdrop{background:#0008;backdrop-filter:blur(4px)}
    .gallery-header{padding:20px 20px 16px;border-bottom:1px solid var(--color-border)}.gallery-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.gallery-heading h3{margin:0;font-size:16px}#close-gallery{border:0;background:transparent;font-size:22px;width:28px;height:28px;border-radius:8px}#close-gallery:hover{background:var(--color-surface-secondary)}
    #search{width:100%;border:1px solid var(--color-border);background:var(--color-surface-secondary);border-radius:8px;padding:10px 12px}#gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:20px;overflow:auto;max-height:490px}.theme-card{padding:0;text-align:left;border:1px solid var(--color-border);border-radius:10px;background:var(--color-surface-secondary);overflow:hidden}.theme-card:hover{border-color:var(--color-text-secondary)}.theme-card[aria-pressed=true]{outline:2px solid var(--doki-accent);outline-offset:1px}.theme-card .thumbnail{height:108px;overflow:hidden;background:var(--card-bg)}.theme-card img{width:100%;height:100%;object-fit:cover;object-position:right}.card-label{display:block;padding:9px 10px;font-weight:600;font-size:12px}.card-group{display:block;font-weight:400;font-size:10px;margin-top:3px;color:var(--color-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.empty{grid-column:1/-1;text-align:center;padding:30px;color:var(--color-text-secondary)}
    :host([dir=rtl]) .mock{left:auto;right:14px}:host([dir=rtl]) .preview-title{left:auto;right:12px}.theme-card{text-align:start}.range{direction:ltr}
    .variant-count{display:block;margin-top:7px;font-size:10px;font-weight:400;color:var(--color-text-secondary)}
    #artwork-dialog{width:min(480px,calc(100vw - 48px))}#artwork-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;padding:20px}#artwork-gallery.single{grid-template-columns:1fr}#artwork-gallery .thumbnail{height:150px}
    @media(max-width:600px){.range{width:150px}input[type=range]{width:105px}.row{gap:10px}.previews{gap:10px}.preview{height:115px}#gallery{grid-template-columns:repeat(2,minmax(0,1fr))}select{max-width:160px}}
  </style><section id="panel" aria-label="Doki Theme">
    <h2 data-i18n="visualStyle"></h2>
    <div class="group">
      <div class="row"><span class="label" data-i18n="theme"></span><button class="chip" id="theme-picker" aria-haspopup="dialog"><img id="theme-thumb" alt=""><span id="theme-name"></span><span class="chevron"></span></button><select id="theme" aria-hidden="true" tabindex="-1"></select></div>
      <div class="row"><span class="label" data-i18n="variant"></span><button class="chip" id="variant-picker" aria-haspopup="dialog"><img id="variant-thumb" alt=""><span id="variant-name"></span><span class="chevron"></span></button><select id="variant" aria-hidden="true" tabindex="-1"></select></div>
      <div class="row"><label for="dark" data-i18n="dark"></label><input id="dark" type="checkbox" role="switch"></div>
      <div class="row"><label for="enabled" data-i18n="enabled"></label><input id="enabled" type="checkbox" role="switch"></div>
    </div>
    <h2 data-i18n="wallpaper"></h2>
    <div class="previews"><div class="preview"><div class="art" id="home-art"></div><div class="mock"><b></b><i></i><i></i><i></i></div><span class="preview-title" data-i18n="homeStatus"></span></div><div class="preview"><div class="art" id="reading-art"></div><div class="mock"><b></b><i></i><i></i><i></i></div><span class="preview-title" data-i18n="readingStatus"></span></div></div>
    <div class="group">
      <div class="row"><label for="opacity" data-i18n="brightness"></label><div class="range"><input id="opacity" type="range" min="0" max="100"><output id="value" for="opacity"></output></div></div>
      <div class="row"><label for="reading" data-i18n="reading"></label><div class="range"><input id="reading" type="range" min="0" max="100"><output id="reading-value" for="reading"></output></div></div>
      <div class="row"><label for="theme-reading" data-i18n="themeReading"></label><input id="theme-reading" type="checkbox" role="switch"></div>
    </div>
    <footer><span id="count"></span><button class="chip" id="reset" data-i18n="reset"></button></footer><small id="status" role="status"></small>
  </section><button id="toggle">Doki</button>
  <dialog id="theme-dialog" aria-labelledby="gallery-title"><div class="gallery-header"><div class="gallery-heading"><h3 id="gallery-title" data-i18n="chooseTheme"></h3><button id="close-gallery" type="button" aria-label="Close">×</button></div><input id="search" type="search" placeholder="Senko, Rem, Fate…"></div><div id="gallery"></div></dialog>
  <dialog id="artwork-dialog" aria-labelledby="artwork-title"><div class="gallery-header"><div class="gallery-heading"><h3 id="artwork-title" data-i18n="variant"></h3><button id="close-artwork" type="button" aria-label="Close">×</button></div></div><div id="artwork-gallery"></div></dialog>`;
  const $ = id => shadow.getElementById(id);
  function current() { return themes.find(t => t.name === settings.theme) || themes.find(t => t.name === 'Senko') || themes[0]; }
  function translate() {
    shadow.querySelectorAll('[data-i18n]').forEach(e=>{e.textContent=tr(e.dataset.i18n);});
    host.lang=root.lang||settings.language;host.dir=['ar','fa','ur'].includes(settings.language.split('-')[0])?'rtl':'ltr';
    $('toggle').title=tr('settings');$('count').textContent=`${themes.length}${tr('themes')?' '+tr('themes'):''} · Doki 88.1.18`;
    $('search').setAttribute('aria-label',tr('search'));$('search').placeholder=tr('search');$('close-gallery').setAttribute('aria-label',tr('close'));
    $('close-artwork').setAttribute('aria-label',tr('close'));
    variants();renderGallery();
  }
  function populate() {
    const query = $('search').value.trim().toLowerCase();
    const selected = current();
    $('theme').replaceChildren();
    const groups = new Map();
    for (const t of themes) {
      if (query && !`${t.name} ${t.group}`.toLowerCase().includes(query) && t.name !== selected.name) continue;
      if (!groups.has(t.group)) { const g = document.createElement('optgroup');g.label=t.group;groups.set(t.group,g);$('theme').append(g); }
      const option = document.createElement('option');option.value=t.name;option.textContent=t.name;option.selected=t.name===selected.name;groups.get(t.group).append(option);
    }
    variants();
  }
  function renderGallery() {
    const query=$('search').value.trim().toLowerCase();
    const matching=themes.filter(t=>`${t.name} ${t.group}`.toLowerCase().includes(query));
    $('gallery').replaceChildren();
    for(const t of matching){
      const card=document.createElement('button');card.type='button';card.className='theme-card';card.setAttribute('aria-pressed',String(settings.active&&t.name===current().name));card.title=`${t.name} · ${t.group} · ${variantCount(t.images.length)}`;
      card.style.setProperty('--card-bg',t.colors.background);
      const thumb=document.createElement('div');thumb.className='thumbnail';const img=document.createElement('img');img.loading='lazy';img.alt='';img.src=new URL(`./doki/${t.images[0].file}`,document.baseURI).href;thumb.append(img);
      const label=document.createElement('span');label.className='card-label';label.textContent=t.name;const group=document.createElement('span');group.className='card-group';group.textContent=t.group;const count=document.createElement('span');count.className='variant-count';count.textContent=variantCount(t.images.length);label.append(group,count);card.append(thumb,label);
      card.onclick=()=>{settings.active=true;settings.theme=t.name;settings.variant='default';populate();apply();$('theme-dialog').close();$('theme-picker').focus();};$('gallery').append(card);
    }
    if(!matching.length){const empty=document.createElement('div');empty.className='empty';empty.textContent=tr('empty');$('gallery').append(empty);}
  }
  $('theme-picker').onclick=()=>{$('search').value='';renderGallery();$('theme-dialog').showModal();$('search').focus();};
  $('close-gallery').onclick=()=>{$('theme-dialog').close();$('theme-picker').focus();};
  $('theme-dialog').addEventListener('click',event=>{if(event.target===$('theme-dialog')){const r=$('theme-dialog').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('theme-dialog').close();}});
  function renderArtwork() {
    const t=current();$('artwork-gallery').classList.toggle('single',t.images.length===1);$('artwork-gallery').replaceChildren();
    for(const artwork of t.images){
      const card=document.createElement('button');card.type='button';card.className='theme-card';card.setAttribute('aria-pressed',String(artwork.variant===settings.variant));card.style.setProperty('--card-bg',settings.dark&&!t.dark?'#111214':t.colors.background);
      const thumb=document.createElement('div');thumb.className='thumbnail';const img=document.createElement('img');img.alt='';img.src=new URL(`./doki/${artwork.file}`,document.baseURI).href;img.style.objectPosition=`${artwork.anchor==='left'?'left':'right'} center`;thumb.append(img);
      const label=document.createElement('span');label.className='card-label';label.textContent=tr(artwork.variant==='default'?'primary':'alternate');card.append(thumb,label);
      card.onclick=()=>{settings.active=true;settings.variant=artwork.variant;variants();apply();$('artwork-dialog').close();$('variant-picker').focus();};$('artwork-gallery').append(card);
    }
  }
  $('variant-picker').onclick=()=>{renderArtwork();$('artwork-dialog').showModal();$('artwork-gallery').querySelector('[aria-pressed=true]')?.focus();};
  $('close-artwork').onclick=()=>{$('artwork-dialog').close();$('variant-picker').focus();};
  $('artwork-dialog').addEventListener('click',event=>{if(event.target===$('artwork-dialog')){const r=$('artwork-dialog').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('artwork-dialog').close();}});
  function variants() {
    const t = current();
    if (!t.images.some(i => i.variant === settings.variant)) settings.variant = 'default';
    $('variant').replaceChildren(...t.images.map(i => {const o=document.createElement('option');o.value=i.variant;o.textContent=i.variant==='default'?tr('primary'):tr('alternate');o.selected=i.variant===settings.variant;return o;}));
    $('variant').disabled = t.images.length < 2;
    renderArtwork();
  }
  const rgb = hex => hex.match(/[a-f\d]{2}/gi).map(value=>parseInt(value,16));
  const hex = color => '#'+color.map(value=>Math.round(value).toString(16).padStart(2,'0')).join('');
  const mix = (a,b,amount) => a.map((value,index)=>value*(1-amount)+b[index]*amount);
  function luminance(color){return color.map(value=>{value/=255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;}).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);}
  function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
  function readable(color,backgrounds,minimum=4.6){
    const score=value=>Math.min(...backgrounds.map(bg=>contrast(value,bg)));
    if(score(color)>=minimum)return color;
    const target=score([255,255,255])>=score([0,0,0])?[255,255,255]:[0,0,0];
    for(let step=1;step<=100;step++){const candidate=mix(color,target,step/100);if(score(candidate)>=minimum)return candidate;}
    return target;
  }
  function apply() {
    const t = current(); const dark = settings.dark || t.dark;
    const bg=dark?(t.dark?t.colors.background:'#111214'):t.colors.background;
    const base=rgb(bg);
    const foreground=readable(rgb(dark?(t.dark?t.colors.foreground:'#eeeeee'):t.colors.foreground),[base],7);
    const fg=hex(foreground);
    const image=t.images.find(i=>i.variant===settings.variant)||t.images[0];
    const url=new URL(`./doki/${image.file}`,document.baseURI).href;
    const requestedReading=settings.themeReading?(image.readingOpacity??0.1):settings.readingOpacity;
    let readingOpacity=requestedReading;
    // Bound the wallpaper's worst possible light/dark pixel behind ordinary text.
    while(readingOpacity>0&&Math.min(contrast(foreground,mix(base,[255,255,255],readingOpacity)),contrast(foreground,mix(base,[0,0,0],readingOpacity)))<4.6)readingOpacity=Math.max(0,readingOpacity-.01);
    const raised=mix(base,foreground,.09);
    const textSurfaces=[base,raised,mix(base,[255,255,255],readingOpacity),mix(base,[0,0,0],readingOpacity)];
    const secondary=hex(readable(mix(base,foreground,.68),textSurfaces));
    const tertiary=hex(readable(mix(base,foreground,.48),textSurfaces));
    const accent=hex(readable(rgb(t.colors.accent),[base,raised],3.1));
    const link=hex(readable(rgb(accent),textSurfaces));
    const thumb=hex(readable(foreground,[rgb(accent)]));
    const buttonBg=t.colors.accent,buttonFg=hex(readable(foreground,[rgb(buttonBg)]));
    const bubbleBg=hex(mix(base,rgb(t.colors.accent),.18));
    root.style.setProperty('--doki-background', bg);
    root.style.setProperty('--doki-foreground', fg);
    root.style.setProperty('--doki-accent', accent);
    root.style.setProperty('--doki-reading-text', fg);
    root.style.setProperty('--doki-switch-thumb',thumb);
    root.style.setProperty('--doki-reading-opacity', String(readingOpacity));
    root.dataset.doki = 'active';
    style.textContent = `
      html[data-doki=active],html[data-doki=active] body{background:${bg}!important;color:${fg}!important}
      html[data-doki=active] [data-app-shell-main-surface]{background-color:${bg}!important;background-image:${settings.enabled?`linear-gradient(color-mix(in srgb,${bg} ${Math.round((1-settings.opacity)*100)}%,transparent),color-mix(in srgb,${bg} ${Math.round((1-settings.opacity)*100)}%,transparent)),url(${JSON.stringify(url)})`:'none'}!important;background-size:cover!important;background-position:${image.anchor==='left'?'left':'right'} center!important;background-repeat:no-repeat!important;}
      html[data-doki=active][data-doki-reading=true] [data-app-shell-main-surface]{background-image:${settings.enabled?`linear-gradient(color-mix(in srgb,${bg} ${Math.round((1-readingOpacity)*100)}%,transparent),color-mix(in srgb,${bg} ${Math.round((1-readingOpacity)*100)}%,transparent)),url(${JSON.stringify(url)})`:'none'}!important;}
      html[data-doki=active]{--color-surface:${bg}!important;--color-surface-primary:${bg}!important;--color-surface-secondary:color-mix(in srgb,${fg} 5%,${bg})!important;--color-surface-tertiary:color-mix(in srgb,${fg} 9%,${bg})!important;--color-surface-elevated:color-mix(in srgb,${fg} 7%,${bg})!important;--color-text:${fg}!important;--color-text-secondary:color-mix(in srgb,${fg} 68%,${bg})!important;--color-text-tertiary:color-mix(in srgb,${fg} 48%,${bg})!important;--color-border:color-mix(in srgb,${fg} 16%,${bg})!important;--color-background-primary-solid:${t.colors.accent}!important;--color-token-bg-primary:${bg}!important;--color-token-text-primary:${fg}!important;}
      html[data-doki=active],html[data-doki=active] :is(#root,nav,[data-app-shell-main-surface],[role=menu],[role=dialog],[role=tooltip]){
        --color-text:${fg}!important;
        --color-text-primary:${fg}!important;--color-text-primary-ghost:${fg}!important;--color-text-primary-ghost-hover:${fg}!important;
        --color-text-primary-outline:${fg}!important;--color-text-primary-outline-hover:${fg}!important;--color-text-primary-soft:${fg}!important;--color-text-primary-soft-alt:${fg}!important;--color-text-primary-surface:${fg}!important;--color-text-emphasis:${fg}!important;
        --color-text-secondary:${secondary}!important;--color-text-secondary-solid:${secondary}!important;--color-text-secondary-ghost:${secondary}!important;--color-text-secondary-ghost-hover:${secondary}!important;--color-text-secondary-soft:${secondary}!important;--color-text-secondary-soft-alt:${secondary}!important;--color-text-secondary-outline:${secondary}!important;
        --color-text-tertiary:${tertiary}!important;--color-text-disabled:${tertiary}!important;--color-text-toolbar-action:${secondary}!important;--color-text-execution-output-label:${secondary}!important;
        --app-color-text-foreground:${fg}!important;--app-color-text-foreground-secondary:${secondary}!important;--app-color-text-foreground-tertiary:${tertiary}!important;--app-color-text-button-tertiary:${secondary}!important;
        --color-token-foreground:${fg}!important;--color-token-description-foreground:${secondary}!important;--color-token-text-secondary:${secondary}!important;--color-token-text-tertiary:${tertiary}!important;--input-placeholder-text-color:${secondary}!important;
        --color-background-user-message:${bubbleBg}!important;--color-background-user-message-compact:${bubbleBg}!important;--user-message-background-color:${bubbleBg}!important;--user-message-text-color:${fg}!important;--color-text-user-message:${fg}!important;
        --color-background-primary-solid:${buttonBg}!important;--color-text-primary-solid:${buttonFg}!important;--color-background-composer-primary:${buttonBg}!important;--color-text-composer-primary:${buttonFg}!important;
        --app-color-background-surface:${bg}!important;--app-color-background-shell:${hex(raised)}!important;--color-token-side-bar-background:${bg}!important;
        --color-background-composer-surface:${hex(mix(base,foreground,.05))}!important;--color-background-composer-action-bar:${hex(mix(base,foreground,.05))}!important;
        --color-surface-elevated-secondary:${hex(mix(base,foreground,.07))}!important;--color-surface-elevated-tertiary:${hex(raised)}!important;
        --color-text-info:${link}!important;--app-color-text-accent:${link}!important;--color-token-text-link-foreground:${link}!important;--link-primary-text-color:${link}!important;--color-ring:${accent}!important;
      }
      html[data-doki=active] :is([role=menu],[role=dialog],[role=tooltip]){background-color:${hex(raised)}!important;color:${fg}!important;}
      html[data-doki=active] [class~="group/settings"] [class~="rounded-2xl"][class~="border-default"]{background-color:${hex(mix(base,foreground,.07))}!important;}
      html[data-doki=active] [class~="group/settings"] button:not([role=switch]){color:${fg}!important;background-color:${bg}!important;}
      html[data-doki=active] [class~="group/settings"] button:not([role=switch]):hover{background-color:${hex(raised)}!important;}
      html[data-doki=active] [class~="group/settings"] [role=switch]>span{background-color:${hex(mix(base,foreground,.15))}!important;}
      html[data-doki=active] [class~="group/settings"] [role=switch][aria-checked=true]>span{background-color:${accent}!important;}
      html[data-doki=active] [class~="group/settings"] [role=switch]>span>span{background-color:${fg}!important;border-color:transparent!important;}
      html[data-doki=active] [class~="group/settings"] [role=switch][aria-checked=true]>span>span{background-color:${thumb}!important;}
      html[data-doki=active] :is([class*="text-text/"],[class*="text-tertiary/"]){color:${secondary}!important;}
      html[data-doki=active] :is(input,textarea)::placeholder,html[data-doki=active] [data-placeholder]::before{color:${secondary}!important;opacity:1!important;}
      html[data-doki=active] [contenteditable=true]{color:${fg}!important;caret-color:${fg}!important;}
      html[data-doki=active] [data-app-shell-main-surface] :is([data-markdown-text-style],[data-markdown-text-tone]){color:var(--doki-reading-text,${fg})!important;}
      html[data-doki=active] [data-app-shell-main-surface] :is([data-markdown-text-style],[data-markdown-text-tone]) :is(p,li,h1,h2,h3,h4,h5,h6,strong,em,blockquote,td,th){color:var(--doki-reading-text,${fg})!important;}
      html[data-doki=active] [data-app-shell-titlebar-content]{color:var(--doki-reading-text,${fg});}
    `;
    $('opacity').value=String(Math.round(settings.opacity*100));$('value').textContent=`${Math.round(settings.opacity*100)}%`;
    $('dark').checked=settings.dark;$('enabled').checked=settings.enabled;
    $('theme-reading').checked=settings.themeReading;
    $('reading').value=String(Math.round(readingOpacity*100));$('reading-value').textContent=`${Math.round(readingOpacity*100)}%`;
    $('theme-name').textContent=t.name;$('theme-thumb').src=url;$('theme-picker').setAttribute('aria-label',`${tr('theme')}: ${t.name}`);
    $('variant-thumb').src=url;$('variant-thumb').style.objectPosition=`${image.anchor==='left'?'left':'right'} center`;$('variant-name').textContent=tr(settings.variant==='default'?'primary':'alternate');$('variant-picker').setAttribute('aria-label',`${tr('variant')}: ${$('variant-name').textContent}`);
    host.style.setProperty('--preview-bg',bg);host.style.setProperty('--preview-fg',fg);
    for(const [id,alpha] of [['home-art',settings.opacity],['reading-art',readingOpacity]]){$(id).style.backgroundImage=settings.enabled?`url(${JSON.stringify(url)})`:'none';$(id).style.opacity=String(alpha);$(id).style.backgroundPosition=`${image.anchor==='left'?'left':'right'} center`;}
    $('status').textContent='';
    const probe=new Image();probe.onerror=()=>{$('status').textContent=tr('failed');};probe.src=url;
    try { localStorage.setItem(key, JSON.stringify(settings)); } catch {}
    window.__dokiThemeStatus={name:t.name,themes:themes.length,image:url,enabled:settings.enabled,active:settings.active,language:settings.language,readingOpacity,palette:{background:bg,foreground:fg,secondary,tertiary,accent,buttonBg,buttonFg,bubbleBg}};
    host.style.setProperty('--doki-accent',accent);host.style.setProperty('--doki-switch-thumb',thumb);
    syncSelectionDisplay();
    if(!settings.active){deactivateDoki();return;}
    updateReading();
  }
  function syncSelectionDisplay(){
    const selected=settings.active;
    $('theme-thumb').hidden=!selected;$('variant-thumb').hidden=!selected;
    $('variant-picker').disabled=!selected;
    if(!selected){
      $('theme-name').textContent=tr('notSelected');$('variant-name').textContent=tr('notSelected');
      $('theme-picker').setAttribute('aria-label',`${tr('theme')}: ${tr('notSelected')}`);
      $('variant-picker').setAttribute('aria-label',`${tr('variant')}: ${tr('notSelected')}`);
      $('theme').selectedIndex=-1;$('variant').selectedIndex=-1;
      $('gallery').querySelectorAll('[aria-pressed]').forEach(card=>card.setAttribute('aria-pressed','false'));
    }
  }
  function deactivateDoki(){
    settings.active=false;style.textContent='';
    delete root.dataset.doki;delete root.dataset.dokiReading;
    Array.from(root.style).filter(property=>property.startsWith('--doki-')).forEach(property=>root.style.removeProperty(property));
    try{localStorage.setItem(key,JSON.stringify(settings));}catch{}
    if(window.__dokiThemeStatus)window.__dokiThemeStatus.active=false;
    syncSelectionDisplay();
    syncCodeContrast();
  }
  function updateReading() {
    if(!settings.active){syncCodeContrast();return;}
    const surfaces=Array.from(document.querySelectorAll('[data-app-shell-main-surface]')).filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;});
    const reading=surfaces.some(e=>e.querySelector('[data-turn-key], [data-markdown-text-style], [data-markdown-text-tone], pre, .monaco-editor, .cm-editor'))||Array.from(document.querySelectorAll('[data-settings-panel-slug][aria-current=page]')).some(e=>e.getBoundingClientRect().height>0);
    const value=String(reading);if(root.dataset.dokiReading!==value)root.dataset.dokiReading=value;
    const status=`${tr(reading?'readingStatus':'homeStatus')} · ${Math.round((reading?Number(root.style.getPropertyValue('--doki-reading-opacity')):settings.opacity)*100)}%`;
    if($('status').textContent!==status)$('status').textContent=status;
    if(window.__dokiThemeStatus)window.__dokiThemeStatus.reading=reading;
    syncCodeContrast();
  }
  const codeRoots=new WeakSet();
  function syncCodeContrast(){
    for(const editor of document.querySelectorAll('diffs-container')){
      const codeShadow=editor.shadowRoot;if(!codeShadow)continue;
      if(!settings.active){codeShadow.getElementById('doki-code-contrast')?.remove();continue;}
      if(!codeRoots.has(codeShadow)){codeRoots.add(codeShadow);new MutationObserver(syncCodeContrast).observe(codeShadow,{childList:true,subtree:true});}
      let codeStyle=codeShadow.getElementById('doki-code-contrast');
      if(!codeStyle){codeStyle=document.createElement('style');codeStyle.id='doki-code-contrast';codeShadow.append(codeStyle);}
      const nativeDark=root.dataset.theme!=='light';
      const css=`pre{color-scheme:${nativeDark?'dark':'light'};background:${nativeDark?'#101010':'#ffffff'}!important;color:${nativeDark?'#eeeeee':'#252525'}!important;}`;
      if(codeStyle.textContent!==css)codeStyle.textContent=css;
    }
  }
  $('toggle').onclick=()=>{const opened=$('panel').classList.toggle('open');$('toggle').setAttribute('aria-expanded',String(opened));};
  $('search').oninput=renderGallery;
  $('theme').onchange=()=>{settings.active=true;settings.theme=$('theme').value;settings.variant='default';variants();apply();};
  $('variant').onchange=()=>{settings.active=true;settings.variant=$('variant').value;apply();};
  $('opacity').oninput=()=>{settings.opacity=Number($('opacity').value)/100;apply();};
  $('reading').oninput=()=>{settings.themeReading=false;settings.readingOpacity=Number($('reading').value)/100;apply();};
  $('theme-reading').onchange=()=>{settings.themeReading=$('theme-reading').checked;apply();};
  $('dark').onchange=()=>{settings.dark=$('dark').checked;apply();};
  $('enabled').onchange=()=>{settings.enabled=$('enabled').checked;apply();};
  $('reset').onclick=()=>{const language=settings.language;settings={...defaults,language};$('search').value='';translate();populate();apply();};
  shadow.addEventListener('keydown',e=>{if(e.key==='Escape'&&!host.hasAttribute('data-embedded')){$('panel').classList.remove('open');$('toggle').setAttribute('aria-expanded','false');$('toggle').focus();}});
  const integrationStyle=document.createElement('style');
  integrationStyle.id='doki-settings-integration-style';
  integrationStyle.textContent=`
    #doki-appearance-tabs{display:flex;gap:4px;max-width:768px;width:100%;box-sizing:border-box;margin:0 auto;padding:8px 24px 0;border-bottom:1px solid var(--color-border);}
    #doki-appearance-tabs button{font:inherit;font-size:14px;cursor:pointer;background:transparent;border:0;border-bottom:2px solid transparent;color:var(--color-text-secondary);padding:10px 16px;}
    #doki-appearance-tabs button[aria-selected=true]{color:var(--color-text);border-bottom-color:var(--doki-accent,var(--color-text));}
    #doki-appearance-tabs button:hover{background:var(--color-surface-secondary);}
    #doki-appearance-tabs button:focus-visible{outline:2px solid var(--doki-accent);outline-offset:-2px;border-radius:4px;}
    #doki-controls[data-embedded]{display:block;max-width:768px;width:100%;box-sizing:border-box;padding:24px;margin:0 auto;}
  `;
  document.head.append(integrationStyle);
  const appearanceTabs=document.createElement('div');
  appearanceTabs.id='doki-appearance-tabs';appearanceTabs.setAttribute('role','tablist');appearanceTabs.setAttribute('aria-label','Codex / Doki Theme');
  host.setAttribute('role','tabpanel');host.setAttribute('aria-labelledby','doki-settings-tab');
  appearanceTabs.innerHTML='<button type="button" id="doki-native-tab" role="tab" aria-selected="true" tabindex="0">Codex</button><button type="button" id="doki-settings-tab" role="tab" aria-selected="false" tabindex="-1" aria-controls="doki-controls">Doki Theme</button>';
  let appearancePanel=null;
  let selectedAppearanceTab='codex';
  let nativeThemeTrigger=null;
  function nativeThemeOption(option){
    let menu=option.closest('[role=menu]');const visited=new Set();
    while(menu&&!visited.has(menu)){
      visited.add(menu);const trigger=document.getElementById(menu.getAttribute('aria-labelledby'));
      if(trigger===nativeThemeTrigger)return true;
      menu=trigger?.closest('[role=menu]');
    }
    return false;
  }
  document.addEventListener('click',event=>{
    if(!(event.target instanceof Element))return;
    const target=event.target;
    const option=target.closest('[role=menuitemradio]');
    if(option&&nativeThemeTrigger&&nativeThemeOption(option)){nativeThemeTrigger=null;deactivateDoki();return;}
    if(!appearancePanel||appearancePanel.hidden||selectedAppearanceTab!=='codex')return;
    const mode=target.closest('input[name="appearance-theme"]')||target.closest('label')?.querySelector('input[name="appearance-theme"]');
    if(mode&&appearancePanel.contains(mode)){nativeThemeTrigger=null;deactivateDoki();return;}
    const trigger=target.closest('button[aria-haspopup=menu]');
    if(trigger&&appearancePanel.contains(trigger)){
      const row=trigger.closest('[class~="@container/settings-row"]');
      nativeThemeTrigger=row&&Array.from(row.querySelectorAll('label,.text-default')).some(label=>label.textContent.trim()===tr('theme'))?trigger:null;
    }else if(!target.closest('[role=menu]'))nativeThemeTrigger=null;
  },true);
  document.addEventListener('change',event=>{
    if(event.target instanceof HTMLInputElement&&event.target.name==='appearance-theme'&&appearancePanel?.contains(event.target)){nativeThemeTrigger=null;deactivateDoki();}
  },true);
  function showAppearanceTab(tab) {
    selectedAppearanceTab=tab;
    const doki=tab==='doki';
    if(appearancePanel&&appearancePanel.hidden!==doki)appearancePanel.hidden=doki;
    if(host.hidden===doki)host.hidden=!doki;
    appearanceTabs.querySelectorAll('button').forEach((button,index)=>{
      const selected=(index===1)===doki;
      button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;
    });
  }
  appearanceTabs.addEventListener('click',event=>{
    const button=event.target.closest('button');if(button)showAppearanceTab(button.id==='doki-settings-tab'?'doki':'codex');
  });
  appearanceTabs.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const next=event.key==='Home'?'codex':event.key==='End'?'doki':selectedAppearanceTab==='codex'?'doki':'codex';showAppearanceTab(next);
    appearanceTabs.querySelector(`[aria-selected=true]`).focus();
  });
  function syncAppearanceIntegration() {
    const active=Array.from(document.querySelectorAll('[data-settings-panel-slug="appearance"][aria-current=page]')).some(e=>e.getBoundingClientRect().height>0);
    if(!active) {
      if(appearancePanel?.isConnected&&appearancePanel.hidden)appearancePanel.hidden=false;
      if(host.parentElement!==document.body)document.body.append(host);
      if(!host.hidden)host.hidden=true;
      if(appearanceTabs.isConnected)appearanceTabs.remove();
      appearancePanel=null;return;
    }
    const candidates=Array.from(document.querySelectorAll('[class~="group/settings"]'));
    const panel=candidates.find(e=>e===appearancePanel)||candidates.find(e=>e.getBoundingClientRect().width>0);
    if(!panel)return;
    appearancePanel=panel;
    const container=panel.parentElement;
    if(appearanceTabs.parentElement!==container)container.insertBefore(appearanceTabs,panel);
    if(host.parentElement!==container)container.insertBefore(host,panel);
    if(!host.hasAttribute('data-embedded'))host.setAttribute('data-embedded','');
    showAppearanceTab(selectedAppearanceTab);
  }
  let scheduled=false;
  new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;updateReading();syncAppearanceIntegration();});}}).observe(document.getElementById('root'),{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','aria-current']});
  window.addEventListener('resize',updateReading);
  new MutationObserver(()=>{
    const language=codexLanguage();
    if(settings.language!==language){settings.language=language;translate();apply();}
    syncCodeContrast();
  }).observe(root,{attributes:true,attributeFilter:['lang','data-theme']});
  document.body.append(host);translate();populate();apply();syncAppearanceIntegration();
})();
