// app16.js — CLEANUP: kill legacy writers + throttle polls
(function(){
  // app14's 3s renderer + hooks become no-ops
  window.renderDeptWeekMeet14=function(){};
  ['deptWeekMeet14','deptWeekMeet17','deptWeekMeet18'].forEach(function(id){
    var e=document.getElementById(id);if(e&&e.parentNode)e.parentNode.removeChild(e);
  });
  var st=document.createElement('style');
  st.textContent='#home-mainDept .card-cool{display:none!important}';
  document.head.appendChild(st);

  // SPEED: memberships max once per 30s, pending once per 60s (was 10s)
  var lm=window.loadMyMemberships9,lt=0;
  window.loadMyMemberships9=function(){var n=Date.now();if(n-lt<30000)return undefined;lt=n;return lm?lm.apply(this,arguments):undefined;};
  var lp=window.loadPending,pt=0;
  window.loadPending=function(){var n=Date.now();if(n-pt<60000)return undefined;pt=n;return lp?lp.apply(this,arguments):undefined;};
})();
console.log('✝️ app16.js cleanup active');
