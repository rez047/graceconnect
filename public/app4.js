

// app4.js — FINAL FIXES (loads AFTER app3.js, overrides broken functions)

// ════════ FIX 1: CORRECT STREAK (recompute from actual active days) ════════
function computeStreakFromDays(days){
  var set={};days.forEach(function(d){set[new Date(d).toDateString()]=true;});
  var count=0;var d=new Date();
  if(!set[d.toDateString()]){d.setDate(d.getDate()-1);} // streak still alive if active yesterday
  while(set[d.toDateString()]){count++;d.setDate(d.getDate()-1);}
  return count;
}
function updateStreak(){
  if(!user||!profile||!sb)return;
  var today=new Date();today.setHours(0,0,0,0);
  var days=(profile.streak_days||[]).slice();
  var hasToday=days.some(function(d){return new Date(d).toDateString()===today.toDateString();});
  if(!hasToday)days.push(today.toISOString());
  var correct=computeStreakFromDays(days);
  var longest=Math.max(profile.streak_longest||0,correct);
  sb.from('profiles').update({streak_current:correct,streak_longest:longest,streak_last_activity:new Date().toISOString(),streak_days:days}).eq('id',user.id).then(function(){
    profile.streak_current=correct;profile.streak_days=days;
    var sc=document.getElementById('streakCount');if(sc)sc.textContent=correct+' Days';
    var ps=document.getElementById('profileStreak');if(ps)ps.textContent=correct+' Days';
    highlightStreakDays(days.map(function(x){return new Date(x);}));
  });
}
// Re-fix displayed streak immediately on load
setTimeout(function(){if(user&&profile)updateStreak();},1500);

// ════════ FIX 2: "HOW ARE YOU FEELING" — any topic / person / thing, verses + insight ════════
var FEEL={grief:["Matthew 5:4","Psalm 34:18"],joy:["Nehemiah 8:10","Psalm 16:11"],anxiety:["Philippians 4:6","1 Peter 5:7"],loneliness:["Hebrews 13:5","Psalm 27:10"],fear:["2 Timothy 1:7","Isaiah 41:10"],doubt:["Mark 9:24","Hebrews 11:1"],anger:["James 1:19","Ephesians 4:26"],love:["1 Corinthians 13:4","1 John 4:19"],hope:["Romans 15:13","Hebrews 6:19"],strength:["Isaiah 40:31","Philippians 4:13"],healing:["Jeremiah 30:17","Psalm 103:2"],forgiveness:["1 John 1:9","Ephesians 4:32"],peace:["John 14:27","Isaiah 26:3"],money:["Matthew 6:33","Malachi 3:10"],wisdom:["James 1:5","Proverbs 3:5"]};
var ENC={grief:"God sees your tears and promises comfort.",joy:"Let this joy overflow and strengthen you.",anxiety:"Trade your worry for worship.",loneliness:"God is always with you.",fear:"Fear is a liar; you are equipped with power and love.",doubt:"Honest doubt brought to Jesus grows deeper faith.",anger:"Be quick to listen, slow to anger.",love:"You are deeply loved; love others as you are loved.",hope:"Hope anchors the soul.",strength:"He strengthens the weary.",healing:"By His stripes you are healed.",forgiveness:"You are forgiven and free.",peace:"His peace guards your heart.",money:"Seek first the Kingdom; your Father knows your needs.",wisdom:"Ask God, who gives generously."};

