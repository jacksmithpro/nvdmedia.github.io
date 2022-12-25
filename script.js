function cookiesPolicyPrompt(){
  if (Cookies.get('acceptedCookiesPolicy') !== "yes"){
    //console.log('accepted policy', chk);
    $("#alertCookiePolicy").show(); 
  }
  $('#btnAcceptCookiePolicy').on('click',function(){
    //console.log('btn: accept');
    Cookies.set('acceptedCookiesPolicy', 'yes', { expires: 30 });
  });
  $('#btnDeclineCookiePolicy').on('click',function(){
    //console.log('btn: decline');
    document.location.href = "https://www.bing.com/search?q=rick+rolled";
  });
}

$( document ).ready(function() {
  cookiesPolicyPrompt();
  
  //-- following not for production ------
  $('#btnResetCookiePolicy').on('click',function(){
    console.log('btn: reset');
    Cookies.remove('acceptedCookiesPolicy');
    $("#alertCookiePolicy").show();
  });
  // ---------------------------
});