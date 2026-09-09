/*
 GraceConnect App33
 Bible Content Engine
 - secure user removal + blocklist RPC
 - non-repeating per-user trivia from Supabase
 - admin CRUD for trivia, Bible characters and devotionals
 - Theographic/HelloAO character fallback (no Wikipedia)
 - Christ Himself devotional fallback (CC BY-NC-SA 4.0 + attribution)
 - preserves existing landing/app fonts and UI
*/

(function(){
'use strict';

var TRIVIA_TABLE='bible_trivia_questions',
    HISTORY_TABLE='trivia_question_history';

var CHAR_TABLE='bible_characters',
    DEVO_TABLE='devotionals';

var THEO_PEOPLE='https://bible.helloao.org/api/d/theographic/people.json';
var THEO_PERSON='https://bible.helloao.org/api/d/theographic/people/';
var DEVO_API='https://www.christhimself.com/api/v1/devotionals/';

var esc=window.esc||function(v){
  return String(v==null?'':v)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
};

function db(){
  try{
    if(typeof window.sb==='function')return window.sb();
    if(window.sb&&window.sb.from)return window.sb;
    if(window.supabaseClient&&window.supabaseClient.from)return window.supabaseClient;
    return null;
  }catch(e){
    return null;
  }
}

function toast(m,t){
  if(window.showToast)return window.showToast(m,t||'info');
  if(window.toast)return window.toast(m,t||'info');
  alert(m);
}

async function admin(){
  if(window.gc32IsAdmin)return !!(await window.gc32IsAdmin());

  var c=db();

  if(!c||!c.auth)return false;

  try{
    var u=(await c.auth.getUser()).data.user;
    if(!u)return false;

    var p=(await c
      .from('profiles')
      .select('role')
      .eq('id',u.id)
      .maybeSingle()).data;

    return [
      'admin',
      'super_admin',
      'superadmin'
    ].indexOf(
      String((p&&p.role)||'').toLowerCase()
    )>-1;

  }catch(e){
    return false;
  }
}

async function uid(){
  var c=db();

  try{
    var r=await c.auth.getUser();
    return r&&r.data&&r.data.user?r.data.user.id:null;
  }catch(e){
    return null;
  }
}

function modal(id,html){
  var old=document.getElementById(id);
  if(old)old.remove();

  var b=document.createElement('div');
  b.id=id;
  b.className='gc33-backdrop';

  b.innerHTML='<div class="gc33-modal">'+html+'</div>';

  document.body.appendChild(b);

  return b;
}

function close(id){
  var x=document.getElementById(id);
  if(x)x.remove();
}

function style(){

  if(document.getElementById('gc33-style'))return;

  var s=document.createElement('style');
  s.id='gc33-style';

  s.textContent=`
  .gc33-backdrop{
    position:fixed;
    inset:0;
    z-index:1000000;
    background:rgba(15,23,42,.72);
    backdrop-filter:blur(9px);
    display:flex;
    align-items:center;
    justify-content:center;
    padding:14px
  }

  .gc33-modal{
    background:#fff;
    width:min(1050px,100%);
    max-height:94vh;
    overflow:auto;
    border-radius:24px;
    box-shadow:0 30px 90px rgba(0,0,0,.3);
    font-family:inherit
  }

  .gc33-head{
    display:flex;
    justify-content:space-between;
    gap:12px;
    padding:20px 22px;
    border-bottom:1px solid #e5e7eb
  }

  .gc33-head h2{
    margin:0;
    font-size:22px
  }

  .gc33-body{
    padding:20px
  }

  .gc33-tabs{
    display:flex;
    gap:8px;
    overflow:auto;
    margin-bottom:18px
  }

  .gc33-tab{
    border:0;
    background:#eef2ff;
    color:#3730a3;
    padding:10px 14px;
    border-radius:10px;
    font-weight:800;
    cursor:pointer;
    white-space:nowrap
  }

  .gc33-tab.active{
    background:#4f46e5;
    color:#fff
  }

  .gc33-grid{
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:12px
  }

  .gc33-field{
    display:flex;
    flex-direction:column;
    gap:6px
  }

  .gc33-field.full{
    grid-column:1/-1
  }

  .gc33-field label{
    font-size:12px;
    font-weight:800;
    color:#475569
  }

  .gc33-field input,
  .gc33-field textarea,
  .gc33-field select{
    width:100%;
    border:1px solid #dbe2ea;
    border-radius:11px;
    padding:11px 12px;
    font:inherit;
    background:#fff;
    color:#172033;
    box-sizing:border-box
  }

  .gc33-field textarea{
    min-height:110px;
    resize:vertical
  }

  .gc33-actions{
    display:flex;
    gap:9px;
    flex-wrap:wrap;
    margin-top:16px
  }

  .gc33-btn{
    border:0;
    border-radius:11px;
    padding:11px 15px;
    font-weight:800;
    cursor:pointer
  }

  .gc33-btn:disabled{
    opacity:.6;
    cursor:not-allowed
  }

  .gc33-primary{
    background:#4f46e5;
    color:#fff
  }

  .gc33-muted{
    background:#eef2f7;
    color:#334155
  }

  .gc33-danger{
    background:#dc2626;
    color:#fff
  }

  .gc33-list{
    display:grid;
    gap:10px
  }

  .gc33-row{
    border:1px solid #e5e7eb;
    border-radius:14px;
    padding:13px;
    display:flex;
    justify-content:space-between;
    gap:12px;
    align-items:center
  }

  .gc33-row small{
    display:block;
    color:#64748b;
    margin-top:4px
  }

  .gc33-badge{
    display:inline-block;
    padding:4px 8px;
    border-radius:999px;
    background:#eef2ff;
    color:#4f46e5;
    font-size:10px;
    font-weight:800
  }

  .gc33-source{
    font-size:11px;
    color:#64748b;
    margin-top:12px;
    line-height:1.5
  }

  .gc33-quiz{
    padding:22px;
    border-radius:20px;
    background:linear-gradient(135deg,#4f46e5,#7c3aed);
    color:#fff;
    margin-top:12px
  }

  .gc33-quiz .gc33-q{
    font-size:20px;
    font-weight:800;
    line-height:1.45;
    margin:14px 0
  }

  .gc33-opts{
    display:grid;
    gap:9px
  }

  .gc33-opt{
    border:1px solid rgba(255,255,255,.35);
    background:rgba(255,255,255,.12);
    color:#fff;
    border-radius:12px;
    padding:13px;
    text-align:left;
    cursor:pointer;
    font:inherit
  }

  .gc33-opt:hover{
    background:rgba(255,255,255,.2)
  }

  .gc33-opt.correct{
    background:#059669
  }

  .gc33-opt.wrong{
    background:#dc2626
  }

  .gc33-next{
    margin-top:14px;
    background:#fff;
    color:#3730a3
  }

  .gc33-public-character{
    margin-top:12px
  }

  .gc33-cite{
    font-size:11px;
    color:#64748b
  }

  .gc33-close{
    border:0;
    background:#eef2f7;
    border-radius:10px;
    width:38px;
    height:38px;
    cursor:pointer
  }

  .gc33-help{
    padding:12px 14px;
    border-radius:12px;
    background:#f8fafc;
    color:#475569;
    font-size:12px;
    line-height:1.6;
    margin-bottom:15px
  }

  .gc33-error{
    padding:12px;
    border-radius:10px;
    background:#fef2f2;
    color:#991b1b;
    border:1px solid #fecaca;
    font-size:12px;
    line-height:1.5;
    margin-top:10px
  }

  .gc33-success{
    padding:12px;
    border-radius:10px;
    background:#ecfdf5;
    color:#065f46;
    border:1px solid #a7f3d0;
    font-size:12px;
    line-height:1.5;
    margin-top:10px
  }

  @media(max-width:700px){
    .gc33-grid{
      grid-template-columns:1fr
    }

    .gc33-field.full{
      grid-column:auto
    }

    .gc33-modal{
      border-radius:18px
    }

    .gc33-body{
      padding:15px
    }
  }
  `;

  document.head.appendChild(s)
}


/* =========================================================
   SECURE USER REMOVAL
   ========================================================= */

function isValidUUID(value){
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value||'').trim()
  );
}

