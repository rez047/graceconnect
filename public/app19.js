// app19.js — FINAL: Bible search + calm meeting widget
console.log('✝️ app19.js loading...');

(function(){

function g(id){
  return document.getElementById(id);
}

function esc19(x){
  if(typeof esc==='function') return esc(x);

  return String(x==null?'':x).replace(
    /[&<>\"']/g,
    function(c){
      return {
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '\"':'&quot;',
        "'":'&#39;'
      }[c];
    }
  );
}


/* ═══════════════════════════════════════════════════════════
   1) BIBLE
   Proxy -> direct source -> offline cache

   Supports:

   English:
     Genesis 1
     John 3
     John 3:16
     John 3:16-18

   Swahili:
     Mwanzo 1
     Yohana 3
     Yohana 3:16
     Yohana 3:16-18
     Zaburi 23
     Warumi 8

   The API receives the chapter and this file filters the
   requested verse/range after the chapter is returned.
   ═══════════════════════════════════════════════════════════ */

var BOOKS19=[
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalm",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation"
];

var SWAHILI_BOOKS19={
  "mwanzo":"Genesis",
  "kutoka":"Exodus",
  "mambo ya walawi":"Leviticus",
  "walawi":"Leviticus",
  "hesabu":"Numbers",
  "kumbukumbu la torati":"Deuteronomy",
  "kumbukumbu":"Deuteronomy",
  "yoshua":"Joshua",
  "waamuzi":"Judges",
  "ruthu":"Ruth",
  "1 samweli":"1 Samuel",
  "2 samweli":"2 Samuel",
  "1 wafalme":"1 Kings",
  "2 wafalme":"2 Kings",
  "1 nyakati":"1 Chronicles",
  "2 nyakati":"2 Chronicles",
  "ezra":"Ezra",
  "nehemia":"Nehemiah",
  "esta":"Esther",
  "ayubu":"Job",
  "zaburi":"Psalm",
  "zab":"Psalm",
  "mithali":"Proverbs",
  "mhubiri":"Ecclesiastes",
  "wimbo ulio bora":"Song of Solomon",
  "wimbo wa sulemani":"Song of Solomon",
  "isaya":"Isaiah",
  "yeremia":"Jeremiah",
  "maombolezo":"Lamentations",
  "ezekieli":"Ezekiel",
  "danieli":"Daniel",
  "hosea":"Hosea",
  "yoeli":"Joel",
  "amosi":"Amos",
  "obadia":"Obadiah",
  "yona":"Jonah",
  "mika":"Micah",
  "nahumu":"Nahum",
  "habakuki":"Habakkuk",
  "sefania":"Zephaniah",
  "hagayi":"Haggai",
  "zekaria":"Zechariah",
  "malaki":"Malachi",
  "mathayo":"Matthew",
  "matayo":"Matthew",
  "marko":"Mark",
  "mariko":"Mark",
  "luka":"Luke",
  "yohana":"John",
  "matendo ya mitume":"Acts",
  "matendo":"Acts",
  "warumi":"Romans",
  "1 wakorintho":"1 Corinthians",
  "2 wakorintho":"2 Corinthians",
  "1 wakorinto":"1 Corinthians",
  "2 wakorinto":"2 Corinthians",
  "wagalatia":"Galatians",
  "waefeso":"Ephesians",
  "wafilipi":"Philippians",
  "wakolosai":"Colossians",
  "1 wathesalonike":"1 Thessalonians",
  "2 wathesalonike":"2 Thessalonians",
  "1 timotheo":"1 Timothy",
  "2 timotheo":"2 Timothy",
  "tito":"Titus",
  "filemoni":"Philemon",
  "waebrania":"Hebrews",
  "yakobo":"James",
  "1 petro":"1 Peter",
  "2 petro":"2 Peter",
  "1 yohana":"1 John",
  "2 yohana":"2 John",
  "3 yohana":"3 John",
  "yuda":"Jude",
  "ufunuo":"Revelation",
  "ufunuo wa yohana":"Revelation"
};

function normalizeBook19(value){
  return String(value||'')
    .trim()
    .toLowerCase()
    .replace(/\s+/g,' ');
}

function canonicalBook19(book){

  var value=normalizeBook19(book);

  if(!value){
    return null;
  }

  if(/^\d+$/.test(value)){
    var n=parseInt(value,10);

    if(n>=1&&n<=66){
      return BOOKS19[n-1];
    }

    return null;
  }

  for(var i=0;i<BOOKS19.length;i++){

    if(
      BOOKS19[i].toLowerCase()===value
    ){
      return BOOKS19[i];
    }
  }

  if(SWAHILI_BOOKS19[value]){
    return SWAHILI_BOOKS19[value];
  }

  return null;
}

function bookNum19(b){

  var canonical=canonicalBook19(b);

  if(!canonical){
    return 1;
  }

  var n=BOOKS19.indexOf(canonical);

  return n>=0 ? n+1 : 1;
}

/*
 * Parse:
 *
 * John 3
 * John 3:16
 * John 3:16-18
 * Yohana 3:16
 */
function parseBibleReference19(ref){

  var value=String(ref||'').trim();

  /*
   Book + chapter + optional verse/range.
   Greedy book portion allows:
     Song of Solomon 2:1
     1 Corinthians 13:4
     1 Wakorintho 13:4
  */
  var match=value.match(
    /^(.+?)\s+(\d+)(?:\s*:\s*(\d+)(?:\s*-\s*(\d+))?)?\s*$/
  );

  if(!match){

    /*
     If the user enters only a book name,
     load chapter 1.
    */
    var onlyBook=canonicalBook19(value);

    if(onlyBook){

      return {
        book:onlyBook,
        chapter:1,
        verseStart:null,
        verseEnd:null
      };
    }

    return {
      book:"Genesis",
      chapter:1,
      verseStart:null,
      verseEnd:null
    };
  }

  var book=canonicalBook19(match[1]);

  if(!book){
    book="Genesis";
  }

  var chapter=parseInt(match[2],10);

  var verseStart=
    match[3]
      ? parseInt(match[3],10)
      : null;

  var verseEnd=
    match[4]
      ? parseInt(match[4],10)
      : verseStart;

  return {
    book:book,
    chapter:chapter,
    verseStart:verseStart,
    verseEnd:verseEnd
  };
}

function safeJSON19(url){

  return fetch(url).then(function(r){

    if(!r.ok){
      throw new Error(
        'HTTP '+r.status
      );
    }

    return r.text().then(function(t){

      var s=(t||'').trim();

      if(
        !s ||
        (
          s.charAt(0)!=='{' &&
          s.charAt(0)!=='['
        )
      ){
        throw new Error(
          'source sent HTML'
        );
      }

      try{
        return JSON.parse(s);
      }catch(e){
        throw new Error(
          'broken JSON'
        );
      }

    });

  });
}

function bibleURLs19(
  trans,
  book,
  ch
){

  var isSw=
    String(trans||'').toLowerCase()==='swahili';

  var code={
    KJV:'kjv',
    NKJV:'kjv',
    NIV:'web',
    WEB:'web',
    ASV:'asv',
    YLT:'ylt',
    DARBY:'darby',
    DRA:'dra'
  }[trans]||'kjv';

  var canonical=
    canonicalBook19(book)||
    book;

  var n=
    bookNum19(canonical);

  var urls=[];

  /*
   First: GraceConnect server API.
   */
  urls.push(
    '/api/bible?translation='+
    encodeURIComponent(
      isSw ? 'swahili' : code
    )+
    '&book='+
    encodeURIComponent(canonical)+
    '&chapter='+
    encodeURIComponent(ch)
  );

  /*
   Direct Swahili fallback.
   */
  if(isSw){

    urls.push(
      'https://api.getbible.net/v2/swahili/'+
      n+
      '/'+
      ch+
      '.json'
    );

    /*
     MEGA.Bible direct fallback.
    */
    var mega=[
      "gen","exo","lev","num","deu","jos","jdg","rut",
      "1sa","2sa","1ki","2ki","1ch","2ch","ezr","neh",
      "est","job","psa","pro","ecc","sng","isa","jer",
      "lam","eze","dan","hos","joe","amo","oba","jon",
      "mic","nah","hab","zep","hag","zec","mal","mat",
      "mrk","luk","jhn","act","rom","1co","2co","gal",
      "eph","php","col","1th","2th","1ti","2ti","tit",
      "phm","heb","jas","1pe","2pe","1jn","2jn","3jn",
      "jud","rev"
    ][n-1];

    if(mega){

      urls.push(
        'https://mega.bible/sw/biblia-takatifu/'+
        mega+
        '/'+
        ch+
        '.simple.json'
      );

      urls.push(
        'https://mega.bible/sw/biblia-takatifu/'+
        mega+
        '/'+
        ch+
        '.json'
      );
    }

  }else{

    /*
     Direct English fallback.
    */
    urls.push(
      'https://bible-api.com/'+
      encodeURIComponent(
        canonical+' '+ch
      )+
      '?translation='+
      code
    );
  }

  return urls;
}

function normalizeBibleData19(
  d,
  book,
  ch
){

  if(!d){
    return null;
  }

  var verses=[];

  /*
   Standard bible-api / GetBible shape.
  */
  if(
    Array.isArray(d.verses)
  ){
    verses=d.verses;
  }

  /*
   GetBible nested shape.
  */
  if(
    !verses.length &&
    d.chapter &&
    Array.isArray(d.chapter.verses)
  ){
    verses=d.chapter.verses;
  }

  /*
   MEGA simplified shape.
  */
  if(
    !verses.length &&
    d.chapter &&
    Array.isArray(d.chapter.content)
  ){
    verses=d.chapter.content;
  }

  if(
    !verses.length &&
    Array.isArray(d.content)
  ){
    verses=d.content;
  }

  verses=verses.map(function(v){

    return {
      verse:Number(
        v.verse!=null
          ? v.verse
          : v.number
      ),

      text:String(
        v.text||
        v.value||
        v.content||
        ''
      ).trim()
    };

  }).filter(function(v){

    return (
      v.verse>0 &&
      v.text
    );

  });

  if(!verses.length){
    return null;
  }

  return {
    reference:
      d.reference||
      d.name||
      (book+' '+ch),

    verses:verses
  };
}

function filterBibleVerses19(
  d,
  verseStart,
  verseEnd
){

  if(
    verseStart==null ||
    !d ||
    !d.verses
  ){
    return d;
  }

  var start=
    parseInt(verseStart,10);

  var end=
    verseEnd==null
      ? start
      : parseInt(verseEnd,10);

  if(
    !Number.isFinite(start) ||
    !Number.isFinite(end)
  ){
    return d;
  }

  if(end<start){

    var temp=start;
    start=end;
    end=temp;
  }

  var filtered=
    d.verses.filter(function(v){

      var n=parseInt(
        v.verse,
        10
      );

      return n>=start&&n<=end;
    });

  if(!filtered.length){
    return null;
  }

  var copy={
    reference:
      d.reference+
      ':'+
      start,

    verses:filtered
  };

  if(end!==start){
    copy.reference+='-'+end;
  }

  return copy;
}

function paint19(
  out,
  d,
  offline
){

  window._bibleVerses=d.verses;
  window._selectedVerses=[];

  var h=
    '<div style="font-weight:700;color:#92400E;margin-bottom:8px">'+
    esc19(d.reference)+
    (
      offline
        ? ' <span class="chip chip-green">offline copy</span>'
        : ''
    )+
    '</div>';

  d.verses.forEach(function(v){

    h+=
      '<div data-v="'+
      esc19(v.verse)+
      '" onclick="toggleVerseHighlight(this,'+
      v.verse+
      ')" style="padding:4px 6px;border-radius:6px;cursor:pointer;margin-bottom:2px">'+
      '<sup>'+
      esc19(v.verse)+
      '</sup> '+
      esc19(v.text)+
      '</div>';

  });

  h+=
    '<div style="display:flex;gap:8px;margin-top:10px">'+
      '<button class="btn btn-primary btn-sm" onclick="saveSelectedVerses()">'+
        '<i class="fas fa-bookmark"></i> Save'+
      '</button>'+
      '<button class="btn btn-chat btn-sm" onclick="openShareVerses()">'+
        '<i class="fas fa-share"></i> Share'+
      '</button>'+
    '</div>';

  out.innerHTML=h;
}

window.loadBibleChapter=function(){

  var trans=
    (g('readerTrans')||{}).value||
    'KJV';

  var ref=
    (g('readerRef')||{
      value:'Genesis 1'
    }).value.trim()||
    'Genesis 1';

  var parsed=
    parseBibleReference19(ref);

  var book=
    parsed.book;

  var ch=
    parsed.chapter;

  var verseStart=
    parsed.verseStart;

  var verseEnd=
    parsed.verseEnd;

  var out=
    g('readerOut');

  if(!out){
    return;
  }

  out.innerHTML=
    '<div style="color:#94A3B8">'+
    'Loading '+
    esc19(trans)+
    '…</div>';

  /*
   Cache key includes verse range so a verse request
   never incorrectly reuses a whole-chapter result.
  */
  var verseKey=
    verseStart!=null
      ? '_'+verseStart+'_'+(
          verseEnd!=null
            ? verseEnd
            : verseStart
        )
      : '_chapter';

  var key=
    'gc_bible_'+
    trans+
    '_'+
    bookNum19(book)+
    '_'+
    ch+
    verseKey;

  var chain=
    Promise.reject(
      new Error('start')
    );

  bibleURLs19(
    trans,
    book,
    ch
  ).forEach(function(u){

    chain=
      chain.catch(function(){

        return safeJSON19(u)
          .then(function(raw){

            var d=
              normalizeBibleData19(
                raw,
                book,
                ch
              );

            if(
              !d ||
              !d.verses ||
              !d.verses.length
            ){
              throw new Error(
                'empty'
              );
            }

            /*
             * Filter requested verse/range.
             */
            d=
              filterBibleVerses19(
                d,
                verseStart,
                verseEnd
              );

            if(
              !d ||
              !d.verses ||
              !d.verses.length
            ){
              throw new Error(
                'requested verse not found'
              );
            }

            return d;

          });

      });

  });

  chain.then(function(d){

    try{
      localStorage.setItem(
        key,
        JSON.stringify(d)
      );
    }catch(e){}

    paint19(
      out,
      d,
      false
    );

  }).catch(function(){

    var cached=null;

    try{
      cached=
        JSON.parse(
          localStorage.getItem(key)||'null'
        );
    }catch(e){}

    if(
      cached &&
      cached.verses &&
      cached.verses.length
    ){

      paint19(
        out,
        cached,
        true
      );

      return;
    }

    out.innerHTML=
      '<div style="color:#991B1B">'+
      'Could not load '+
      esc19(trans)+
      ' '+
      esc19(
        book+' '+ch+
        (
          verseStart!=null
            ? ':'+
              verseStart+
              (
                verseEnd!=null &&
                verseEnd!==verseStart
                  ? '-'+verseEnd
                  : ''
              )
            : ''
        )
      )+
      '.<br>'+
      '<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="loadBibleChapter()">'+
      '<i class="fas fa-rotate-right"></i> Retry'+
      '</button>'+
      '</div>';

  });
};


/* ═══════════
   2) ONE CALM MEETING WIDGET
   ═══════════ */

// kill app14's writer completely
window.renderDeptWeekMeet14=function(){};

(function(){

  [
    'deptWeekMeet14',
    'deptWeekMeet17',
    'deptWeekMeet18'
  ].forEach(function(id){

    var b=g(id);

    if(b){
      b.remove();
    }

  });

})();

function meetSig19(m,can){

  return JSON.stringify([
    m&&m.id,
    m&&m.meeting_date,
    m&&m.start_time,
    m&&m.end_time,
    m&&m.venue,
    m&&m.theme,
    !!can
  ]);

}

function deptId19(){

  return window.currentDeptId||null;

}

function ensureMeetBox19(){

  var host=
    g('home-mainDept');

  if(!host){
    return null;
  }

  var box=
    g('meet19Box');

  if(!box){

    box=
      document.createElement('div');

    box.id='meet19Box';

    var edit=
      g('deptEditMeetBtn');

    if(
      edit &&
      edit.parentNode===host
    ){

      edit.insertAdjacentElement(
        'afterend',
        box
      );

    }else{

      host.insertBefore(
        box,
        host.firstChild
      );

    }

  }

  return box;

}

function hideLegacyMeetUI19(){

  var host=
    g('home-mainDept');

  if(!host){
    return;
  }

  var nodes=
    host.querySelectorAll(
      '.card,.weekly-meeting-card,#deptWeekMeet14,#deptWeekMeet17,#deptWeekMeet18'
    );

  for(
    var i=0;
    i<nodes.length;
    i++
  ){

    var n=nodes[i];

    if(
      n.id==='meet19Box'
    ){
      continue;
    }

    if(
      /This Week'?s Meeting/i.test(
        n.textContent||''
      )
    ){

      n.style.display='none';

    }

  }

}

window.deleteMeeting19=function(mid){

  var d=
    deptId19();

  if(
    !mid ||
    !(
      typeof isDeptLeader9==='function' &&
      isDeptLeader9(d)
    )
  ){

    return alert(
      '🚫 Leader/admin only.'
    );

  }

  if(
    !confirm(
      'Delete this meeting?'
    )
  ){
    return;
  }

  sb
    .from('weekly_meetings')
    .delete()
    .eq('id',mid)
    .then(function(r){

      if(r.error){

        return alert(
          '⚠️ '+r.error.message
        );

      }

      alert('✅ Deleted');

      loadDeptMeeting19(true);

    });

};

function loadDeptMeeting19(force){

  var d=
    deptId19();

  if(
    !sb ||
    !d
  ){
    return;
  }

  var host=
    g('home-mainDept');

  if(
    !host ||
    !host.classList.contains('active')
  ){
    return;
  }

  sb
    .from('weekly_meetings')
    .select('*')
    .eq('department_id',d)
    .order(
      'created_at',
      {ascending:false}
    )
    .limit(1)
    .then(function(r){

      var m=
        (r.data&&r.data[0])||
        null;

      var can=false;

      try{

        can=
          typeof isDeptLeader9==='function' &&
          isDeptLeader9(d);

      }catch(e){}

      var box=
        ensureMeetBox19();

      if(!box){
        return;
      }

      var sig=
        meetSig19(
          m,
          can
        );

      if(
        !force &&
        box.dataset.sig19===sig
      ){

        hideLegacyMeetUI19();

        return;
      }

      box.dataset.sig19=sig;

      if(m){
        window._curMeetingId=m.id;
      }

      var h=
        '<div style="background:#fff;border:1px solid var(--border);border-radius:16px;padding:18px;box-shadow:0 1px 3px rgba(0,0,0,.08)">';

      h+=
        '<div style="font-family:\'Playfair Display\',serif;font-size:1.05rem;font-weight:700;margin-bottom:8px">'+
        '<i class="fas fa-calendar-day" style="color:var(--primary)"></i> This Week\'s Meeting'+
        '</div>';

      if(!m){

        h+=
          '<div style="text-align:center;padding:14px;color:var(--text-lighter)">'+
          'No meeting scheduled yet'+
          '</div>';

      }else{

        h+=
          '<div style="font-size:.9rem;line-height:1.8">'+
          (
            m.meeting_date
              ? '<div><b>📅 Date:</b> '+
                esc19(m.meeting_date)+
                '</div>'
              : ''
          )+
          (
            m.start_time
              ? '<div><b>🕐 Time:</b> '+
                esc19(m.start_time)+
                (
                  m.end_time
                    ? ' – '+esc19(m.end_time)
                    : ''
                )+
                '</div>'
              : ''
          )+
          (
            m.venue
              ? '<div><b>📍 Venue:</b> '+
                esc19(m.venue)+
                '</div>'
              : ''
          )+
          (
            m.theme
              ? '<div><b>🎯 Theme:</b> '+
                esc19(m.theme)+
                '</div>'
              : ''
          )+
          (
            typeof mediaHTML==='function'
              ? mediaHTML(mediaOf(m))
              : ''
          )+
          '</div>';

      }

      if(can){

        h+=
          '<div style="display:flex;gap:8px;margin-top:10px">'+

          '<button class="btn btn-warm btn-sm" onclick="openDeptMeetingEditor(\''+
          d+
          '\')">'+
          '<i class="fas fa-edit"></i> Update'+
          '</button>'+

          (
            m
              ? '<button class="btn btn-danger btn-sm" onclick="deleteMeeting19(\''+
                m.id+
                '\')">'+
                '<i class="fas fa-trash"></i> Delete'+
                '</button>'
              : ''
          )+

          '</div>';

      }

      box.innerHTML=
        h+
        '</div>';

      hideLegacyMeetUI19();

    });

}

window.refreshMeetings19=function(){

  loadDeptMeeting19(true);

};

// refresh ONLY on events

var _o19=
  window.openDeptForum;

window.openDeptForum=function(){

  var r=
    _o19
      ? _o19.apply(
          this,
          arguments
        )
      : undefined;

  setTimeout(
    function(){

      hideLegacyMeetUI19();
      loadDeptMeeting19(true);

    },
    800
  );

  return r;

};

var _s19=
  window.saveDeptMeeting9;

window.saveDeptMeeting9=function(){

  var r=
    _s19
      ? _s19.apply(
          this,
          arguments
        )
      : undefined;

  setTimeout(
    function(){
      loadDeptMeeting19(true);
    },
    1000
  );

  return r;

};

var _u19=
  window.updateMeeting;

window.updateMeeting=function(){

  var r=
    _u19
      ? _u19.apply(
          this,
          arguments
        )
      : undefined;

  setTimeout(
    function(){
      loadDeptMeeting19(true);
    },
    1000
  );

  return r;

};

var _d19=
  window.deleteCurrentMeeting;

window.deleteCurrentMeeting=function(){

  var r=
    _d19
      ? _d19.apply(
          this,
          arguments
        )
      : undefined;

  setTimeout(
    function(){
      loadDeptMeeting19(true);
    },
    1000
  );

  return r;

};

// live cross-device updates
if(
  window.sb &&
  sb.channel
){

  try{

    sb
      .channel('wm19')
      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'weekly_meetings'
        },
        function(){

          loadDeptMeeting19(false);

        }
      )
      .subscribe();

  }catch(e){}

}

// safety net
setInterval(
  function(){

    try{
      loadDeptMeeting19(false);
    }catch(e){}

  },
  300000
);

// keep legacy cards hidden
setInterval(
  function(){

    try{
      hideLegacyMeetUI19();
    }catch(e){}

  },
  4000
);


/* ═══════════
   3) SCALE GUARDS
   ═══════════ */

var _lm=
  window.loadMyMemberships9;

var _lmT=0;

window.loadMyMemberships9=function(){

  var n=Date.now();

  if(
    n-_lmT<20000
  ){
    return undefined;
  }

  _lmT=n;

  return _lm
    ? _lm.apply(
        this,
        arguments
      )
    : undefined;

};

var _lp=
  window.loadPending;

var _lpT=0;

window.loadPending=function(){

  var n=Date.now();

  if(
    n-_lpT<60000
  ){
    return undefined;
  }

  _lpT=n;

  return _lp
    ? _lp.apply(
        this,
        arguments
      )
    : undefined;

};

setTimeout(
  function(){

    hideLegacyMeetUI19();
    loadDeptMeeting19(true);

  },
  1200
);

console.log(
  '✝️ app19.js active (Bible + calm meetings)'
);

})();
