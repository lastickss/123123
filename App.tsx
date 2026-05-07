import React, { useState, useRef, useEffect } from 'react';

// --- КОНСТАНТЫ И ДАННЫЕ МАЙНКРАФТА ---
const MC_COLORS = {
  black: '#000000', dark_blue: '#0000AA', dark_green: '#00AA00', dark_aqua: '#00AAAA',
  dark_red: '#AA0000', dark_purple: '#AA00AA', gold: '#FFAA00', gray: '#AAAAAA',
  dark_gray: '#555555', blue: '#5555FF', green: '#55FF55', aqua: '#55FFFF',
  red: '#FF5555', light_purple: '#FF55FF', yellow: '#FFFF55', white: '#FFFFFF'
};

const ADVANCED_TAGS =[
  { name: 'Keybind', tag: '<key:key.jump>' },
  { name: 'Translatable', tag: "<lang:block.minecraft.diamond_block>" },
  { name: 'Fallback', tag: "<lang_or:block.minecraft.diamond_block:'Dirt'>" },
  { name: 'Insertion', tag: "<insert:text>нажми с shift</insert>" },
  { name: 'Rainbow', tag: "<rainbow>Радужный текст</rainbow>" },
  { name: 'Gradient', tag: "<gradient:#5e4fa2:#f79459>Градиент</gradient>" },
  { name: 'Transition', tag: "<transition:white:black:red:0>Переход</transition>" },
  { name: 'Font', tag: "<font:alt>Другой шрифт</font>" },
  { name: 'Newline', tag: "<newline>" },
  { name: 'Selector', tag: "<selector:@e[limit=5]>" },
  { name: 'Score', tag: "<score:player:objective>" },
  { name: 'NBT', tag: "<nbt:entity:'@s':Health/>" },
  { name: 'Pride', tag: "<pride:trans>Pride флаг</pride>" },
  { name: 'Sprite', tag: "<sprite:blocks:block/stone>" },
  { name: 'Head', tag: "<head:Notch>" }
];