function formatSupabaseError(e){

  if(!e)return 'Unknown database error.';

  var parts=[];

  if(e.message)parts.push(e.message);
  if(e.code)parts.push('Code: '+e.code);
  if(e.details)parts.push('Details: '+e.details);
  if(e.hint)parts.push('Hint: '+e.hint);

  if(parts.length)return parts.join(' | ');

  try{
    return JSON.stringify(e);
  }catch(x){
    return String(e);
  }
}

window.deleteUser=async function(userId,email){

  if(!(await admin())){
    toast('Admin access required','error');
    return;
  }

  userId=String(userId||'').trim();

  if(!userId){
    toast('User ID missing. The account cannot be removed without a valid user ID.','error');
    return;
  }

  if(!isValidUUID(userId)){
    toast('Invalid user ID. Expected a valid UUID.','error');
    return;
  }

  var c=db();

  if(!c){
    toast('Supabase client unavailable. Please refresh the application and try again.','error');
    return;
  }

  /* Prevent an administrator from accidentally deleting themselves. */
  try{
    if(c.auth&&c.auth.getUser){

      var currentResult=await c.auth.getUser();
      var currentUser=currentResult&&currentResult.data
        ?currentResult.data.user
        :null;

      if(currentUser&&String(currentUser.id)===userId){
        toast('You cannot delete the currently signed-in administrator account from this screen.','error');
        return;
      }
    }
  }catch(selfCheckError){
    console.warn('Unable to perform self-deletion safety check:',selfCheckError);
  }

  var displayEmail=String(email||'').trim();

  var confirmationMessage=
    'Remove this account and block its email from registering again?';

  if(displayEmail){
    confirmationMessage+=
      '\n\nAccount: '+displayEmail;
  }

  if(!confirm(confirmationMessage))return;

  var deletionButton=null;

  try{

    /*
      Locate the clicked delete button when possible.
      This prevents accidental double-click deletion.
    */
    var buttons=document.querySelectorAll(
      '[data-user-id="'+CSS.escape(userId)+'"]'
    );

    if(buttons&&buttons.length){
      deletionButton=buttons[0];
      deletionButton.disabled=true;
      deletionButton.dataset.gc33Deleting='true';
    }

  }catch(buttonError){
    console.warn('Unable to lock deletion button:',buttonError);
  }

  try{

    /*
      IMPORTANT:
      Actual deletion remains server-side through the SECURITY DEFINER
      Supabase RPC. The browser never receives service-role credentials.
    */
    var r=await c.rpc(
      'admin_remove_user',
      {
        target_user_id:userId
      }
    );

    if(r&&r.error){
      throw r.error;
    }

    /*
      Some Supabase RPC configurations can return null data even when
      the operation succeeds. Treat the absence of an RPC error as success.
    */
    toast(
      'User removed and email added to the blocklist.',
      'success'
    );

    /*
      Refresh the existing moderation UI without breaking the current
      navigation architecture.
    */
    if(window.gc32OpenModeration){

      try{
        await window.gc32OpenModeration();
      }catch(refreshError){
        console.warn(
          'User was deleted, but moderation panel refresh failed:',
          refreshError
        );
      }

    }

  }catch(e){

    console.error(
      'GraceConnect user deletion failed:',
      e
    );

    var message=formatSupabaseError(e);

    /*
      Give actionable diagnostics instead of the previous generic
      "Database function unavailable" message.
    */
    var lower=String(message).toLowerCase();

    if(
      lower.indexOf('function')>-1 &&
      (
        lower.indexOf('does not exist')>-1 ||
        lower.indexOf('not found')>-1
      )
    ){

      toast(
        'User deletion failed: Supabase RPC "admin_remove_user" was not found. Create/deploy the SQL function first. '+message,
        'error'
      );

    }else if(
      lower.indexOf('permission')>-1 ||
      lower.indexOf('not authorized')>-1 ||
      lower.indexOf('rls')>-1 ||
      lower.indexOf('forbidden')>-1
    ){

      toast(
        'User deletion failed because Supabase denied the operation. Check the RPC SECURITY DEFINER/permissions and admin authorization. '+message,
        'error'
      );

    }else if(
      lower.indexOf('foreign key')>-1 ||
      lower.indexOf('violates')>-1 ||
      lower.indexOf('constraint')>-1
    ){

      toast(
        'User deletion failed because related database records are preventing deletion. Check the foreign-key relationships for this user. '+message,
        'error'
      );

    }else{

      toast(
        'User deletion failed: '+message,
        'error'
      );
    }

  }finally{

    if(deletionButton){
      deletionButton.disabled=false;
      delete deletionButton.dataset.gc33Deleting;
    }

  }
};


/* =========================================================
   TRIVIA
   ========================================================= */

var triviaState={
  q:null,
  answered:false,
  seen:new Set()
};


/* ---------- trivia validation ---------- */

function normalizeDifficulty(value){

  var d=String(value==null?'NORMAL':value)
    .trim()
    .toUpperCase();

  if(d==='EASY')return 'EASY';
  if(d==='HARD')return 'HARD';

  return 'NORMAL';
}

function cleanTriviaOptions(value){

  var options=[];

  if(Array.isArray(value)){
    options=value;
  }else if(value&&typeof value==='object'){
    options=Object.values(value);
  }

  return options
    .map(function(x){
      return String(x==null?'':x).trim();
    })
    .filter(Boolean);
}

function getCorrectIndex(raw,options){

  /*
    Preferred format:
      correct_index: 0

    Compatibility:
      correct: 0
      correct: "Answer text"
      correct_answer: "Answer text"
    */

  var candidate;

  if(
    raw.correct_index!==undefined &&
    raw.correct_index!==null &&
    String(raw.correct_index).trim()!==''
  ){
    candidate=raw.correct_index;
  }else if(
    raw.correct!==undefined &&
    raw.correct!==null &&
    String(raw.correct).trim()!==''
  ){
    candidate=raw.correct;
  }else if(
    raw.correct_answer!==undefined &&
    raw.correct_answer!==null &&
    String(raw.correct_answer).trim()!==''
  ){
    candidate=raw.correct_answer;
  }else{
    return {
      index:null,
      error:'Missing correct_index/correct/correct_answer.'
    };
  }

  /*
    Numeric correct answer.
  */
  if(
    typeof candidate==='number' ||
    (
      typeof candidate==='string' &&
      /^-?\d+$/.test(candidate.trim())
    )
  ){

    var n=Number(candidate);

    if(
      !Number.isInteger(n) ||
      n<0 ||
      n>=options.length
    ){
      return {
        index:null,
        error:
          'correct_index must be an integer between 0 and '+
          (options.length-1)+'.'
      };
    }

    return {
      index:n,
      error:null
    };
  }

  /*
    Textual correct answer.
  */
  var answer=String(candidate).trim().toLowerCase();

  var found=-1;

  for(var i=0;i<options.length;i++){

    if(
      String(options[i]).trim().toLowerCase()===answer
    ){
      found=i;
      break;
    }

  }

  if(found===-1){

    return {
      index:null,
      error:
        'The correct answer "'+
        String(candidate)+
        '" does not exactly match any option.'
    };
  }

  return {
    index:found,
    error:null
  };
}

function normalizeSourceURL(value){

  var url=String(value==null?'').trim();

  if(!url)return '';

  try{

    var parsed=new URL(url);

    if(
      parsed.protocol!=='http:' &&
      parsed.protocol!=='https:'
    ){
      return null;
    }

    return parsed.toString();

  }catch(e){
    return null;
  }
}

