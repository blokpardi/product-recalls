/// <reference path = "/html/js/jquery-1.8.2.intellisense.js"/>
/// <reference path = "/html/js/knockout-2.2.0.debug.js"/>

///// Object classes


var Product = function (rcnum, rcdate, rcurl, type, manufacturer, desc, hazard, country) {
    this.recallNumber = rcnum;
    this.recallDate = rcdate;
    this.recallURL = rcurl;
    this.productType = type;
    this.productManufacturer = manufacturer;
    this.description = desc;
    this.hazard = hazard;
    this.country = country;
}

var productsVM = {
    products: []
};

var stackpage = function (pageId, pageTitle) {
    this.pageId = pageId;
    this.pageTitle = pageTitle
}

var _backstack = {stackpages:[]}

$(document).ready(function () {
    //showStates();
    showProducts(null, "recent recalls");
    $('#searcherror').click(function () {
        $('#searcherror').hide();
    });
});

function newProducts() {
    var vmlen = productsVM.products.length;
    productsVM.products.splice(0, productsVM.products.length);
}


function setClick() {
    $('[data-clicktype]').unbind('click');
    $('[data-clicktype]').click(function () {
        itemClick($(this));
        event.preventDefault();
    });
}


function showAbout() {
    pageNav(new stackpage("#about-page", "about"));
}


function showProducts(query, pagename) {
    waitOn();
    var element = $("#products-list");
    ko.cleanNode(element);
    newProducts();
    var url = "http://api.usa.gov/recalls/search.json?sort=date&organization=cpsc";
    if (query != null && query != 'recent')
        url = url + "&query=" + query;
    $.getJSON(url)
        .done(function (json) {
            $.each(json, function () {
                if (this.results.length != 0) {
                    $.each(this.results, function (i, data) {
                        //alert(this.product_types);
                        productsVM.products.push(new Product(
                            this.recall_number,
                            this.recall_date,
                            this.recall_url,
                            this.product_types,
                            this.manufacturers,
                            this.descriptions,
                            this.hazards,
                            this.countries
                            ));
                    });
                }
                else
                    showSearchError("There were no results from this search. Please try another search. To search for recent recalls use 'recent' as the search term.");
            })
                       
            ko.applyBindings(productsVM, document.getElementById("products-list"));
            setClick();
            if (query != null)
                _backstack.stackpages = [];
            pageNav(new stackpage("#products-list", pagename));
            waitOff();
        })
        .fail(function () {
            waitOff(); 
            pageNav(new stackpage("#neterror-page", "oops!"))
        });
}


function showProduct(rnum) {
    waitOn();
    ko.cleanNode(document.getElementById("product-page"));
    var selectedProduct = productsVM.products.filter(function (product) { return product.recallNumber == rnum });
    var viewModel = {
        product: [selectedProduct[0]]
    };
    ko.applyBindings(viewModel, document.getElementById("product-page"));
    pageNav(new stackpage("#product-page", selectedProduct[0].description.toString().toLowerCase()));
    waitOff();
}

function showPage(pageId, pageTitle, fdirection) {
    fdirection = typeof fdirection !== 'undefined' ? fdirection : "right";
    $('html, body').animate({ scrollTop: 0 }, 0);
    $('*[data-role="page"]').hide();
    $("#page-title").html(pageTitle);
    $(pageId).show("slide", { direction: fdirection, easing: 'easeOutQuint' }, 1000);
}

function itemClick(obj) {
    
    if ($(obj).data('clicktype') == "product") {
        showProduct($(obj).data('rnum'));
    }
}

function waitOn() {
    $('#wp-waiting').show();
}

function waitOff() {
    $('#wp-waiting').hide();
}

function pageNav(spage) {
    waitOff();
    if (spage != "null") {
        _backstack.stackpages.push(spage);
        showPage(spage.pageId, spage.pageTitle);
    }
    else {
        _backstack.stackpages.pop();
        var ln = _backstack.stackpages.length - 1;
        var pg = _backstack.stackpages[ln];
        
        //reset product list if going back to select a new product
        //if (pg.pageId == "#state-list")
        //    newHospitals();
        showPage(pg.pageId, pg.pageTitle, "left");
    }

    if (_backstack.stackpages.length-1 == 0) {
        try {
            AndroidFunction.backstackoff();
        }
        catch (err) {
            window.external.notify("backstackoff");
        }
    }
    else
        try {
            AndroidFunction.backstackon();
        }
        catch (err) {
            window.external.notify("backstackon");
        }
}

function showSearch() {
    $('#searchbox').toggle("slide", { direction: 'up'}, 600);
}

function dosearch() {
    var query = $('#search-text').val();
    if (query != '') {
        showSearch();
        var pagename = "search: " + query;
        $('#searcherror').hide();
        showProducts(query, pagename);
    }
    else {
        showSearchError("You didn't enter any search terms. Please enter a query and try again.");

    }
    $('#search-text').val('');
    return false;
}

function showSearchError(message) {
    $('#searchErrorMsg').text(message);
    $('#searcherror').show();
}