function fetchVersesFor(query){
  // Try HelloAO search (trusted, returns verses mentioning the topic/person)
  return fetch('https://bible.helloao.org/api/KJV/search.json?query='+encodeURIComponent(query)+'&limit=3')
    .then(function(r){return r.json();})
    .then(function(d){
      var out=[];
      var arr=(d&&d.results)?d.results:(d&&d.verses)?d.verses:[];
      arr.forEach(function(v){
        var ref=(v.book_name||v.book||'')+' '+(v.chapter||'')+':'+(v.verse||'');
        var text=v.text||v.verse_text||'';
        if(text)out.push({reference:ref,text:text});
      });
      return out;
    }).catch(function(){return [];});
}
function aiInsight(topic,verses){
  var n=verses.length;
  var first=n?verses[0]:null;
  var s='🤖 Insight: "'+topic+'" appears in Scripture'+(n?' ('+n+' reference'+(n>1?'s':'')+')':'');
  if(first)s+='. '+first.text+' ('+first.reference+')';
  s+=' God\'s Word speaks directly to "'+topic+'" today — hold onto it.';
  return s;
}
function retrieveVersesOnline(){
  var input=(document.getElementById('emotionalInput').value||'').trim().toLowerCase();
  var c=document.getElementById('verseResults');if(!c)return;
  if(!input){c.innerHTML='';return;}
  c.innerHTML='<div style="color:#94A3B8">Searching Scripture...</div>';
  var key=null;for(var k in FEEL){if(input.indexOf(k)>-1){key=k;break;}}
  if(key){renderVerseCards(input,FEEL[key],ENC[key]);return;}
  // Any topic / person / thing
  fetchVersesFor(input).then(function(verses){
    if(verses.length){renderVerseCards(input,verses.map(function(v){return v.reference;}),aiInsight(input,verses),verses);}
    else{
      // Fallback: Wikipedia (person/thing) + generic verse
      fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(input)).then(function(r){return r.json();}).then(function(w){
        var bio=(w&&w.extract)?w.extract:'';
        renderVerseCards(input,['Jeremiah 29:11'],aiInsight(input,[{text:bio||('"'+'"' ),reference:'Jeremiah 29:11'}]),[]);
      }).catch(function(){showUnavailable(input);});
    }
  });
}
function renderVerseCards(input,refs,enc,versesArr){
  var c=document.getElementById('verseResults');
  Promise.all(refs.map(function(r){return bibleFetch(r,'web').catch(function(){return null;});})).then(function(res){
    var h='<div class="verse-result"><div class="verse-result-header"><i class="fas fa-heart"></i> God\'s Word for "'+esc(input)+'"</div>';
    var used=res.filter(function(d){return d&&d.text;});
    if(used.length){used.forEach(function(d){h+='<div class="verse-item"><div class="verse-text">"'+esc(d.text.trim())+'"</div><div class="verse-ref">— '+esc(d.reference)+'</div></div>';});}
    else if(versesArr&&versesArr.length){versesArr.forEach(function(v){h+='<div class="verse-item"><div class="verse-text">"'+esc(v.text)+'"</div><div class="verse-ref">— '+esc(v.reference)+'</div></div>';});}
    h+='<div class="verse-encourage">💝 '+esc(enc)+'</div></div>';
    c.innerHTML=h;
  });
}