function validateTriviaObject(raw,index){

  if(!raw||typeof raw!=='object'||Array.isArray(raw)){

    return {
      valid:false,
      error:
        'Question '+(index+1)+' must be a JSON object.'
    };
  }

  var question=String(raw.question||'').trim();

  if(!question){

    return {
      valid:false,
      error:
        'Question '+(index+1)+' is missing "question".'
    };
  }

  if(question.length<5){

    return {
      valid:false,
      error:
        'Question '+(index+1)+' is too short.'
    };
  }

  var options=cleanTriviaOptions(raw.options);

  /*
    Support the legacy option_a/b/c/d format without removing it.
  */
  if(options.length===0){

    options=[
      raw.option_a,
      raw.option_b,
      raw.option_c,
      raw.option_d
    ]
    .map(function(x){
      return String(x==null?'':x).trim();
    })
    .filter(Boolean);
  }

  if(options.length<2){

    return {
      valid:false,
      error:
        'Question '+(index+1)+
        ' must contain at least 2 options.'
    };
  }

  if(options.length>6){

    return {
      valid:false,
      error:
        'Question '+(index+1)+
        ' contains '+options.length+
        ' options. Maximum allowed is 6.'
    };
  }

  /*
    Duplicate option protection.
  */
  var optionKeys=options.map(function(x){
    return x.toLowerCase();
  });

  if(new Set(optionKeys).size!==optionKeys.length){

    return {
      valid:false,
      error:
        'Question '+(index+1)+
        ' contains duplicate answer options.'
    };
  }

  var correct=getCorrectIndex(raw,options);

  if(correct.error){

    return {
      valid:false,
      error:
        'Question '+(index+1)+': '+correct.error
    };
  }

  var difficulty=normalizeDifficulty(raw.difficulty);

  /*
    Explicitly reject invalid difficulty values rather than silently
    accepting arbitrary database values.
  */
  if(
    raw.difficulty!==undefined &&
    raw.difficulty!==null &&
    String(raw.difficulty).trim()!==''
  ){

    var suppliedDifficulty=String(raw.difficulty)
      .trim()
      .toUpperCase();

    if(
      ['EASY','NORMAL','HARD'].indexOf(suppliedDifficulty)===-1
    ){

      return {
        valid:false,
        error:
          'Question '+(index+1)+
          ' has invalid difficulty "'+
          String(raw.difficulty)+
          '". Use EASY, NORMAL or HARD.'
      };
    }
  }

  var sourceURL=normalizeSourceURL(raw.source_url);

  if(sourceURL===null){

    return {
      valid:false,
      error:
        'Question '+(index+1)+
        ' has an invalid source_url. Use HTTP or HTTPS.'
    };
  }

  var category=String(
    raw.category==null?'Scripture':raw.category
  ).trim()||'Scripture';

  var reference=String(
    raw.reference==null?'':raw.reference
  ).trim();

  var explanation=String(
    raw.explanation==null?'':raw.explanation
  ).trim();

  var sourceName=String(
    raw.source_name==null?'':raw.source_name
  ).trim();

  return {
    valid:true,
    row:{
      question:question,
      options:options,
      correct_index:correct.index,
      reference:reference,
      explanation:explanation,
      category:category,
      difficulty:difficulty,
      source_name:sourceName,
      source_url:sourceURL||'',
      approved:true
    }
  };
}


/* ---------- random trivia ---------- */

async function randomTrivia(){

  var c=db();

  if(!c){
    toast('Supabase unavailable','error');
    return null;
  }

  var u=null;

  try{
    u=(await c.auth.getUser()).data.user;
  }catch(e){}

  if(!u){
    toast(
      'Please sign in to use non-repeating trivia.',
      'error'
    );
    return null;
  }

  var r=await c.rpc(
    'get_random_trivia_question',
    {
      p_user_id:u.id
    }
  );

  if(r.error){

    console.warn(
      'get_random_trivia_question RPC failed. Using client fallback:',
      r.error
    );

    var q=await c
      .from(TRIVIA_TABLE)
      .select('*')
      .eq('approved',true)
      .limit(100);

    if(q.error)throw q.error;

    var pool=(q.data||[])
      .filter(function(x){
        return !triviaState.seen.has(x.id);
      });

    if(!pool.length){

      toast(
        'You have completed all currently available trivia questions. Add more questions from Admin Content.',
        'info'
      );

      return null;
    }

    r={
      data:pool[
        Math.floor(
          Math.random()*pool.length
        )
      ]
    };
  }

  if(!r.data){

    toast(
      'No unseen trivia questions are available yet.',
      'info'
    );

    return null;
  }

  triviaState.q=r.data;
  triviaState.answered=false;

  return r.data;
}


/* ---------- mark question seen ---------- */

async function markSeen(id){

  var c=db();

  if(!c||!id)return;

  try{

    var u=(await c.auth.getUser()).data.user;

    if(!u)return;

    var r=await c.rpc(
      'mark_trivia_question_seen',
      {
        p_user_id:u.id,
        p_question_id:id
      }
    );

    if(r&&r.error){
      console.warn(
        'Unable to permanently record trivia history:',
        r.error
      );
    }else{
      triviaState.seen.add(id);
    }

  }catch(e){
    console.warn(
      'Unable to mark trivia question as seen:',
      e
    );
  }
}


/* ---------- options normalization ---------- */

function normalizeOptions(q){

  if(Array.isArray(q.options)){
    return q.options;
  }

  if(q.options&&typeof q.options==='object'){
    return Object.values(q.options);
  }

  return [
    q.option_a,
    q.option_b,
    q.option_c,
    q.option_d
  ].filter(Boolean);
}


/* ---------- trivia renderer ---------- */

async function renderTrivia(){

  var host=document.getElementById('home-trivia');

  if(!host)return;

  var back=host.querySelector('.back-btn');

  host.innerHTML='';

  if(back)host.appendChild(back);

  var box=document.createElement('div');

  box.id='gc33-trivia-root';

  host.appendChild(box);

  box.innerHTML=
    '<div class="section-title-app">🧠 Bible Trivia</div>'+
    '<div class="gc33-help">'+
    'Every question is selected randomly from the approved library '+
    'and permanently recorded for your account so the same question '+
    'is not served twice.'+
    '</div>'+
    '<div class="gc33-quiz">'+
    'Loading a fresh Scripture question…'+
    '</div>';

  var q=await randomTrivia();

  if(!q){

    var empty=box.querySelector('.gc33-quiz');

    if(empty){
      empty.innerHTML='No unseen question is available.';
    }

    return;
  }

  drawQuestion(box,q);
}


/* ---------- draw trivia question ---------- */

function drawQuestion(box,q){

  var opts=normalizeOptions(q);

  var correct=Number(
    q.correct_index!=null
      ?q.correct_index
      :q.correct
  );

  if(
    correct>=opts.length &&
    typeof q.correct==='string'
  ){
    correct=opts.indexOf(q.correct);
  }

  /*
    Defensive validation for questions already stored in Supabase.
  */
  if(
    !Number.isInteger(correct) ||
    correct<0 ||
    correct>=opts.length
  ){

    box.querySelector('.gc33-quiz').innerHTML=
      '<div class="gc33-error">'+
      'This trivia question contains an invalid correct-answer configuration. '+
      'Please ask an administrator to edit the question.'+
      '</div>';

    return;
  }

  box.querySelector('.gc33-quiz').innerHTML=

    '<div style="font-size:11px;font-weight:800;opacity:.8">'+
    esc(q.category||'SCRIPTURE')+
    ' · '+
    esc(q.difficulty||'NORMAL')+
    '</div>'+

    '<div class="gc33-q">'+
    esc(q.question)+
    '</div>'+

    '<div class="gc33-opts">'+

    opts.map(function(o,i){

      return '<button class="gc33-opt" data-i="'+i+'">'+
        esc(o)+
        '</button>';

    }).join("")+

    '</div>'+

    '<div id="gc33-feedback"></div>'+

    (
      q.reference
      ?
      '<div style="margin-top:12px;font-size:11px;opacity:.8">'+
      'Reference: '+
      esc(q.reference)+
      '</div>'
      :''
    );

  Array.from(
    box.querySelectorAll('.gc33-opt')
  ).forEach(function(b){

    b.onclick=async function(){

      if(triviaState.answered)return;

      triviaState.answered=true;

      var i=Number(b.dataset.i);

      Array.from(
        box.querySelectorAll('.gc33-opt')
      ).forEach(function(x,j){

        x.disabled=true;

        if(j===correct){
          x.classList.add('correct');
        }

      });

      if(i!==correct){
        b.classList.add('wrong');
      }

      var f=box.querySelector('#gc33-feedback');

      f.innerHTML=
        '<div style="margin-top:13px;line-height:1.6">'+
        (
          i===correct
          ?'✓ Correct!'
          :'✗ Not quite.'
        )+
        (
          q.explanation
          ?'<br>'+esc(q.explanation)
          :''
        )+
        '</div>'+
        '<button class="gc33-btn gc33-next" id="gc33-next">'+
        'Next Question'+
        '</button>';

      await markSeen(q.id);

      var next=document.getElementById('gc33-next');

      if(next){
        next.onclick=renderTrivia;
      }

    };

  });
}