export default function MinecraftFormatter() {
  const [mode, setMode] = useState('minimessage'); // minimessage | json
  const [text, setText] = useState('Привет, <gradient:blue:aqua>Minecraft</gradient>!\n<gray>Попробуй эти <b>инструменты</b>!');
  const [hoverTextEditor, setHoverTextEditor] = useState('');
  
  const[previewMode, setPreviewMode] = useState('chat_open');
  const [mcVersion, setMcVersion] = useState('1.20.4');
  const [activeMenu, setActiveMenu] = useState(null); // color, action, hover, advanced
  const [hexColor, setHexColor] = useState('#FFFFFF');
  
  const editorRef = useRef(null);
  const hoverEditorRef = useRef(null);

  // --- ВНЕДРЕНИЕ ШРИФТОВ И СТИЛЕЙ МАЙНКРАФТА ---
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @import url('https://fonts.cdnfonts.com/css/minecraft-4');
      .mc-font { font-family: 'Minecraft', sans-serif; font-smooth: never; -webkit-font-smoothing: none; }
      
      .mc-btn {
        background-color: #c6c6c6; border: 2px solid; 
        border-color: #ffffff #555555 #555555 #ffffff;
        color: #333; text-shadow: 1px 1px 0px #fff; cursor: pointer; padding: 4px 8px;
        transition: filter 0.1s;
      }
      .mc-btn:hover { background-color: #d6d6d6; }
      .mc-btn:active { border-color: #555555 #ffffff #ffffff #555555; padding: 5px 7px 3px 9px; }
      
      .mc-panel {
        background-color: #c6c6c6; border: 2px solid;
        border-color: #ffffff #555555 #555555 #ffffff;
      }
      
      .mc-input {
        background-color: #000; border: 2px solid;
        border-color: #555555 #ffffff #ffffff #555555;
        color: #fff; padding: 6px; outline: none; width: 100%;
      }
      
      .mc-tooltip {
        background-color: rgba(16, 0, 16, 0.95);
        border: 2px solid #3700b3;
        border-radius: 3px;
        box-shadow: inset 0 0 0 1px #100010, 2px 2px 0px 0px rgba(0,0,0,0.5);
        padding: 6px; color: #aaaaaa;
      }

      .mc-book {
        background-color: #e5cc98; color: #000; border-radius: 4px;
        box-shadow: inset 0 0 20px rgba(0,0,0,0.2);
        padding: 20px; font-size: 16px;
      }
        
      /* Стили для скроллбара в стиле MC */
      ::-webkit-scrollbar { width: 12px; background: #c6c6c6; border-left: 2px solid #555; }
      ::-webkit-scrollbar-thumb { background: #888; border: 2px solid; border-color: #fff #555 #555 #fff; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  },[]);

  // --- ЛОГИКА ВСТАВКИ ТЕГОВ ---
  const insertTag = (tagStart, tagEnd = '') => {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = text.substring(start, end);
    const newText = text.substring(0, start) + tagStart + selected + tagEnd + text.substring(end);
    setText(newText);
    setActiveMenu(null);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagStart.length, start + tagStart.length + selected.length);
    }, 10);
  };

  // --- ПРОСТОЙ ПАРСЕР MINIMESSAGE В HTML (ДЛЯ ПРЕДПРОСМОТРА) ---
  const renderPreview = (rawText) => {
    let html = rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Парсинг базовых цветов и HEX
    html = html.replace(/&lt;#([0-9a-fA-F]{6})&gt;/g, '<span style="color: #$1;">');
    html = html.replace(/&lt;(\/?)(black|dark_blue|dark_green|dark_aqua|dark_red|dark_purple|gold|gray|dark_gray|blue|green|aqua|red|light_purple|yellow|white)&gt;/g, (match, close, color) => {
      if (close) return '</span>';
      return `<span style="color: ${MC_COLORS[color]};">`;
    });

    // Декорации
    html = html.replace(/&lt;b&gt;/g, '<span style="font-weight: bold;">').replace(/&lt;\/b&gt;/g, '</span>');
    html = html.replace(/&lt;i&gt;/g, '<span style="font-style: italic;">').replace(/&lt;\/i&gt;/g, '</span>');
    html = html.replace(/&lt;u&gt;/g, '<span style="text-decoration: underline;">').replace(/&lt;\/u&gt;/g, '</span>');
    html = html.replace(/&lt;st&gt;/g, '<span style="text-decoration: line-through;">').replace(/&lt;\/st&gt;/g, '</span>');
    html = html.replace(/&lt;obf&gt;/g, '<span style="background: rgba(255,255,255,0.2); filter: blur(2px);">').replace(/&lt;\/obf&gt;/g, '</span>');
    html = html.replace(/&lt;reset&gt;/g, '</span></span></span></span></span></span></span></span>'); // Грубый сброс

    // Градиенты (простая имитация)
    html = html.replace(/&lt;gradient:([^&]+)&gt;(.*?)&lt;\/gradient&gt;/g, (match, colors, content) => {
        const colorArr = colors.split(':').map(c => c.startsWith('#') ? c : (MC_COLORS[c] || '#FFF'));
        return `<span style="background: linear-gradient(90deg, ${colorArr.join(', ')}); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${content}</span>`;
    });

    // Переносы строк
    html = html.replace(/&lt;newline&gt;/g, '<br/>').replace(/\n/g, '<br/>');

    // Кликабельные элементы (подчеркивание)
    html = html.replace(/&lt;click:[^&]+&gt;(.*?)&lt;\/click&gt;/g, '<span style="text-decoration: underline; cursor: pointer;">$1</span>');
    
    // Ховер
    html = html.replace(/&lt;hover:[^&]+&gt;(.*?)&lt;\/hover&gt;/g, '<span style="border-bottom: 1px dotted #fff; cursor: help;">$1</span>');

    return { __html: html };
  };

  // --- КОНВЕРТЕР В JSON (БАЗОВЫЙ) ---
  const generateJSON = () => {
    return JSON.stringify({
      text: "",
      extra:[
        { text: text, color: "white" } // В реальности тут нужен сложный AST парсер, показываем заглушку структуры
      ]
    }, null, 2);
  };

  return (
    <div className="flex flex-col h-screen bg-[#1d1d1d] text-white mc-font p-2" style={{backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")'}}>
      
      {/* ВЕРХНЯЯ ПАНЕЛЬ (ПЕРЕКЛЮЧАТЕЛЬ ФОРМАТА) */}
      <div className="flex justify-center gap-4 mb-4 mt-2">
        <button 
          onClick={() => setMode('minimessage')}
          className={`mc-btn text-xl px-8 py-2 ${mode === 'minimessage' ? 'border-[#555] bg-[#999]' : ''}`}
        >
          MiniMessage
        </button>
        <button 
          onClick={() => setMode('json')}
          className={`mc-btn text-xl px-8 py-2 ${mode === 'json' ? 'border-[#555] bg-[#999]' : ''}`}
        >
          JSON Message
        </button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden max-w-[1400px] w-full mx-auto">
        
        {/* ЛЕВАЯ ЧАСТЬ - РЕДАКТОР */}
        <div className="flex-1 flex flex-col mc-panel p-2 relative shadow-lg">
          
          {/* ПАНЕЛЬ ИНСТРУМЕНТОВ */}
          <div className="flex flex-wrap gap-2 mb-2 p-2 bg-[#8b8b8b] border-2 border-t-[#555] border-l-[#555] border-r-[#fff] border-b-[#fff]">
            
            {/* Меню Цвета */}
            <div className="relative">
              <button className="mc-btn" onClick={() => setActiveMenu(activeMenu === 'color' ? null : 'color')}>
                Цвет
              </button>
              {activeMenu === 'color' && (
                <div className="absolute top-full left-0 mt-1 mc-panel p-2 z-50 w-64 shadow-2xl flex flex-col gap-2">
                  <div className="grid grid-cols-4 gap-1">
                    {Object.entries(MC_COLORS).map(([name, hex]) => (
                      <button key={name} title={name} onClick={() => insertTag(`<${name}>`, `</${name}>`)} 
                              className="w-8 h-8 border-2 border-[#fff] hover:scale-110 transition-transform" 
                              style={{backgroundColor: hex, borderColor: name === 'black' ? '#555' : hex}} />
                    ))}
                  </div>
                  <div className="flex gap-2 items-center mt-2 border-t-2 border-[#888] pt-2">
                    <input type="color" value={hexColor} onChange={(e) => setHexColor(e.target.value)} className="w-8 h-8 bg-black p-0 border-0" />
                    <button className="mc-btn flex-1" onClick={() => insertTag(`<${hexColor}>`, `</${hexColor}>`)}>HEX: {hexColor}</button>
                  </div>
                  <button className="mc-btn w-full" onClick={() => insertTag(`<shadow:${hexColor}>`, `</shadow>`)}>Тень (Shadow)</button>
                </div>
              )}
            </div>

            {/* Декорации */}
            <div className="h-8 w-1 bg-[#555] mx-1 border-r border-[#fff]"></div>
            <button className="mc-btn font-bold" onClick={() => insertTag('<b>', '</b>')} title="Bold">B</button>
            <button className="mc-btn italic" onClick={() => insertTag('<i>', '</i>')} title="Italic">I</button>
            <button className="mc-btn underline" onClick={() => insertTag('<u>', '</u>')} title="Underline">U</button>
            <button className="mc-btn line-through" onClick={() => insertTag('<st>', '</st>')} title="Strikethrough">S</button>
            <button className="mc-btn" onClick={() => insertTag('<obf>', '</obf>')} title="Obfuscated">k</button>
            <button className="mc-btn text-red-700" onClick={() => insertTag('<reset>')} title="Reset Style">✖</button>
            
            <div className="h-8 w-1 bg-[#555] mx-1 border-r border-[#fff]"></div>

            {/* Меню Action */}
            <div className="relative">
              <button className="mc-btn" onClick={() => setActiveMenu(activeMenu === 'action' ? null : 'action')}>
                Действие ⚙️
              </button>
              {activeMenu === 'action' && (
                <div className="absolute top-full left-0 mt-1 mc-panel p-3 z-50 w-72 shadow-2xl flex flex-col gap-2">
                  <h3 className="text-black mb-1 border-b-2 border-[#888]">Событие по клику</h3>
                  <button className="mc-btn text-left" onClick={() => { const u = prompt('URL:'); if(u) insertTag(`<click:open_url:'${u}'>`, '</click>'); }}>Отрыть URL</button>
                  <button className="mc-btn text-left" onClick={() => { const c = prompt('Команда:'); if(c) insertTag(`<click:run_command:'${c}'>`, '</click>'); }}>Выполнить команду</button>
                  
                  {['chat_open', 'chat_closed'].includes(previewMode) && (
                    <button className="mc-btn text-left" onClick={() => { const s = prompt('Текст/Команда:'); if(s) insertTag(`<click:suggest_command:'${s}'>`, '</click>'); }}>Suggest Command</button>
                  )}
                  {previewMode === 'book' && (
                    <button className="mc-btn text-left" onClick={() => { const p = prompt('Страница:'); if(p) insertTag(`<click:change_page:${p}>`, '</click>'); }}>Изменить страницу</button>
                  )}
                  
                  <button className="mc-btn text-left" onClick={() => { const t = prompt('Текст для копирования:'); if(t) insertTag(`<click:copy_to_clipboard:'${t}'>`, '</click>'); }}>Скопировать в буфер</button>
                </div>
              )}
            </div>

            {/* Меню Hover */}
            <div className="relative">
              <button className="mc-btn" onClick={() => setActiveMenu(activeMenu === 'hover' ? null : 'hover')}>
                Hover 🖱️
              </button>
              {activeMenu === 'hover' && (
                <div className="absolute top-full left-0 mt-1 mc-panel p-3 z-50 w-80 shadow-2xl flex flex-col gap-2">
                  <h3 className="text-black mb-1 border-b-2 border-[#888]">Событие наведения</h3>
                  
                  <div className="bg-[#111] p-2 border-2 border-[#555] mb-2">
                     <p className="text-[#aaa] text-xs mb-1">MiniMessage текст для Hover:</p>
                     <textarea 
                       ref={hoverEditorRef}
                       value={hoverTextEditor}
                       onChange={(e) => setHoverTextEditor(e.target.value)}
                       className="w-full mc-input h-16 text-xs"
                       placeholder="<red>Привет!</red>"
                     />
                     <button className="mc-btn mt-2 w-full" onClick={() => insertTag(`<hover:show_text:'${hoverTextEditor}'>`, '</hover>')}>Вставить Show Text</button>
                  </div>

                  <button className="mc-btn text-left" onClick={() => { const i = prompt('Тип предмета (напр. diamond):'); if(i) insertTag(`<hover:show_item:minecraft:${i}>`, '</hover>'); }}>Показать предмет</button>
                  <button className="mc-btn text-left" onClick={() => { const e = prompt('Тип сущности:'); if(e) insertTag(`<hover:show_entity:minecraft:${e}:UUID>`, '</hover>'); }}>Показать сущность</button>
                </div>
              )}
            </div>

            {/* Меню Теги */}
            <div className="relative">
              <button className="mc-btn" onClick={() => setActiveMenu(activeMenu === 'tags' ? null : 'tags')}>
                Другие теги ➕
              </button>
              {activeMenu === 'tags' && (
                <div className="absolute top-full left-0 mt-1 mc-panel p-2 z-50 w-64 max-h-64 overflow-y-auto shadow-2xl flex flex-col gap-1">
                  {ADVANCED_TAGS.map((t) => (
                    <button key={t.name} className="mc-btn text-left text-xs" onClick={() => insertTag(t.tag)}>
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ПОЛЕ РЕДАКТИРОВАНИЯ */}
          {mode === 'minimessage' ? (
             <textarea 
             ref={editorRef}
             value={text}
             onChange={(e) => setText(e.target.value)}
             className="flex-1 mc-input text-lg resize-none p-4"
             placeholder="Введите текст здесь..."
           />
          ) : (
            <textarea 
             value={generateJSON()}
             readOnly
             className="flex-1 mc-input text-lg resize-none p-4 text-green-400 font-mono"
           />
          )}

        </div>

        {/* ПРАВАЯ ЧАСТЬ - ПРЕДПРОСМОТР И НАСТРОЙКИ */}
        <div className="w-[500px] flex flex-col gap-4">
          
          {/* Меню выбора режима предпросмотра */}
          <div className="mc-panel p-2">
            <p className="text-black mb-2 px-1">Режим отображения:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                {id: 'chat_closed', name: 'Чат (Закрыт)'},
                {id: 'chat_open', name: 'Чат (Открыт)'},
                {id: 'lore', name: 'Описание предмета'},
                {id: 'motd', name: 'MOTD сервера'},
                {id: 'book', name: 'Книга'},
                {id: 'hologram', name: 'Голограмма'},
                {id: 'empty', name: 'Пустой (Без фона)'}
              ].map(p => (
                <button 
                  key={p.id}
                  onClick={() => setPreviewMode(p.id)}
                  className={`mc-btn text-sm ${previewMode === p.id ? 'border-blue-500 bg-[#999]' : ''}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* ОКНО ПРЕДПРОСМОТРА */}
          <div className="flex-1 mc-panel bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] bg-[#333] relative flex items-center justify-center p-4 overflow-hidden">
             
             {/* Рендер чата */}
             {previewMode.includes('chat') && (
               <div className="absolute bottom-4 left-4 right-4 flex flex-col justify-end">
                 <div className="bg-black/50 p-2 text-shadow-mc w-full max-h-64 overflow-y-auto break-words leading-[1.3] text-[16px]" dangerouslySetInnerHTML={renderPreview(text)}></div>
                 {previewMode === 'chat_open' && (
                   <div className="h-6 mt-2 border-2 border-[#555] bg-black/80 w-full relative flex items-center px-1">
                     <span className="text-[#aaa] mr-1">{'>'}</span>
                     <span className="w-2 h-4 bg-white animate-pulse"></span>
                   </div>
                 )}
               </div>
             )}

             {/* Рендер Lore (Подсказка предмета) */}
             {previewMode === 'lore' && (
               <div className="mc-tooltip min-w-[150px] max-w-sm break-words leading-[1.2] text-[15px]">
                 <div className="text-white mb-2" style={{color: MC_COLORS.light_purple}}>Алмазный меч</div>
                 <div dangerouslySetInnerHTML={renderPreview(text)}></div>
               </div>
             )}

             {/* Рендер MOTD */}
             {previewMode === 'motd' && (
               <div className="w-full bg-black/80 p-2 border-2 border-[#333] text-[16px] leading-[1.2] max-h-20 overflow-hidden">
                 <div className="text-blue-300 mb-1">A Minecraft Server</div>
                 <div dangerouslySetInnerHTML={renderPreview(text)}></div>
               </div>
             )}

             {/* Рендер Книги */}
             {previewMode === 'book' && (
               <div className="mc-book w-[300px] h-[400px] relative">
                 <div dangerouslySetInnerHTML={renderPreview(text)}></div>
                 <div className="absolute bottom-4 right-4 text-xs text-[#555]">Стр. 1 из 1</div>
               </div>
             )}

             {/* Рендер Голограммы */}
             {previewMode === 'hologram' && (
               <div className="text-center drop-shadow-md text-[18px] leading-[1.4]" dangerouslySetInnerHTML={renderPreview(text)}></div>
             )}

             {/* Пустой режим */}
             {previewMode === 'empty' && (
               <div className="w-full h-full text-[16px] leading-[1.4] flex items-start" dangerouslySetInnerHTML={renderPreview(text)}></div>
             )}

          </div>

          {/* ПАНЕЛЬ УПРАВЛЕНИЯ СНИЗУ (Версия и Копирование) */}
          <div className="mc-panel p-2 flex justify-between items-center bg-[#8b8b8b]">
            <select 
              value={mcVersion} 
              onChange={(e) => setMcVersion(e.target.value)}
              className="bg-black text-white p-1 border-2 border-gray-600 outline-none mc-font"
            >
              <option value="1.20.4">Minecraft 1.20.4+</option>
              <option value="1.19.4">Minecraft 1.19.4</option>
              <option value="1.18.2">Minecraft 1.18.2</option>
            </select>

            <button 
              className="mc-btn font-bold text-green-900 border-green-200"
              onClick={() => {
                navigator.clipboard.writeText(mode === 'minimessage' ? text : generateJSON());
                alert('Скопировано в буфер обмена!');
              }}
            >
              Копировать
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}