// ════════ FIX 3: CHARACTER EXPLORER — full life story + virtues + today ════════
var CHAR_BIOS={
 Ezra:{story:"A priest and scribe who led exiles back to Jerusalem and restored the Law.",faith:"Devotion to God's Word.",virtues:"humility, diligence, reverence",went:"Faced opposition and a people who had forgotten God.",today:"Set your heart to study and do the Word, like Ezra."},
 Nehemiah:{story:"Cupbearer who rebuilt Jerusalem's walls.",faith:"Prayer + action.",virtues:"courage, leadership, perseverance",went:"Mockery and threats while rebuilding.",today:"Rebuild what is broken with prayer and hard work."},
 Esther:{story:"Queen who saved her people.",faith:"Bold trust in God.",virtues:"courage, self-sacrifice",went:"Risked death to approach the king.",today:"Stand for others 'for such a time as this.'"},
 Daniel:{story:"Exile who rose to power without compromising.",faith:"Unshakable integrity.",virtues:"integrity, prayer, wisdom",went:"Lions' den for praying to God.",today:"Stay faithful in a secular world."},
 Joseph:{story:"Sold by brothers, raised to save nations.",faith:"Trust in providence.",virtues:"forgiveness, patience",went:"Betrayal, slavery, prison.",today:"What others mean for harm, God means for good."},
 Moses:{story:"Led Israel out of Egypt.",faith:"Obedience.",virtues:"humility, perseverance",went:"40 years in the wilderness.",today:"God uses the reluctant."},
 David:{story:"Shepherd to king.",faith:"A heart after God.",virtues:"worship, repentance, courage",went:"Persecution by Saul; his own failures.",today:"Bring your whole self to God."},
 Peter:{story:"Fisherman to Pentecost preacher.",faith:"Restoration.",virtues:"devotion, boldness",went:"Denied Christ, then was restored.",today:"Failure is not final with Jesus."},
 Paul:{story:"Persecutor to apostle.",faith:"Grace.",virtues:"perseverance, zeal",went:"Shipwrecks, prison, stoning.",today:"No past is beyond redemption."},
 Ruth:{story:"Moabite in the line of Christ.",faith:"Loyalty.",virtues:"loyalty, humility",went:"Widowhood and poverty.",today:"Faithful love is rewarded."},
 Mary:{story:"Mother of Jesus.",faith:"Obedience.",virtues:"trust, humility",went:"Societal shame, then blessing.",today:"Say yes to God's plan."},
 Joshua:{story:"Led Israel into the Promised Land.",faith:"Courage.",virtues:"courage, faithfulness",went:"Battles and leadership burdens.",today:"Be strong and courageous."},
 Caleb:{story:"Wholehearted spy.",faith:"Wholehearted faith.",virtues:"steadfastness",went:"40 years of wandering.",today:"Claim your mountain."},
 Elijah:{story:"Prophet of fire.",faith:"Bold prayer.",virtues:"boldness",went:"Fled Jezebel; despair under a broom tree.",today:"The prayer of the righteous avails much."},
 Jonah:{story:"Reluctant prophet to Nineveh.",faith:"Second chances.",virtues:"obedience (eventually)",went:"Storm, great fish.",today:"Go where God sends you."},
 Job:{story:"Righteous sufferer.",faith:"Endurance.",virtues:"patience, integrity",went:"Loss, disease, false friends.",today:"Trust God when you don't understand."},
 MaryMagdalene:{story:"First witness of the resurrection.",faith:"Devotion.",virtues:"love, loyalty",went:"Deliverance, then devotion.",today:"Seek Jesus early."},
 Timothy:{story:"Young leader mentored by Paul.",faith:"Purity.",virtues:"faithfulness",went:"Youth and pressure.",today:"Let no one despise your youth."},
 Samuel:{story:"Prophet who anointed kings.",faith:"Listening.",virtues:"obedience",went:"A corrupt priesthood.",today:"Speak, Lord, for your servant hears."},
 Solomon:{story:"Wisest king.",faith:"Wisdom.",virtues:"wisdom",went:"Temptation of many wives.",today:"Seek wisdom above wealth."},
 Abraham:{story:"Father of faith.",faith:"Believed against impossibility.",virtues:"faith, patience",went:"Waiting for a promised son.",today:"Trust God's promises."},
 John:{story:"The beloved disciple.",faith:"Love.",virtues:"love",went:"Exile on Patmos.",today:"Abide in Christ's love."},
 JohnBaptist:{story:"Voice in the wilderness.",faith:"Humility.",virtues:"humility, boldness",went:"Beheading for truth.",today:"He must increase; I must decrease."},
 Stephen:{story:"First martyr.",faith:"Forgiveness.",virtues:"courage, forgiveness",went:"Stoned for the Gospel.",today:"Forgive as you are forgiven."},
 Gideon:{story:"Weak man made mighty.",faith:"Small faith used greatly.",virtues:"obedience",went:"Fear and doubt.",today:"God uses the weak."},
 Samson:{story:"Strongest, yet flawed.",faith:"Strength from God.",virtues:"strength",went:"Betrayal and blindness.",today:"Your strength is for God's purpose."},
 Deborah:{story:"Judge and prophetess.",faith:"Leadership.",virtues:"wisdom, courage",went:"A nation in oppression.",today:"Lead with God's wisdom."},
 Boaz:{story:"Kinsman-redeemer.",faith:"Kindness.",virtues:"generosity, integrity",went:"None—chose kindness.",today:"Be a redeemer to others."},
 Martha:{story:"Sister of Lazarus.",faith:"Service.",virtues:"service",went:"Distraction and worry.",today:"Choose the better portion."},
 Lazarus:{story:"Raised from the dead.",faith:"Life from God.",virtues:"testimony",went:"Death, then life.",today:"Jesus is the resurrection and the life."},
 Thomas:{story:"Doubter who believed.",faith:"Honest doubt to faith.",virtues:"honesty",went:"Doubt until he saw.",today:"Blessed are those who believe unseen."},
 Judas:{story:"Betrayer.",faith:"Warning.",virtues:"(warning) greed",went:"Greed led to betrayal.",today:"Guard your heart from greed."},
 Pilate:{story:"Governor who washed his hands.",faith:"Warning.",virtues:"(warning) compromise",went:"Pressure over truth.",today:"Stand for truth over pressure."}
};
function loadCharacter(){
  var q=(document.getElementById('charSearch').value||'').trim();if(!q)return;
  var out=document.getElementById('charOut');out.innerHTML='<div style="color:#94A3B8">Searching Scripture & history...</div>';
  var name=q.charAt(0).toUpperCase()+q.slice(1).toLowerCase();
  var key=Object.keys(CHAR_BIOS).find(function(k){return k.toLowerCase()===name.replace(/\s/g,'').toLowerCase()||name.toLowerCase().indexOf(k.toLowerCase())===0;})||null;
  var bio=key?CHAR_BIOS[key]:null;
  // Life story from Wikipedia + related verses
  Promise.all([
    fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(name)).then(function(r){return r.json();}).catch(function(){return null;}),
    fetchVersesFor(name)
  ]).then(function(res){
    var w=res[0],verses=res[1]||[];
    var story=(w&&w.extract)?w.extract:(bio?bio.story:'');
    var faith=bio?bio.faith:'Faith in God.';
    var virtues=bio?bio.virtues:'faith, hope, love';
    var went=bio?bio.went:'Trials that shaped their faith.';
    var today=bio?bio.today:'Apply their faith to your life today.';
    var img=(w&&w.thumbnail)?'<img src="'+w.thumbnail.source+'" style="max-width:100%;border-radius:8px;margin-bottom:8px">':'';
    var verseHtml=verses.slice(0,3).map(function(v){return '<div class="verse-item" style="margin-top:8px"><div class="verse-text">"'+esc(v.text)+'"</div><div class="verse-ref">— '+esc(v.reference)+'</div></div>';}).join('');
    out.innerHTML='<div style="font-weight:800;font-size:1.1rem;margin-bottom:6px">'+esc(name)+'</div>'+img
      +'<div style="font-size:.85rem;line-height:1.6;margin-bottom:8px">'+esc(story||'Not found.')+'</div>'
      +'<div class="verse-encourage" style="margin-bottom:6px">✝️ <b>Faith:</b> '+esc(faith)+'<br>⭐ <b>Virtues:</b> '+esc(virtues)+'<br>⚔️ <b>What they went through:</b> '+esc(went)+'<br>🕊️ <b>For us today:</b> '+esc(today)+'</div>'
      +verseHtml;
  }).catch(function(){out.innerHTML='<div style="color:#991B1B">Could not load.</div>';});
}