/* =========================================================
   CHARACTERS: THEOGRAPHIC + EXISTING DICTIONARY
   NO WIKIPEDIA
   ========================================================= */

function existingBio(name){

  var b=window.CHAR_BIOS&&window.CHAR_BIOS[name];

  if(b)return b;

  var k=Object.keys(
    window.CHAR_BIOS||{}
  ).find(function(x){

    return x
      .toLowerCase()
      .replace(/[^a-z]/g,'')===
      name
      .toLowerCase()
      .replace(/[^a-z]/g,'');

  });

  return k?window.CHAR_BIOS[k]:null;
}

async function characterFromAPI(q){

  var list=await fetch(
    THEO_PEOPLE
  ).then(function(r){

    if(!r.ok)throw Error('people list');

    return r.json();

  });

  var arr=list.people||[];

  var term=q.toLowerCase();

  var hit=
    arr.find(function(p){
      return String(p.name||'').toLowerCase()===term;
    })||
    arr.find(function(p){
      return String(p.name||'')
        .toLowerCase()
        .indexOf(term)>-1;
    });

  if(!hit)throw Error('Character not found');

  return fetch(
    'https://bible.helloao.org'+
    hit.thisPersonApiLink
  )
  .then(function(r){
    return r.json();
  })
  .then(function(x){
    return x.person||x;
  });
}

function refText(refs){

  return (refs||[])
    .slice(0,20)
    .map(function(r){

      return r.book+
        ' '+
        r.chapter+
        ':'+
        r.verse+
        (
          r.endVerse
          ?'-'+r.endVerse
          :''
        );

    })
    .join(', ');
}

async function loadCharacter33(){

  var input=
    (document.getElementById('charSearch')||{}).value||'';

  input=input.trim();

  if(!input)return;

  var out=document.getElementById('charOut');

  if(!out)return;

  out.innerHTML=
    '<div style="color:#94A3B8">'+
    'Searching Scripture-based character data…'+
    '</div>';

  try{

    var c=db(),
        custom=null;

    if(c){

      var rr=await c
        .from(CHAR_TABLE)
        .select('*')
        .ilike('name','%'+input+'%')
        .eq('active',true)
        .limit(1);

      if(
        !rr.error&&
        rr.data&&
        rr.data[0]
      ){
        custom=rr.data[0];
      }
    }

    var p=null;

    try{
      p=await characterFromAPI(input);
    }catch(e){}

    var old=existingBio(input);

    if(!p&&!custom&&!old){

      out.innerHTML=
        '<div>'+
        'Character not found in the current biblical-person datasets.'+
        '</div>';

      return;
    }

    var name=
      (custom&&custom.name)||
      (p&&p.name)||
      input;

    var story=
      (custom&&custom.life_story)||
      (old&&old.story)||
      (
        p&&
        Array.isArray(p.description)
        ?p.description.join(' ')
        :(p&&p.description)||''
      );

    var faith=
      (custom&&custom.faith)||
      (old&&old.faith)||
      'Study the person’s recorded response to God in the cited passages; distinguish explicit Scripture from later tradition.';

    var virtues=
      (custom&&custom.virtues)||
      (old&&old.virtues)||
      'Faithfulness, obedience, courage and perseverance where supported by Scripture.';

    var trials=
      (custom&&custom.trials)||
      (old&&old.went)||
      '';

    var lessons=
      (custom&&custom.lessons)||
      (old&&old.today)||
      'Read the cited passages in context and apply only what Scripture actually teaches.';

    var refs=
      (custom&&custom.scripture_refs)||
      refText(p&&p.references);

    out.innerHTML=

      '<div class="gc33-public-character">'+

      '<div style="font-size:22px;font-weight:850;margin-bottom:8px">'+
      esc(name)+
      '</div>'+

      '<div class="card" style="padding:14px;margin-bottom:10px">'+
      '<b>Life Story</b>'+
      '<p style="line-height:1.7;margin-top:7px">'+
      esc(story||'No expanded biography has been authored yet.')+
      '</p>'+
      '</div>'+

      '<div class="card" style="padding:14px;margin-bottom:10px">'+
      '<b>Faith & Trust in God</b>'+
      '<p style="line-height:1.7;margin-top:7px">'+
      esc(faith)+
      '</p>'+
      '</div>'+

      '<div class="card" style="padding:14px;margin-bottom:10px">'+
      '<b>Faith & Virtues — Deeper Study</b>'+
      '<p style="line-height:1.7;margin-top:7px">'+
      esc(virtues)+
      '</p>'+
      '</div>'+

      (
        trials
        ?
        '<div class="card" style="padding:14px;margin-bottom:10px">'+
        '<b>Trials & Turning Points</b>'+
        '<p style="line-height:1.7;margin-top:7px">'+
        esc(trials)+
        '</p>'+
        '</div>'
        :''
      )+

      '<div class="card" style="padding:14px;margin-bottom:10px">'+
      '<b>What We Can Learn</b>'+
      '<p style="line-height:1.7;margin-top:7px">'+
      esc(lessons)+
      '</p>'+
      '</div>'+

      '<div class="card" style="padding:14px">'+
      '<b>Scripture References</b>'+
      '<p style="line-height:1.7;margin-top:7px">'+
      esc(refs||'See the cited Scripture dataset.')+
      '</p>'+
      '</div>'+

      '<div class="gc33-cite" style="margin-top:10px">'+
      'Primary character metadata: Theographic Bible Metadata via Free Use Bible API. '+
      'Custom church entries override the dataset.'+
      '</div>'+

      '</div>';

  }catch(e){

    console.error(e);

    out.innerHTML=
      '<div>'+
      'Unable to load character data right now.'+
      '</div>';
  }
}

window.loadCharacter=loadCharacter33;


/* =========================================================
   DEVOTIONAL
   ========================================================= */

function todayKey(){

  var d=new Date();

  return String(
    d.getMonth()+1
  ).padStart(2,'0')+
  '-'+
  String(
    d.getDate()
  ).padStart(2,'0');
}

async function getDevotional(){

  var c=db(),
      custom=null;

  if(c){

    try{

      var r=await c
        .from(DEVO_TABLE)
        .select('*')
        .eq('active',true)
        .eq(
          'date',
          new Date().toISOString().slice(0,10)
        )
        .order(
          'updated_at',
          {ascending:false}
        )
        .limit(1);

      if(
        !r.error&&
        r.data&&
        r.data[0]
      ){
        custom=r.data[0];
      }

    }catch(e){}
  }

  if(custom){

    return {
      d:custom,
      source:'GraceConnect custom'
    };
  }

  var j=await fetch(
    DEVO_API+
    todayKey()+
    '.json'
  )
  .then(function(r){

    if(!r.ok)throw Error('devotional api');

    return r.json();

  });

  var am=
    (j.periods||[])
      .find(function(x){
        return x.period==='am';
      })||
    j.periods&&j.periods[0];

  var x=
    am&&
    am.languages&&
    am.languages.en;

  return {
    d:{
      title:
        x&&x.theme||
        'Today’s Devotional',

      body:
        x&&x.summary||
        '',

      verse:
        (x&&x.verses||[])
          .map(function(v){
            return v.reference||v.text||'';
          })
          .join(' · '),

      questions:
        (x&&x.questions)||[]
    },

    source:
      'Christ Himself — A Daily Devotional'
  };
}

