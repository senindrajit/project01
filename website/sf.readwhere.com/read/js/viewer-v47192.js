(function(window, undefined ) {
var document = window.document,
	location = window.location;

  var skip_level1_domains = [
    extractHostname( DEConfig.rwBase ),
    'epaper.patrika.com'
  ]

  var renderClips = {
    'requested_clips' : [],
    'loaded_clips' : []
  };

//expose any public members in this
//defined after functions are implemented
  var deconf = window.DEConfig,
    deEvents = {
      'pageChange':'pageChangeEvent',
      'renderPage': 'renderPageEvent',
      'levelReady': 'levelReadyEvent',
      'dragFinish': 'dragFinishEvent',
      'clipFinish': 'clipFinishEvent',
      'pageDataLoaded': 'pageDataLoadedEvent',
      'autoScroll':'autoScrollEvent',
      'showAuthBox': 'showAuthBoxEvent',
      'showLoginBox': 'showLoginBoxEvent',
      'pluginsLoaded': 'pluginsLoadedEvent',
      'loginChecked': 'loginCheckedEvent',
      'preloadPage': 'preloadPageEvent',
      'urlChange':'urlChangeEvent',
      'clipClose':'clipCloseEvent',
      'pageNumChange': 'pageNumChangeEvent'
    },
    pageData = {},
    sectionData = {},
    currentLevel,
    clickPos,
    clickPosRatio,
    lastScreenPos,
    lastScrollPos,
    pageOffset,
    navBarOffset,
    navBarFixed,
    winHeight,
    winWidth,
    isDragging,
    preventZoomClick = false,
    showClips = true,
    isClipping,
    clippingObj,
    $clipRect,
    overlayShadow,
    $pageContainer,
    allDataLoaded,
    mousePos,
    topClips,
    pageBottomOffset,
    clipLastScroll = {'top':0,'left':0},
    pluginJsLoaded = false,
    search_query,
    de = {
      'prepareForClipping':'',
      'openSubscribe':'',
      'cancelClipping':'',
      'allPageDataLoaded':false,
      'pageData':'',
      'sectionData':'',
      'allSectionDataLoaded':false,
      'zooms':'3',
      'isautoScroll':false,
      'forceCloseSidebar': false,
      'plugins':{},
      'emails':[],
      'pageClips':{},
      'scrollRatio':0,
      'page':1,
      'zoom':1,
      'last_mode': null,
      'manual_mode' : false
    },
    thumbContainerPos,
    pageWidth,
    pageHeight,
    screenWidth,
    screenHeight,
    screenMouseX,
    screenMouseY,
    pageTop,
    pageLeft,
    avgScrollLeft,
    avgScrollTop,
    avgScrollRight,
    avgScrollBottom,
    firstPage,
    clickPage,
    footerStatus = true,
    footerResizing = false,
    userdata,
    subscriberdata = false,
    resetFooter = false,
    PAGINATION = {
      'PAGE':0,
      'RECORD':50,
      'REQUESTED':[]
    },
    supportedWebP = null,
    webPPrefix = window.location.protocol + '//webpcache.epapr.in/index.php?in=',
    webPPrefixV2 = 'https://icdn.readwhere.com/size/default/format/webp/src/',
    webP_ENC = {
      '+': '-',
      '/': '_',
      '=': '.'
    },
    top_clip_page = 1,
    top_clip_per_request = 6,
    all_clips = {}
    page_change_count = 0,
    all_clips = {},
    nLimitedSession = false,
    requested_plugins = [];


if(deconf.DEBUG){
  var origTrigger = $.fn.trigger;
  $.fn.trigger = function(){
    console.log('triggered '+ arguments[0]);
    origTrigger.apply(this, arguments);
  }
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
  } : null;
}

function isBrowserUnsupported() {
  var isIe55 = (navigator.appName == "Microsoft Internet Explorer" && parseInt(navigator.appVersion) == 4 && navigator.appVersion.indexOf("MSIE 5.5") != -1);
  var isIe6 = (navigator.appName == "Microsoft Internet Explorer" && parseInt(navigator.appVersion) == 4 && navigator.appVersion.indexOf("MSIE 6.0") != -1);
  var isIe7 = (navigator.appName == "Microsoft Internet Explorer" && parseInt(navigator.appVersion) == 4 && navigator.appVersion.indexOf("MSIE 7.0") != -1);
  return isIe55 || isIe6 || isIe7;
}

function showBrowserUnsupportedMessage(){
  var html = '<div style="width:480px; height:170px; background-color: #F477AE; margin: 150px auto 0; padding: 10px;">' +
                '<div style="margin:20px">'+
                    '<p style="font-size:13px; font-weight: bold;">Oops!! You are using a browser that is not supported by us. '+
                    'To open this site please download and install any of the following browser</p>'+
                '</div>'+
                '<span style="width:106px; height:106px; padding: 5px; margin: 21px;"><a target="_top" href="http://www.mozilla.org/en-US/firefox/fx/" target="_blank"'+
                        ' title="Mozilla Firefox"><img src="'+DEConfig.baseUrl+'theme/images/firefox-logo.png"></a></span>'+
                '<span style="width:106px; height:106px; padding: 5px; margin: 21px;"><a target="_top" href="https://www.google.com/chrome/" target="_blank"'+
                        ' title="Google Chrome"><img src="'+DEConfig.baseUrl+'theme/images/chrome-logo.png"></a></span>'+
                '<span style="width:106px; height:106px; padding: 5px; margin: 21px;"><a target="_top" href="http://windows.microsoft.com/en-IN/internet-explorer/products/ie/home" target="_blank"'+
                        ' title="Latest verion of Internet Explorer"><img src="'+DEConfig.baseUrl+'theme/images/ie-logo.png"></a></span>'+
            '</div>';
  $('body').html(html);
}

function urlParam (name){
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    return results[1] || 0;
}

function generateLink() {
  arguments.join = [].join;
  //join base url with given arguments
  return deconf.baseUrl + arguments.join('/');
}

function getPageData() { return pageData; }

function getLevel(num,zoom){
  var lvl;
  if(! pageData.hasOwnProperty(num) ){
  	return undefined;
  }
  zoom = Number(zoom);

  try{
    switch(zoom) {
      case 1:
        if ((de.mode=='page') && (screen_width >= 600)){
            lvl = pageData[num].levels.leveldefault;
        }else{
            //lvl = pageData[num].levels.level0;
            lvl = pageData[num].levels.leveldefault;
        }
        break;
      case 2:
        lvl = pageData[num].levels.level1;
        break;
      case 3:
        lvl = pageData[num].levels.level2;
        break;
    }
  }catch(ex){}
  return lvl;
}

function intersects(rect1, rect2){
  //take projection on x and y
  //if both overlap, intersects = true
  //return true;
  var xInt = (rect1.x < rect2.x) ? rect2.x < (rect1.x + rect1.w) :
    rect1.x < (rect2.x+rect2.w);

  var yInt = (rect1.y < rect2.y) ? rect2.y < (rect1.y + rect1.h) :
    rect1.y < (rect2.y+rect2.h);
  return xInt && yInt;
}

function showVisibleChunks() {
  //run a for loop
  //check if the chunk is visible
  //clear and put image in it.
  if(!currentLevel){
    return;
  }
  pageOffset = (pageOffset) ? pageOffset : $('#de-chunks-container').offset();
  var scrollTop = $(window).scrollTop();
  var scrollLeft = $(window).scrollLeft();
  //find visible area of page
  var ya,xa,y = 0, x = 0, width = 0, height = 0, wH, wW;
  ya = scrollTop - pageOffset.top;
  y = (ya > 0) ? ya : 0;
  wH = winHeight - ((ya < 0) ? -ya : 0);

  xa = scrollLeft - pageOffset.left;
  x = (xa > 0) ? xa : 0;
  wW = winWidth - ((xa < 0) ? -xa : 0);
  height = currentLevel.height - y;
  height = (height < wH) ? height : wH;
  if (isSingleView()) {
      width = currentLevel.width - x;
  }else{
    width = currentLevel.width*2 - x;
  }
  width = (width < wW) ? width : wW;
  var visibleRect = {'x':x,'y':y,'w':width,'h':height};
  var chunk, $chunkdiv;
  var level = getLevel(de.page,de.zoom);

  if (!level){return;}
  for (var idx in level.chunks){
    if(! level.chunks.hasOwnProperty(idx) ) continue;

    //find the div which is not loaded, get its rect
    //detect its intersection with visible rect
    //put image in it and mark it as loaded
    chunk = level.chunks[idx];
    $chunkdiv = $("#left-chunk-"+idx);
    if($chunkdiv.attr('loaded') == 'true') continue;

    chunkRect = {'x':Number($chunkdiv.css('left').replace('px','')),
      'y':Number($chunkdiv.css('top').replace('px','')),
      'w':$chunkdiv.width(),
      'h':$chunkdiv.height()};
    if(! intersects(chunkRect, visibleRect)) continue;

    $chunkdiv.attr('loaded', 'true');

    var cimg = new Image();
    cimg.alt = "";
    cimg.style.width = chunk.width + 'px';
    cimg.style.height = chunk.height + 'px';
    cimg.width = Number(chunk.width);
    cimg.height = Number(chunk.height);
    $chunkdiv.append(cimg);
    renderImage( cimg, chunk.url );
    //cimg.src = chunk.url;
  }

  if (!isSingleView()){
    var chunk, $chunkdiv;
    var level_1 = getLevel(Number(de.page)+1, de.zoom);

    for (var idx in level_1.chunks){
      if(! level_1.chunks.hasOwnProperty(idx) ) continue;

      //find the div which is not loaded, get its rect
      //detect its intersection with visible rect
      //put image in it and mark it as loaded
      chunk = level_1.chunks[idx];
      $chunkdiv = $("#right-chunk-"+idx);
      if($chunkdiv.attr('loaded') == 'true') continue;

      chunkRect = {'x':Number($chunkdiv.css('left').replace('px','')),
        'y':Number($chunkdiv.css('top').replace('px','')),
        'w':$chunkdiv.width(),
        'h':$chunkdiv.height()};
      if(! intersects(chunkRect, visibleRect)) continue;

      $chunkdiv.attr('loaded', 'true');

      var cimg = new Image();
      cimg.alt = "";
      cimg.style.width = chunk.width + 'px';
      cimg.style.height = chunk.height + 'px';
      cimg.width = Number(chunk.width);
      cimg.height = Number(chunk.height);
      $chunkdiv.append(cimg);
      renderImage( cimg, chunk.url );
      //cimg.src = chunk.url;
    }
  }
}

var renderImage = function( imgObject, src ) {
  if ( !DEConfig.webPEnabled || !supportedWebP /*|| src.split('.').pop() != 'jpg'*/ ) {

    imgObject.src = src;
    return;
  }

  imgObject.src = getImageUrl( src );
  imgObject.onerror = function() {
    imgObject.src = src;
    imgObject.onerror = null;
  }
}

var getImageUrl = function( url ) {

  if ( !DEConfig.webPEnabled || !supportedWebP /* || url.split('.').pop() != 'jpg'*/ ) {

    return url;
  } else {

    if( DEConfig.hasOwnProperty('webPVersion') && DEConfig.webPVersion == 2 ) {

      return webPPrefixV2 + btoa(url.replace('http:','https:')).replace(/[+/=]/g, function(match){ return webP_ENC[match];} );
    } else {

      return webPPrefix + url;
    }
  }
}

function renderPage(pgnum,side){

  if( nLimitedSession && pageData.hasOwnProperty(pgnum) ){

    if( side == 'left' ){
      $(window).trigger('n-limited-left-page-change', [{page_key: pageData[pgnum].key, page_num: pgnum}]);
    } else {
      $(window).trigger('n-limited-right-page-change', [{page_key: pageData[pgnum].key, page_num: pgnum}]);
    }
  }


  var num_levels = 0;
  var regex = /^level\d.*$/;
  for(var idx in pageData[pgnum].levels){
    if( regex.test(idx) ){
        num_levels += 1;
    }
  }
  de.zoomLevels = num_levels;

  var level = getLevel(pgnum, de.zoom); //alert("level_width "+level.width);
  currentLevel = level;
  if (side=='left'){
    var $mainView = $("#de-chunks-container").empty();
    var bgThumbdiv = document.createElement("div");
    var bgThumbimg = new Image();
    bgThumbdiv.id = "left-bgThumbdiv";
    bgThumbdiv.style.width = bgThumbimg.style.width = level.width + 'px';
    bgThumbdiv.style.height = bgThumbimg.style.height = level.height + 'px';
    bgThumbdiv.style.position = "absolute";
    bgThumbdiv.style.left = "0px";
    bgThumbdiv.style.top = "0px";
    bgThumbimg.width = Number(level.width);
    bgThumbimg.height = Number(level.height);
    bgThumbdiv.appendChild(bgThumbimg);
    $mainView.append(bgThumbdiv);

    bgThumbimg.alt = "";
    bgThumbimg.onload = function(evt){
      $(window).trigger(deEvents.levelReady);
    };
    renderImage( bgThumbimg, pageData[pgnum].levels.thumbs.chunks[0].url );
    //bgThumbimg.src = pageData[pgnum].levels.thumbs.chunks[0].url;

    var chunk, chunkdiv;
    for (var idx in level.chunks){
      if(! level.chunks.hasOwnProperty(idx) ) continue;

      chunk = level.chunks[idx];
      chunkdiv = document.createElement("div");
      chunkdiv.style.position="absolute";
      chunkdiv.style.top= chunk.ty + 'px';
      chunkdiv.style.left= chunk.tx + 'px';
      chunkdiv.style.width = chunk.width + 'px';
      chunkdiv.style.height = chunk.height + 'px';
      chunkdiv.id = "left-chunk-"+idx;

      $mainView.append(chunkdiv);
    }

    if (de.mode=='page' || de.page==1 || de.page==deconf.numPages){
      $(window).trigger(deEvents.renderPage);
    }
  } else if (side=='right'){
    var $mainView = $("#de-chunks-container");
    var bgThumbdiv = document.createElement("div");
    var bgThumbimg = new Image();
    bgThumbdiv.id = "right-bgThumbdiv";
    bgThumbdiv.style.width = level.width + 'px';
    bgThumbdiv.style.height = level.height + 'px';
    bgThumbdiv.style.position = "absolute";
    bgThumbdiv.style.left = level.width + "px";
    bgThumbdiv.style.top = "0px";
    bgThumbimg.width = level.width;
    bgThumbimg.height = level.height;

    bgThumbdiv.appendChild(bgThumbimg);
    $mainView.append(bgThumbdiv);

    bgThumbimg.alt = "";
    bgThumbimg.onload = function(evt){
      $(window).trigger(deEvents.levelReady);
    };
    renderImage( bgThumbimg, pageData[pgnum].levels.thumbs.chunks[0].url );
    //bgThumbimg.src = pageData[pgnum].levels.thumbs.chunks[0].url;

    var chunk, chunkdiv;
    for (var idx in level.chunks){
      if(! level.chunks.hasOwnProperty(idx) ) continue;

      chunk = level.chunks[idx];
      chunkdiv = document.createElement("div");
      chunkdiv.style.position="absolute";
      chunkdiv.style.top= chunk.ty + 'px';
      chunkdiv.style.left= Number(level.width) + Number(chunk.tx) + 'px';
      chunkdiv.style.width = chunk.width + 'px';
      chunkdiv.style.height = chunk.height + 'px';
      chunkdiv.id = "right-chunk-"+idx;

      $mainView.append(chunkdiv);
    }
    $(window).trigger(deEvents.renderPage);
  }

  if ( typeof(isPageRenderFailed) != 'undefined' && isPageRenderFailed == true ) {

    isPageRenderFailed = false;
    //viewerAnalytics('send', 'event', 'PageRenderSuccess', DEConfig.publisherId, navigator.userAgent);
  }
}

function changePage(){
  switch (de.mode){
    case 'page' :loadSinglePage();break;
    case 'dual' :loadDualPage();break;
    //default: loadSinglePage(); break;
  }
}

function loadPage(pgnum1, pgnum2){
  if (pgnum2){
    if(pageData.hasOwnProperty(pgnum1) && pageData.hasOwnProperty(pgnum2)){
        renderPage(pgnum1,'left');
        renderPage(pgnum2,'right');
        return;
    }
  }else{
    if(pageData.hasOwnProperty(pgnum1)){
        renderPage(pgnum1,'left');
        return;
    }
  }

  if(deconf.isPaid && deconf.loggedin){
    $.getJSON( generateLink('pagemeta/'+getPageMetaType(),deconf.issueId +'/'+ pgnum1 + "-" + 
      ((pgnum2) ? pgnum2 : pgnum1)) + '?type=' + DEConfig.pType + '&user=' + userdata.id + 
      '&crypt=' + userdata.crypt + '&key=' + userdata.key,

      function(response){
        pageData[pgnum1]=response[pgnum1];
        renderPage(pgnum1,'left');
        if (pgnum2){
            pageData[pgnum2] = response[pgnum2];
            renderPage(pgnum2,'right');
        }
      }
    );
  }else{
    $.getJSON( generateLink('pagemeta/'+getPageMetaType(),deconf.issueId+'/'+ pgnum1 + "-" + ((pgnum2) ? pgnum2 : pgnum1)),

      function(response){
        pageData[pgnum1]=response[pgnum1];
        renderPage(pgnum1,'left');
        if (pgnum2){
            pageData[pgnum2] = response[pgnum2];
            renderPage(pgnum2,'right');
        }
      }
    );
  }  
}

function loadSinglePage(){
  loadPage(de.page, false);
}

function loadDualPage(){
  if (de.page == 1 || de.page == deconf.numPages){
   loadSinglePage();
  }else if (de.page % 2 ==0){
    loadPage(de.page,Number(de.page)+1);
  }else{
    de.page = de.page - 1;
    changeHashForPage(de.mode, de.page);
  }
}

var panelTimeout;
function adjustInterface(){
  var pWidth = $('#left-bgThumbdiv').width(),
    pHeight = $('#left-bgThumbdiv').height();
  $('.page-size').each(function(){
    if (isSingleView()){
        $(this).width(pWidth).height(pHeight);
        $('#de-page-wrapper').width(pWidth);
    }else{
        $(this).width(pWidth+$('#right-bgThumbdiv').width()).height(pHeight);
        $('#de-page-wrapper').width(pWidth+$('#right-bgThumbdiv').width());
    }
  });
  pageOffset = $('#de-chunks-container').offset();

  if($(window).width() <= 768){
    $('#page-level-bar').css('top','60px');
  }
  if(de.zoom > 1){
    //hide sidebars
    $('#page-left-panel').css('visibility','hidden');
    $('#page-right-panel').css('visibility','hidden');

    $('.btn_prev').addClass('zoom_arrow_fixed');
    $('.btn_next').addClass('zoom_arrow_fixed');

    $('.zoomin').addClass('zoomin32');
    
    var contentWidth = pWidth+620;
    $('#content-container').width(contentWidth);
    $('#top-container').width(contentWidth);
    window.clearTimeout(panelTimeout);
    if(!clickPosRatio){
      clickPosRatio = {'x':0.5,'y':0};
    }
    var maxScrollTop = Number(currentLevel.height) + pageOffset.top - winHeight;
    var maxScrollLeft = 0;
    
    maxScrollLeft = (Number(currentLevel.width) + 600) - winWidth;
    newx = (clickPosRatio.x * maxScrollLeft),
    newy = clickPosRatio.y * maxScrollTop;

    $(window).scrollTop(newy);
    $(window).scrollLeft(newx);
    
    //disable clipping plugin
    //enable page dragging
     if(clippingObj) {
      clippingObj.setOptions({'disable':true});
      clippingObj.update();
    }
    $pageContainer.removeClass('drag-down').addClass('drag-up');
    onPageScroll();
  } else {
      clickPosRatio = false;
      $('#content-container').css('width','100%');
      $('#top-container').css('width','100%');
      if(clippingObj) {  
        clippingObj.setOptions({'enable':true});
        clippingObj.update();
      }
      $pageContainer.removeClass('drag-down').removeClass('drag-up');
      panelTimeout = window.setTimeout(function(){
        $('#page-left-panel').css('visibility','visible');
        $('#page-right-panel').css('visibility','visible');
      },500);
      onPageScroll();
  }

  if (DE.scrollPos){
    $(window).scrollTop($("#de-page-container").height()*DE.scrollPos);
    DE.scrollPos = 0;
  }
}

function registerClipNavigationKeys(){
    $(document).unbind('keyup');

    $(document).keyup(function(evt){

        switch(evt.keyCode){
        case 37:
                navigateOnClip('prev');
                break;
        case 39:
                navigateOnClip('next');
                break;
        }
    });
}

function unregisterClipNavigationKeys(){
  $(document).unbind('keyup');
  $(document).unbind('keypress');
}

function closeDisplayClip(){

  //register key shortcuts for page prev/next
  unregisterClipNavigationKeys()
  de.registerKeyShortcuts();

  $('.clip-enlarged').remove();
  $('.enlarged.clipactions').remove();
  $('.modal-close').hide();
  var callee = arguments.callee;
  $('.modal-close').each(function(idx,elem){
    $(elem).unbind('click', callee);
  });
  $('#clip-ad').hide();
  $('#enlarged-bottom-clip-ad').hide();
  de.section = (de.section) ? de.section : 'issue';
  de.sectionPage = (de.sectionPage) ? de.sectionPage : '1';
  changeHash(de.section, de.sectionPage);
  $(window).scrollTop(clipLastScroll.top).scrollLeft(clipLastScroll.left);
}

function displayClip(id, key, size, source, clip_data){

  //unregister key shortcuts for page prev/next
  de.unregisterKeyShortcuts();
  registerClipNavigationKeys();

  if( DEConfig.new_clip_popup ) {

    displayClipInPopup(id, key, size, source, clip_data);
    return;
  }

  //show a full screen clip
  //learn the last scroll position and reset it
  $('.prevclip').remove();
  $('.nextclip').remove();
  clipLastScroll = {'top':$(window).scrollTop(), 'left':$(window).scrollLeft()};
  $(window).scrollTop(0).scrollLeft(0);
  $('.modal-close').show().click(closeDisplayClip);
  $('.clip-enlarged').remove();

  $('#clip-ad').show();

  var issue = deconf.issueId;
  var showclipnav = showClipNavigationButtons();
  var navbtnhtml = '';

  if(showclipnav['prev']) {
    navbtnhtml += '<a href="javascript:;" class="btn_prev prevclip" style="text-decoration:none;" title="Previous" alt="Previous"> <span> <i class="fa fa-angle-left"></i> </span> </a>';  
  }

  if(showclipnav['next']) {
    navbtnhtml += '<a href="javascript:;" class="btn_next nextclip" style="text-decoration:none;" title="Next" alt="Next"> <span> <i class="fa fa-angle-right"></i> </span> </a>';
  }

  var enlarged_clipactions_html = '<div class="enlarged clipactions">';

  if( !DEConfig.hasOwnProperty('enable_clip_navigation') || DEConfig.enable_clip_navigation == false ) {

    enlarged_clipactions_html += navbtnhtml;
  }

  enlarged_clipactions_html += ''+
      '<a class="btn btn-default openinnew" target="_blank" href="'+deconf.baseUrlLink+'c/'+id+'" ><i class="fa fa-external-link"></i><span style="color:#333" class="label">Open</span></a>';

  if(DEConfig.v2_downloader != '-1') {
    if( DEConfig.clip_downloader ) {
        enlarged_clipactions_html += '<a target="_top" class="btn btn-default download downloadclip" href="javascript:;" data-clip-key="'+key+'"><i class="fa fa-cloud-download"></i><span style="color:#333" class="label">Download</span></a>';
    }
  } else {
    if( true || DEConfig.showpdf ) {
        enlarged_clipactions_html += '<a target="_top" class="btn btn-default download downloadclip" href="javascript:;" data-clip-key="'+key+'"><i class="fa fa-cloud-download"></i><span style="color:#333" class="label">Download</span></a>';
    }
  }

  enlarged_clipactions_html += ''+
      '<button type="button" class="btn btn-default fbshare" data-src="'+deconf.baseUrlLink+'c/'+id+'"><i class="fa fa-facebook"></i><span class="label">Facebook</span></button>'+
      '<button type="button" class="btn btn-default twshare" data-src="'+deconf.baseUrlLink+'c/'+id+'"><i class="fa fa-twitter"></i><span class="label">Tweet</span></button>'+
      '<button type="button" class="btn btn-default email" data-issueid="'+issue+'" data-clipid="'+id+'" data-clipkey="'+key+'"><i class="fa fa-envelope"></i><span class="label">Email</span></button>';

  if( DEConfig.hasOwnProperty('enable_clip_navigation') && DEConfig.enable_clip_navigation == true && clip_data ) {

      if( clip_data.hasOwnProperty('previous_clip') ) {
        enlarged_clipactions_html += '<a class="btn btn-default back" href="#clip/'+clip_data.prev_clip.id+'/'+clip_data.prev_clip.key+'" data-clip-key="'+clip_data.prev_clip.key+'"><i class="fa"></i><span style="color:#333" class="label">Back</span></a>';
      }

      if( clip_data.hasOwnProperty('next_clip') ) {
        enlarged_clipactions_html += '<a class="btn btn-default continue" href="#clip/'+clip_data.next_clip.id+'/'+clip_data.next_clip.key+'" data-clip-key="'+clip_data.next_clip.key+'"><i class="fa"></i><span style="color:#333" class="label">Continue</span></a>';
      }      
  }
  
  enlarged_clipactions_html += '</div>';

  $('body').append(enlarged_clipactions_html);

  $(".enlarged.clipactions .fbshare").unbind('click').click(shareClipOnFb);
  $(".enlarged.clipactions .twshare").unbind('click').click(shareClipOnTwitter);
  $(".enlarged.clipactions .email").unbind('click').click(shareClipOnEmail)


  var clipSmall = "https://cache.epapr.in/"+issue+"/"+key+"/thumb.jpg";
  var clipFull = "https://cache.epapr.in/"+issue+'/'+key+'/page.jpg';

  var cimgSmall = new Image();
  cimgSmall.src=clipSmall;
  
  var cimgFull = new Image();  

  var setClipPosition = function( clipW, clipH ){
    var clipLeft, clipTop;

    if( clipW < $(window).width() ) {
      //center on width
      clipLeft = Math.floor( ( $(window).width() - clipW ) / 2 );
    }

    if( clipH < $(window).height() ) {
      //center on height
      clipTop = Math.floor( ( $(window).height() - clipH ) / 2 );
    }

    clipLeft = (clipLeft > 20) ? clipLeft : 20;
    //clipTop = (clipTop > 50) ? clipTop : 50;
    clipTop = (clipTop > 130) ? clipTop : 130; // to integrate ad on clip page

    $('.clip-enlarged-image').css({
      left: clipLeft+'px',
      top: clipTop+'px',
      width: clipW+'px',
      height: clipH+'px'
    });

    $('.clip-enlarged-comments').css({
      top: (clipTop+clipH+50)+'px'
    });
    $("#de-page-container").height('0px');
    $("#de-chunks-container").height('0px');    

  var adTop = clipTop+clipH+300;
  $('#enlarged-bottom-clip-ad').css({ top: adTop+'px' });

  }

  $('body')
    .append('<img id="enlarged-clip-img" src="'+clipSmall+'" alt="clip" class="clip-enlarged clip-enlarged-image"/>')
    .append('<img src="'+clipFull+'" alt="clip" class="clip-enlarged clip-enlarged-image"/>')
    .append('<div id="clip-comments" style="left:20%;width:60%;background-color:white;" class="clip-enlarged clip-enlarged-comments"><div class="fb-comments" data-href="'+deconf.baseUrlLink+'c/'+id+'" data-width="100%" data-numposts="10" data-colorscheme="light"></div></div>');

  var clipSize = size.split(':');
  setClipPosition( Number( clipSize[0] ), Number( clipSize[1] ) );

  if(window.FB){
    FB.XFBML.parse(document.getElementById('clip-comments'));
  }

  cimgFull.onload = function( e ) {
    setClipPosition( this.width, this.height );
  }

  $('#enlarged-bottom-clip-ad').show();
  cimgFull.src=clipFull;
}

var displayClipInPopup = function(id, key, size, source, clip_data){

  $("#showClipModal .clip-img").attr('src', DEConfig.cdnBase+DEConfig.issueId+'/'+key+'/page.jpg');
  $("#showClipModal #clip-comments").attr('data-href', DEConfig.baseUrl+'c/'+id);
  $("#showClipModal .openinnew").attr('href', DEConfig.baseUrl+'c/'+id);
  $("#showClipModal .fbshare").attr('data-src', DEConfig.baseUrl+'c/'+id);
  $("#showClipModal .twshare").attr('data-src', DEConfig.baseUrl+'c/'+id);
  $("#showClipModal .downloadclip").attr('data-clip-key', key);
  $("#showClipModal .email").attr('data-clipkey', key);
  $("#showClipModal .email").attr('data-clipid', id);

  $("#showClipModal .fbshare").unbind('click').click(shareClipOnFb);
  $("#showClipModal .twshare").unbind('click').click(shareClipOnTwitter);
  $("#showClipModal .email").unbind('click').click(shareClipOnEmail)

  /*if( DEConfig.hasOwnProperty('enable_clip_navigation') && DEConfig.enable_clip_navigation == true && clip_data ) {
  }*/

  $("#showClipModal .cont-btn").hide();
  if( clip_data.hasOwnProperty('linked_clip') ) {

    var clip_button = ( Number(clip_data.page_num) <= Number(clip_data.linked_clip.page_num) ) ? 'continue-reading' : 'back-reading';

    $("#showClipModal ."+clip_button)
    .attr('href', '#clip/'+clip_data.linked_clip.clip_id+'/'+clip_data.linked_clip.clip_key )
    .show();
  } else {

    $("#showClipModal .continue-reading").hide();
    $("#showClipModal .back-reading").hide();
    if( clip_data.hasOwnProperty('previous_clip') ) {

      $("#showClipModal .back-reading")
      .attr('href', '#clip/'+clip_data.previous_clip.clip_id+'/'+clip_data.previous_clip.clip_key )
      .show();
    }

    if( clip_data.hasOwnProperty('next_clip') ) {

      $("#showClipModal .continue-reading")
      .attr('href', '#clip/'+clip_data.next_clip.clip_id+'/'+clip_data.next_clip.clip_key )
      .show();
    }
  }

  $('#showClipModal').modal();

  if(window.FB){
    try{
      FB.XFBML.parse(document.getElementById('clip-comments'));
    }catch(e){}
  }
}

function changePageOnInput() {
  var pnum = Math.floor($('#pagenum-input').val());
  if(!$.isNumeric(pnum)) {
    showPageNumberOnNavbar();
    return;
  }
  cancelClipping();

  $('.prevpage').removeClass('disablebtn');
  $('.nextpage').removeClass('disablebtn');
  if(DEConfig.sections.hasOwnProperty(DE.section)){
    numPages = DEConfig.sections[DE.section].length;
  }else{
    numPages = DEConfig.numPages
  }

  //de.manual_mode = false; 
  
  pnum = Math.max(1, Math.min(pnum, numPages));
  if( !de.manual_mode && ($.inArray(parseInt(pnum), DEConfig.doublespread_pages) != -1 ) ) {
    if(de.last_mode == null) {
      de.last_mode = de.section;  
    
    }
    de.section = 'dual';
    DE.setNavPropWithMode('dual');
    DE.showHideSideBars('hide'); 
  } else {
    if(DE.last_mode == 'dual') {
        de.section = 'dual';
        setNavPropWithMode('dual');
        showHideSideBars('hide'); 
      } else if(DE.last_mode == 'page') {
        de.section = 'page';
        setNavPropWithMode('page');
        showHideSideBars('show');
      }
  }


  changeHash(de.section, pnum);
  showPageNumberOnNavbar();

  if(pnum==1) {
    $('.prevpage').addClass('disablebtn');
  } else if(pnum == numPages) {
    $('.nextpage').addClass('disablebtn');
  }
}

function showSearchHighlight(){
  if (search_query != undefined && search_query != '') {
    var pageKey = pageData[de.page].key;

    $.getJSON(deconf.baseUrl+'search/highlight/'+pageKey+'/'+DEConfig.issueId+'/'+search_query,
    function(response){
      $.each(response, function(key,value) {
        var searchbox = drawAugmentedBox(value.x1,value.y1,value.x2,value.y2, 'div', 'left');
        searchbox.style.backgroundColor="rgba(255,255,0,0.3)";
        searchbox.style.cursor="inherit";
        $("#de-chunks-container").append(searchbox);
      });
        
    });
  }    

}

function showClip(hash) {
  var clipId = hash[1];
  var clipKey = hash[2];
  var clipSize = hash[3];
  var clipSource = hash[4];
  
  /*var plugin_keys = [];
  for(var plugin in DE.plugins){
    if(!DE.plugins.hasOwnProperty(plugin)) continue;
    plugin_keys.push(plugin);
  }

  var showclipnav = showClipNavigationButtons();
  var navbtnhtml = '';

  if(showclipnav['prev']) {
    navbtnhtml += '<a href="javascript:;" class="btn_prev prevclip" style="text-decoration:none;" title="Previous" alt="Previous"> <span> <i class="fa fa-angle-left"></i> </span> </a>';  
  }

  if(showclipnav['next']) {
    navbtnhtml += '<a href="javascript:;" class="btn_next nextclip" style="text-decoration:none;" title="Next" alt="Next"> <span> <i class="fa fa-angle-right"></i> </span> </a>';
  }

  clipObj.show({
    id : clipId,
    key : clipKey,
    size : clipSize,
    source : clipSource,
    issueId : deconf.issueId,
    baseUrl : deconf.baseUrlLink,
    pluginKeys : plugin_keys,
    pluginsObj : DE.plugins,
    pagePlugins : DE.plugincache,
    enablePlugins : true,
    showAd : true,
    navbtnhtml : navbtnhtml,
    pageMeta : pageData
  });*/

  /*if( !DEConfig.hasOwnProperty('enable_clip_navigation') || DEConfig.enable_clip_navigation == false ) {

    displayClip(clipId, clipKey, clipSize, clipSource, null );
    trackPage('clip',clipId);
    return;
  }*/

  if( all_clips.hasOwnProperty(clipKey) ) {

    displayClip(clipId, clipKey, clipSize, clipSource, all_clips[clipKey] );
    trackClipPage(clipId, clipSource);
    // trackPage('clip',clipId);
    return;
  }

  $.getJSON(DEConfig.baseUrl+'viewer/getclipdetail/'+clipKey, function(response){

    if( !response.status ) {

      swal(response.message);
      return;
    }

    all_clips[clipKey] = response.data;
    displayClip(clipId, clipKey, clipSize, clipSource, all_clips[clipKey] );
    // trackPage('clip',clipId);
    trackClipPage(clipId, clipSource);
  })
}

function checkUrl(evt){
  
  $(window).trigger(deEvents.urlChange);

  var hashStr = window.location.hash.substr(1);
	
  if(! hashStr){
	  hashStr = 'page/1/1';
	}

	var hash = hashStr.split('/');
  if(hash[0] == 'clip'){
    showClip(hash);
    return;
  }

  var pages, pageNum, pageZoom;

  //de.mode = ( hash[0].indexOf( Object.keys( DEConfig.sections ) ) !== -1 ) ? hash[0] : ( ( hash[0]=='dual' ) ? 'dual' : 'page'; )
	de.mode = (hash[0]=='dual') ? 'dual' : 'page';
  de.section = hash[0];  

  if(deconf.sections.hasOwnProperty(de.section)){

    //de.mode = de.section;
    pages = deconf.sections[de.section].pages;
    pageNum = pages[Number(hash[1])-1];
    pageNum = (pageNum) ? pageNum : 1; 
    $('#page-thumbs a').removeClass('section_highlight');
    $('#all_pages').removeClass('section_highlight');
    $('#'+de.section).addClass('section_highlight');
  }else{
    pageNum = hash[1];
  }

  pageNum = pageNum.replace(/^0+/, ''); // removing any trailing 0 in pagenum eg : 03 => 3

  pageNum = (pageNum <= deconf.numPages) ? pageNum : deconf.numPages;
  pageNum = (pageNum > 0) ? pageNum : 1;

  pageZoom = (hash[2]) ? hash[2] : (de.zoom) ? de.zoom : 1;


  if( de.page != pageNum ){
    $(window).trigger(deEvents.pageNumChange);
  }

  de.page = pageNum;
  de.sectionPage = hash[1];
  //de.zoom = (de.zoom) ? de.zoom : 1;
  de.zoom = pageZoom;


  trackPage('page',pageNum);

  if (hash.length>3 && hash[3] != 'rw'){
    search_query = hash[3];
  } else {
    search_query = '';
  }

  if(!de.manual_mode && ($.inArray(parseInt(pageNum), DEConfig.doublespread_pages) != -1 )) {
    if(de.last_mode == null) {
      de.last_mode = de.mode;
    }
    de.mode = 'dual';
    setNavPropWithMode('dual');
    showHideSideBars('hide'); 
  } else {
    if(de.last_mode == 'dual') {
      de.mode = 'dual';
    } else if(de.last_mode == 'page') {
      de.mode = 'page';
    }
  } 

 	//call the handler
	$(window).trigger(deEvents.pageChange);
}

function onDragFinish(evt){
  $pageContainer.removeClass('drag-down').addClass('drag-up');
  lastScrollPos = {'left' :  $(document).scrollLeft(),'top'  :  $(document).scrollTop()};
}

var preventClick;

function onMouseUp(evt){
  preventClick = false;
  if(preventZoomClick) {
    preventClick = true;
  }
  if(isDragging){
    $(window).trigger(deEvents.dragFinish);
    //preventClick = true;
    isDragging = false;
    preventZoomClick = false;
    $pageContainer.unbind('mousemove');
  }
}

function onMouseMoveScroll(evt){
  isDragging = true;
  preventZoomClick = true;
  var x = evt.screenX;
  var y = evt.screenY;
  var yScreenRatio = y / window.screen.height;
  var yDiff = yScreenRatio * window.screen.height;
  yDiff = (lastScreenPos.y * window.screen.height - yDiff) ;
  if(lastScrollPos){
      yDiff = lastScrollPos.top + yDiff ;
  }
  //top down scrolling
  $(document).scrollTop(yDiff);
  var xScreenRatio = x / window.screen.width;
  var xDiff = xScreenRatio * window.screen.width;
  xDiff = (lastScreenPos.x * window.screen.width - xDiff) ;
  if(lastScrollPos){
      xDiff = lastScrollPos.left + xDiff ;
  }
  $(document).scrollLeft(xDiff);
  evt.preventDefault();
}

function onMouseDown(evt){
  var x = evt.pageX;
	var y = evt.pageY;
	//get it relative to page
  pageOffset = $pageContainer.offset();
	x = x - pageOffset.left;
	y = y - pageOffset.top;
	var yScreen = evt.screenY;
  var xRatio = x / currentLevel.width;
	var yRatio = y / currentLevel.height;
  clickPos = {'x': x,'y': y};
  clickPosRatio = {'x': xRatio, 'y': yRatio};
  lastScreenPos = {'x': evt.screenX / window.screen.width, 'y': yScreen / window.screen.height};
  //bind to scroll when zoomed in otherwise bind to clipping
  if(Number(de.zoom) > 1 && !isClipping){
      isDragging = true;
	    $pageContainer.removeClass('drag-up').addClass('drag-down').unbind('mousemove').mousemove(onMouseMoveScroll);
      evt.preventDefault();
   }

   lastScrollPos = {'left':$(document).scrollLeft(), 'top':$(document).scrollTop()};
}

var topClipsShowing;

function onPageScroll(evt) {
  showVisibleChunks();
  var bottomBoxReach = $(window).scrollTop() > ( (pageBottomOffset ? pageBottomOffset.top : 5000) - winHeight);
  if( !topClipsShowing && bottomBoxReach){
    showTopClipsPage();
    topClipsShowing = true;
  }
}

function displayPreClipped(pageKey, right_side) {
  var hideFn = function(target){
    window.clearTimeout(target.data('visible'));
    target.data('visible',false);
    var btn = target.find('.clip-enlarge-btn');
    if(!btn.data('hover')){
      btn.fadeOut(100);
      $('.clip-box').show();
    }
    target.css('background-color','');
  };

  var onClipHover = function(e){
    var target = $(e.currentTarget);
    var timeout = target.data('visible');

    window.clearTimeout(timeout);
    timeout = window.setTimeout(hideFn,1500,target);
    if (target.data('visible')) {
      target.data('visible',timeout);
      return;
    };
    target.data('visible',timeout);
    target.find('.clip-enlarge-btn').fadeIn(50);
    //hide other clips till i'm hovering over 1
    target.siblings('.clip-box').hide();

    var bgcolor = target.attr('data-bg-color');
    if (bgcolor){
      var rgb = hexToRgb(bgcolor);
      target.css('background-color','rgba('+rgb.r+','+rgb.g+','+rgb.b+',0.5)');
    }
  }

  var onClipMouseLeave = function(e){
    var target = $(e.currentTarget);
    hideFn(target);
  }

  var displayClips = function(clips, page_key, right_page){
    if(deconf.environment == 'DEVELOPMENT') {
      var clipLevel = 2;
    } else {
      var clipLevel = 3;
    }

    var topLevel = getLevel(de.page, clipLevel);
    var num_clips = clips.length,
      levelW = Number(currentLevel.width),
      levelH = Number(currentLevel.height),
      topLevelW = Number(topLevel.width),
      topLevelH = Number(topLevel.height),
      clip, clipBox, clipBtn, clipBoxH, clipBoxW;

    if((num_clips != 0) && (clips[0]['page_key'] != page_key)){
      return;
    }

    for(var idx=0; idx < num_clips; idx += 1){
      clip = clips[idx];
      clipBox = document.createElement('div');
      clipBox.setAttribute('data-clipid', clip.id);

      clipBoxH = levelH * (Number(clip.y1) - Number(clip.y0));
      clipBoxW = levelW * (Number(clip.x1) - Number(clip.x0));
      fullSizeClipH = topLevelH * (Number(clip.y1) - Number(clip.y0));
      fullSizeClipW = topLevelW * (Number(clip.x1) - Number(clip.x0));
      clip_href = '#clip/'+clip.id+'/'+clip.key+'/'+fullSizeClipW+':'+fullSizeClipH;
      clipBox.setAttribute('data-cliphref', clip_href);
      clipBox.setAttribute('class', 'clip-box clippageview');
      clipBox.style.width = clipBoxW + 'px';
      clipBox.style.height = clipBoxH + 'px';
      clipBox.style.top = (levelH * Number(clip.y0)) + 'px';
      if (right_page){
        clipBox.style.left = (levelW * Number(clip.x0)) + levelW + 'px';
        clipBox.setAttribute('data-pgnum',Number(de.page)+1);
      }else{
          clipBox.style.left = (levelW * Number(clip.x0)) + 'px';
          clipBox.setAttribute('data-pgnum',Number(de.page));
      }

      if (clip.hasOwnProperty('publisher_id')){
        clipBox.setAttribute('data-authenticated',1);
        clipBox.setAttribute('data-bg-color', (DEConfig.hasOwnProperty('publisher_clip_behaviour') && DEConfig.publisher_clip_behaviour) ? DEConfig.publisher_clip_behaviour['bg-color-hax'] : 'BBDEFB');
        clipBtn = $('<a class="clip-enlarge-btn" href="javascript:"><i class="fa fa-external-link"></i></a>');
      }else{
        clipBox.setAttribute('data-bg-color','F9ECD1');
        clipBtn = $('<a class="clip-enlarge-btn" href="javascript:"><i class="fa fa-search-plus"></i></a>');
      }

      $(clipBox).mousemove(onClipHover).mouseleave(onClipMouseLeave);
      clipBtn.hover(function(){$(this).data('hover',true);},function(){$(this).data('hover',false)});
      clipBtn.data('clipkey', clip['key']).data('clipid',clip['id']).data('fullsize',fullSizeClipW+':'+fullSizeClipH);
      clipBtn.click(function(e){

        var c = $(e.currentTarget);
        if ( c.parent().attr('data-authenticated') && DEConfig.hasOwnProperty('publisher_clip_behaviour') && DEConfig.publisher_clip_behaviour && DEConfig.publisher_clip_behaviour.navigation == 'new-window' ){

            window.open(DEConfig.baseUrlLink+'c/'+c.data('clipid'));
        }else{

          window.location.hash = '#clip/'+c.data('clipid')+'/'+c.data('clipkey')+'/'+c.data('fullsize');
        }
        e.stopPropagation();
        e.preventDefault();
      });

      // clicking anywhere on publisher clip box should open clip in new window
      if (clip.hasOwnProperty('publisher_id')){
        $(clipBox).click(function(e){
          e.stopPropagation();
          e.preventDefault();
          if ( DEConfig.hasOwnProperty('publisher_clip_behaviour') && DEConfig.publisher_clip_behaviour && DEConfig.publisher_clip_behaviour.navigation == 'new-window' ){
            window.open( DEConfig.baseUrlLink+'c/'+$(this).attr('data-clipid') );
          } else{
            window.location.hash = $(this).attr('data-cliphref');
          }
        });
      }

      $(clipBox).append(clipBtn);
      $pageContainer.append(clipBox);
    }

    if(showClips == false) {
      ShowHideClips('hide');
    } else {
      ShowHideClips('show');
    }

    showClipsForPage();
  }
  
  if(de.pageClips.hasOwnProperty(pageKey)){
    displayClips(de.pageClips[pageKey], pageKey, right_side);
  } else if ($.inArray(pageKey, renderClips['requested_clips']) != -1) {
    return;
  } else{
    if ($.inArray(pageKey, renderClips['requested_clips']) == -1) {
      renderClips['requested_clips'].push(pageKey);
    }

    $.getJSON(deconf.baseUrl+'viewer/pageclips/'+deconf.issueId+'/'+pageKey, function(response){
      if(!response.status){
        showClipsForPage();
        return;
      }
      var clips = response.data;
      de.pageClips[response.pagekey] = clips;

      for( var idx in clips ) {

        all_clips[ clips[idx].key ] = clips[idx];
      }

      displayClips(clips, response.pagekey, right_side);
    });
  }
}

function shareClipOnFb(){
  if(!$(this).data('src')){
    return;
  }
  var link = $(this).data('src');
  var twurl = 'https://www.facebook.com/sharer.php?app_id=335724729790737&sdk=joey&u='+escape(link)+'&display=popup&ref=plugin'
  var newwindow=window.open(twurl,'facebook','height=420,width=600,top='+((window.screen.height/2)-210)+',left='+((window.screen.width/2)-275));
  if (window.focus) {newwindow.focus()}
}

function shareClipOnTwitter(){
  if(!$(this).data('src')){
    return;
  }
  var link = $(this).data('src');
  var twurl = 'https://twitter.com/intent/tweet?url='+encodeURIComponent(link)+'&text='+encodeURIComponent('Clipping of '+DEConfig.publisherName+' '+DEConfig.titleName);
  
  var newwindow=window.open(twurl,'twitter','height=420,width=550,top='+((window.screen.height/2)-210)+',left='+((window.screen.width/2)-275));
  if (window.focus) {newwindow.focus()}
}

function validateAndSendEmail(){
  var emailStr = $('#email-addresses').val();
  //loop on all emails and check each
  var emails = emailStr.split(/[, ;]/);
  var trimmed;
  var cleanEmails = [];
  var emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
  var match;
  for (var i = emails.length - 1; i >= 0; i--) {
    trimmed = emails[i].trim();
    if(!trimmed) continue;
    match = trimmed.match(emailPattern);
    if(!match){
      alert('There is an error. Email address(es) are invalid, please re-enter.');
      $('#email-addresses').focus();
      return;
    }
    cleanEmails.push(trimmed);
  };
  var fromname = $('#fromname-input').val();
  var issueId = $(this).data('issueid');
  var clipId = $(this).data('clipid');
  var clipKey = $(this).data('clipkey');

  if( cleanEmails.length < 1 ) {

    alert('There is an error. Email address(es) are invalid or empty, please re-enter.');
    $('#email-addresses').focus();
    return;
  }

  if( fromname == '' ) {

    alert('There is an error. please enter your name.');
    $('#fromname-input').focus();
    return;
  }

  
  //send these emails
  $(this).replaceWith('<div id="email-sending" style="text-align:center"><i class="fa fa-spin fa-cog" style="font-size:24px;text-align:center;"></i></div>');
  $.post(DEConfig.baseUrl+"clip/sendemail/"+issueId+'/'+clipId+'/'+clipKey,{"emails":cleanEmails,"from":fromname,'titlename':DEConfig.publisherName+' '+DEConfig.titleName}, function(response){
    $('#email-sending').replaceWith('<p style="text-align:center;">Email sent</p><div style="text-align:center"><button type="button" class="btn btn-link panel-close">Close</button></div>')
    $(".panel-close").click(closeEmailClip);
  });
}

function closeEmailClip(){
  $('#emailclip-panel').remove();
}

function shareClipOnEmail(){

  $(document).off('focusin.modal');

  var issueId = $(this).data('issueid');
  var clipId = $(this).data('clipid');
  var clipKey = $(this).data('clipkey');

  $('body').append('<div id="emailclip-panel" style="z-index: 1200;"><p class="title">Email Clip</p><button class="btn btn-link panel-close-btn"><i class="fa fa-times"></i></button><label for="emails" class="form-label">Send To:</label>'+
    '<textarea placeholder="yourname@domain.com, example@domain.com" class="form-control email-input" name="emails" id="email-addresses" rows="3">'+
    '</textarea><label for="fromname" class="form-label">Your Name:</label>'+
    '<input type="text" name="fromname" id="fromname-input" class="form-control" placeholder="Your Name"/>'+
    '<button data-issueid="'+issueId+'" data-clipid="'+clipId+'" data-clipkey="'+clipKey+'" '+
    'type="button" class="btn btn-primary form-control sendemail" style="text-align:center">Send</button</div>');
  
  $(".sendemail").click(validateAndSendEmail);

  $("#emailclip-panel .panel-close-btn").click(closeEmailClip);
}


function showPreClipped() {
  //load and display clips
  $('.clip-box').remove();
  var pageKey = pageData[de.page].key;
  displayPreClipped(pageKey, false);
  if (!isSingleView()){
    if (pageData.hasOwnProperty(Number(de.page)+1)){
      displayPreClipped(pageData[Number(de.page)+1].key, true);
    }
  }
}

function prepareForClipping(){
  isClipping = true;
  if(clippingObj) {
    clippingObj.setOptions({ show: true, persistent: true, enable:true });
  }
}

function clipSelectionChange(e){
  var pageOffset = $pageContainer.offset();
  var clipSelection = clippingObj.getSelection();
  var firstTime = (e ? e.firstTime : false);
  if(clipSelection.width < 10){
    return;
  }
  var top = pageOffset.top + clipSelection.y1 - (firstTime ? 110 :56);
  var leftM = pageOffset.left + clipSelection.x1 + clipSelection.width/2 - 111;
  $('#clip-options').remove();
  $('body').append('<div style="top: '+top+'px; left: '+leftM+'px; display: block;" id="clip-options" class="popover fade top in" role="tooltip">'+
    '<div style="left: 50%;" class="arrow"></div><h3 style="display: none;" class="popover-title"></h3><div class="popover-content">'+
    (firstTime ? '<p>Re-size and place this box where you want to clip</p>' : '')+
    (firstTime ? '' : '<button id="clip-options-save" class="btn btn-primary">Clip &amp; Share</button>') +
    '<button id="clip-options-cancel" class="btn btn-link"><i class="fa fa-times"></i> Cancel</button></div></div>');
  $('#clip-options-save').unbind('click').click(startClipping);
  $('#clip-options-cancel').unbind('click').click(cancelClipping);
}

function clipBtnClick(){
  if(!clippingObj){
    return;
  }
  if (!clippingObj.getSelection().width){
    var l = $(window).scrollLeft();
    var t = $(window).scrollTop();
    clippingObj.setOptions({ show: true, x1: l+300, y1: t+50, x2: l+550, y2: t+150 });
  }
  prepareForClipping();
  clipSelectionChange({'firstTime':true});
}

function cancelClipping(){
  if(clippingObj) {
    clippingObj.cancelSelection();  
  }
  $('#clip-options').remove();
  isClipping = false;
  if(clippingObj) {
    clippingObj.setOptions({ persistent: false });
    if(de.zoom > 1){
      //disable clipping
      clippingObj.setOptions({disable:true});
    }
    clippingObj.update();
  }
  $('#page-level-bar').removeClass('flip');
  
  $('#clipping-panel .clipactions.share').hide();
  $('#clipping-panel .clipactions.save').show();
  $('#save-clip-form').show();
  $('#clipping-panel .linktoclip').hide();
  $('#clipping-panel .btn.saveclipinfo').text('Save');
  
  $('#suggested-clip-box').show();
  $(".create-new").hide();
  
  $("#new_clip").hide();
  $('body').css('overflow','visible');
}

function closeSaveClip(){
  $('.modal-close').hide();
  var callee = arguments.callee;
  $('.modal-close').each(function(idx,elem){
    $(elem).unbind('click', callee);
  });
  $('#clipping-panel').hide();
  cancelClipping();
}

function saveClipInfo(){
  var nonce = $('#clipping-panel .btn.saveclipinfo').data('nonce');
  var clipid = $('#clipping-panel .btn.saveclipinfo').data('clipid');
  var type = $('#type-of-clip').val();
  if(!type){
    type = 'other';
  }
  $('#clipping-panel .btn.saveclipinfo').text('Saving...');
  $.getJSON(deconf.baseUrl+'clip/setcliptype/'+clipid+'/'+type+'/'+nonce, function(response){
    $('#clipping-panel .clipactions.share').show();
    $('#clipping-panel .clipactions.save').hide();
    $('#save-clip-form').hide();
    $('#clipping-panel .linktoclip').show();
  });
}

function createNewClip(){
  
  $("#suggested-clip-box").hide();

  $('#new_clip').show();

  $('#new_clip .loader').show();
  //$('#clip-options').remove();
  var selection = clippingObj.getSelection();
  if((selection.width < 50) || (selection.height) < 50){

    alert('Very small clip. Please increase the size');
    return;
  }

  viewerAnalytics('send', 'event', 'clip', 'create-new', 'desktop-v4' );

  var pagekey = pageData[de.page].key;
  var x0 = selection.x1 / Number(currentLevel.width),
      y0 = selection.y1 / Number(currentLevel.height),
      x1 = selection.x2 / Number(currentLevel.width),
      y1 = selection.y2 / Number(currentLevel.height);

  x0 = (x0 > 0)? x0 : 0;
  y0 = (y0 > 0)? y0 : 0;
  x0 = (x0 < 1)? x0 : 1;
  y0 = (y0 < 1)? y0 : 1;

  x1 = (x1 > 0)? x1 : 0;
  y1 = (y1 > 0)? y1 : 0;
  x1 = (x1 < 1)? x1 : 1;
  y1 = (y1 < 1)? y1 : 1;

  //open a modal window
  $('#clipping-panel .btn.saveclipinfo').unbind('click').css('visibility','hidden');
  $('#clipping-panel .clipimage').css('background-image',"url('')");
  
  $.getJSON(deconf.baseUrl+'clip/create/'+pagekey+'/'+x0+'/'+y0+'/'+x1+'/'+y1,{
    host: DEConfig.baseUrlLink
  },function(response){
      if(response.status == false) {

        $('#clipping-panel').hide();
        $('#new_clip .loader').hide();
        $('.modal-close').hide();
        alert(response.message);
        clippingObj.cancelSelection();
        cancelClipping();
        return;
      } else if (!response.clipid) {

        $('#clipping-panel').hide();
        $('#new_clip .loader').hide();
        $('.modal-close').hide();
        alert('There was an error in creating the clip. Please try again');
        clippingObj.cancelSelection();
        cancelClipping();
        return;
      } else {

        trackPage('create-clip',response.key);
        $('#clipping-panel .btn.saveclipinfo').unbind('click').click(saveClipInfo).css('visibility', 'visible')
          .data('nonce',response.nonce)
          .data('clipid',response.clipid);
        var cliplink = deconf.baseUrlLink+'c/'+response.clipid;
        var clipimg = "https://cache.epapr.in/"+deconf.issueId+"/"+response.key+"/page.jpg";
        $('#clip-link').val(cliplink);
        $('#clipping-panel .link').attr('href',cliplink);
        $('#new_clip .loader').hide();
        $('#clipping-panel .clipimage').css('background-image',"url("+clipimg+")");
        $('#clipping-panel .clipactions .btn').data('src', cliplink);
        $('#clipping-panel .clipactions .email').data('issueid', deconf.issueId).data('clipid',response.clipid).data('clipkey',response.key);
        $('.clipactions .btn.download').attr('href', cliplink);
        $('#cliplink').attr('href', cliplink);
      }       
  });
}

function startClipping(){

  $("#suggested-clips .suggest_clip").remove();// remove previous suggested clips
  $('#clip-options').remove();
  var selection = clippingObj.getSelection();

  if((selection.width < 50) || (selection.height) < 50){

    alert('Very small clip. Please increase the size');
    return;
  }

  viewerAnalytics('send', 'event', 'clip', 'init', 'desktop-v4' );

  var pagekey = pageData[de.page].key;
  var x0 = selection.x1 / Number(currentLevel.width),
      y0 = selection.y1 / Number(currentLevel.height),
      x1 = selection.x2 / Number(currentLevel.width),
      y1 = selection.y2 / Number(currentLevel.height);

  x0 = (x0 > 0)? x0 : 0;
  y0 = (y0 > 0)? y0 : 0;
  x0 = (x0 < 1)? x0 : 1;
  y0 = (y0 < 1)? y0 : 1;

  x1 = (x1 > 0)? x1 : 0;
  y1 = (y1 > 0)? y1 : 0;
  x1 = (x1 < 1)? x1 : 1;
  y1 = (y1 < 1)? y1 : 1;

  
  $('body').css('overflow','hidden');
 
  $('.modal-close').show().click(closeSaveClip);
  
  $(".suggested-clip-header").html("");
  $('#clipping-panel').show();
  $("#clipping-panel #suggested-clip-box").show();
  
  $('#suggested-clip-box .loader').show();
  /****** Suggested clip api call ****/
  $.getJSON(deconf.baseUrl+'clip/suggestClips/'+pagekey+'/'+x0+'/'+y0+'/'+x1+'/'+y1,{
    host: DEConfig.baseUrlLink
  },function(response){

      if(response.status == false) {

        $('#clipping-panel').hide();
        $('.modal-close').hide();
        swal(response.message);
        clippingObj.cancelSelection();
        cancelClipping();
        return;
      } else if ( response.hasOwnProperty('data') && response.data != null && response.data.hasOwnProperty('duplicates') && response.data.duplicates != null ) {

          viewerAnalytics('send', 'event', 'clip', 'show-suggestion', 'desktop-v4' );
        
          $(".suggested-clip-header").html("<h3><b>Are you looking for these clips ?</b></h3> ");
          $('#suggested-clips .loader').hide();
          $(".create-new").show();
         
          var clip_data = response.data.duplicates;
          for(var clip in clip_data){
            
            var cliplink = deconf.baseUrlLink+'c/'+clip_data[clip].id;
            var clipimg = "https://cache.epapr.in/"+deconf.issueId+"/"+clip_data[clip].key+"/page.jpg";
            //console.log(clipimg);
            var suggested_clip = 
            "<div class='suggest_clip'>"+
              "<a class='link' href="+cliplink+">"+
                "<span class='suggested_clipimage' style='background-image : url("+clipimg+");'></span> </a>"+
              "<div class='form-group linktoclip'>"+
                "<label for='clip-link' style='float: left;'>Link to this clip</label>"+
                "<input type='text' class='form-control' value="+cliplink+" readonly>"+
              "</div>"+
              "<a class='btn btn-default' target='_blank' style='margin-top:-5px;' href="+cliplink+">"+
                "<i class='fa fa-external-link'></i><span style='font-weight: bold; font-size: 12px; line-height: 20px; margin: 0px 4px;''>Open</span>"+
              "</a>"
            "</div>";

            $("#suggested-clips").append(suggested_clip);
          }
      } else {
        
        createNewClip();

      }
  });
}

function preloadPage(){

  //if ( DEConfig.refreshOnPageChange ) return;
  
  //preload defalut level chunks 
  pages = isSingleView() ? [Number(de.page)+1, Number(de.page)-1] : [Number(de.page)+2, Number(de.page)+3, Number(de.page)-1, Number(de.page)-2];
  for(var i = 0; i < pages.length; i += 1){
    level = getLevel(pages[i], 1);
    if(level){
      for(var chunkIdx=0; chunkIdx < level.chunks.length; chunkIdx += 1){
        var img = new Image();
        renderImage( img, level.chunks[chunkIdx].url );
        //img.src = level.chunks[chunkIdx].url;
      }
    }
  }   


  //DOWNLOAD PAGEMETA
  var PAGE_FROM = (PAGINATION.PAGE * PAGINATION.RECORD) + 1;
  var PAGE_TO = (PAGINATION.PAGE+1) * PAGINATION.RECORD;
  if (PAGE_FROM>deconf.numPages) return;

  if ($.inArray(PAGE_FROM+'-'+PAGE_TO,PAGINATION.REQUESTED)!=-1)return;
  PAGINATION.REQUESTED.push(PAGE_FROM+'-'+PAGE_TO);

  var pagemetaurl = deconf.baseUrl+'pagemeta/'+getPageMetaType()+'/'+deconf.issueId+'/'+PAGE_FROM+'-'+PAGE_TO;
  pagemetaurl = pagemetaurl + ((deconf.isPaid && deconf.loggedin) ? '?user=' + userdata.id + '&crypt=' + userdata.crypt + '&key=' + userdata.key + '&type=' + DEConfig.pType : '');
  $.getJSON(pagemetaurl,function(response){
      for (var num in response){
        pageData[num] = response[num];
      }

       if (DEConfig.mode=='sample'){    
        DEConfig.numPages = Object.keys(pageData).length;   
        showPageNumberOnNavbar();   
      }

      PAGINATION.PAGE = PAGINATION.PAGE + 1;
      $(window).trigger(deEvents.pageDataLoaded);
      $(window).trigger('pageLoadedEvent');
    }
  );
  
}

function getPageMetaType(){
  if (deconf.needsAuth){
    if (deconf.isPaid){
      //paid volumes
      if (deconf.isAuth){
        return 'get';
      }else{
        changeHashForPage(de.mode, 1);
        return 'getsample';
      }
    }else{
      //subscribers only volumes
      if(deconf.loggedin){
        return 'get';
      }else{
        changeHash(de.section,1);
        return 'getsample';
      }
    }
  }else{
    //free volume
    return 'get';
  }
}

function onPageClick(evt){
  if(Number(de.zoom) == 1){
    de.zoomIn();
  } else if(Number(de.zoom) == 2 && !preventClick){
    $('.btn_prev').removeClass('zoom_arrow_fixed');
    $('.btn_next').removeClass('zoom_arrow_fixed');
    de.zoomOut();  
  } 
}

function isSingleView(){
    return (de.mode=='page' || de.page==1 || de.page==deconf.numPages) ? true : false;
}

$( "#de-page-container" ).mouseleave(function() {
  $("#de-page-container").unbind('mousemove');
});

function autoScroll(){
        pageWidth=0,
        pageHeight=0,
        screenWidth=0,
        screenHeight=0,
        screenMouseX=0,
        screenMouseY=0,
        pageTop=0,
        pageLeft=0,
        avgScrollLeft=0,
        avgScrollTop=0,
        avgScrollRight=0,
        avgScrollBottom=0;

    $("#de-page-container")
        .unbind('mouseenter')
        .bind('mouseenter',function(evt){
            calculationForAutoScroll(evt);
        })
        .unbind('mousemove')
        .bind('mousemove',function(evt){
            if (de.zoom>1){
                var posDiffX = evt.clientX - screenMouseX;
                var posDiffY = evt.clientY - screenMouseY;

                if ((posDiffX)>0 && avgScrollRight){
                    //scroll right
                    $(window).scrollLeft($(window).scrollLeft() + (posDiffX * avgScrollRight));
                }else if ((posDiffX)<0 && avgScrollLeft){
                    //scroll left
                    $(window).scrollLeft($(window).scrollLeft() - (Math.abs(posDiffX) * avgScrollLeft));
                }

                if ((posDiffY>0) && avgScrollBottom){
                    //scroll bottom
                    $(window).scrollTop($(window).scrollTop() + (posDiffY * avgScrollBottom));
                }else if ((posDiffY<0) && avgScrollTop){
                    //scroll top
                    $(window).scrollTop($(window).scrollTop() - (Math.abs(posDiffY) * avgScrollTop));
                }
                calculationForAutoScroll(evt);
                evt.preventDefault();
            }
        })
        ;

}

function calculationForAutoScroll(evt){
    pageWidth = $("#de-page-container").width(),
    pageHeight = $("#de-page-container").height(),
    screenWidth = $(window).width(),
    screenHeight = $(window).height(),
    screenMouseX = evt.clientX,
    screenMouseY = evt.clientY,
    pageTop = $("#de-page-container").offset().top - $(window).scrollTop(),
    pageLeft = $("#de-page-container").offset().left - $(window).scrollLeft();

    if (pageTop<0){
        avgScrollTop = Math.abs(pageTop) / screenMouseY;
        avgScrollBottom = (pageHeight - (Math.abs(pageTop) + screenHeight)) / (screenHeight - screenMouseY);
    }else{
        avgScrollTop = 0;
        avgScrollBottom = (pageHeight > screenHeight) ? ((pageHeight - screenHeight + pageTop) / (screenHeight - screenMouseY)) : 0;
    }

    if (pageLeft<0){
        avgScrollLeft = Math.abs(pageLeft) / screenMouseX;
        avgScrollRight = (pageWidth - (Math.abs(pageLeft) + screenWidth)) / (screenWidth - screenMouseX);
    }else{
        avgScrollLeft = 0;
        avgScrollRight = (pageWidth > screenWidth) ? ((pageWidth - screenWidth + pageLeft) / (screenWidth - screenMouseX)) : 0;
    }
}

function showComments(){
    if ($("#de-comments").css('display')=='none')
        $("#de-comments").show();
    else if ($("#de-comments").css('display')=='block')
        $("#de-comments").hide();

    if ($("#de-comments").length==0){
        var offset = $("#de-comments-btn").offset();
        $($("#de-comments-tmpl").html())
            .css({'left':offset.left+'px'})
            .css({'top':offset.top+25+'px'})
            .appendTo('body');
        $("#volume-fb-comments").attr('data-href',deconf.baseUrl+deconf.issueId);
        if (window.FB){
            FB.init({
                xfbml : true
            })
        }

        $("#de-comments .title .close").click(function(){
           $("#de-comments") .hide();
        });
    }
}

function loadPlugins(){
    page_key = pageData[de.page].key;
    //see which plugins are to be loaded
    //load their attributes
    //and show them as they are loaded
    var plugins = [];
    //for caching responses
    if(typeof(DE.plugincache) == 'undefined') DE.plugincache = {};
    if(typeof(DE.plugincache[page_key]) == 'undefined'){
        DE.plugincache[page_key] = {};
    }

    for(var plugin in DE.plugins){
        if(!DE.plugins.hasOwnProperty(plugin)) continue;
        plugins.push(plugin);
    }

    if (DE.plugincache[page_key]['plugin']){
        showPlugin(DE.plugincache[page_key]['plugin'],"left");
    }else{
        getPlugins(page_key,plugins,"left")
    }

    if (!isSingleView()){
        right_page_key = pageData[Number(de.page)+1].key;

        if(typeof(DE.plugincache[right_page_key]) == 'undefined'){
            DE.plugincache[right_page_key] = {};
        }

        if (DE.plugincache[right_page_key]['plugin']){
            showPlugin(DE.plugincache[right_page_key]['plugin'],"right");
        }else{
            getPlugins(right_page_key, plugins, "right")
        }
    }
}

function getPlugins(key,plugins,pageside){
    if( requested_plugins.indexOf(key) !== -1 ){

      return;
    }

    requested_plugins.push(key);
    
    $.getJSON(deconf.baseUrl+ 'attributes/getv3/'+key+'/'+plugins.join('/'),
            function(response){
               DE.plugincache[key]['plugin'] = response;
               showPlugin(response,pageside);
            });
}

function showPlugin(response, pageside){
    for (var plugin in response){
      loadlibrary(DE.plugins[plugin].requirelibs, DEConfig.baseUrl);
       var num_items = response[plugin].length;
       var item;
       
       for(var i=0; i<num_items; i+=1){
          if (pageside=="left"){
            if (response[plugin][i]["attributes"]["pagekey"]!=pageData[de.page].key) return;
          }
          if (pageside=="right"){
            if (response[plugin][i]["attributes"]["pagekey"]!=pageData[Number(de.page)+1].key) return;
          }
          item = response[plugin][i];

          if( (plugin == 'gallery' && DEConfig.plugins['gallery-version'] == "v2") || (plugin == 'video' && deconf.plugins['video-version'] == "v2") || (plugin == 'upload_video' && deconf.plugins['upload_video-version'] == "v2") ){
            DE.plugins[plugin].onShowV2(item, pageside);
          }else{
            DE.plugins[plugin].onShow(item, pageside);
          }
          //DE.plugins[plugin].onShow(item, pageside);
        }
   }
}

function changePageForSource(page_no, src) {
  switch(src) {
    case 'link_plugin' : 
      changeHashWithZoom('page', page_no, DE.zoom);
      $("html, body").animate({ scrollTop: 0 }, 600); 
      break;
  } 
}

function loadlibrary(lib_array, base_path){
    var loadScript = function(d, s, id, src) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) {return;}
            js = d.createElement(s);js.id = id;
            js.src = src;
            fjs.parentNode.insertBefore(js, fjs);
          };

    var loadStyle = function(d, s, id, src) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) {return;}
            js = d.createElement(s);js.id = id;
            js.href = src;
            js.rel = 'stylesheet';
            fjs.parentNode.insertBefore(js, fjs);
          };

    if (lib_array.length){
        for (i=0; i<lib_array.length; i++){

            if(lib_array[i].url == 'partial' && base_path != undefined){

              lib_array[i].src = base_path + lib_array[i].src;
            }

            if (lib_array[i].src.substr(lib_array[i].src.length-3)=='css'){

              loadStyle(document,'link',lib_array[i].id, lib_array[i].src);
            }else{

              loadScript(document,'script',lib_array[i].id, lib_array[i].src);
            }
        }
    }
}