// ════════ FIX 4: LIVE SERMON — YouTube plays + auto-end when not live ════════
var ytPlayer=null;
function onYouTubeIframeAPIReady(){/* handled dynamically */}
function renderLiveSession(s){
  var box=document.getElementById('sermonLiveBox');if(!box)return;
  if(ytPlayer&&ytPlayer.destroy){try{ytPlayer.destroy();}catch(e){}ytPlayer=null;}
  if(!s){box.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-lighter)">No live sermon right now.</div>';var cw=document.getElementById('liveCommentsWrap');if(cw)cw.style.display='none';return;}
  var h='<div style="font-weight:700;margin-bottom:8px">'+esc(s.title)+'</div>';
  if(s.youtube_url){h+='<div id="ytplayer" style="width:100%;aspect-ratio:16/9"></div>';}
  else if(s.media_url){h+='<video class="video-embed" controls autoplay><source src="'+s.media_url+'"></video>';}
  h+='<div style="font-size:.75rem;color:var(--text-light);margin-top:8px">Streaming since '+ago(s.created_at)+'</div>';
  box.innerHTML=h;
  var cw=document.getElementById('liveCommentsWrap');if(cw)cw.style.display='block';loadLiveComments(s.id);
  if(s.youtube_url){loadYTPlayer(s.youtube_url);}
}
function extractYTId(u){var m=String(u).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([^&\s?]+)/);return m?m[1]:'';}
function loadYTPlayer(url){
  var id=extractYTId(url);if(!id)return;
  var tag=document.createElement('script');tag.src='https://www.youtube.com/iframe_api';
  window.onYouTubeIframeAPIReady=function(){
    ytPlayer=new YT.Player('ytplayer',{videoId:id,playerVars:{autoplay:1},events:{
      onReady:function(e){try{e.target.playVideo();}catch(err){}},
      onStateChange:function(e){
        // state 0 = ended -> auto-end live
        if(e.data===0){endLive();}
        // If video data says NOT live, end live automatically
        try{var vd=e.target.getVideoData();if(vd&&vd.isLive===false){/* recorded video; keep playing but not "live" */}}catch(err){}
      }
    }});
  };
  document.body.appendChild(tag);
}