async function renderDevotional33(){

  if(devoRendering)return;

  var card=document.getElementById(
    'devotionalCard'
  );

  if(!card)return;

  devoRendering=true;

  try{

    var r=await getDevotional(),
        d=r.d;

    var t=document.getElementById('devTitle'),
        b=document.getElementById('devBody'),
        v=document.getElementById('devVerse');

    if(t)t.textContent=
      d.title||
      'Daily Devotional';

    if(b)b.textContent=
      d.body||
      '';

    if(v)v.textContent=
      d.verse
      ?'📖 '+d.verse
      :'';

    var extra=
      document.getElementById(
        'gc33-devo-extra'
      );

    if(!extra){

      extra=document.createElement('div');

      extra.id='gc33-devo-extra';

      card.appendChild(extra);
    }

    extra.innerHTML=

      (
        d.prayer
        ?
        '<div style="margin-top:12px">'+
        '<b>Prayer</b>'+
        '<div style="margin-top:5px;line-height:1.6">'+
        esc(d.prayer)+
        '</div>'+
        '</div>'
        :''
      )+

      (
        d.questions&&
        d.questions.length
        ?
        '<div style="margin-top:12px">'+
        '<b>Reflect</b>'+
        '<ol style="margin:7px 0 0 18px;line-height:1.7">'+
        d.questions
          .map(function(q){
            return '<li>'+esc(q)+'</li>';
          })
          .join("")+
        '</ol>'+
        '</div>'
        :''
      )+

      '<div class="gc33-cite" style="margin-top:12px">'+
      'Source: '+
      esc(r.source)+
      '. Third-party devotional text is displayed under its published API terms; '+
      'custom GraceConnect content takes precedence.'+
      '</div>';

  }catch(e){

    console.warn(e);

  }finally{

    devoRendering=false;
  }
}


/* =========================================================
   ADMIN CONTENT MANAGER
   ========================================================= */

var managerState={
  tab:'trivia'
};

var devoRendering=false;
var lastTriviaVisible=false;


/* ---------- manager ---------- */

function openManager(){

  return admin().then(function(ok){

    if(!ok){

      toast(
        'Admin access required',
        'error'
      );

      return;
    }

    style();

    var b=modal(
      'gc33-manager',

      '<div class="gc33-head">'+

      '<h2>✝ Bible Content Manager</h2>'+

      '<button class="gc33-close" onclick="gc33CloseManager()">×</button>'+

      '</div>'+

      '<div class="gc33-body">'+

      '<div class="gc33-tabs">'+

      '<button class="gc33-tab active" data-tab="trivia">'+
      'Trivia'+
      '</button>'+

      '<button class="gc33-tab" data-tab="characters">'+
      'Bible Characters'+
      '</button>'+

      '<button class="gc33-tab" data-tab="devotionals">'+
      'Devotionals'+
      '</button>'+

      '</div>'+

      '<div id="gc33-manager-content"></div>'+

      '</div>'
    );

    Array.from(
      b.querySelectorAll('.gc33-tab')
    ).forEach(function(x){

      x.onclick=function(){

        Array.from(
          b.querySelectorAll('.gc33-tab')
        ).forEach(function(y){
          y.classList.remove('active');
        });

        x.classList.add('active');

        managerState.tab=x.dataset.tab;

        renderManager();
      };

    });

    renderManager();

  });
}

window.gc33CloseManager=function(){
  close('gc33-manager');
};

async function renderManager(){

  var h=document.getElementById(
    'gc33-manager-content'
  );

  if(!h)return;

  if(managerState.tab==='trivia'){
    return renderTriviaAdmin(h);
  }

  if(managerState.tab==='characters'){
    return renderCharAdmin(h);
  }

  return renderDevoAdmin(h);
}


/* =========================================================
   EDITOR FIELDS
   ========================================================= */

function editorFields(type,item){

  item=item||{};

  if(type==='trivia'){

    return '<div class="gc33-grid">'+

      '<div class="gc33-field full">'+
      '<label>Question</label>'+
      '<textarea id="e-question">'+
      esc(item.question||'')+
      '</textarea>'+
      '</div>'+

      '<div class="gc33-field full">'+
      '<label>Options — one per line</label>'+
      '<textarea id="e-options">'+
      esc(
        (
          Array.isArray(item.options)
          ?item.options
          :[]
        ).join('\n')
      )+
      '</textarea>'+
      '</div>'+

      '<div class="gc33-field">'+
      '<label>Correct option index (0-5)</label>'+
      '<input id="e-correct" type="number" min="0" max="5" value="'+
      esc(
        item.correct_index==null
        ?0
        :item.correct_index
      )+
      '">'+
      '</div>'+

      '<div class="gc33-field">'+
      '<label>Category</label>'+
      '<input id="e-category" value="'+
      esc(item.category||'Scripture')+
      '">'+
      '</div>'+

      '<div class="gc33-field">'+
      '<label>Difficulty</label>'+
      '<select id="e-difficulty">'+

      '<option '+
      (
        item.difficulty==='EASY'
        ?'selected'
        :''
      )+
      '>EASY</option>'+

      '<option '+
      (
        item.difficulty==='NORMAL'||
        !item.difficulty
        ?'selected'
        :''
      )+
      '>NORMAL</option>'+

      '<option '+
      (
        item.difficulty==='HARD'
        ?'selected'
        :''
      )+
      '>HARD</option>'+

      '</select>'+
      '</div>'+

      '<div class="gc33-field">'+
      '<label>Bible reference</label>'+
      '<input id="e-reference" value="'+
      esc(item.reference||'')+
      '">'+
      '</div>'+

      '<div class="gc33-field full">'+
      '<label>Explanation</label>'+
      '<textarea id="e-explanation">'+
      esc(item.explanation||'')+
      '</textarea>'+
      '</div>'+

      '<div class="gc33-field">'+
      '<label>Source name</label>'+
      '<input id="e-source" value="'+
      esc(item.source_name||'')+
      '">'+
      '</div>'+

      '<div class="gc33-field">'+
      '<label>Source URL</label>'+
      '<input id="e-sourceurl" value="'+
      esc(item.source_url||'')+
      '">'+
      '</div>'+

      '</div>';
  }

  if(type==='characters'){

    return '<div class="gc33-grid">'+

      '<div class="gc33-field">'+
      '<label>Name</label>'+
      '<input id="e-name" value="'+
      esc(item.name||'')+
      '">'+
      '</div>'+

      '<div class="gc33-field">'+
      '<label>Aliases (comma separated)</label>'+
      '<input id="e-aliases" value="'+
      esc(
        (item.aliases||[]).join(', ')
      )+
      '">'+
      '</div>'+

      '<div class="gc33-field full">'+
      '<label>Life story</label>'+
      '<textarea id="e-life">'+
      esc(item.life_story||'')+
      '</textarea>'+
      '</div>'+

      '<div class="gc33-field full">'+
      '<label>Faith & trust in God — detailed</label>'+
      '<textarea id="e-faith">'+
      esc(item.faith||'')+
      '</textarea>'+
      '</div>'+

      '<div class="gc33-field full">'+
      '<label>Faith & virtues — detailed</label>'+
      '<textarea id="e-virtues">'+
      esc(item.virtues||'')+
      '</textarea>'+
      '</div>'+

      '<div class="gc33-field full">'+
      '<label>Trials / turning points</label>'+
      '<textarea id="e-trials">'+
      esc(item.trials||'')+
      '</textarea>'+
      '</div>'+

      '<div class="gc33-field full">'+
      '<label>Lessons / application</label>'+
      '<textarea id="e-lessons">'+
      esc(item.lessons||'')+
      '</textarea>'+
      '</div>'+

      '<div class="gc33-field full">'+
      '<label>Scripture references</label>'+
      '<textarea id="e-refs">'+
      esc(
        (item.scripture_refs||[]).join(', ')
      )+
      '</textarea>'+
      '</div>'+

      '<div class="gc33-field">'+
      '<label>Source name</label>'+
      '<input id="e-source" value="'+
      esc(item.source_name||'')+
      '">'+
      '</div>'+

      '<div class="gc33-field">'+
      '<label>Source URL</label>'+
      '<input id="e-sourceurl" value="'+
      esc(item.source_url||'')+
      '">'+
      '</div>'+

      '</div>';
  }

  return '<div class="gc33-grid">'+

    '<div class="gc33-field">'+
    '<label>Date</label>'+
    '<input id="e-date" type="date" value="'+
    esc(
      item.date||
      new Date().toISOString().slice(0,10)
    )+
    '">'+
    '</div>'+

    '<div class="gc33-field">'+
    '<label>Title</label>'+
    '<input id="e-title" value="'+
    esc(item.title||'')+
    '">'+
    '</div>'+

    '<div class="gc33-field full">'+
    '<label>Theme / Scripture</label>'+
    '<input id="e-theme" value="'+
    esc(item.theme||'')+
    '">'+
    '</div>'+

    '<div class="gc33-field full">'+
    '<label>Reflection / body</label>'+
    '<textarea id="e-body">'+
    esc(
      item.body||
      item.reflection||
      ''
    )+
    '</textarea>'+
    '</div>'+

    '<div class="gc33-field full">'+
    '<label>Prayer</label>'+
    '<textarea id="e-prayer">'+
    esc(item.prayer||'')+
    '</textarea>'+
    '</div>'+

    '<div class="gc33-field full">'+
    '<label>Reflection questions — one per line</label>'+
    '<textarea id="e-questions">'+
    esc(
      (item.questions||[]).join('\n')
    )+
    '</textarea>'+
    '</div>'+

    '<div class="gc33-field">'+
    '<label>Source name</label>'+
    '<input id="e-source" value="'+
    esc(item.source_name||'GraceConnect')+
    '">'+
    '</div>'+

    '<div class="gc33-field">'+
    '<label>Source URL</label>'+
    '<input id="e-sourceurl" value="'+
    esc(item.source_url||'')+
    '">'+
    '</div>'+

    '</div>';
}