function drawAugmentedBox(x0,y0,x1,y1, elem, pageside){
    var level= currentLevel;
    var h = Number(level.height);
    var w = Number(level.width) ;
    var box;
    if(elem){
        box = document.createElement(elem);
    }else{
        box = document.createElement('div');
    }
    var boxheight = (y1 * h - y0 * h);
    var boxwidth = (x1 * w - x0 * w);
    box.style.position = 'absolute';
    box.style.display = 'block';
    box.style.top = (y0 * h) + 'px';

    if (pageside=="left"){
        box.style.left =(x0 * w) + 'px';
    }else if (pageside=="right"){
        box.style.left = ((x0 * w) + w) + 'px';
    }

    box.style.height=boxheight+'px';
    box.style.width=boxwidth+'px';
    //box.style.backgroundImage='url("https://sf.readwhere.com/read/theme/images/Transparent.gif")';
    //box.style.zIndex = 11;
    box.setAttribute('class', 'augmented-box');
    return box;
}

function validEmail(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}

function closeFeedback(){
  $('.modal-close').hide().unbind('click',closeFeedback);
  $('#feedback-sent').remove();
  $('#feedback-panel').hide();
}

function showFeedback(){

  if( deconf.loggedin ){
    
    $('#feedback-fromemail-input').val(userdata.email);
  }

  $('.modal-close').show().click(closeFeedback);
  $('#feedback-panel').show().find('.panel-close-btn').click(closeFeedback);
  $('#feedback-send').show();
  var sendFeedback = function(e){
    var txt = $('#feedback-box').val().substr(0,1000);
    var fromemail = $('#feedback-fromemail-input').val();
    if(!txt){

      $("#feedback-panel .feedback-message.error").show();
      return;
    } else {

      $("#feedback-panel .feedback-message.error").hide();
    }

    if (!fromemail || !validEmail(fromemail)){
      $("#feedback-panel .email.error").show();
      return;
    } else {
      
      $("#feedback-panel .email.error").hide();
    }

    $('#feedback-send').hide();
    $('#feedback-panel').append('<div id="feedback-sending" style="text-align:center">'+
      '<i class="fa fa-spin fa-cog" style="font-size:24px;text-align:center;"></i></div>');
    $.post(deconf.baseUrl + 'feedback/send',
      {
        'response' : txt,
        'email'   : fromemail,
        'url': encodeURIComponent(window.location),
        'titleid': DEConfig.titleId,
        'volumeid': DEConfig.issueId,
        'viewer_version': DEConfig.viewer_version
      },
      function(response){
          $("#feedback-sending").remove();
          $('#feedback-panel').append('<div id="feedback-sent"><p style="text-align:center;">Feedback sent</p><div style="text-align:center"><button type="button" class="btn btn-link">Close</button></div></div>');
          $('#feedback-sent').click(closeFeedback);
      });
  }

  $('#feedback-send').unbind('click').click(sendFeedback);
}

