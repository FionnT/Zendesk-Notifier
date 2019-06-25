$(document).ready(function(){

/////////// Tab manager

$("#leftnav span").each(function(){
  var areas = ["setup", "views", "settings"]
  var $this = $(this);
  $this.on("click", function(){
    for(i=0;i<areas.length;i++){
      $( $("#leftnav span")[i] ).removeClass("click") // Dual purpose For loop
      $this.addClass("click")
      opt = $this.data("area")
      if(areas[i] != opt){
        hide = "#" + areas[i];
        $(hide).css("display", "none")
        show = "#" + opt
        document.location.hash = opt;
        $(show).css("display", "block")
      }
    }
  })
})

var hash = document.location.hash;
if(hash === "#setup"){ $($("#leftnav span")[0]).click()
}else if( hash === "#views"){ $($("#leftnav span")[1]).click()
}else if( hash === "#settings"){ $($("#leftnav span")[2]).click()
}else{ $($("#leftnav span")[0]).click()}


/////////// Volume Slider

// Initialization

var vol_slider = $("#volume");
var vol_lvl = $(".vol_lvl");

vol_slider.slider({
  min: 0,
  max: 100,
  value: 0,
	range: "min",
	slide: function(event, ui) {
    vol_lvl.text(ui.value + "%")
    chrome.storage.sync.set({volume: Number(ui.value/100)});
  }
  });

// Stored volume level
chrome.storage.sync.get(['volume'], function(result) {
  vol_slider.slider('value', result.volume*100);
  vol_lvl.text(result.volume*100 + "%")
});

// Stored sound
chrome.storage.sync.get(["sound"], function(result){
  $(".volumeslider ul li").each(function(){
    var text = $($(this).find("p")[0]).text();
    var file = result.sound.split("/")[1].split(".")[0];
    console.log(file + ":" + text);
    if(text === file){
      $($(this).find("div")[0]).addClass("active");
      $($(this).find("p")[1]).text("Current");
      $($(this).find("img")[0]).attr("src", "images/playing.png");
    }
  })
});


// Sound player - selector

$(".volumeslider ul li").each(function(){
  $(this).on("click", function(){
    $(".volumeslider ul li").each(function(){
      $($(this).find("div")[0]).removeClass("active");
      $($(this).find("p")[1]).text("Click to play");
      $($(this).find("img")[0]).attr("src", "images/darkplay.png");
    })
    $($(this).find("div")[0]).addClass("active");
    $($(this).find("p")[1]).text("Current");
    $($(this).find("img")[0]).attr("src", "images/playing.png");
    var file = "sounds/" + $($(this).find("p")[0]).text() + ".mp3"
    var audio = new Audio(chrome.runtime.getURL(file));
    chrome.storage.sync.get(["volume"], function(vol){
      var audio = new Audio(chrome.runtime.getURL(file));
      audio.volume = vol.volume;
      audio.play();
    })
    chrome.storage.sync.set({sound: file});
  })
})

/////////// Power manager

$(".power .toggle").on("click", function(){
  parent = $($(this).parents()[0]);
  if(parent.hasClass("active")){
    parent.removeClass("active").addClass("inactive")
    chrome.storage.sync.set({preventsleep: false})
  }else {
    parent.addClass("active").removeClass("inactive")
    chrome.storage.sync.set({preventsleep: true})
  }
})

// Initialization
chrome.storage.sync.get(["preventsleep"], function(result){
  if(result.preventsleep){
    $(".power .switch").addClass("active").removeClass("inactive");
  }else {
    $(".power .switch").removeClass("active").addClass("inactive")
  }
})


/////////// Fake Select Boxes

$('.sel').each(function() {
  $(this).children('select').css('display', 'none');

  var $current = $(this);

  $(this).find('option').each(function(i) {
    if (i == 0) {
      $current.prepend($('<div>', {
        class: $current.attr('class').replace(/sel/g, 'sel__box')
      }));

      var placeholder = $(this).text();
      $current.prepend($('<span>', {
        class: $current.attr('class').replace(/sel/g, 'sel__placeholder'),
        text: placeholder,
        'data-placeholder': placeholder
      }));

      return;
    }

    $current.children('div').append($('<span>', {
      class: $current.attr('class').replace(/sel/g, 'sel__box__options'),
      text: $(this).text()
    }));
  });
});


// Toggling the `.active` state on the `.sel`.
$(".wrapper").on("click", ".sel" ,function() {
  $(this).toggleClass('active');
});

// Toggling the `.selected` state on the options.
$(".wrapper").on("click", '.sel__box__options', function() {
  var txt = $(this).text();
  var index = $(this).index();

  $(this).siblings('.sel__box__options').removeClass('selected');
  $(this).addClass('selected');

  var $currentSel = $(this).closest('.sel');
  $currentSel.children('.sel__placeholder').text(txt);
  $currentSel.children('select').prop('selectedIndex', index + 1);
});

})