/* =========================================================
   READ EDITOR
   ========================================================= */

function readEditor(type){

  if(type==='trivia'){

    var raw={
      question:
        document.getElementById(
          'e-question'
        ).value,

      options:
        document.getElementById(
          'e-options'
        ).value
        .split(/\n+/)
        .map(function(x){
          return x.trim();
        })
        .filter(Boolean),

      correct_index:
        document.getElementById(
          'e-correct'
        ).value,

      category:
        document.getElementById(
          'e-category'
        ).value,

      difficulty:
        document.getElementById(
          'e-difficulty'
        ).value,

      reference:
        document.getElementById(
          'e-reference'
        ).value,

      explanation:
        document.getElementById(
          'e-explanation'
        ).value,

      source_name:
        document.getElementById(
          'e-source'
        ).value,

      source_url:
        document.getElementById(
          'e-sourceurl'
        ).value
    };

    var result=validateTriviaObject(raw,0);

    if(!result.valid){
      throw Error(result.error);
    }

    return result.row;
  }

  if(type==='characters'){

    return {
      name:
        document.getElementById(
          'e-name'
        ).value.trim(),

      aliases:
        document.getElementById(
          'e-aliases'
        ).value
        .split(',')
        .map(function(x){
          return x.trim();
        })
        .filter(Boolean),

      life_story:
        document.getElementById(
          'e-life'
        ).value.trim(),

      faith:
        document.getElementById(
          'e-faith'
        ).value.trim(),

      virtues:
        document.getElementById(
          'e-virtues'
        ).value.trim(),

      trials:
        document.getElementById(
          'e-trials'
        ).value.trim(),

      lessons:
        document.getElementById(
          'e-lessons'
        ).value.trim(),

      scripture_refs:
        document.getElementById(
          'e-refs'
        ).value
        .split(',')
        .map(function(x){
          return x.trim();
        })
        .filter(Boolean),

      source_name:
        document.getElementById(
          'e-source'
        ).value.trim(),

      source_url:
        document.getElementById(
          'e-sourceurl'
        ).value.trim(),

      active:true
    };
  }

  return {

    date:
      document.getElementById(
        'e-date'
      ).value,

    title:
      document.getElementById(
        'e-title'
      ).value.trim(),

    theme:
      document.getElementById(
        'e-theme'
      ).value.trim(),

    body:
      document.getElementById(
        'e-body'
      ).value.trim(),

    prayer:
      document.getElementById(
        'e-prayer'
      ).value.trim(),

    questions:
      document.getElementById(
        'e-questions'
      ).value
      .split(/\n+/)
      .map(function(x){
        return x.trim();
      })
      .filter(Boolean),

    source_name:
      document.getElementById(
        'e-source'
      ).value.trim(),

    source_url:
      document.getElementById(
        'e-sourceurl'
      ).value.trim(),

    active:true,
    is_custom:true
  };
}


/* =========================================================
   SAVE ROW
   ========================================================= */

async function saveRow(table,id,type){

  var c=db();

  if(!c){
    throw Error('Supabase unavailable');
  }

  var p=readEditor(type);

  var u=await uid();

  p.updated_by=u;
  p.updated_at=new Date().toISOString();

  if(id)p.id=id;

  var r=await c
    .from(table)
    .upsert(p);

  if(r.error){
    throw r.error;
  }

  toast(
    'Saved successfully',
    'success'
  );

  renderManager();
}


/* =========================================================
   EDITOR MODAL
   ========================================================= */

function editorModal(type,item){

  var id=item&&item.id;

  var b=modal(
    'gc33-editor',

    '<div class="gc33-head">'+

    '<h2>'+
    ({
      trivia:'Trivia Question',
      characters:'Bible Character',
      devotionals:'Devotional'
    }[type])+
    '</h2>'+

    '<button class="gc33-close" onclick="gc33CloseEditor()">×</button>'+

    '</div>'+

    '<div class="gc33-body">'+

    editorFields(type,item)+

    '<div class="gc33-actions">'+

    '<button class="gc33-btn gc33-primary" id="gc33-save">'+
    'Save'+
    '</button>'+

    '<button class="gc33-btn gc33-muted" onclick="gc33CloseEditor()">'+
    'Cancel'+
    '</button>'+

    '</div>'+

    '</div>'
  );

  b.querySelector(
    '#gc33-save'
  ).onclick=function(){

    var button=this;

    button.disabled=true;
    button.textContent='Saving…';

    saveRow(
      type==='trivia'
        ?TRIVIA_TABLE
        :type==='characters'
          ?CHAR_TABLE
          :DEVO_TABLE,
      id,
      type
    )
    .catch(function(e){

      console.error(
        'Save failed:',
        e
      );

      toast(
        'Save failed: '+
        formatSupabaseError(e),
        'error'
      );

      button.disabled=false;
      button.textContent='Save';
    });
  };
}

window.gc33CloseEditor=function(){
  close('gc33-editor');
};


/* =========================================================
   TRIVIA ADMIN
   ========================================================= */