function closeAbout(){
  $('.modal-close').hide().unbind('click',closeAbout);
  $('#about-panel').hide();
}

function showAbout(){
  $('.modal-close').show().click(closeAbout);
  $('#about-panel').show()
}

function closeWhitelabelAbout(){
  $('.modal-close').hide().unbind('click',closeWhitelabelAbout);
  $('#whitelabel-about-panel').hide();
}

function showWhitelabelAbout(){
  $('.modal-close').show().click(closeWhitelabelAbout);
  $('#whitelabel-about-panel').show()
}

function getCookies(c_name){
    var i,x,y, cookies = document.cookie.split(";");
    for (i=0;i<cookies.length;i++){
        x = cookies[i].substr(0,cookies[i].indexOf("="));
        y = cookies[i].substr(cookies[i].indexOf("=")+1);
        x=x.replace(/^\s+|\s+$/g,""); //trim
        if (x==c_name){
            return unescape(y);
        }
    }
    return '';
}

function checkCookies(){
    var cookie = getCookies('de');
    if (cookie!=''){
        cookie = cookie.split(',');
        deconf.showSidebar = (cookie[0]=='true') ? true : false;
        deconf.isautoScroll = (cookie[1]=='true') ? true : false;

        if (deconf.isautoScroll){
            $(window).trigger('autoScrollEvent');
        }
    }else{
        $(window).trigger('showSidebar');
    }
    $(window).unbind(deEvents.renderPage, checkCookies);
}

