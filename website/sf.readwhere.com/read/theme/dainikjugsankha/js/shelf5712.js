var shelf_titles = {},
	auth_response = null;

var onLoginChecked = function( evt, evtData ) {

	if(evtData.status == 'unknown_user') {

		return doLogin();
	}

	auth_response = evtData.authResponse;
	fetchShelfContent( evtData );
}

var fetchShelfContent = function( evtData ){

	Config.content_tabs.forEach(function(tab){

		$.getJSON(Config.base_url+'shelfapiv2/getwhitelabelshelf/'+tab+'/'+auth_response.sessionKey+'/'+Config.wl_key, 
		function(response){

			renderShelfContent(response, tab);
		})
	})
}

var renderShelfContent = function(response, tab){

	if( response.status != true ) {

		return;
	}

	shelf_data = response.data;

	var tab_html = ''+ 
		'<div class="tab-pane tab-pane'+tab+'-tab" id="'+tab+'-shelf">'+
		'</div>';

	$(tab_html).appendTo(".tab-content");

	response.data.forEach(function(title){

		shelf_titles[title.t_id] = title;
		shelf_titles[title.t_id]["pagination"] = {
			page: 0,
			record: 20
		};

		var title_head_html = ''+
			'<div class="content-area shelf-box title-'+title.t_id+'">'+
				'<div class="shelf-head">'+
	                '<h2>'+title.t_name+'</h2>'+
	                /*'<span>'+(title.subscribed ? 'Till Date: 17 July 2018' : '')+'</span>'+*/
	                '<span class="v-all">'+
	                	'<button type="button" class="btn view-all-button" data-titleid="'+title.t_id+'">View All</button>'+
	                '</span>'+
	            '</div>'+
	        '</div>';

		$("#"+tab+"-shelf").append(title_head_html);        

		$(".shelf-box.title-"+title.t_id+" .view-all-button").click(viewAllIssues);

		title.issues.forEach(function(issue){

			var issue_html = ''+
				'<div class="col-md-4 div-768 f-lft">'+
                    '<div class="card-area hvr-float-shadow">'+
                        '<div class="card-thumb">'+
                            '<div class="card-img">'+
                                '<img src="'+issue.coverimage['300']+'" alt="">'+
                            '</div>'+
                            '<div class="cards-title">'+
                                '<h2>'+issue.v_name+'</h2>'+
                            '</div>'+
                            '<div class="read-btn">'+
                                '<a href="'+Config.base_url+'r/'+issue.v_id+'">Read Now</a>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                '</div>';

            $("#"+tab+"-shelf .shelf-box.title-"+title.t_id).append(issue_html);
		})
	})
}

var viewAllIssues = function( event ) {

	var title_id = $(event.currentTarget).attr('data-titleid');

	if ( $("#view-all-issue-modal-title-"+title_id).length < 1 ) {

		var modal_html = ''+
			'<div class="modal fade bd-example-modal-lg" id="view-all-issue-modal-title-'+title_id+'">'+
				'<div class="modal-dialog modal-lg modal-dialog-centered">'+
					'<div class="modal-content">'+
						'<div class="modal-header modal-heading">'+
							'<h2>'+shelf_titles[title_id].t_name+'</h2>'+
          					'<button type="button" class="close" data-dismiss="modal">&times;</button>'+
						'</div>'+
						'<div class="modal-body">'+
							'<div class="container_mainewspapers">'+
							'</div>'+
							'<div class="clearfix"></div>'+
							'<div class="alert alert-info load_more" data-titleid="'+title_id+'">'+
								'<span class="text" style="display:none;">Load More</span>'+
								'<span class="image"><img src="'+Config.base_url+'styles/images/loader.gif"></span>'+
							'</div>'+
						'</div>'+
						'<div class="modal-footer">'+
							'<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>'+
						'</div>'+
					'</div>'+
				'</div>'+
			'</div>';
		$(modal_html).appendTo('body');
		$("#view-all-issue-modal-title-"+title_id+" .load_more").click(function( evt ){

			var title_id = $(evt.currentTarget).attr('data-titleid');
			$("#view-all-issue-modal-title-"+title_id+" .load_more span").toggle();
		 	loadMoreIssues( title_id );
		});

		loadMoreIssues( title_id );
	}

	$("#view-all-issue-modal-title-"+title_id).modal('show');
}

var loadMoreIssues = function( title_id ) {

	shelf_titles[title_id].pagination.page++; 

	$.getJSON(Config.base_url+'shelfapiv2/gettitleissues/'+title_id+'/'+auth_response.sessionKey, 
	{
		page: shelf_titles[title_id].pagination.page,
		record: shelf_titles[title_id].pagination.record
	},
	function(response){

		if( response.status == false ) {

			$("#view-all-issue-modal-title-"+title_id+" .load_more").unbind('click').text(response.error);
			return;
		}

		var title_issues_html = '';
		response.data.forEach(function(issue){

			title_issues_html += ''+
				'<div class="col-md-4 div-768">'+
	                '<div class="card-area hvr-float-shadow">'+
	                    '<div class="card-thumb">'+
	                        '<div class="card-img">'+
	                            '<img src="'+issue.coverimage["300"]+'" alt="">'+
	                        '</div>'+
	                        '<div class="cards-title">'+
	                            '<h2>'+issue.v_name+'</h2>'+
	                        '</div>'+
	                        '<div class="read-btn">'+
	                            '<a href="'+Config.base_url+'r/'+issue.v_id+'">Read Now</a>'+
	                        '</div>'+
	                    '</div>'+
	                '</div>'+
	            '</div>';
		})

		$("#view-all-issue-modal-title-"+title_id+" .container_mainewspapers").append(title_issues_html);
		$("#view-all-issue-modal-title-"+title_id+" .load_more span").toggle();

		if( response.total_count <= shelf_titles[title_id].pagination.record ) {
			$("#view-all-issue-modal-title-"+title_id+" .load_more").hide();
		}
	})
}

$(document).ready(function(){

	$(window).bind('loggedCheckedOnWLEvent', onLoginChecked);
})