async function renderTriviaAdmin(h){

  var c=db();

  if(!c){

    h.innerHTML=
      '<div class="gc33-error">'+
      'Supabase client unavailable.'+
      '</div>';

    return;
  }

  var r=await c
    .from(TRIVIA_TABLE)
    .select('*')
    .order(
      'updated_at',
      {ascending:false}
    )
    .limit(100);

  var rows=(r.data||[])
    .map(function(x){

      return '<div class="gc33-row">'+

        '<div>'+

        '<b>'+
        esc(x.question)+
        '</b>'+

        '<small>'+
        esc(
          x.reference||
          'No reference'
        )+
        ' · '+
        esc(
          x.source_name||
          'Unspecified source'
        )+
        ' · '+
        esc(
          x.difficulty||
          'NORMAL'
        )+
        '</small>'+

        '</div>'+

        '<button class="gc33-btn gc33-muted" data-id="'+
        esc(x.id)+
        '">'+
        'Edit'+
        '</button>'+

        '</div>';

    })
    .join("");

  h.innerHTML=

    '<div class="gc33-actions">'+

    '<button class="gc33-btn gc33-primary" id="new">'+
    '+ Add Question'+
    '</button>'+

    '<button class="gc33-btn gc33-muted" id="import">'+
    'Import JSON'+
    '</button>'+

    '</div>'+

    '<div class="gc33-help">'+
    'Use only questions you have permission to use. '+
    'Every question must have at least 2 unique options and a valid correct answer. '+
    'A source and Bible reference are stored with every question. '+
    'The app will never intentionally repeat a served question for the same signed-in user.'+
    '</div>'+

    '<div class="gc33-list">'+
    (
      rows||
      '<div>No questions yet.</div>'
    )+
    '</div>'+

    (
      r.error
      ?
      '<div class="gc33-error">'+
      esc(
        formatSupabaseError(r.error)
      )+
      '</div>'
      :''
    );

  h.querySelector(
    '#new'
  ).onclick=function(){
    editorModal('trivia');
  };

  h.querySelector(
    '#import'
  ).onclick=importTrivia;

  Array.from(
    h.querySelectorAll('[data-id]')
  ).forEach(function(b){

    b.onclick=async function(){

      try{

        var result=await c
          .from(TRIVIA_TABLE)
          .select('*')
          .eq(
            'id',
            b.dataset.id
          )
          .single();

        if(result.error){
          throw result.error;
        }

        editorModal(
          'trivia',
          result.data
        );

      }catch(e){

        toast(
          'Unable to load question: '+
          formatSupabaseError(e),
          'error'
        );
      }
    };
  });
}


/* =========================================================
   VALIDATED TRIVIA JSON IMPORTER
   ========================================================= */

async function importTrivia(){

  var b=modal(
    'gc33-import',

    '<div class="gc33-head">'+

    '<h2>Import Bible Trivia JSON</h2>'+

    '<button class="gc33-close" onclick="gc33CloseImport()">×</button>'+

    '</div>'+

    '<div class="gc33-body">'+

    '<div class="gc33-help">'+

    '<b>Required format</b><br>'+
    'Paste a JSON array of question objects.<br><br>'+

    '<b>Required:</b> question, options, correct_index<br>'+
    '<b>Optional:</b> reference, explanation, category, difficulty, source_name, source_url<br>'+
    '<b>Options:</b> 2–6 unique answers<br>'+
    '<b>Difficulty:</b> EASY, NORMAL or HARD<br>'+
    '<b>correct_index:</b> zero-based (0 = first option)<br><br>'+

    'The importer validates every question before inserting anything. '+
    'Invalid questions are rejected instead of silently being skipped.'+

    '</div>'+

    '<textarea id="gc33-json" style="width:100%;min-height:300px;border:1px solid #dbe2ea;border-radius:12px;padding:12px;font:inherit;box-sizing:border-box"></textarea>'+

    '<div id="gc33-import-status"></div>'+

    '<div class="gc33-actions">'+

    '<button class="gc33-btn gc33-primary" id="go">'+
    'Import'+
    '</button>'+

    '<button class="gc33-btn gc33-muted" id="validate">'+
    'Validate Only'+
    '</button>'+

    '</div>'+

    '</div>'
  );

  var textarea=b.querySelector(
    '#gc33-json'
  );

  var status=b.querySelector(
    '#gc33-import-status'
  );

  function setStatus(message,type){

    status.innerHTML=
      '<div class="'+
      (
        type==='error'
        ?'gc33-error'
        :'gc33-success'
      )+
      '">'+
      message+
      '</div>';
  }

  function parseAndValidate(){

    var text=String(
      textarea.value||''
    ).trim();

    if(!text){

      throw Error(
        'Paste the trivia JSON before continuing.'
      );
    }

    var arr;

    try{

      arr=JSON.parse(text);

    }catch(e){

      throw Error(
        'Invalid JSON: '+
        e.message
      );
    }

    if(!Array.isArray(arr)){

      throw Error(
        'JSON must be an array of question objects.'
      );
    }

    if(!arr.length){

      throw Error(
        'The JSON array is empty.'
      );
    }

    if(arr.length>10000){

      throw Error(
        'Maximum import size is 10,000 questions per import.'
      );
    }

    var rows=[];
    var errors=[];

    var duplicateQuestions=new Map();

    arr.forEach(function(item,index){

      var result=validateTriviaObject(
        item,
        index
      );

      if(!result.valid){

        errors.push(
          result.error
        );

        return;
      }

      var key=result.row.question
        .trim()
        .toLowerCase()
        .replace(/\s+/g,' ');

      if(duplicateQuestions.has(key)){

        errors.push(
          'Question '+(index+1)+
          ' duplicates question '+
          (duplicateQuestions.get(key)+1)+
          ' in this import.'
        );

        return;
      }

      duplicateQuestions.set(
        key,
        index
      );

      rows.push(
        result.row
      );
    });

    if(errors.length){

      var display=errors
        .slice(0,20)
        .map(function(x){
          return '• '+esc(x);
        })
        .join('<br>');

      if(errors.length>20){
        display+=
          '<br>… and '+
          (errors.length-20)+
          ' more validation errors.';
      }

      throw Error(
        'Validation failed:<br><br>'+
        display
      );
    }

    return rows;
  }


  /*
    Validate-only button.
  */
  b.querySelector(
    '#validate'
  ).onclick=function(){

    try{

      var rows=parseAndValidate();

      setStatus(
        '✓ Validation successful. '+
        rows.length+
        ' question(s) are ready to import.',
        'success'
      );

    }catch(e){

      setStatus(
        e.message,
        'error'
      );
    }
  };


  /*
    Actual import.
  */
  b.querySelector(
    '#go'
  ).onclick=async function(){

    var button=this;

    try{

      button.disabled=true;
      button.textContent='Validating…';

      var rows=parseAndValidate();

      var c=db();

      if(!c){

        throw Error(
          'Supabase client unavailable.'
        );
      }

      var u=await uid();

      if(!u){

        throw Error(
          'You must be signed in as an administrator to import trivia.'
        );
      }

      /*
        Add audit fields without changing the user's JSON format.
      */
      rows=rows.map(function(row){

        return {
          question:row.question,
          options:row.options,
          correct_index:row.correct_index,
          reference:row.reference,
          explanation:row.explanation,
          category:row.category,
          difficulty:row.difficulty,
          source_name:row.source_name,
          source_url:row.source_url,
          approved:true,
          created_by:u,
          updated_by:u
        };

      });

      var total=rows.length;

      var imported=0;

      for(
        var i=0;
        i<rows.length;
        i+=500
      ){

        var batch=rows.slice(
          i,
          i+500
        );

        button.textContent=
          'Importing '+
          imported+
          '/'+
          total+
          '…';

        var rr=await c
          .from(TRIVIA_TABLE)
          .insert(batch);

        if(rr.error){

          throw rr.error;
        }

        imported+=batch.length;

        setStatus(
          'Imported '+
          imported+
          ' of '+
          total+
          ' questions…',
          'success'
        );
      }

      toast(
        total+
        ' questions imported successfully.',
        'success'
      );

      close(
        'gc33-import'
      );

      renderManager();

    }catch(e){

      console.error(
        'Trivia import failed:',
        e
      );

      setStatus(
        'Import failed:<br><br>'+
        formatSupabaseError(e),
        'error'
      );

      button.disabled=false;
      button.textContent='Import';
    }
  };
}

window.gc33CloseImport=function(){
  close('gc33-import');
};


/* =========================================================
   CHARACTER ADMIN
   ========================================================= */