function setCookies(c_name,value,exdays){
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
    document.cookie = c_name + "=" + c_value + "; path=/";
}

function changepdf(){
    var pdflink = deconf.baseUrl+'pdf/get/'+deconf.issueId+'/'+de.page;
    $('#de-page-toolbox .de-pdf-link').html(
        '<a target="_top" href="'+pdflink+'" title="Download this page"><img src="https://sf.readwhere.com/read/theme/images/Transparent.gif" width="55" height="20" /></a>'
    );
}

function showHideAds(){
    if (de.zoom>1){
        $("#de-side-ad").hide();
        $("#de-right-small-ad").hide();
    }else{
        $("#de-side-ad").show();
        $("#de-right-small-ad").show();
    }
}

function intrestitialAds(){

  this.close = function(){

    $("#modal-close-btn").unbind('click', this.close);
    $('.modal-close').hide()
    $('#intrestitial-ads-panel').hide();
  }

  this.show = function(){
    
    if( !DEConfig.ad_display_intrestitial_page_change || page_change_count%4 ){
      return;
    }

    $('.modal-close').show()
    $('#modal-close-btn').hide()
    $('#intrestitial-ads-panel').show();

    setTimeout(function(){
      $("#modal-close-btn").show().click(this.close);
    }.bind(this), 5000)
  }
}