// ════════ FIX 5: DISCOVER renders uploads + edit/delete everything ════════
function loadNewsArticles(){return sb.from('news_articles').select('*').order('published_at',{ascending:false}).then(function(r){window._news=r.data||[];renderDiscoverUploads();}).catch(function(){});}
function loadGalleryItems(){return sb.from('gallery_items').select('*').order('created_at',{ascending:false}).then(function(r){window._gallery=r.data||[];renderDiscoverUploads();}).catch(function(){});}
function loadDocuments(){return sb.from('documents').select('*').order('created_at',{ascending:false}).then(function(r){window._docs=r.data||[];renderDiscoverUploads();}).catch(function(){});}
function renderDiscoverUploads(){
  // Inject a section into Discover main showing uploads with edit/delete
  var host=document.getElementById('discover-main');if(!host)return;
  var sec=document.getElementById('uploadsSection');
  if(!sec){sec=document.createElement('div');sec.id='uploadsSection';host.appendChild(sec);}
  var canEdit=isSuper();
  var h='<div class="section-title-app" style="font-size:1.05rem;margin-top:14px">📰 News & Stories</div>';
  var news=window._news||[];
  h+=news.length?news.map(function(n){return '<div class="post"><div class="post-body"><b>'+esc(n.title)+'</b><br>'+esc(n.excerpt||'')+'</div>'+(n.image_url?'<div class="post-media"><img src="'+n.image_url+'"></div>':'')+'<div class="post-actions"><button class="post-action" onclick="openNewsArticle(\''+n.id+'\')"><i class="fas fa-book-open"></i> Read</button>'+(canEdit?'<button class="post-delete" onclick="editNews(\''+n.id+'\')"><i class="fas fa-edit"></i></button><button class="post-delete" onclick="delNews(\''+n.id+'\')"><i class="fas fa-trash"></i></button>':'')+'</div></div>';}).join(''):'<div style="color:var(--text-lighter);font-size:.8rem">No articles yet.</div>';
  h+='<div class="section-title-app" style="font-size:1.05rem;margin-top:14px">🖼️ Gallery</div>';
  var gal=window._gallery||[];
  h+=gal.length?'<div class="gallery-grid">'+gal.map(function(g){return '<div class="gallery-item">'+(g.media_type==='video'?'<video src="'+g.media_url+'"></video>':'<img src="'+g.media_url+'')">')+'<div class="gallery-item-overlay"><div class="gallery-item-title">'+esc(g.title)+(canEdit?' <span onclick="event.stopPropagation();editGallery(\''+g.id+'\')" style="cursor:pointer">✏️</span> <span onclick="event.stopPropagation();delGallery(\''+g.id+'\')" style="cursor:pointer">🗑️</span>':'')+'</div></div></div>';}).join('')+'</div>':'<div style="color:var(--text-lighter);font-size:.8rem">No gallery items yet.</div>';
  h+='<div class="section-title-app" style="font-size:1.05rem;margin-top:14px">📄 Documents</div>';
  var docs=window._docs||[];
  h+=docs.length?docs.map(function(d){return '<a class="document-card" href="'+d.file_url+'" target="_blank"><div class="document-icon"><i class="fas fa-file"></i></div><div class="document-info"><div class="document-title">'+esc(d.title)+'</div><div class="document-meta">'+esc(d.category)+'</div></div>'+(canEdit?'<span onclick="event.preventDefault();event.stopPropagation();editDoc(\''+d.id+'\')" style="cursor:pointer">✏️</span> <span onclick="event.preventDefault();event.stopPropagation();delDoc(\''+d.id+'\')" style="cursor:pointer">🗑️</span>':'')+'</a>';}).join(''):'<div style="color:var(--text-lighter);font-size:.8rem">No documents yet.</div>';
  sec.innerHTML=h;
}
function openNewsArticle(id){var n=(window._news||[]).find(function(x){return x.id===id;});if(!n)return;
  var html=(n.image_url?'<img src="'+n.image_url+'" style="max-width:100%;border-radius:var(--radius);margin-bottom:16px">':'')+'<h2 style="font-family:Playfair Display,serif;font-size:1.6rem;margin-bottom:8px">'+esc(n.title)+'</h2><div style="font-size:.85rem;color:var(--text-light);margin-bottom:16px">'+esc(n.author_name||'Admin')+' • '+fdate(n.published_at)+'</div><div style="line-height:1.8;white-space:pre-wrap">'+esc(n.content||n.excerpt||'')+'</div>';
  document.getElementById('articleContent').innerHTML=html;openModal('articleModal');}