async function renderCharAdmin(h){

  var c=db();

  var r=await c
    .from(CHAR_TABLE)
    .select('*')
    .order('name')
    .limit(200);

  var rows=(r.data||[])
    .map(function(x){

      return '<div class="gc33-row">'+

        '<div>'+

        '<b>'+
        esc(x.name)+
        '</b>'+

        '<small>'+
        esc(
          x.source_name||
          'Custom'
        )+
        '</small>'+

        '</div>'+

        '<button class="gc33-btn gc33-muted" data-id="'+
        esc(x.id)+
        '">'+
        'Edit'+
        '</button>'+

        '</div>';

    })
    .join("");

  h.innerHTML=

    '<div class="gc33-actions">'+

    '<button class="gc33-btn gc33-primary" id="new">'+
    '+ Add Character'+
    '</button>'+

    '<button class="gc33-btn gc33-muted" id="sync">'+
    'Import Theographic People'+
    '</button>'+

    '</div>'+

    '<div class="gc33-help">'+
    'The Theographic Bible Metadata dataset currently exposes 3,067 people through Free Use Bible API. '+
    'Custom GraceConnect fields let you deepen faith, virtues and life stories without replacing the underlying Scripture references.'+
    '</div>'+

    '<div class="gc33-list">'+
    (
      rows||
      '<div>No imported/custom characters yet. Public search still uses Theographic live data.</div>'
    )+
    '</div>';

  h.querySelector(
    '#new'
  ).onclick=function(){
    editorModal('characters');
  };

  h.querySelector(
    '#sync'
  ).onclick=syncTheographic;

  Array.from(
    h.querySelectorAll('[data-id]')
  ).forEach(function(b){

    b.onclick=async function(){

      var x=(
        await c
          .from(CHAR_TABLE)
          .select('*')
          .eq(
            'id',
            b.dataset.id
          )
          .single()
      ).data;

      editorModal(
        'characters',
        x
      );
    };
  });
}


/* =========================================================
   THEOGRAPHIC SYNC
   ========================================================= */

async function syncTheographic(){

  try{

    var list=await fetch(
      THEO_PEOPLE
    ).then(function(r){
      return r.json();
    });

    var people=list.people||[],
        c=db(),
        u=await uid();

    var rows=people.map(function(p){

      return {
        source_id:p.id,
        name:p.name,
        aliases:[],
        life_story:'',
        faith:'',
        virtues:'',
        trials:'',
        lessons:'',
        scripture_refs:[],
        source_name:
          'Theographic Bible Metadata via Free Use Bible API',
        source_url:
          'https://github.com/robertrouse/theographic-bible-metadata',
        active:true,
        created_by:u,
        updated_by:u
      };
    });

    for(
      var i=0;
      i<rows.length;
      i+=300
    ){

      var r=await c
        .from(CHAR_TABLE)
        .upsert(
          rows.slice(i,i+300),
          {
            onConflict:'source_id'
          }
        );

      if(r.error){
        throw r.error;
      }
    }

    toast(
      people.length+
      ' Theographic people synchronized',
      'success'
    );

    renderManager();

  }catch(e){

    toast(
      'Character sync failed: '+
      formatSupabaseError(e),
      'error'
    );
  }
}


/* =========================================================
   DEVOTIONAL ADMIN
   ========================================================= */

async function renderDevoAdmin(h){

  var c=db();

  var r=await c
    .from(DEVO_TABLE)
    .select('*')
    .order(
      'date',
      {ascending:false}
    )
    .limit(100);

  var rows=(r.data||[])
    .map(function(x){

      return '<div class="gc33-row">'+

        '<div>'+

        '<b>'+
        esc(
          x.title||
          'Untitled'
        )+
        '</b>'+

        '<small>'+
        esc(x.date||'')+
        ' · '+
        esc(
          x.source_name||
          'GraceConnect'
        )+
        '</small>'+

        '</div>'+

        '<button class="gc33-btn gc33-muted" data-id="'+
        esc(x.id)+
        '">'+
        'Edit'+
        '</button>'+

        '</div>';

    })
    .join("");

  h.innerHTML=

    '<div class="gc33-actions">'+

    '<button class="gc33-btn gc33-primary" id="new">'+
    '+ Add / Override Today'+
    '</button>'+

    '</div>'+

    '<div class="gc33-help">'+
    'Custom devotionals override the fallback. If there is no active custom entry for today, GraceConnect uses the Christ Himself API. '+
    'Its original devotional content is CC BY-NC-SA 4.0; attribution is displayed in the app.'+
    '</div>'+

    '<div class="gc33-list">'+
    (
      rows||
      '<div>No custom devotionals yet.</div>'
    )+
    '</div>';

  h.querySelector(
    '#new'
  ).onclick=function(){
    editorModal('devotionals');
  };

  Array.from(
    h.querySelectorAll('[data-id]')
  ).forEach(function(b){

    b.onclick=async function(){

      var x=(
        await c
          .from(DEVO_TABLE)
          .select('*')
          .eq(
            'id',
            b.dataset.id
          )
          .single()
      ).data;

      editorModal(
        'devotionals',
        x
      );
    };
  });
}


/* =========================================================
   ADMIN DISCOVER BUTTON
   ========================================================= */

/* ---------- admin Discover button ---------- */
function injectAdminButton(){
  if(document.getElementById('gc33-content-button'))return;

  admin().then(function(isAdmin){
    if(!isAdmin)return;

    var p=document.getElementById('adminDiscoverPanel');

    /*
      Preferred location:
      Use the existing Admin Discover panel when available.
    */
    if(p){
      var b=document.createElement('button');
      b.id='gc33-content-button';
      b.className='btn btn-primary btn-block btn-sm';
      b.style.marginTop='8px';
      b.innerHTML='<i class="fas fa-book-bible"></i> Bible Content Manager';
      b.onclick=function(){openManager();};
      p.appendChild(b);
      return;
    }

    /*
      Fallback:
      If the original adminDiscoverPanel is not present in the
      current frontend, place the button into the admin area
      without removing or replacing existing elements.
    */
    var candidates=[
      document.getElementById('adminPanel'),
      document.getElementById('admin-dashboard'),
      document.getElementById('adminDashboard'),
      document.querySelector('[data-admin-panel]'),
      document.querySelector('.admin-panel'),
      document.querySelector('.admin-dashboard')
    ];

    var target=null;
    for(var i=0;i<candidates.length;i++){
      if(candidates[i]){
        target=candidates[i];
        break;
      }
    }

    /*
      Last-resort fallback:
      Create a small dedicated container at the end of the body.
      It does not replace existing UI.
    */
    if(!target){
      target=document.createElement('div');
      target.id='gc33-admin-content-entry';
      target.style.cssText=
        'position:fixed;right:18px;bottom:18px;z-index:99999;';
      document.body.appendChild(target);
    }

    var b2=document.createElement('button');
    b2.id='gc33-content-button';
    b2.className='btn btn-primary btn-block btn-sm';
    b2.style.cssText=
      'margin-top:8px;cursor:pointer;border:0;border-radius:10px;padding:10px 14px;font-weight:800;';
    b2.innerHTML='<i class="fas fa-book-bible"></i> Bible Content Manager';
    b2.onclick=function(){openManager();};

    target.appendChild(b2);
  }).catch(function(e){
    console.warn('[GraceConnect] Unable to determine admin status for Content Manager button:',e);
  });
}


/* =========================================================
   WATCH EXISTING APP
   ========================================================= */

function watch(){

  style();

  injectAdminButton();

  var h=document.getElementById(
    'home-trivia'
  );

  if(h){

    var visible=
      getComputedStyle(h).display!=='none';

    if(
      visible&&
      !lastTriviaVisible
    ){
      renderTrivia();
    }

    lastTriviaVisible=visible;
  }

  var d=document.getElementById(
    'home-devotional'
  );

  if(
    d&&
    getComputedStyle(d).display!=='none'
  ){
    renderDevotional33();
  }
}

setInterval(
  watch,
  1500
);

setTimeout(
  watch,
  700
);


/* =========================================================
   PUBLIC API
   ========================================================= */

window.gc33RenderTrivia=
  renderTrivia;

window.gc33RenderDevotional=
  renderDevotional33;

window.gc33OpenContentManager=
  openManager;

})();