function removeAutoHideElements(){
    $(".autoclose").remove();
}

function checkLogin(){

  $.getJSON(DEConfig.rwBaseHttps+'api/checklogin?callback=?',
  function(response){

    if (response.id){

      deconf.loggedin = true;
      userdata = response;
      showuserinfo();
    }else if (response.result=="toc_failed"){

      window.location.href= response.url + '?ru='+window.location.href;
      return;
    }else{

      $(".btn.subscribe").css('visibility','visible');
    }
    loginChecked();
  });
}

function checkAuth(){

    if (!deconf.isPaid){

        deconf.isAuth = true;
        authChecked();
        return;
    }

    if( !DEConfig.loggedin ) {

      authChecked();
      return;
    }


    //$.getJSON(deconf.baseUrl+'shelfapi/isinshelf/'+userdata.id+'/'+deconf.issueId+'/'+userdata.crypt+'/'+userdata.key+'?callback=?',
    /*$.getJSON(deconf.baseUrl+'shelfapiv2/isinshelf/'+userdata.session_key+'/'+deconf.issueId+'?callback=?',
    function(response){
        if (response.status==true && response.inShelf==true){
            deconf.isAuth = true;
        }
        authChecked();
    });*/

    $(window).bind(nLimitedEvents.authReadCheckComplete, function(e, custom_data){

        if(!custom_data.status){ 

          authChecked();
          return;
        }

        if ( custom_data.data.isinshelf==true || custom_data.data.ispublisher==true) {

          DEConfig.isAuth = true;
        } else if ( DEConfig.nlimited==true && custom_data.data.nlimited==true ){

          DEConfig.isAuth = true;
          nLimitedSession = true;
          $(window).trigger('n-limited-init', [{vol_id: DEConfig.issueId, title_id: DEConfig.titleId, publisher_id: DEConfig.publisherId, vol_type: DEConfig.pType, language: DEConfig.language, user_id: userdata.session_key }]);
        }

        authChecked();
    });

    $(window).trigger(nLimitedEvents.authReadCheck, [{"0":userdata.id,"1":userdata.crypt,"2":userdata.key,"3":DEConfig.issueId,"4":userdata.isPublisher}])
}

function getRwconnectLibrary() {
  var libs = [
    {
      'id': 'rwconnect',
      'src': DEConfig.rwBaseHttps+'js/rwconnect/allV2.js'
    }
  ];
  loadlibrary(libs);
}

function loginChecked(){

  function initRWConnect(){

    window.rwAsyncInit = function() {

      RW.init({

        appId: DEConfig.appId
      });

      $("#user_login .login-link").click(function(){

        trackEvent('viewer_login', 'click' );
        RW.login( function( response ) {} );
      });

      $( ".rw-buy-box .loader" ).hide();
      $( ".login-required" ).click( function () {
        
        RW.login( function( response ) {} );
      })
    }

    getRwconnectLibrary();
  }


  $('.contentloader').hide();

  if( DEConfig.archived ){

    if ( DEConfig.loggedin ){
      
      $("#de-login-before-read .loader").show();
      $("#de-login-before-read .buy-box-info").hide();
      authenticateArchiveVolume();
    }else{
      showAuthenticatePage();
    }
  } else if ( DEConfig.enableLogin && !DEConfig.isPaid) {

    if ( DEConfig.loggedin ) {

      hideSigninPage();
      hideAuthenticatePage();
      checkUrl();
      documentReady();
    } else {

      authenticateIssue();
    }
  } else if (DEConfig.needsAuth){ //isPaid

      if (DEConfig.loggedin){

          checkAuth();
      }else{

        $("#de-subscribe-login-box .loader").hide();
        $("#de-subscribe-login-box .buy-box-info").show();
      }
  } else if ( DEConfig.read_behind_login ) {

    if( !DEConfig.loggedin ) {

      showAuthenticatePage();
      initRWConnect();
    }else if(DEConfig.custom_user_profile && DEConfig.custom_user_profile != ''){
        var event = $.Event("userRegistrationEvent");
        event.userdata = userdata;
        $(window).trigger(event);
    } else {

      checkAuth();
    }
  }

  //integrate rwconnect
  if ( !DEConfig.loggedin ) {

    initRWConnect();
  } 

  if ( window.location.host == extractHostname( DEConfig.rwBase ) ) {

    if ( DEConfig.loggedin ) {

      $("#user_login .user-login-subscribe").show();

      //set visitor type guest / registered for rw analytics only
      trackEvent('viewer_user_status', 'registered' );
    } else {

      //set visitor type guest / registered for rw analytics only
      trackEvent('viewer_user_status', 'guest' );
    }

    documentReady();
  }
  //viewcount();
}

function authChecked(){

  if (DEConfig.isAuth){

      if( DEConfig.isPaid ){

        //$('#de-subscribe-login-box').hide();
        hideSigninPage();
      } else {

        hideAuthenticatePage();
      }
  }else{

    $(".rw-buy-box .loader").hide();
    $(".rw-buy-box #buy-box-info").show();

    if( DEConfig.loggedin ) {
      //for mathrubhumi v3-1 viewer (hide already purchased button for login)
      $('.product-already-purchased').hide();
    }
  }

  if( DEConfig.isPaid && DEConfig.isAuth ){

    $.post(DEConfig.baseUrl+'viewer/track',{
      user_id: userdata.id,
      publisher_id: DEConfig.publisherId,
      title_id: DEConfig.titleId,
      volume_id: DEConfig.issueId
    }, function(response){ 
    })
  }
}

function closesignin(){
    $("#de-signin-box").dialog('destroy');
    $("#de-signin-box").remove();
    checkLogin();
}

function addUserClip(response){
    if (deconf.loggedin){
        var key = response.key;
        var id = response.clipid;
        var clip_link = deconf.baseUrl+'c/'+id;
        var thumb = deconf.cdnBase+deconf.issueId+'/'+key+'/thumb.jpg';
        $.getJSON(deconf.authBase+'api/setuserclip?callback=?',
		{
			'link':clip_link,
			'thumb':thumb,
			'clipid':id,
			'url':DEConfig.baseUrl
		},
            function(response){});
    }
}

// show user info updated as in we have for viewer v3 and commenting out viewer v4 showuser info function
function showuserinfo(){
    $('.login-link').hide();
    $('.login-link-free').hide();
    var profile = $('.rw-header-link.profile').show();
    profile.find('.name').text(userdata.name);
    $('.rw-header-link.loginonly').show();

    var profilepic = '';
    if(userdata.profilepic && userdata.profilepic != '' && userdata.profilepic != "default") {
      profilepic = '<img src="'+userdata.profilepic.replace('http:','https:')+'">';
    } else {
      image = DEConfig.baseUrl+'styles/images/user_default.png';
      profilepic = '<img src="'+image+'">';
    }
    $('.madv4_user_photo').html(profilepic);
    
    var fullname = userdata.firstname + ' ' + userdata.lastname;
    
    var username = userdata.name;
    var display_name = '';
    if (fullname.substring(0, 4) != 'user' && fullname != ' ') {
      display_name = fullname;
    } else if (username.substring(0, 4) != 'user') {
      display_name = username;
    } else {
      display_name = userdata.email;
    }

    var char_count = 8;
    if($(".login-link-free").length ) {
      char_count = 20;
    }
    name = display_name;
    if(display_name.length > char_count) {
      name = display_name.substring(0, char_count) + '...';  
    }
    
    $('.madv4_user_name').html(name + '<span class="caret"></span>');

    $(".profile.rw-header-link")
      .click(function(e){
        if($(this).hasClass('open')){
          $(".profile.header-dropdown").hide();
          $(this).removeClass('open').addClass('close');
          return;
        }
        offset = $(this).offset();
        $(".profile.header-dropdown")
            .css({'right':'-1px',
                'width':'100px'}).show();
        $(this).removeClass('close').addClass('open');
        var thisItem = this;
        $(document).mousedown(function(e){
          if($(thisItem).hasClass('open')){
            if(! $(e.target).is('.rw-header-link.list')){
              e.preventDefault();
              e.stopPropagation();
              $(".profile.header-dropdown").hide();
              $(thisItem).removeClass('open').addClass('close');
            }
          }
          $(document).unbind('mousedown', arguments.callee);
        });
    });
}

function viewcount(){
    var userid = (typeof(userdata)=='undefined') ? 0 : userdata.id;
    if (userid){
      $.getJSON(deconf.baseUrl+'api/viewcount/'+deconf.issueId+'/'+deconf.titleId+'/'+
                userdata.id+'/'+userdata.crypt+'/'+userdata.key,function(){});
    }else{
      $.getJSON(deconf.baseUrl+'api/viewcount/'+deconf.issueId+'/'+deconf.titleId+'/'+userid,function(){});
    }
}

function openSubscribe(){
  if ($("#de-subscription-box").length > 0){
      $("#de-subscription-box").remove();
      return;
  }

  var clientWidth = document.body.clientWidth;
  $($('#de-subscription-box-tmpl').html())
  .appendTo('body')
  .css({'left':(clientWidth/2-250)+'px','top':'300px','position':'fixed'});

  if (typeof(userdata)!="undefined" && typeof(userdata.email)!=undefined){
      $('.subscription-email').val(userdata.email);
  }
  $('#de-subscription-box .message').hide();

  $("#de-subscription-box .title .close").click(openSubscribe);
  $('#de-subscription-box .btn.submit').unbind('click').click(
  	function(evt){
  		var name = $('.subscription-name').val();
  		var email = $('.subscription-email').val();
  		var titles = [DEConfig.titleId];
  		var regexp= /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

      if (!name){
        $('.subscription-info').text('Please enter your name');
        return;
      }

      if (!regexp.test(email)){
        $('.subscription-info').text('Invalid email, please check');
        return;
      }

      $('#de-subscription-box .list-form').hide();
      $("#de-subscription-box .wait").show();
  	  $.post(DEConfig.baseUrl + 'subscriber/add',
      		  {
              'name': name,
      		    'email': email,
      		    'titles': titles.join(',')
            },
      		  function(response){
      		    $("#de-subscription-box .wait").hide();
      		    $('#de-subscription-box .message').show();
      		    $('#de-subscription-box .message h3').text('Thanks '+name);
      		    $("#de-user .subscribe").hide();
      		  }
  	  );
  	}
  );

}

function showAuthenticatePage() {
    $("#page-level-bar").hide();
    $("#content-row").hide();
    $("#page-bottom").hide();
    $("#taboola-below-article-thumbnails").hide();
    $(".adunit").hide(); 
    $(".btn_prev").hide();
    $(".btn_next").hide(); 
    $('.watsnew').hide();
    $('.header_mainnavbar').hide();

    $("#de-login-before-read").remove();
    $($("#de-login-before-read-tmpl").html()).appendTo('#content-container');
    $("#de-login-before-read .loader").hide();
}

function hideAuthenticatePage() {
    $("#page-level-bar").show();
    $("#content-row").show();
    $("#page-bottom").show();
    $("#taboola-below-article-thumbnails").show();
    $(".adunit").show(); 
    $(".btn_prev").show();
    $(".btn_next").show(); 
    $('.watsnew').show();
    $('.header_mainnavbar').show();

    $("#de-login-before-read").remove();
    documentReady();
}

function authenticateIssue() {
  $.getJSON(deconf.baseUrl + 'viewer/isreadabletoguest/'+DEConfig.titleId+'/'+DEConfig.published, function(authenticate){
    if(!authenticate) {
      showAuthenticatePage();
      getRwconnectLibrary();
      window.rwAsyncInit = function() {
        RW.init({
          appId: DEConfig.appId
        });

        $( ".rw-buy-box .loader" ).hide();
        $( ".login-required" ).click( function () {
          
          RW.login( function( response ) {} );
        })
      }
    } else {
      hideAuthenticatePage();  
    }
  });
}

function authenticateArchiveVolume(){

  $.getJSON(DEConfig.rwBaseHttps+'read/archive/isauthenticated/'+DEConfig.issueId+'?callback=?', 
  function(response){

    if( response.status ){

      DEConfig.isAuth = true;
      authChecked();
    } else {

      if( DEConfig.isPaid ){

        new archivePaidVolume().show();
      }else{

        new archiveReadPanel().show();
      }
    }
  })  
}

function archivePaidVolume(){

  this.panel = $('#archive-paid-msg');

  this.show = function(){

    if( DEConfig.loggedin ){
    
      this.panel.find('.user_email').text(userdata.email);
    }

    $('.modal-close').show();//.click(this.close.bind(this));
    $('#modal-close-btn').hide();
    this.panel.show();
  };
}

function archiveReadPanel(){

  this.panel = $('#archive-read-confirmation-panel');

  this.show = function(){

    if( DEConfig.loggedin ){
    
      this.panel.find('.user_email').text(userdata.email);
    }

    $('.modal-close').show();//.click(this.close.bind(this));
    $('#modal-close-btn').hide();
    this.panel.show();

    if( DEConfig.restore_payment_disable ){
      
      this.panel.find('.confirm-btn').unbind('click').click(this.sendConfirmation.bind(this));  
      //this.panel.find('.archive_download-btn').unbind('click').click({restore_type:"pdf"},this.checkoutItem.bind(this));
    }else{

      this.panel.find('.confirm-btn').unbind('click').click({restore_type:"web"},this.checkoutItem.bind(this));
      this.panel.find('.archive_download-btn').unbind('click').click({restore_type:"pdf"},this.checkoutItem.bind(this));
    }
  };

  this.close = function(){

    $('.modal-close').hide().unbind('click',this.close);  
    this.panel.hide();
  };

  this.checkoutItem = function(event){
    
    this.panel.find(".email.error").hide();

    this.panel.find('.confirm-btn').hide();
    this.panel.find('.archive_download-btn').hide();
    this.panel.find('.sending-loader').show();
    subscription_id = 1;

    var url = DEConfig.baseUrl+'checkoutapi/addtoarchivecart/'+DEConfig.issueId+'/'+subscription_id+'/'+
                userdata.id+'/'+userdata.crypt+'/'+userdata.key+'/'+event.data.restore_type;
    $.getJSON(url,
      function(response){

          this.panel.find('.sending-loader').hide();
          if (response.status==true){
              // redirect to checkout page
              window.location = DEConfig.baseUrl+'cartcheckoutv2/show?archive=true';
              return;
              /*$("#"+modal_id).modal('hide');
              getCartItemCount();
              getCartDetail(true);*/
          } else{
              alert(response.error);
          }
      }.bind(this)
    );
  };

  this.sendConfirmation = function(){
    
    this.panel.find(".email.error").hide();

    this.panel.find('.confirm-btn').hide();
    this.panel.find('.sending-loader').show();

    $.post(DEConfig.baseUrl + 'archive/acceptconfirmation',
      {
        'email'   : userdata.email,
        'titleid' : DEConfig.titleId,
        'volumeid': DEConfig.issueId,
        'viewer_version': DEConfig.viewer_version
      },
      function(response){

        this.panel.find('.sending-loader').hide();

        if( response.status ){
          
          this.panel.find('.acknowledgement .success').show();
        } else {
          
          this.panel.find('.acknowledgement .error').text(response.message).show();
        }
      }.bind(this));
  }
}