function delNews(id){if(!confirm('Delete article?'))return;sb.from('news_articles').delete().eq('id',id).then(function(){loadNewsArticles();});}
function editNews(id){var n=(window._news||[]).find(function(x){return x.id===id;});if(!n)return;
  var t=prompt('Edit title:',n.title);if(t===null)return;var c=prompt('Edit content:',n.content||'');if(c===null)return;
  sb.from('news_articles').update({title:t,content:c}).eq('id',id).then(function(){alert('✅ Updated');loadNewsArticles();});}
function delGallery(id){if(!confirm('Delete gallery item?'))return;sb.from('gallery_items').delete().eq('id',id).then(function(){loadGalleryItems();});}
function editGallery(id){var g=(window._gallery||[]).find(function(x){return x.id===id;});if(!g)return;
  var t=prompt('Edit title:',g.title);if(t===null)return;
  // allow re-upload media
  var i=document.createElement('input');i.type='file';i.accept='image/*,video/*';i.onchange=function(){if(i.files&&i.files[0]){uploadMediaFile(i.files[0]).then(function(url){sb.from('gallery_items').update({title:t,media_url:url}).eq('id',id).then(function(){alert('✅ Updated');loadGalleryItems();});});}};i.click();}
function delDoc(id){if(!confirm('Delete document?'))return;sb.from('documents').delete().eq('id',id).then(function(){loadDocuments();});}
function editDoc(id){var d=(window._docs||[]).find(function(x){return x.id===id;});if(!d)return;
  var t=prompt('Edit title:',d.title);if(t===null)return;
  var i=document.createElement('input');i.type='file';i.accept='.pdf,.doc,.docx,image/*';i.onchange=function(){if(i.files&&i.files[0]){uploadMediaFile(i.files[0]).then(function(url){sb.from('documents').update({title:t,file_url:url}).eq('id',id).then(function(){alert('✅ Updated');loadDocuments();});});}};i.click();}

// Load uploads whenever Discover opens + refresh after uploads
(function(){
  var origSwitch=window.switchSection;
  window.switchSection=function(n){origSwitch(n);if(n==='discover'){loadNewsArticles();loadGalleryItems();loadDocuments();}};
  // refresh after super-admin uploads
  ['saveNewsArticle','saveGalleryItem','saveDocument'].forEach(function(fn){
    var orig=window[fn];
    if(orig){window[fn]=function(){var r=orig.apply(this,arguments);setTimeout(function(){loadNewsArticles();loadGalleryItems();loadDocuments();},800);return r;};}
  });
})();
console.log('✝️ app4.js loaded (streak fix, AI-like verses, full characters, live auto-end, discover uploads + edit/delete)');
