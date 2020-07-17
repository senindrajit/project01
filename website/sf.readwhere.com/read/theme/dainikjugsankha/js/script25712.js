var user_data = null,
    cart_detail = null;

function isInShelf( ){

    if( !Config.hasOwnProperty('latest_vol') ) {

        return;
    }

    $(".product-cart.product-price-list .product-already-purchased").hide();

    $.getJSON(Config.base_url+'shelfapi/isinshelf/'+user_data.userID+'/'+Config.latest_vol+'?callback=?',
    function(response){
        if (response.status==true && response.inShelf==true){
            
            $(".product-cart.product-price-list").hide();
            $(".product-cart.product-read-now").show();
        } else {

            $(".product-cart.product-read-now").hide();
            $(".product-cart.product-price-list").show();
        }
    });
}

function addToCart(e){

    if( !user_data ) {

        doLogin();
        return;
    }

    var url = Config.base_url+'checkoutapi/addtocart/'+
                $(e.currentTarget).attr('data-volume-id')+'/'+
                $(e.currentTarget).attr('data-subscription-id')+'/'+
                user_data.userID+'/'+user_data.crypt+'/'+user_data.keyForCrypt+
                '?wl='+Config.wl_key+'&callback=?';

    $.getJSON(url, function(response){

        if (response.status==true){

            getCartItemCount();
            getCartDetail(true);
        } else{

            alert(response.error);
        }
    });
}

function getCartDetail(openCartModal){

    var url = Config.base_url+'checkoutapi/getcartdetail/'+user_data.userID+'/'+
        user_data.crypt+'/'+user_data.keyForCrypt+'?wl='+Config.wl_key+'&callback=?';
    $.getJSON(url, function(response){

        if (response.status==true){

            cart_detail = response;
            if (openCartModal==true){

                showCart();
            }else {

                $('#cart_amt').html('');
                $('#cart_amt').append(parseFloat(cart_detail.data.totalnetamount).toFixed(2));                      
            }
        } else {

            if( openCartModal ) {

                alert(response.error);
                return;
            }

            $('#cart_amt').html("0.00");
            $(".place-order").hide();
        }
    });
}

function getCartItemCount(){

    var url = Config.base_url+'checkoutapi/cartitemcount/'+user_data.userID+'/'+user_data.crypt+'/'+user_data.keyForCrypt+'?wl='+Config.wl_key+'&callback=?';
    $.getJSON(url, function(response){

        if (response.status==true){

            $(".user-detail .itm-cart").text(response.count);
        }
    });
}

function showCart(){

    if (!cart_detail) {

        alert('Cart is empty!');
        return;
    }
    
    html = '<div id="user-cart-modal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">'+
                '<div class="modal-dialog">'+
                '<div class="modal-content">'+
                '<div class="modal-header">'+
                    '<button type="button" class="close" data-dismiss="modal" aria-hidden="true"> x </button>'+
                    '<h3 id="myModalLabel">Your Shopping Cart Detail</h3>'+
                '</div>'+
                '<div class="modal-body">'+
                    '<table class="table table-condensed table-hover">'+
                        '<thead>'+
                            '<tr>'+
                                '<th></th>'+
                                '<th>Title</th>'+
                                '<th>Amount</th>'+
                                '<th>Action</th>'+
                            '</tr>'+
                        '</thead>'+
                        '<tbody>'+getCartItems(cart_detail.cart_key)+'</tbody>'+
                    '</table>'+
                '</div>'+
                '<div class="modal-footer">'+
                    '<div id="footer_tab" >'+
                        '<table width="100%">'+
                            '<tr>'+
                                '<td></td><td width="75px"></td><td width="55%" align="right">Total Amount</td>'+
                                '<td id="cart_amt">'+parseFloat(cart_detail.data.totalnetamount).toFixed(2)+'</td>'+
                            '</tr>'+
                        '</table>'+
                    '</div>'+
                    '<div style="width: 100%; float: left; margin-top: 26px;">'+
                        '<button class="btn btn-primary place-order" data-cart-key="'+cart_detail.cart_key+'">Place Order</div>'+
                    '</div>'+
                '</div>'+
                '</div>'+
            '</div>'+
            '</div>';
    $('body').append(html);

    $("#user-cart-modal")
        .modal('show')
        .on('hidden.bs.modal',function(){
            $(this).remove();
        });

    $(".place-order")
        .unbind('click')
        .click(function(){
            window.location.href = Config.rw_base+'read/cartcheckout/show?src='+Config.host_url+'&wl='+Config.wl_key;
        });

    $(".removecart_img").unbind('click').bind('click',removeFromCart);
}