/*function showArchiveReadConfirmationPanel(){

  var panel = $('#archive-read-confirmation-panel');

  if( DEConfig.loggedin ){
    
    panel.find('[name="user_email"]').val(userdata.email);
  }

  $('.modal-close').show().click(closeFeedback);
  panel.show();
  
  var sendConfirmation = function(e){

    var fromemail = panel.$('#feedback-fromemail-input').val();
    if(!txt){

      $("#feedback-panel .feedback-message.error").show();
      return;
    } else {

      $("#feedback-panel .feedback-message.error").hide();
    }

    if (!fromemail || !validEmail(fromemail)){
      $("#feedback-panel .email.error").show();
      return;
    } else {
      
      $("#feedback-panel .email.error").hide();
    }

    $('#feedback-send').hide();
    $('#feedback-panel').append('<div id="feedback-sending" style="text-align:center">'+
      '<i class="fa fa-spin fa-cog" style="font-size:24px;text-align:center;"></i></div>');
    $.post(deconf.baseUrl + 'feedback/send',
      {
        'response' : txt,
        'email'   : fromemail,
        'url': encodeURIComponent(window.location),
        'titleid': DEConfig.titleId,
        'volumeid': DEConfig.issueId,
        'viewer_version': DEConfig.viewer_version
      },
      function(response){
          $("#feedback-sending").remove();
          $('#feedback-panel').append('<div id="feedback-sent"><p style="text-align:center;">Feedback sent</p><div style="text-align:center"><button type="button" class="btn btn-link">Close</button></div></div>');
          $('#feedback-sent').click(closeFeedback);
      });
  }

  panel.find('.confirm-btn').unbind('click').click(sendConfirmation);
}*/


function showSigninPage(){
    $("#page-level-bar").hide();
    $("#content-row").hide();
    $("#page-bottom").hide();
    $("#taboola-below-article-thumbnails").hide();
    $(".social").hide(); 
    $(".adunit").hide(); 
    $(".btn_prev").hide();
    $(".btn_next").hide(); 
    $($("#de-subscribe-login-box-tmpl").html()).appendTo('#content-container');
    $("#de-subscribe-login-box .preview-btn").click(setSampleMode);

    checkLogin();
    if(de.mode){
      changeHash(de.mode, 1, 1);
    }
}

function hideSigninPage(){
  $(".adunit").show(); 
  $("#taboola-below-article-thumbnails").show();
  $("#page-level-bar").show();
  $("#content-row").show();
  $("#page-bottom").show();
  $(".social").show();
  $(".btn_prev").show();
  $(".btn_next").show(); 
  $("#de-subscribe-login-box").remove();
  documentReady();
}

function showZeroPagesError(){
  $("#page-level-bar").hide();
  $("#content-row").hide();
  $("#page-bottom").hide();
  $("#taboola-below-article-thumbnails").hide();
  $(".social").hide(); 
  $(".adunit").hide(); 
  $(".btn_prev").hide();
  $(".btn_next").hide();  

  $($("#de-zero-pages-error-tmpl").html()).appendTo('body');
}

function changeHashForSearch(mode, page, zoom, query) {
  window.location.hash = mode + '/' + page + '/' + zoom + '/' +query;
}

function changeHashForPage(mode,page) {
  changeHashWithZoom( mode, page, de.zoom );
  //window.location.hash = mode + '/' + page + '/' + de.zoom;
}

function changeHash(section,page){
  changeHashWithZoom( section, page, de.zoom );
  //window.location.hash = section + '/' + page+ '/' + de.zoom ;
}

function changeHashWithZoom(section,page,zoom){

  if ( DEConfig.refreshOnPageChange && DEConfig.mode !='sample' && 
      section != 'clip' && 
      parseInt( de.page ) != parseInt( page ) && 
      parseInt( de.sectionPage ) != parseInt( page ) &&
      window.location.host != extractHostname( DEConfig.rwBase ) ) {
      
      var mode = ($.inArray(parseInt(de.page), DEConfig.doublespread_pages) != -1 ) ? 'page' : section;// : 'page' ;
      
      window.location = getVolumeUrl(DEConfig.issueId)+'/'+page+'/'+mode+'/'+zoom;

      return;
  }

  window.location.hash = section + '/' + page + '/' + zoom;
}

function changeHashForClip(hash){
  window.location.hash = hash;
}

function setSampleMode(){
  DEConfig.mode = 'sample';
  hideSigninPage();
}

function showPageNumberOnNavbar(){
  var numPages;
  if(deconf.sections.hasOwnProperty(de.section)){
    numPages = deconf.sections[de.section].pages.length;
    $('#pagecount-btn').html("of "+numPages+' <i class="fa fa-caret-down"></i>');
  }else{
    numPages = deconf.numPages
    $('#pagecount-btn').html("of "+numPages+' <i class="fa fa-caret-down"></i>');
  }

  if(de.mode == 'dual' && DE.page > 1 && DE.page < numPages ) {
    var text = de.sectionPage + '-' + (Number(de.sectionPage)+1);
  } else {
    var text = de.sectionPage;
  }
  $('#pagenum-input').val(text);  
}

function trackPageChange(){

  if (deconf.customAnalytics && DEConfig.action_page_view==true ) {

    //track event for page views
    //viewerAnalytics('send', 'event', 'content-read', DEConfig.pType, DEConfig.isPaid ? 'paid' : 'free' );

    /*viewerAnalytics('send', {
      'hitType': 'pageview',
      'page': window.location.href.replace(DEConfig.baseUrl,'')
    });*/

    viewerAnalytics('custom.send', {
      'hitType': 'pageview',
      'page': window.location.href.replace(DEConfig.baseUrl,'')
    });
  }

  if( (DEConfig.isPaid & DEConfig.isAuth & DEConfig.loggedin) && userdata && userdata.hasOwnProperty('id') ){

    var eventCategory = 'U'+userdata.id+':P'+DEConfig.publisherId+':T'+DEConfig.titleId+':V'+DEConfig.issueId+':Page'+DE.page.padStart(4,0);
    var eventAction = 'PageRender';
    var eventLabel = DEConfig.pType;

    viewerAnalytics('page_view_tracker.send', 'event', eventCategory, eventAction, eventLabel );
  }
}

function trackClipPage( clipId, clipSource ) {
    /*viewerAnalytics('send', {
      'hitType': 'pageview',
      'page': 'c/'+clipId
    });*/

    if (deconf.customAnalytics && DEConfig.action_page_view==true ) {

      viewerAnalytics('custom.send', {
        'hitType': 'pageview',
        'page': 'c/'+clipId+(typeof (clipSource) == 'undefined' ? '' : '/'+clipSource)
      });
    }
}

function trackPage(type, title){
  if (typeof(viewerAnalytics)=='undefined'){

    return;
  }


  if (type=='page'){
      trackPageChange();return;
  }

  if ( type == 'clip' ) {
    var clipId = title;
    trackClipPage( clipId );
    return;
  } 

  var page = DEConfig.issueId + '/'+type+'/' + title;
  
  /*viewerAnalytics('set', 'dimension1', deconf.titleId);
  viewerAnalytics('send', 'pageview', {
    'page': page,
    'title': title
  });*/

  if (deconf.customAnalytics && DEConfig.action_page_view==true ) {

    viewerAnalytics('custom.send', 'pageview',{
      'page': page,
      'title': title
    });
  }
}

function trackEvent( eventCategory, eventAction, eventLabel, eventValue, options ) {

  viewerAnalytics('send', 'event', eventCategory, eventAction, eventLabel || null, eventValue || null, options || null );

  if (deconf.customAnalytics) {

    viewerAnalytics('custom.send', 'event', eventCategory, eventAction, eventLabel || null, eventValue || null, options || null );
  }
}

function showSections(){
    $('#page-left-panel .tabs').removeClass('active');
    $('#left-panel-sections').addClass('active');
    $('#page-thumbs').removeClass('clips pageclips');
    
    $('#page-thumbs').empty();
    // all pages link from sections
    $("#page-thumbs").append('<a id="all_pages" class="" data-section="all" role="button" href="#"><i class="fa fa-file-text"></i>All Pages</a>');

    for (var sectionKey in DEConfig.sections){
      $("#page-thumbs").append('<a id="'+sectionKey+'" class="panel-section-link" data-section="'+sectionKey+'" role="button" href="#"><i class="fa fa-file-text"></i>'+DEConfig.sections[sectionKey].name+'</a>');
    }

    $('.panel-section-link').click(function(e){
      var sectionKey = $(e.target).data('section');
      changeHash(sectionKey, 1);
      visualizeSectionChange(DEConfig.sections[sectionKey].name);    
    });

    $('#all_pages').click(function(e){
      $('#page-thumbs a').removeClass('section_highlight');
      $('#all_pages').addClass('section_highlight');
      changeHash('page', 1);
      visualizeSectionChange('All Pages');    
    });

    highlightSection(de.page);
    trackPage('panel-sections','Sections');
}

function visualizeSectionChange(text) {
  var current_text =  $('.section_indicator_span').text();
  if($.trim(current_text) === $.trim(text)) {
    return;
  }

  var indicator_text = '<span class="section_indicator_span"> '+text+'</span> ';
  $('.zoom_indicator').html(indicator_text);

  if(text == '') {
    return;
  }
  $(".zoom_indicator").fadeIn(700).delay(500).fadeOut(700);
}

function highlightSection(current_page) {
  if(deconf.sections.hasOwnProperty(de.section)){
    $('#page-thumbs a').removeClass('section_highlight');
    $('#all_pages').removeClass('section_highlight');
    $('#'+de.section).addClass('section_highlight');
  } else {
    $('#page-thumbs a').removeClass('section_highlight');
    $('#all_pages').addClass('section_highlight');
    /*var flag=0;
    for (var sectionKey in DEConfig.sections) {
      section_pages = deconf.sections[sectionKey].pages;
      for (idx = 0; idx < section_pages.length; idx++) {
        page_num = Number(section_pages[idx]);
        if(page_num == current_page) {
          flag = 1;
          $('#all_pages').removeClass('section_highlight');
          $('#'+sectionKey).addClass('section_highlight');
          visualizeSectionChange(DEConfig.sections[sectionKey].name);
          return true;
        }
      }
    }
    if(flag==0) {
      visualizeSectionChange('');
    }*/
  }
}

function renderSideClips(clips, source) {
  var clipLevel = (deconf.environment == 'DEVELOPMENT') ? 2 : 3;
  var topLevel = getLevel(de.page, clipLevel);
  var topLevelW = Number(topLevel.width),
    topLevelH = Number(topLevel.height);

  for(var idx=0; idx < clips.length; idx += 1){
    clip = clips[idx];

    fullSizeClipH = topLevelH * (Number(clip['y1']) - Number(clip['y0']));
    fullSizeClipW = topLevelW * (Number(clip['x1']) - Number(clip['x0']));

    clipImg = 'https://cache.epapr.in/'+clip['issue_id']+'/'+clip['key']+ ( (clip['width'] > 900) ? '/thumb.jpg' : '/page.jpg');
    clipImg = getImageUrl( clipImg );
    if(source == 'pageclips') {
      $('#page-thumbs').append($('<a style="text-decoration:none;display:block;margin:10px 0;max-height:150px;overflow:hidden;" data-clipid="'+clip['id']+'" href="#clip/'+clip['id']+'/'+clip['key']+'/'+fullSizeClipW+':'+fullSizeClipH+'/'+source+'"><img style="padding:2px;width:200px;border:1px solid #ddd" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="'+clipImg+'" onload="lazy(this)" /></a>'));  
    } else if(source == 'topclips'){
      $('#top-clips-box').append($('<a style="text-decoration:none;display:inline-block;margin:5px;height:170px;overflow:hidden;" data-clipid="'+clip['id']+'" href="#clip/'+clip['id']+'/'+clip['key']+'/'+fullSizeClipW+':'+fullSizeClipH+'/'+source+'"><img style="padding:2px;width:310px;border:1px solid #ddd" src="'+clipImg+'" /></a>'));
    }
    
  };

  if(source=='topclips') {
    $('#load_more_clips').remove();
    if(clips.length >= top_clip_per_request) {
      $('#top-clips-box').append($('<div style="text-align: center;margin: 10px auto;"><a href="'+DEConfig.baseUrl+'viewer/topclips/'+DEConfig.issueId+'" style="btn btn-primary"> View All </a></div>'));  
    }
  }

}

function showClipsForPage() {
  //load top clips for this issue using api and lazy load the images
  if(!$( "#left-panel-topclips" ).hasClass( "active" )) { // if page clips section is not active do nothing
    return;
  }
  $('#page-thumbs').addClass('clips pageclips');
  $('#page-thumbs').empty();

  var pageKey = pageData[de.page].key;
  if(de.pageClips[pageKey] == undefined) {
    $('#page-thumbs').append('<div style="text-align: center;margin-top: 24%;font-size: 20px;"> No clip created yet. </div>');
    return;
  }

  var clips = de.pageClips[pageKey];

  var num_clips = de.pageClips[pageKey].length;
  if((num_clips != 0) && (clips[0]['page_key'] != pageKey)){
    return;
  }
  
  renderSideClips(clips, 'pageclips');
  trackPage('page-clips','Page Clips');
}

function showTopClipsPage(){
  if($('#top-clips-box a').length > 0){
    return;
  }
  var fill = function(){
    $('#top-clips-box').empty();
    var clip,clipImg;
  
    if(topClips.length > 0){
      $('#top-clips-box').append('<h4>Top Clips</h4>');
    }

    renderSideClips(topClips, 'topclips');
  }

  $.getJSON(deconf.baseUrl+'viewer/topclipsforissue/'+deconf.issueId+'?start=1&rows='+top_clip_per_request, function(response){
    if(!response.status){
      //no clips found
      return; 
    }
    topClips = response.data;

    for( var idx in topClips ) {

      all_clips[ topClips[idx].key ] = topClips[idx];
    }

    fill();
   });
}

function showMoreTopClips() {
  var start = top_clip_page * top_clip_per_request;
  $.getJSON(deconf.baseUrl+'viewer/topclipsforissue/'+deconf.issueId, { start : start+1, rows : top_clip_per_request-1}, function(response){
    if(!response.status){
      $('#load_more_clips').remove();
      return; 
    }
    topClips = response.data;
    renderSideClips(topClips, 'topclips');
    top_clip_page++;
  });
}

function showThumbs(){
  $('#page-left-panel .tabs').removeClass('active');
  $('#left-panel-pages').addClass('active');
  $('#page-thumbs').removeClass('clips pageclips');
  $('#page-thumbs').empty();
  var img, w,h;
  for (var i = 1; i <= deconf.numPages; i++) {
    if(!pageData.hasOwnProperty(i)){
      continue;
    }
    img = getImageUrl( pageData[i]['levels']['thumbs']['chunks'][0]['url'] );
    w = pageData[i]['levels']['thumbs']['chunks'][0]['width'];
    h = pageData[i]['levels']['thumbs']['chunks'][0]['height'];
    $('#page-thumbs').append($('<a style="text-decoration:none;display:block;margin:10px 0;" href="#page/'+i+'"><img style="padding:2px;width:'+(w)+'px;height:'+h+'px;border:1px solid #ddd" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="'+img+'" onload="lazy(this)" /></a>'));
  };
}

function showCalendar(action){
  //load available publish dates
  $('#calendar-loader').show();
  var dateMonth = [$('#calendar-year-selector').val(), $('#calendar-month-selector').val()]
  var dateObj;
  var addLeadingZero = function(num) {
    if (num < 10) {
      return "0" + num;
    } else {
      return "" + num;
    }
  }
  var y,m;
  switch(action){
    case 'next':
      y = dateMonth[0];
      y = (dateMonth[1] == '12') ? (Number(y) + 1) : y;
      m = (dateMonth[1] == '12') ? '01' : addLeadingZero(Number(dateMonth[1])+1);
      dateMonth = [y,m];
      $('#calendar-year-selector').val(dateMonth[0]);
      $('#calendar-month-selector').val(dateMonth[1]);

    break;
    case 'prev':
      y = dateMonth[0];
      y = (dateMonth[1] == '01') ? (Number(y) - 1) : y;
      m = (dateMonth[1] == '01') ? '12' : addLeadingZero(Number(dateMonth[1])-1);
      dateMonth = [y,m];
      $('#calendar-year-selector').val(dateMonth[0]);
      $('#calendar-month-selector').val(dateMonth[1]);
    break;
    default:
    break;
  }
  dateObj = new Date(Number(dateMonth[0]), Number(dateMonth[1])-1);
  var from = (dateObj.getTime() - 86400000)/1000;
  dateObj.setDate(dateObj.getDate()+31);
  var to = dateObj.getTime()/1000;
  $.getJSON(deconf.baseUrl + 'viewer/publishdates/'+deconf.titleId+'/'+from+'/'+to+'/json', function(response){
    var linkedDays = {};
    var o, pMonth, cal;
    for (var i = response.length - 1; i >= 0; i--) {
      o = response[i];
      pMonth = o['published'].split(' ')[0];
      linkedDays[pMonth] = {'url':getVolumeUrl(o['id'])}
    };
    $('#calendar-loader').hide();
    cal = $('.responsive-calendar').responsiveCalendar({
    'time':dateMonth[0] + '-' + dateMonth[1],
    'linkedDays': linkedDays
    });
    $('.responsive-calendar').responsiveCalendar('setLinkedDays',linkedDays);
    $('.responsive-calendar').responsiveCalendar(dateMonth[0] + '-' + dateMonth[1]);
  });
  trackPage('calendar', 'Calendar');
}

function getVolumeUrl(vol_id){

  if ( window.location.host == extractHostname( DEConfig.rwBase ) ) {

    return DEConfig.rwBase+'read/'+vol_id;
  } else {

    return DEConfig.baseUrl+'r/'+vol_id;
  }
}

function preparePageHeaders(){
  var img, w,h;
  $('#page-headers-table').empty();
  for (var i = 1; i <= deconf.numPages; i++) {
    if(!pageData.hasOwnProperty(i)){
      continue;
    }
    img = getImageUrl( pageData[i]['levels']['header']['chunks'][0]['url'] );
    w = pageData[i]['levels']['header']['chunks'][0]['width'];
    h = pageData[i]['levels']['header']['chunks'][0]['height'];
    $('#page-headers-table').append($('<tr><td>'+i+'</td><td><a class="pagelink" style="text-decoration:none;display:block;margin:10px 0;" href="javascript:;" data-href="#'+de.mode+'/'+i+'"><img style="padding:2px;width:'+(w)+'px;height:'+h+'px;border:1px solid #ddd" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="'+img+'" onload="lazyHeader(this)" /></a></td></tr>'));
  };
}

