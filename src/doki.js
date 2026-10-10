(() => {
  'use strict';
  if (new URL(location.href).searchParams.get('initialRoute') === '/avatar-overlay') return;
  const themes = [...DOKI_THEMES];
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
  Object.assign(messages['ru-RU']??={},messages.ru);
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
  Object.assign(messages.en,{customThemes:'Custom themes',createTheme:'Create theme',editTheme:'Edit theme',importTheme:'Import JSON',exportTheme:'Export JSON',deleteTheme:'Delete theme',themeName:'Name',backgroundColor:'Background',textColor:'Text',accentColor:'Accent',uploadWallpaper:'Choose wallpaper',removeWallpaper:'Remove wallpaper',saveTheme:'Save and apply',cancel:'Cancel',customHint:'PNG, JPEG or WebP. Original quality and resolution are preserved in this Codex Doki profile.',customError:'Could not save or load the theme.',deleteConfirm:'Delete this custom theme?',customSaved:'Theme saved.',imported:'Theme imported.',noWallpaper:'No wallpaper',customLoading:'Loading custom themes…'});
  Object.assign(messages.ru,{customThemes:'Свои темы',createTheme:'Создать тему',editTheme:'Изменить тему',importTheme:'Импорт JSON',exportTheme:'Экспорт JSON',deleteTheme:'Удалить тему',themeName:'Название',backgroundColor:'Фон',textColor:'Текст',accentColor:'Акцент',uploadWallpaper:'Выбрать фон',removeWallpaper:'Убрать фон',saveTheme:'Сохранить и применить',cancel:'Отмена',customHint:'PNG, JPEG или WebP. Исходные качество и разрешение сохраняются в этом профиле Codex Doki.',customError:'Не удалось сохранить или загрузить тему.',deleteConfirm:'Удалить эту свою тему?',customSaved:'Тема сохранена.',imported:'Тема импортирована.',noWallpaper:'Без картинки',customLoading:'Загрузка своих тем…'});
  Object.assign(messages['ru-RU'],messages.ru);
  Object.assign(messages.en,{autoAccent:'Automatic accent from wallpaper',nameError:'Enter a theme name.',duplicateError:'A theme with this name already exists. Choose a different name.',colorError:'Use a valid color in #RRGGBB format.',imageError:'Could not read the image. Choose a valid PNG, JPEG or WebP.',formatError:'Choose a valid Codex Doki theme JSON file.',storageError:'Could not save the theme in this profile. Check available disk space.'});
  Object.assign(messages.ru,{autoAccent:'Акцент автоматически из фона',nameError:'Введите название темы.',duplicateError:'Тема с таким названием уже существует. Выберите другое название.',colorError:'Нужен корректный цвет в формате #RRGGBB.',imageError:'Не удалось прочитать картинку. Выберите корректный PNG, JPEG или WebP.',formatError:'Выберите корректный JSON-файл темы Codex Doki.',storageError:'Не удалось сохранить тему в этом профиле. Проверьте свободное место на диске.'});
  Object.assign(messages['ru-RU'],messages.ru);
  const blankImage='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==';
  const imageURL=image=>image.data||new URL(`./doki/${image.file}`,document.baseURI).href;
  Object.assign(messages.en,{optimizeWallpaper:'Optimize large wallpapers',optimizedHint:'PNG, JPEG or WebP. Large images are optimized for a 4K background; disable optimization to keep the original.',imageSize:'Wallpaper size'});
  Object.assign(messages.ru,{optimizeWallpaper:'Оптимизировать тяжёлые фоны',optimizedHint:'PNG, JPEG или WebP. Тяжёлые картинки оптимизируются под фон до 4K; отключите оптимизацию, чтобы сохранить оригинал.',imageSize:'Размер фона'});
  Object.assign(messages['ru-RU'],messages.ru);messages.en.customHint=messages.en.optimizedHint;messages.ru.customHint=messages.ru.optimizedHint;messages['ru-RU'].customHint=messages.ru.customHint;
  let customDB, customBusy=false, editing=null, draftImage='', draftOriginal='', draftAccent=null, initialized=false, lastPersisted='', selectionWrite=Promise.resolve();
  function database(){return new Promise((resolve,reject)=>{const request=indexedDB.open('codex-doki-custom-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('themes');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
  async function storeCustom(next){
    if(!customDB)throw new Error('storageError');
    await new Promise((resolve,reject)=>{const tx=customDB.transaction('themes','readwrite',{durability:'strict'});tx.objectStore('themes').put(next,'all');tx.oncomplete=resolve;tx.onerror=()=>reject(new Error('storageError'));tx.onabort=()=>reject(new Error('storageError'));});
    themes.splice(DOKI_THEMES.length,themes.length-DOKI_THEMES.length,...next);
  }
  function persistSettings(){
    if(!initialized)return;
    const snapshot=JSON.stringify(settings);if(snapshot===lastPersisted)return;lastPersisted=snapshot;
    try{localStorage.setItem(key,snapshot);}catch{}
    if(customDB){selectionWrite=selectionWrite.catch(()=>{}).then(()=>new Promise((resolve,reject)=>{const tx=customDB.transaction('themes','readwrite',{durability:'strict'});tx.objectStore('themes').put(JSON.parse(snapshot),'settings');tx.oncomplete=resolve;tx.onerror=()=>reject(new Error('storageError'));tx.onabort=()=>reject(new Error('storageError'));}));selectionWrite.catch(()=>{$('status').textContent=tr('storageError');lastPersisted='';});}
  }
  function validateCustom(value){
    if(!value||typeof value.name!=='string'||!value.name.trim())throw new Error('nameError');
    const colors={};for(const field of ['background','foreground','accent']){if(!/^#[0-9a-f]{6}$/i.test(value.colors?.[field]||''))throw new Error('colorError');colors[field]=value.colors[field];}
    const data=value.wallpaper??'';
    if(typeof data!=='string'||(data&&!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(data)))throw new Error('imageError');
    return {name:value.name.trim(),custom:true,autoAccent:value.autoAccent===true,optimizeWallpaper:value.optimizeWallpaper!==false,group:'Custom',dark:luminance(rgb(colors.background))<.5,colors,images:[{variant:'default',data:data||blankImage,readingOpacity:.1,anchor:'right'}]};
  }
  const portable=t=>({name:t.name,colors:{...t.colors},autoAccent:t.autoAccent===true,optimizeWallpaper:t.optimizeWallpaper!==false,wallpaper:t.images[0].data===blankImage?'':t.images[0].data});
  function uniqueName(name,except){if(themes.some(t=>t!==except&&t.name.toLowerCase()===name.toLowerCase()))throw new Error('duplicateError');}
  async function decodeImage(data){const img=new Image();img.src=data;try{await img.decode();}catch{throw new Error('imageError');}if(!img.naturalWidth||!img.naturalHeight)throw new Error('imageError');return img;}
  const imageBytes=data=>data?Math.floor((data.length-data.indexOf(',')-1)*3/4)-(data.endsWith('==')?2:data.endsWith('=')?1:0):0;
  async function optimizedWallpaper(img,data,enabled=true){
    if(!enabled||(imageBytes(data)<=2*1024*1024&&Math.max(img.naturalWidth,img.naturalHeight)<=3840))return data;
    const scale=Math.min(1,3840/img.naturalWidth,3840/img.naturalHeight),canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
    try{const context=canvas.getContext('2d');context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(img,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.9));if(!blob||blob.type!=='image/webp'||blob.size>=imageBytes(data))return data;
      return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('imageError'));reader.readAsDataURL(blob);});
    }catch{return data;}finally{canvas.width=canvas.height=0;}
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
    #custom-dialog{width:min(540px,calc(100vw - 48px));max-height:85vh;overflow:auto}#custom-form{padding:20px}#custom-form .row{gap:12px}#custom-name{width:240px;max-width:60%;background:var(--color-surface-secondary);border:1px solid var(--color-border);border-radius:8px;padding:8px}input[type=color]{width:44px;height:30px;border:1px solid var(--color-border);border-radius:6px;background:transparent;padding:2px;cursor:pointer}.custom-actions{display:flex;gap:8px;flex-wrap:wrap;padding:12px 0}.custom-actions .chip{font-size:12px}#custom-preview{height:150px;border-radius:10px;background-size:cover;background-position:right center;border:1px solid var(--color-border);padding:16px}#custom-hint,#custom-error{font-size:12px;line-height:1.5}#custom-error{min-height:18px;color:var(--color-text)}.chip:disabled{opacity:.5;cursor:default}
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
    <h2 data-i18n="customThemes"></h2><div class="group"><div class="custom-actions"><button type="button" class="chip" id="custom-create" data-i18n="createTheme"></button><button type="button" class="chip" id="custom-edit" data-i18n="editTheme"></button><button type="button" class="chip" id="custom-import" data-i18n="importTheme"></button><button type="button" class="chip" id="custom-export" data-i18n="exportTheme"></button><button type="button" class="chip" id="custom-delete" data-i18n="deleteTheme"></button></div><input hidden id="custom-import-file" type="file" accept=".json,application/json"></div>
    <footer><span id="count"></span><button class="chip" id="reset" data-i18n="reset"></button></footer><small id="status" role="status"></small>
  </section><button id="toggle">Doki</button>
  <dialog id="theme-dialog" aria-labelledby="gallery-title"><div class="gallery-header"><div class="gallery-heading"><h3 id="gallery-title" data-i18n="chooseTheme"></h3><button id="close-gallery" type="button" aria-label="Close">×</button></div><input id="search" type="search" placeholder="Senko, Rem, Fate…"></div><div id="gallery"></div></dialog>
  <dialog id="artwork-dialog" aria-labelledby="artwork-title"><div class="gallery-header"><div class="gallery-heading"><h3 id="artwork-title" data-i18n="variant"></h3><button id="close-artwork" type="button" aria-label="Close">×</button></div></div><div id="artwork-gallery"></div></dialog>
  <dialog id="custom-dialog" aria-labelledby="custom-title"><div class="gallery-header"><div class="gallery-heading"><h3 id="custom-title"></h3><button type="button" id="custom-close" class="chip">×</button></div></div><form id="custom-form"><div class="row"><label for="custom-name" data-i18n="themeName"></label><input id="custom-name" required></div><div class="row"><label for="custom-background" data-i18n="backgroundColor"></label><input id="custom-background" type="color"></div><div class="row"><label for="custom-foreground" data-i18n="textColor"></label><input id="custom-foreground" type="color"></div><div class="row"><label for="custom-accent" data-i18n="accentColor"></label><input id="custom-accent" type="color"></div><div class="row"><label for="custom-auto-accent" data-i18n="autoAccent"></label><input id="custom-auto-accent" type="checkbox" role="switch"></div><div class="row"><label for="custom-optimize" data-i18n="optimizeWallpaper"></label><input id="custom-optimize" type="checkbox" role="switch"></div><div id="custom-preview"></div><p id="custom-image-info" role="status"></p><div class="custom-actions"><button type="button" class="chip" id="custom-upload" data-i18n="uploadWallpaper"></button><button type="button" class="chip" id="custom-remove" data-i18n="removeWallpaper"></button><input hidden id="custom-image" type="file" accept="image/png,image/jpeg,image/webp"></div><p id="custom-hint" data-i18n="customHint"></p><p id="custom-error" role="alert"></p><div class="custom-actions"><button type="submit" class="chip" id="custom-save" data-i18n="saveTheme"></button><button type="button" class="chip" id="custom-cancel" data-i18n="cancel"></button></div></form></dialog>`;
  const $ = id => shadow.getElementById(id);
  function current() { return themes.find(t => t.name === settings.theme) || themes.find(t => t.name === 'Senko') || themes[0]; }
  function translate() {
    shadow.querySelectorAll('[data-i18n]').forEach(e=>{e.textContent=tr(e.dataset.i18n);});
    host.lang=root.lang||settings.language;host.dir=['ar','fa','ur'].includes(settings.language.split('-')[0])?'rtl':'ltr';
    $('toggle').title=tr('settings');$('count').textContent=`${themes.length}${tr('themes')?' '+tr('themes'):''} · Doki 88.1.18`;
    $('search').setAttribute('aria-label',tr('search'));$('search').placeholder=tr('search');$('close-gallery').setAttribute('aria-label',tr('close'));
    $('close-artwork').setAttribute('aria-label',tr('close'));$('custom-close').setAttribute('aria-label',tr('close'));
    if($('custom-dialog').open){$('custom-title').textContent=tr(editing?'editTheme':'createTheme');previewCustom();}
    variants();renderGallery();
  }
  function populate() {
    const query = $('search').value.trim().toLowerCase();
    const selected = current();
    $('theme').replaceChildren();
    const groups = new Map();
    for (const t of themes) {
      if (query && !`${t.name} ${t.group}`.toLowerCase().includes(query) && t.name !== selected.name) continue;
      if (!groups.has(t.group)) { const g = document.createElement('optgroup');g.label=t.custom?tr('customThemes'):t.group;groups.set(t.group,g);$('theme').append(g); }
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
      const thumb=document.createElement('div');thumb.className='thumbnail';const img=document.createElement('img');img.loading='lazy';img.alt='';img.src=imageURL(t.images[0]);thumb.append(img);
      const label=document.createElement('span');label.className='card-label';label.textContent=t.name;const group=document.createElement('span');group.className='card-group';group.textContent=t.custom?tr('customThemes'):t.group;const count=document.createElement('span');count.className='variant-count';count.textContent=variantCount(t.images.length);label.append(group,count);card.append(thumb,label);
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
      const thumb=document.createElement('div');thumb.className='thumbnail';const img=document.createElement('img');img.alt='';img.src=imageURL(artwork);img.style.objectPosition=`${artwork.anchor==='left'?'left':'right'} center`;thumb.append(img);
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
    const t = current(); const dark = (!t.custom && settings.dark) || t.dark;
    const bg=t.custom?t.colors.background:dark?(t.dark?t.colors.background:'#111214'):t.colors.background;
    const base=rgb(bg);
    const foreground=readable(rgb(t.custom?t.colors.foreground:dark?(t.dark?t.colors.foreground:'#eeeeee'):t.colors.foreground),[base],7);
    const fg=hex(foreground);
    const image=t.images.find(i=>i.variant===settings.variant)||t.images[0];
    const url=imageURL(image);
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
    persistSettings();
    window.__dokiThemeStatus={name:t.name,themes:themes.length,image:url,enabled:settings.enabled,active:settings.active,language:settings.language,readingOpacity,palette:{background:bg,foreground:fg,secondary,tertiary,accent,buttonBg,buttonFg,bubbleBg}};
    host.style.setProperty('--doki-accent',accent);host.style.setProperty('--doki-switch-thumb',thumb);
    syncSelectionDisplay();
    if(!settings.active){deactivateDoki();return;}
    updateReading();
  }
  function syncSelectionDisplay(){
    const selected=settings.active;
    for(const id of ['custom-edit','custom-export','custom-delete'])$(id).disabled=customBusy||!selected||!current().custom;
    $('custom-create').disabled=customBusy;$('custom-import').disabled=customBusy;
    $('dark').disabled=selected&&!!current().custom;
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
    persistSettings();
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
  function wallpaperAccent(img){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,64,64);
    const pixels=ctx.getImageData(0,0,64,64).data,buckets=new Map();
    for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<128)continue;const color=[pixels[i],pixels[i+1],pixels[i+2]],max=Math.max(...color),min=Math.min(...color),sat=(max-min)/255,light=luminance(color);if(light<.025||light>.9)continue;
      const key=color.map(v=>v>>4).join(',');const bucket=buckets.get(key)||{weight:0,total:0,sum:[0,0,0]};const weight=.1+sat*sat*3;bucket.weight+=weight;bucket.total++;color.forEach((v,k)=>bucket.sum[k]+=v);buckets.set(key,bucket);
    }
    const best=[...buckets.values()].sort((a,b)=>b.weight-a.weight)[0];return best?hex(best.sum.map(v=>v/best.total)):null;
  }
  function pickAccent(){if(!$('custom-auto-accent').checked)return;const bg=rgb($('custom-background').value);$('custom-accent').value=hex(readable(rgb(draftAccent||current().colors.accent),[bg,mix(bg,readable(rgb($('custom-foreground').value),[bg],7),.09)],3.1));}
  function previewCustom(){
    const fmt=bytes=>{const power=bytes>=1048576?2:bytes>=1024?1:0,units=settings.language.startsWith('ru')?['Б','КБ','МБ']:['B','KB','MB'];return new Intl.NumberFormat(host.lang||'en',{maximumFractionDigits:2}).format(bytes/1024**power)+' '+units[power];};$('custom-image-info').textContent=draftImage?`${tr('imageSize')}: ${fmt(imageBytes(draftOriginal))}${draftImage!==draftOriginal?' → '+fmt(imageBytes(draftImage)):''}`:'';
    const p=$('custom-preview'),bg=$('custom-background').value,base=rgb(bg),fg=hex(readable(rgb($('custom-foreground').value),[base,mix(base,[255,255,255],.1),mix(base,[0,0,0],.1)]));p.style.backgroundColor=bg;p.style.color=fg;p.style.backgroundImage=draftImage?`linear-gradient(${bg}e6,${bg}e6),url(${JSON.stringify(draftImage)})`:'none';p.textContent=$('custom-name').value||tr('themeName');p.style.borderColor=$('custom-accent').value;
  }
  function editCustom(theme){
    editing=theme;draftAccent=null;$('custom-optimize').checked=theme?.optimizeWallpaper!==false;$('custom-auto-accent').checked=theme?theme.autoAccent===true:true;draftImage=theme?.images[0].data||'';if(draftImage===blankImage)draftImage='';draftOriginal=draftImage;
    $('custom-title').textContent=tr(theme?'editTheme':'createTheme');$('custom-name').value=theme?.name||'';
    for(const field of ['background','foreground','accent'])$('custom-'+field).value=(theme||current()).colors[field];
    $('custom-error').textContent='';$('custom-image').value='';previewCustom();$('custom-dialog').showModal();$('custom-name').focus();if(draftImage)customOperation(async()=>{const img=await decodeImage(draftOriginal);draftImage=await optimizedWallpaper(img,draftOriginal,$('custom-optimize').checked);draftAccent=wallpaperAccent(img);pickAccent();previewCustom();},$('custom-error'));else{pickAccent();previewCustom();}
  }
  async function customOperation(action,errorElement=$('status')){
    if(customBusy)return;customBusy=true;syncSelectionDisplay();$('custom-save').disabled=true;errorElement.textContent='';
    try{await action();}catch(error){const reason=error instanceof SyntaxError?'formatError':error.message;errorElement.textContent=tr(messages.en[reason]?reason:'customError');}
    finally{customBusy=false;syncSelectionDisplay();$('custom-save').disabled=false;}
  }
  $('custom-create').onclick=()=>editCustom(null);$('custom-edit').onclick=()=>{if(current().custom)editCustom(current());};
  for(const id of ['custom-close','custom-cancel'])$(id).onclick=()=>{if(!customBusy){$('custom-dialog').close();$('theme-picker').focus();}};
  $('custom-close').setAttribute('aria-label',tr('close'));
  $('custom-dialog').addEventListener('cancel',e=>{if(customBusy)e.preventDefault();});
  $('custom-dialog').addEventListener('close',()=>{draftImage='';draftOriginal='';draftAccent=null;editing=null;$('custom-preview').style.backgroundImage='none';$('custom-image').value='';});
  for(const id of ['custom-name','custom-background','custom-foreground'])$(id).oninput=()=>{pickAccent();previewCustom();};$('custom-accent').oninput=()=>{$('custom-auto-accent').checked=false;previewCustom();};$('custom-auto-accent').onchange=()=>{pickAccent();previewCustom();};
  $('custom-optimize').onchange=()=>customOperation(async()=>{if(draftOriginal){draftImage=await optimizedWallpaper(await decodeImage(draftOriginal),draftOriginal,$('custom-optimize').checked);previewCustom();}},$('custom-error'));
  $('custom-upload').onclick=()=>$('custom-image').click();
  $('custom-remove').onclick=()=>{if(!customBusy){draftImage='';draftOriginal='';draftAccent=null;pickAccent();previewCustom();}};
  $('custom-image').onchange=()=>customOperation(async()=>{
    const file=$('custom-image').files[0];if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('imageError');
    const object=URL.createObjectURL(file);
    try{const img=await decodeImage(object);const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('imageError'));reader.readAsDataURL(file);});draftOriginal=data;draftImage=await optimizedWallpaper(img,data,$('custom-optimize').checked);draftAccent=wallpaperAccent(img);pickAccent();previewCustom();}finally{URL.revokeObjectURL(object);}
  },$('custom-error'));
  $('custom-form').onsubmit=event=>{event.preventDefault();customOperation(async()=>{
    const t=validateCustom({name:$('custom-name').value,colors:Object.fromEntries(['background','foreground','accent'].map(f=>[f,$('custom-'+f).value])),wallpaper:draftImage,autoAccent:$('custom-auto-accent').checked,optimizeWallpaper:$('custom-optimize').checked});uniqueName(t.name,editing);
    const next=themes.filter(t=>t.custom&&t!==editing);next.push(t);await storeCustom(next);
    settings.active=true;settings.theme=t.name;settings.variant='default';populate();apply();await selectionWrite;$('custom-dialog').close();$('theme-picker').focus();$('status').textContent=tr('customSaved');
  },$('custom-error'));};
  $('custom-delete').onclick=()=>{const t=current();if(!t.custom||!confirm(tr('deleteConfirm')))return;customOperation(async()=>{await storeCustom(themes.filter(x=>x.custom&&x!==t));deactivateDoki();populate();apply();await selectionWrite;renderGallery();});};
  $('custom-export').onclick=()=>{if(!current().custom)return;const t=current(),blob=new Blob([JSON.stringify({format:'codex-doki-theme',version:1,theme:portable(t)},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=t.name.replace(/[^a-z0-9_-]/gi,'_')+'.json';shadow.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);};
  $('custom-import').onclick=()=>{$('custom-import-file').value='';$('custom-import-file').click();};
  $('custom-import-file').onchange=()=>customOperation(async()=>{const file=$('custom-import-file').files[0];if(!file)return;const payload=JSON.parse(await file.text());if(payload.format!=='codex-doki-theme'||payload.version!==1)throw new Error('formatError');const t=validateCustom(payload.theme);uniqueName(t.name);if(t.images[0].data!==blankImage){const img=await decodeImage(t.images[0].data);t.images[0].data=await optimizedWallpaper(img,t.images[0].data,t.optimizeWallpaper);}const next=themes.filter(t=>t.custom);await storeCustom([...next,t]);settings.active=true;settings.theme=t.name;settings.variant='default';populate();apply();await selectionWrite;$('status').textContent=tr('imported');});

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
  async function initialize(){
    try{customDB=await database();const stored=await new Promise((resolve,reject)=>{const tx=customDB.transaction('themes');const all=tx.objectStore('themes').get('all'),selected=tx.objectStore('themes').get('settings');tx.oncomplete=()=>resolve({themes:all.result||[],settings:selected.result});tx.onerror=()=>reject(tx.error);});const saved=stored.themes;
      if(!Array.isArray(saved))throw new Error('Stored themes');
      for(const entry of saved){const t=validateCustom(portable(entry));uniqueName(t.name);themes.push(t);}
      if(stored.settings&&typeof stored.settings.theme==='string')settings={...defaults,...stored.settings,language:codexLanguage()};
    }catch{customDB?.close();customDB=null;}
    initialized=true;settings.language=codexLanguage();
    document.body.append(host);translate();populate();apply();syncAppearanceIntegration();
    if(!customDB)$('status').textContent=tr('storageError');
  }
  initialize();
})();