function getCartItems(cart_key){

    cartdata = cart_detail.data;
    html = '';
    for (var idx in cartdata.items){
        html += '<tr id="'+idx+'">';
        html += '<td style="width:75px;vertical-align:middle;"><img width="50" src="'+Config.cloud_front_base+'imageapi/coverforissue/'+cartdata['items'][idx]['volumeid']+'/'+cartdata['items'][idx]['type']+'"></td>';
        html += '<td style="width:55%;vertical-align:middle;">'+cartdata['items'][idx]['title']+'</td>';
        html += '<td style="vertical-align:middle;text-align:center;">'+parseFloat(cartdata['items'][idx]['netamount']).toFixed(2)+'</td>';
        html += '<td style="vertical-align:middle;text-align:center;"> <a class="removecart_img" href="javascript:;" data-item-key="'+idx+'" data-cart-key="'+cart_key+'"> <i class="fa fa-times fa-lg" style="color:red;"></i> </a>   </td>';
        html += '</tr>';
    }
    return html;
}

function removeFromCart(evt){

    var targetObj = $(evt.currentTarget);
    var item_key = targetObj.attr('data-item-key');

    var url = Config.base_url+'checkoutapi/removefromcart/'+item_key+'/'+cart_detail.cart_key+'/'+
                user_data.userID+'/'+user_data.crypt+'/'+user_data.keyForCrypt+'?wl='+Config.wl_key+'&callback=?'
    $.getJSON( url, function(response){

        if (response.status==true){

            targetObj.parent().parent().remove();
            getCartItemCount();
            getCartDetail();
        }
    });
}

function _setconfig(authResponse) {

    if (authResponse){

        user_data = authResponse;
        $(".user-detail .login-link").hide();
        $(".user-detail .profile-link").show();
        $(".user-detail .profile-link .user-name span").text(user_data.email);

        getCartItemCount();
        isInShelf();
    } else {

        $(".product-cart.product-price-list").show();
    }
}


window.rwAsyncInit = function() {
    
    RW.init({appId: Config.app_id});
    RW.getLoginStatus(function(response) {

        if(response.status == 'unknown_user') {

            $('.login-rw-connect').bind('click', function() {

                doLogin();
            });      
        }

        _setconfig(response.authResponse);
        $(window).trigger('loggedCheckedOnWLEvent', response);
    });
}

function doLogin(){

    if( $.browser.mobile || navigator.userAgent.match(/iPad/i) ) {

        window.location.href = Config.rw_base+'m/login?ru='+Config.base_url+(Config.hasOwnProperty('title_id')?'t/'+Config.title_id:'');
    } else {

        RW.login(function(response) {});
    }
}

function showPreview(){

    if( !Config.hasOwnProperty('latest_vol') ) {

        return;
    }

    $.getJSON(Config.base_url+'pagemeta/getsample/'+Config.latest_vol, function(response){

        $(".preview-container").show();
        for( var idx in response ) {

            var html = ''+
                        '<div class="item">'+
                            '<div style="padding:0 10px;border: 1px solid #CCC;margin:0 10px;">'+
                                '<img src="'+response[idx].levels.level0.chunks[0].url.replace("http://", "https://")+'">'+
                            '</div>'+
                        '</div>';
            $(html).appendTo("#preview-page-carousel");
        }

        $("#preview-page-carousel").owlCarousel();
    });
}

$(document).ready(function(){


    showPreview();

    $(".btn-add-to-cart").click(addToCart);
    $(".btn-show-cart").click(function(){

        getCartDetail(true);
    });
});