function initOtherTitles(){
    //search publication functionality
    $(".other-titles input.search-other-publication").keyup(function(){
        var searchable_text = $(this).val().trim().toUpperCase();
        if (searchable_text==""){
            $(".other-titles .searchable").hide();
            $(".other-titles .non-searchable").show();
            return;
        }

        $(".other-titles .searchable").show();
        $(".other-titles div.searchable div.not-found").hide();
        $(".other-titles .non-searchable").hide();

        var regex = new RegExp(searchable_text,"i");
        var total_found = 0;
        $(".other-titles div.searchable div a").each(function(index){
            if ($(this).parent().hasClass("not-found")){
                return;
            }

            if (!regex.exec($(this).text())){
                $(this).parent().hide();
            }else{
                total_found++;
                $(this).parent().show();
            }            
        });
        if (total_found==0){
            $(".other-titles div.searchable div.not-found").show();
        }
    });

    $(".other-titles .collection .parent a")
        .bind('mouseenter',function(e){
            $(".other-titles .collection .child").hide();
            $(".other-titles .collection .child."+$(this).attr('data-list')).show();
        })
        .bind('mouseleave',function(e){
        });
}

function closeOtherTitle(){
  $('.modal-close').hide().unbind('click',closeOtherTitle);
  $('#other-title-panel').hide();
}

function initSearchTitles(){
    $("#other-title-modal .searchbar #txt_search").keyup(function(){
        var searchable_text = $(this).val().trim().toUpperCase();
        if (searchable_text==""){
            $("#other-title-modal #vs_searchresults").hide();
            return;
        }

        $("#other-title-modal #vs_searchresults").show();

        var regex = new RegExp(searchable_text,"i");
        var total_found = 0;
        $("#other-title-modal #vs_searchresults div a").each(function(index){
            if (!regex.exec($(this).text())){
                $(this).hide();
            }else{
                total_found++;
                $(this).show();
            }            
        });
        if (total_found==0){
            $("#other-title-modal .vs_searchresults div.not-found").show();
        }
    });
}

function showLastReadTitles(){
    var html = '';
    var last_reads = getMyPublications();
    var recently_visited = false;

    if (last_reads.length==0){
        //hide last read titles
        $("#other-title-modal .last_read").hide();
    }else{
        $("#other-title-modal .last_read .publication").empty();
        last_reads.splice(0,last_reads.length-6);
        //show last read titles in order of last viewed first
        last_reads.reverse(); // array reverse because we push last read titles at the end of existing array
        for(var index in last_reads){
          if ( DEConfig.otherTitles[last_reads[index]] !== undefined ) {
            recently_visited = true;
            html = '<a target="_top" href="'+DEConfig.baseUrl+'t/'+last_reads[index]+'/latest">'+DEConfig.otherTitles[last_reads[index]].name+'</a>';
            $("#other-title-modal .last_read .publication").append(html);
          } 
        }
        if(!recently_visited) {
          $('.last_read').hide();
        }
    }
}

function showOtherTitles(){    
    initSearchTitles();
    showLastReadTitles();
    $("#other-title-modal").modal();

    if (Object.keys(DEConfig.collection).length>0 && DEConfig.collection.children != null){
        renderCollectionTitles(getTitleCollection(DEConfig.titleId));
        $("#other-title-modal .collection_hierarchy").html(getCollectionHierarcyForTitle(DEConfig.titleId));
        $("#other-title-modal .collection_hierarchy a[data-collection]").unbind('click').bind('click', renderCollectionInfo);
    }else{
        //publisher don't created collection 
        //show all titles
        $("#other-title-modal .collection_hierarchy").hide();
        $("#other-title-modal .edition .publication").html('');
        renderOtherTitles();
    }

    trackPage('other-titles', 'Other Titles');
}

function getTitleCollection(title_id){

    var collection_id = null;

    var getCollection = function(collection){

        if (!collection) return;

        var collection_selected = false;
        for (var index in collection.children){
            if ( !collection_selected && $.inArray(title_id.toString(),collection.children[index].titles)!=-1){

                collection_selected = true;
                collection_id = collection.children[index].id;
            }

            getCollection(collection.children[index]);
        }
    }

    getCollection(DEConfig.collection);
    return collection_id;
}

function getCollectionHierarcyForTitle(title_id){

    var getHierarchy = function(collection, title_id){
        if (!collection || !collection.children) {
            return '';
        }

        var html = '', collection_to_process = null;

        html = '<div class="widthplus vs_border-top vs_padding15_2 v4_firstpopdiv ">';

        if (collection.id!=DEConfig.collection.id){
          html += '<div class="widthplus">'+
                      '<span class="vs_heading5">'+collection.display_name+'</span>'+
                  '</div>';
        }


        html += '<div class="widthplus vs_padding15 vs_tagscaptions">';

        var collection_selected = false;

        for (var index in collection.children){

            if ( !collection_selected && $.inArray(title_id.toString(),collection.children[index].titles)!=-1){
              
                collection_selected = true;
                collection_to_process = collection.children[index];
                html += '<a href="javascript:;" class="selected">'+collection.children[index].display_name+'</a>';
            }else{
                html += '<a href="javascript:;" data-collection="'+index+'">'+collection.children[index].display_name+'</a>';
            }

        }

        html += '</div></div>';

        return html + getHierarchy(collection_to_process, title_id);
    }

    return getHierarchy(DEConfig.collection, title_id);
}

function renderCollectionInfo(evt){
    var collection_id = $(evt.currentTarget).attr('data-collection');
    var collection_hierarchy = [];

    var getParent = function(collection, collection_id){
        if (collection.id==collection_id){
            return collection.parent;
        }else if (collection.children != null){
            for (var index in collection.children){
                result = getParent(collection.children[index], collection_id);
                if (result){
                    return result;
                }
            }
        }
        return null;    
    }

    var renderCollectionHierarchy = function(collection, collection_id){

        var html = '<div class="widthplus vs_border-top vs_padding15_2 v4_firstpopdiv">';

        if (collection.id!=DEConfig.collection.id){
          html += '<div class="widthplus">'+
                      '<span class="vs_heading5">'+collection.display_name+'</span>'+
                  '</div>';
        }

        html += '<div class="widthplus vs_padding15 vs_tagscaptions">';
        for (var index in collection.children){
            if (index==collection_id){
                collection_to_process = collection.children[index];
                html += '<a href="javascript:;" class="selected">'+collection.children[index].display_name+'</a>';
            }else{
                html += '<a href="javascript:;" data-collection="'+index+'">'+collection.children[index].display_name+'</a>';
            }
        }

        return html += '</div></div>';
    }

    var html = '';

    var parent = collection_id;
    do{
        collection_hierarchy.push(parent);
        parent = getParent(DEConfig.collection, parent);
    }while(parent);

    var parent_collection = DEConfig.collection;
    for (var i=collection_hierarchy.length-2; i>=0; i--){
        html = html + renderCollectionHierarchy(parent_collection, collection_hierarchy[i]);
        parent_collection = parent_collection.children[collection_hierarchy[i]];
    }

    if (parent_collection.children){
        html = html + renderCollectionHierarchy(parent_collection, collection_hierarchy[i]);
    }

    $("#other-title-modal .collection_hierarchy").html(html);
    $("#other-title-modal .collection_hierarchy a[data-collection]").unbind('click').bind('click', renderCollectionInfo);

    renderCollectionTitles(collection_id);
}

function renderCollectionTitles(collection_id){
    
    var getCollectionTitles = function(collection, collection_id){
        if (collection.id==collection_id){
            return collection.titles;
        }else if (collection.children != null){
            for (var index in collection.children){
                result = getCollectionTitles(collection.children[index], collection_id);
                if (result){
                    return result;
                }
            }
        }
        return null;
    }

    var titles = (collection_id=='parent') ? DEConfig.collection.titles : getCollectionTitles(DEConfig.collection, collection_id);

    $("#other-title-modal .edition .publication").empty();
    $("#other-title-modal .edition .publication").html('');
    for (var index in titles){
        if (titles[index]==DEConfig.titleId || !DEConfig.otherTitles.hasOwnProperty(titles[index])){
            continue;
        }

        var html = '<div class="col-md-2">'+
                        '<a target="_top" href="'+DEConfig.baseUrl+'t/'+titles[index]+'/latest" class="vs_cardone">'+
                            '<div class="vs_img">'+
                                '<img src="https://d2na0fb6srbte6.cloudfront.net/read/imageapi/coverfortitle/'+titles[index]+'/'+DEConfig.otherTitles[titles[index]].type+'">'+
                            '</div>'+
                            '<div class="vs_cardcaption">'+DEConfig.otherTitles[titles[index]].name+'</div>'+
                        '</a>'+
                    '</div>';

        $("#other-title-modal .edition .publication").append(html);
    }
}

function renderOtherTitles(){
    for (var title_id in DEConfig.otherTitles){
        var html = '<div class="col-md-2">'+
                        '<a target="_top" href="'+DEConfig.baseUrl+'t/'+title_id+'/latest" class="vs_cardone">'+
                            '<div class="vs_img">'+
                                '<img src="https://d2na0fb6srbte6.cloudfront.net/read/imageapi/coverfortitle/'+title_id+'/'+DEConfig.otherTitles[title_id].type+'">'+
                            '</div>'+
                            '<div class="vs_cardcaption">'+DEConfig.otherTitles[title_id].name+'</div>'+
                        '</a>'+
                    '</div>';

        $("#other-title-modal .edition .publication").append(html);
    }
}

function tourVisited(){
    if (parseInt(getCookies('tour_visited')) == 1){
        return true;
    }else{
        return false;
    }
}

function showTour() {
  // Instance the tour
  var tour = new Tour({
  name: "tour",
  steps: [
        {
        element: "#free_user_login .login-link-free",
        title: "Power to the Logged in users!",
        content: "Access previous issues and download the e-paper. ",
        placement : "bottom"
      },
      {
        element: "#free_user_login .madv4_user_name",
        title: "Power to the Logged in",
        content: "Voila! You can now download the e-paper and access the previous issues",
        placement : "bottom"
      },
      {
        element: "#epaper-box .download-pdf",
        title: "Log-in to download",
        content: "Please Log-in & Subscribe to download the e-paper",
        placement : "bottom"
      },
      {
        element: "#calendar-menu a#drop2",
        title: "Access previous issues",
        content: "Access previous issues here",
        placement : "bottom"
      }
    ],
  container: "body",
  smartPlacement: false,
  keyboard: true,
  storage: false,
  debug: true,
  backdrop: true,
  backdropContainer: 'body',
  backdropPadding: 0.2,
  redirect: true,
  orphan: false,
  duration: false,
  delay: false,
  basePath: "",
  template: "<div class='popover tour'>" +
      "<div class='arrow'></div>" +
      "<h3 class='popover-title'></h3>"+
      "<div class='popover-content'></div>"+
      "<div class='popover-navigation'>"+
          "<button class='btn btn-default' data-role='prev' style='margin-right: 8px;'>« Prev</button>"+
          "<button class='btn btn-default' data-role='next'>Next »</button>"+
      "</div>"+
      "<button class='btn btn-default' data-role='end' style='float: right;margin-right: 7px;margin-top: -4px;margin-bottom: 5px;'>End tour</button>"+
    "</div>"
});



  // Initialize the tour
  tour.init();

  // Start the tour
  tour.start();

}

/*function showTour(){
  if(de.mode=='dual') {
      $("#dual_dwnld").show();
      $('#single_dwnld').hide();
    } else {
      $('#single_dwnld').show();
      $("#dual_dwnld").hide();
    }

    $("#tour_overlay").show();
    $("#tour_overlay").height($(document).height());

    if (Object.keys(DEConfig.sections).length==0){
        $("#tour_overlay .tour_section").hide();
    }

    $("#tour_overlay #cancel_tour").unbind('click').click(function(){
        $("#tour_overlay").hide();
    });
}*/

function markTourVisited(){
    setCookies("tour_visited",1,30);
}

function getMyPublications(){
    var mypublications = getCookies("rwmypublications").split(',');

    for (var i = 0; i<mypublications.length; i++){
        if (mypublications[i]=="" || mypublications[i]==DEConfig.titleId){
            mypublications.splice(i,1);
        }
    }

    return mypublications;
}

function addToMyPublications(){
    mypublications = getMyPublications();
    mypublications.push(DEConfig.titleId);

    var record_count_to_save = 10;
    if (mypublications.length>record_count_to_save){
        mypublications.splice(0,mypublications.length - record_count_to_save);
    }
    setCookies("rwmypublications",mypublications.join(','),30);
}

function createClippingObject() {
  
  if( !DEConfig.enable_clipping ) {

    return;
  }

  clippingObj = $('#de-page-container').imgAreaSelect({
          'handles':true,
          'parent':'body',
          'instance':true,
          'fadeSpeed':300,
          'onSelectStart':prepareForClipping,
          'onSelectChange':clipSelectionChange
        });
}

function removeClippingObject() {
  clippingObj = null;
}

// function to update href of pages accessible from page header table, according to page mode (single / dual)
function changePageHeaderHref(mode) {
  if ( $( ".pagelink" ).length ) {  
    $.each($(".pagelink"), function( index, link ) {
      var url = $(link).attr('data-href')
      url = url.replace('#'+de.mode, '#'+mode);
      $(link).attr('data-href', url)
    }); 
  }
}

function setNavPropWithMode(mode) {
  cancelClipping(); 
  switch(mode) {
    case 'page' : 
      $(".clip").removeAttr('title');
      $(".clip").css('cursor', 'pointer');
      $(".clip").css('background-color','#fff');
      $(".clip").removeClass('alertmsg');

      $('.dualpage').css('display', 'block');
      $('.singlepage').css('display', 'none');

      createClippingObject();
      changeHash('page', de.page, de.zoom);
      changePageHeaderHref(mode);
      $( "body" ).off( "click", ".alertmsg", switchModeForClip );
      $( "body" ).on( "click", ".btn.clip", clipBtnClick );

      break;

    case 'dual' :
      $(".clip").attr('title', 'Only in single page mode');
      $(".clip").css('cursor', 'default');
      $(".clip").css('background-color','#adadad');
      $(".clip").addClass('alertmsg');

      $('.dualpage').css('display', 'none');
      $('.singlepage').css('display', 'block');
                
      removeClippingObject();
      changeHash('dual', de.page, de.zoom);
      changePageHeaderHref(mode);
      $( "body" ).on( "click", ".alertmsg", switchModeForClip );
      $( "body" ).off( "click", ".btn.clip", clipBtnClick );
      
      break;

      default: 
        createClippingObject();
  }
}

function switchModeForClip() {  
  swal({
    title: "Switch to single page mode?",
    text: "Clipping is only available in single page mode!",
    type: "info",
    showCancelButton: true,
    confirmButtonColor: '#23AA43',
    confirmButtonText: 'Switch',
    closeOnConfirm: true
  },
  function(){
    swal("Changed to single page mode", "success");
    setNavPropWithMode('page');
  });
}

function showClipNavigationButtons() {
  var hash = (window.location.hash.substr(1)).split('/');
  var clipid = hash[1];
  var src = hash[4];

  var clip_navigate = new Array();
  clip_navigate['prev'] = true;
  clip_navigate['next'] = true;

  if(src == undefined) {
    src = 'mainclips';
  }

  var current_clip;
  if(src == 'pageclips') {
    current_clip = $(".pageclips").find("[data-clipid='" + clipid + "']");  
  } else if(src == 'topclips') {
    current_clip = $(".topclips").find("[data-clipid='" + clipid + "']");
  } else if(src == 'mainclips') {
    current_clip = $(".mainclips").find("[data-clipid='" + clipid + "']");
  }

  clip_prev = (current_clip).prev();
  clip_next = (current_clip).next();

  if(src=='mainclips') {
    new_hash_prev = (clip_prev).attr('data-cliphref');
    new_hash_next = (clip_next).attr('data-cliphref');
  } else {
    new_hash_prev = (clip_prev).attr('href');
    new_hash_next = (clip_next).attr('href');  
  }
  
  if(new_hash_prev == undefined) {
    clip_navigate['prev'] = false;
  }

  if(new_hash_next == undefined) {
    clip_navigate['next'] = false;
  }
  return clip_navigate;
}

function navigateOnClip(direction) {
  var hash = (window.location.hash.substr(1)).split('/');
  var clipid = hash[1];
  var src = hash[4];

  if(src == undefined) {
    src = 'mainclips';
  }
  
  var current_clip;
  if(src == 'pageclips') {
    current_clip = $(".pageclips").find("[data-clipid='" + clipid + "']");  
  } else if(src == 'topclips') {
    current_clip = $(".topclips").find("[data-clipid='" + clipid + "']");
  } else if(src == 'mainclips') {
    current_clip = $(".mainclips").find("[data-clipid='" + clipid + "']");
  }

  var clip = new_hash = '';

  if(direction == 'prev') {
    clip = (current_clip).prev();
  } else if(direction == 'next') {
    clip = (current_clip).next();
  }

  if(src=='mainclips') {
    new_hash = (clip).attr('data-cliphref');
  } else {
    new_hash = (clip).attr('href');  
  }

  if(new_hash != undefined) {
    changeHashForClip(new_hash); 
  }
 
}

var navbar_top;
var touch_dist_x;
var touch_dist_y;
var screen_width;
var screen_height;

function showHideSideBars(status) {
  switch(status) {
    case 'hide' : 
      $('#page-left-panel').hide();
      $('#page-right-panel').hide();
      $('#download-icon').show();
      $('.btn_prev').addClass('zoom_arrow_fixed');
      $('.btn_next').addClass('zoom_arrow_fixed');
      break;

    case 'show' :
      $('#page-left-panel').show();
      $('#page-right-panel').show();
      $('#download-icon').hide();
      $('.btn_prev').removeClass('zoom_arrow_fixed');
      $('.btn_next').removeClass('zoom_arrow_fixed');
      break;
  }
}

function openGroupChat() {

  if($('#chatdiv').css('display') == 'none') {
    $('#chatdiv').show();
    $("#chatframe").attr("src", "https://luminous-return-840.firebaseapp.com/?volume_id="+DEConfig.issueId);
    viewerAnalytics('send', 'event', 'chat', 'open', 'group chat open');
  } else {
    $("#chatframe").attr("src", "");
    $('#chatdiv').hide();
    viewerAnalytics('send', 'event', 'chat', 'close', 'group chat close');
  }

  $('#chatloader').hide();
}

var detectWebPSupport = function() {

  if ( supportedWebP != null ) {

    return;
  }

  var webP = new Image();
  webP.onload = function() {

    supportedWebP = (webP.height === 2) ? true : false;
  }
  webP.onerror = function() {

    supportedWebP = false;
  }
  webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
}

function redirectToDownload() {
  base_url = DEConfig.rwBase + 'read/';
  if(DEConfig.wlDownload) {
    base_url = DEConfig.baseUrl;
  }
  url = base_url + 'download/newspaper/' + DEConfig.issueId;
  window.location.href = url;
}

function redirectToClipDownload(key) {
  base_url = DEConfig.rwBase + 'read/';
  if(DEConfig.wlDownload) {
    base_url = DEConfig.baseUrl;
  }
  url = base_url + 'clip/download/' + key;
  window.location.href = url;
}

function downloadClip() {
  var key = $(this).attr('data-clip-key');
  if(!DEConfig.enableLogin) { // authentication disable, redirect to clip download page
    redirectToClipDownload(key);
    return;
  }

  if(DEConfig.enableLogin && DEConfig.loggedin) { // authentication enable and user login, redirect to clip download
    redirectToClipDownload(key);
    return;
  }

  if(DEConfig.enableLogin && !DEConfig.loggedin) {
    RW.login( function( response ) {} );
  }
}


function downloadPdf() {
  if(!DEConfig.enableLogin) { // authentication disable, redirect to download page
    redirectToDownload();
    return;
  }

  if(DEConfig.enableLogin && DEConfig.loggedin) { // authentication enable and user login, redirect to download
    redirectToDownload();
    return;
  }

  if(DEConfig.enableLogin && !DEConfig.loggedin) {
    RW.login( function( response ) {} );
  }
}

// search with in title pages starts here

function loadSearchResult(page) {
  $('.srchloader').show();
  var searchstring = $('input#de-searchbox').val();
  if (searchstring != '') { 
    $.getJSON(DEConfig.baseUrl+'search/issue/'+DEConfig.issueId+'/'+encodeURIComponent(searchstring)+'/'+page, 
      function (resultObj) {

        $('.srchloader').hide();
        if(!resultObj.status){
          $('.searched_pages').css('padding','20px').css('text-align', 'center').css('font-size', '25px').css('font-weight', 'bold');
          $('.searched_pages').html("No results found");   
          //$('#page_num').html('0 - 0 of 0');
          return false;
        }
        
        $('#search_head').show();
        $(".searched_pages").empty();
        // no need to show pagination, since we are getting all results.

        /*$('#search_navbar').show(); 
        $('#page_num').html(resultObj.start + ' - ' + resultObj.to + ' of ' + resultObj.numFound);
        if(page > 1){
            $('#prev').attr('p',parseInt(page)-1);
        } else {
          $('#prev').removeAttr('p');
        }
        if(resultObj.to < resultObj.numFound){
            $("#next").attr('p',parseInt(page)+1);                          
        } else {
          $('#next').removeAttr('p');
        }*/
      
        $.each(resultObj.data, function(key, value) { 
          html = "";
          html += "<div class='item_search_noti' de-srchd-page="+ value.pageNum +" style='cursor:pointer;'>"; 
          //html += " <a href='"+DEConfig.baseUrl+"r/"+DEConfig.issueId+"/"+value.pageNum+"/page/2/"+encodeURIComponent(searchstring)+"'>";
          html += "  <div id='srch_select_"+value.pageNum+"'>";
          html += "  <div class='col-md-3'>";
          html += "    <div class='search_img_icon'>";
          html += "      <span class='img_list'>";
          html += "         <img src='"+DEConfig.baseUrl+"pagemeta/image/"+DEConfig.issueId+"/"+value.pageNum+"/thumbs'>";
          html += "      </span>";
          html += "    </div>";
          html += "  </div>";
          //html += " </a>";
          html += "  <div class='col-md-9'>";
          html += "    <div class='search_text'> ";
          html += "       <span style='width:100%; float:left;padding-bottom:3%;'> <b> Page No. : "+ value.pageNum +" </b> </span>";
          html += "       <span> "+ value.excerpt +" </span>";
          html += "    </div>";
          html += "  </div> ";
          html += "  </div> ";
          html += "</div> ";

          $(".searched_pages").append(html);
      });
                          
    });
  }
}

function validateAndLoadSearchResult(event) {
  if($("input#de-searchbox").val().trim() == '') {
    return false;
  }
  
  loadSearchResult('1');
  event.preventDefault();
  return false;
  
}

//if search in page form is submit
$('#search-form').submit(function (event) { 
  validateAndLoadSearchResult(event);
});

//if search button is clicked
$(".searchbtn").bind('click',function(event){
  validateAndLoadSearchResult(event);
});

$('body').on('click', '.item_search_noti', function() {
  var page_num = $(this).attr('de-srchd-page');
  var searchstring = $('input#de-searchbox').val();
  de.zoom = 1;
  $('#search-query-modal').modal('toggle');
  $( "div" ).removeClass( "search_select" );
  $('#srch_select_'+page_num).addClass('search_select');
  changeHashForSearch('page', page_num, de.zoom, searchstring);
});


// code for pagination
$('#search_navbar button#prev').click(function(e){
  var page = $(this).attr('p');
  if (page != undefined)
    loadSearchResult(page);
  e.preventDefault();
  return false;      
});

$('#search_navbar button#next').click(function(e){
  var page = $(this).attr('p');
  if (page != undefined)
    loadSearchResult(page);
  e.preventDefault();
  return false;      
});

function ShowHideClips(status) {
  switch(status) {
    case 'show' :
      showClips = true;
      $("div.toggle").removeClass('off');
      $("div.toggle").removeClass('btn-default');
      $("div.toggle").addClass('btn-primary');
      $('.clippageview').show();
      break;

    case 'hide' :
      showClips = false;
      $("div.toggle").addClass('off');
      $("div.toggle").addClass('btn-default');
       $("div.toggle").removeClass('btn-primary');
      $('.clippageview').hide();
      break;
  }
}

function extractHostname(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}

$(function() {
  $('#showhideclip').change(function() {
    if($(this).prop('checked')) {
      setCookies('rwshowclips', true, 30);
      ShowHideClips('show');
      visualizeSectionChange('Showing Clips');
    } else {
      setCookies('rwshowclips', false, 30);
      ShowHideClips('hide');
      visualizeSectionChange('Hiding Clips');
    }
  });
});

var subscribePrompted = false;
function promptToSubscribe() {

    return;

    if ( subscribePrompted ) return;

    subscribePrompted = true;

    if ( !DEConfig.suggestedReads.hasOwnProperty( DEConfig.titleId ) || !DEConfig.suggestedReads[ DEConfig.titleId ].hasOwnProperty('n') || DEConfig.suggestedReads[ DEConfig.titleId ].n < 3 ) return;
    
    var tour = new Tour({
        name: "tour",
        steps: [
            {
                element: "#user_login .user-login-subscribe",
                title: "Subscribe",
                content: "Subscribe to read it directly from your mail-box",
                placement : "bottom"
            },
            {
                element: "#user_login .login-to-subscribe",
                title: "Login to subscribe",
                content: "Login & Subscribe to read it directly from your mail-box",
                placement : "bottom"
            }
        ],
        container: "body",
        smartPlacement: false,
        keyboard: true,
        storage: false,
        debug: true,
        backdrop: true,
        backdropContainer: 'body',
        backdropPadding: 0.2,
        redirect: true,
        orphan: false,
        duration: 5000,
        delay: false,
        basePath: "",
        template: "<div class='popover tour'>" +
            "<div class='arrow'></div>" +
            "<h3 class='popover-title'></h3>"+
            "<div class='popover-content'></div>"+
            "<div class='popover-navigation'>"+
            "</div>"+
            "<button class='btn btn-default' data-role='end' style='float: right;margin-right: 7px;margin-top: -4px;margin-bottom: 5px;'>Close</button>"+
          "</div>"
      });

    tour.init();
    tour.start();
}

// search within title pages ends here

var validateForPartnerReading = function(){

  $.getJSON(DEConfig.baseUrl+'partner/authenticate/'+DEConfig.issueId, function( response ) {

    if( !response.status ) {

      window.location = response.url;
      return;
    }

    $('.contentloader').hide();
    documentReady();
  })
}

function documentReady() {

  if ( DEConfig.webPEnabled ) {

    detectWebPSupport();
  }

  if ( DEConfig.enableLogin && !DEConfig.isPaid && !DEConfig.archived ) { // show login status for enable-login and free publication
    
    $('#free_user_login').show();
    if(!DEConfig.loggedin)  {
        getRwconnectLibrary();
        window.rwAsyncInit = function() {
          RW.init({
            appId: DEConfig.appId
          });

          $( ".login-link-free" ).show().click( function () {

            RW.login( function( response ) {} );
          })
        }
      }
  }

  screen_width = screen.width;
  screen_height = screen.height;

  $pageContainer = $('#de-page-container');
  winHeight = $(window).height();
  winWidth = $(window).width();
  pageBottomOffset = $('#page-bottom').offset();
	//bind page change
	$(window)
  .bind(deEvents.pageChange, function(){
    changePage();
    showPageNumberOnNavbar();
    showHideAds();
    $('.btn.zoomin, .btn.zoomout').blur();
    showSearchHighlight();
  })
	//bind page render
	.bind(deEvents.renderPage, adjustInterface)
  .bind(deEvents.clipClose, closeDisplayClip)
	.bind(deEvents.renderPage, preloadPage)
  .bind(deEvents.preloadPage, preloadPage)
	.bind(deEvents.levelReady, showPreClipped)
  .bind(deEvents.dragFinish, onDragFinish)
	.bind(deEvents.pageDataLoaded, function(){
    switch(deconf.left_tab) { // activating left panel according to publisher backend
      case 'sections' : 
          $('#page-left-panel .tabs').removeClass('active');
          $('#left-panel-sections').addClass('active');
          $('#page-thumbs').removeClass('clips pageclips');
          showSections();
          break;
      
      case 'pages' : 
          $('#page-left-panel .tabs').removeClass('active');
          $('#left-panel-pages').addClass('active');
          $('#page-thumbs').removeClass('clips pageclips');
          showThumbs();
          break; 

      case 'clips' :
          $('#page-left-panel .tabs').removeClass('active');
          $('#left-panel-topclips').addClass('active');
          $('#page-thumbs').addClass('clips pageclips');
          showClipsForPage();
          break;
    }
    //preparePageHeaders();
	})
  .bind(deEvents.urlChange, function(){
    //track in ga
    clickPosRatio = false;
  })
  .bind(deEvents.pageNumChange, function(){
    page_change_count++;
    new intrestitialAds().show();
  });

  if(deconf.enablePlugins){
    $(window).bind(deEvents.renderPage, loadPlugins);
  }

  if (deconf.showpdf){
    $(window).bind(deEvents.renderPage,changepdf);
  }
  
  $pageContainer.bind('mousedown', onMouseDown)
  	.bind('mouseup', onMouseUp)
  	.bind('click', onPageClick);

	$(window).scroll(onPageScroll);

  $('#pagenum-input').change(changePageOnInput);

  $('#page-level-bar').affix({
    'offset':{
      'top':($('#page-level-nav').offset().top)
    }
  });

  $( ".singlepage" ).click(function() {
    de.last_mode = null;
    de.manual_mode = true;
    setNavPropWithMode('page');
    showHideSideBars('show');
  });

  $( ".dualpage" ).click(function() {
    de.last_mode = null;
    de.manual_mode = true;
    setNavPropWithMode('dual');
    showHideSideBars('hide');
  });

  $('.section-link').click(function(e){
    var sectionKey = $(e.target).data('section');
    changeHash(sectionKey, 1);
  });
  $('.btn.clip').click(clipBtnClick);
  //$('#left-panel-topclips a').click(showTopClips);
  $('#left-panel-topclips a').click(function() {
    $('#page-left-panel .tabs').removeClass('active');
    $('#left-panel-topclips').addClass('active');
    showClipsForPage();
  });
  $('#left-panel-pages a').click(showThumbs);
  $('#left-panel-sections a').click(showSections);

  $('#page-headers-list').on('show.bs.dropdown', function(){
    preparePageHeaders();
    $('#page-headers-dropdown').show();
  }).on('hide.bs.dropdown', function(){
    $('#page-headers-dropdown').hide();
  });

  window.lazy = lazyload({
  container: document.getElementById('page-thumbs')
  });
  window.lazyHeader = lazyload({
  container: document.getElementById('page-headers-dropdown')
  });

  //clipping
  /*clippingObj = $('#de-page-container').imgAreaSelect({
        'handles':true,
        'parent':'body',
        'instance':true,
        'fadeSpeed':300,
        'onSelectStart':prepareForClipping,
        'onSelectChange':clipSelectionChange
      });*/

  $('.btn.cancelclip').click(cancelClipping);
  $('.btn.saveclip').click(startClipping);
  $('.ignore-suggest-clip').click(createNewClip);
  $(".cancel_validate_clip").click(closeSaveClip);

  $(".fbshare").click(shareClipOnFb);
  $(".twshare").click(shareClipOnTwitter);
  $(".email").click(shareClipOnEmail);
  //update navbar page count button
  $(window).bind(deEvents.renderPage, function(){
    //update zoom button's class
    if(typeof(pageData[de.page].levels.level2) == 'undefined'){
      de.zooms = '2';
    }

    if ( skip_level1_domains.indexOf( window.location.host ) !== -1 ) {
      de.zooms = '2';
    }
  });

  // removing show tour (what's new) functionality
  
  /*if ( DEConfig.enableLogin && !tourVisited()){
    showTour();
    markTourVisited();
  }*/

  $('body').on('click', '.prevclip', function() {
    navigateOnClip('prev');
  });

  $('body').on('click', '.nextclip', function() {
    navigateOnClip('next');
  });

  $('body').on('click', '.closechat', openGroupChat);

  $('body').on('click', '#load_more_clips', showMoreTopClips);
  $('body').on('click', '.downloadclip', downloadClip);

  $('.download-pdf').unbind('click').bind('click', downloadPdf);

  $("#de-comments-btn").click(showComments);
  $('.feedback').click(showFeedback);
  $('.btn.about').click(showAbout);
  $('.btn.whitelabel-about').click(showWhitelabelAbout);
  $('.search').click(function() {
    $("#search-query-modal").modal();
  });

  $('#search-query-modal').on('shown.bs.modal', function() {
    $('#de-searchbox').focus();
  });

  //$( "td a.pagelink" ).on('click', function (){
  $('body').on('click', 'a.pagelink', function(e) {
    e.preventDefault();
    var hash = $(this).attr('data-href');
    //de.manual_mode = false;
    window.location.hash = hash;
  });

  promptToSubscribe();

  //Show tour for viewer
  $(".watsnew").click(showTour)
  if( ( DEConfig.environment == 'DEVELOPMENT' || DEConfig.publisherId == 47930 ) && !tourVisited() ) {
    showTour();
    markTourVisited();
  }
  //Show tour for viewer

  $('#showClipModal').on('hidden.bs.modal',function( evt ){
      closeDisplayClip();
  })

  
  de.prepareForClipping = prepareForClipping;
	de.cancelClipping = cancelClipping;
	de.pageData = getPageData;
  de.drawAugmentedBox = drawAugmentedBox;
  de.changePageForSource = changePageForSource;
  de.getLevel = getLevel;
  de.openSubscribe = openSubscribe;
  de.changeHash = changeHash;
  de.changeHashForPage = changeHashForPage;
  de.changeHashWithZoom = changeHashWithZoom;
  de.visualizeSectionChange = visualizeSectionChange;
  de.highlightSection = highlightSection;
  de.showSigninPage = showSigninPage;
  de.paginationConfig = PAGINATION;
  de.setNavPropWithMode = setNavPropWithMode;
  de.showHideSideBars = showHideSideBars;
  $.pathchange.init();
  $(window).pathchange(checkUrl).trigger('pathchange');

  if(de.mode=='page') {
    //setNavPropWithMode('page');
    setNavPropWithMode(de.section);
    showHideSideBars('show');
  } else if(de.mode=='dual'){
    setNavPropWithMode('dual');
    showHideSideBars('hide');
  };

}


$(document).ready(function() {

  de.showCalendar = showCalendar;
  $('#calendar-menu').on('show.bs.dropdown', showCalendar);

  initOtherTitles();
  $(".collection").click(showOtherTitles);

  var showClips_cookie = getCookies('rwshowclips');
  if(showClips_cookie == 'true' || showClips_cookie == '') {
    $('#showhideclip').attr('checked', 'checked');
    ShowHideClips('show');
  } else {
    $('#showhideclip').removeAttr('checked');
    ShowHideClips('hide');
  }

  //handle zero(0) pages
  if (deconf.numPages==0){
      showZeroPagesError();
      return;            
  }

  checkUrl();
  
  if(DEConfig.custom_user_profile && DEConfig.custom_user_profile!=''){
        $(window).bind('afterUserProfileCheckEvent',checkAuth);
  }

  if(DEConfig.archived){
    $('#navbar-subscribe').hide();
    $('#user_login').show();
    checkLogin();
    return;
  }

  if(DEConfig.isPaid) {
    $('#navbar-subscribe').hide();
    $('#user_login').show();
    if (DEConfig.mode=='sample'){
      setSampleMode();
    }else{
      showSigninPage();
    }
    return;
  }

  if(DEConfig.read_behind_login) {
    $('#navbar-subscribe').hide();
    $('#user_login').show();
    checkLogin();
    return;
  }

  if(DEConfig.partner_authentication_enable) {
    $( ".contentloader" ).show();
    validateForPartnerReading();
    return;
  }

  /*if ( DEConfig.enableLogin ) {
    $(".show_demotour_again").click(showTour);  
  }*/
  
  if ( DEConfig.enableLogin && !DEConfig.isPaid) { // authenticate volume for archived`
    $( ".contentloader" ).show();
    checkLogin();
    return;
  }

  if ( window.location.host == extractHostname( DEConfig.rwBase ) ){

    $('#navbar-subscribe').hide();
    $('#user_login').show();

    if ( DEConfig.isPaid ) {

      $("#user_login .user-login-subscribe").hide();
    }
    checkLogin();

    return;
  }
  
  documentReady();
});

$(window).unload(function(){
    addToMyPublications();
});
de.isBrowserUnsupported = isBrowserUnsupported;
de.urlParam = urlParam;
de.showBrowserUnsupportedMessage = showBrowserUnsupportedMessage;
de.events = deEvents;
if(isBrowserUnsupported()){
	showBrowserUnsupportedMessage();
}
window.DE = de;
})(window);
