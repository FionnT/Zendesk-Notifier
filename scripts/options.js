$(document).ready(function(){

/////////// Internal Notification Handler

function notify(message, happy){
  // notify(int, boolean)
  var box = $("#notification");
  var msg = $("#notification p");
  var long = [
    "Succesfully added your new queue!",
    "Sorry, I couldn't parse that filter URL!",
    "Sorry, you need to input a shorthand name!",
    "Please fill in a valid URL, and a shorthand name for the filter!", //3
    "Succesfully updated the queue's details!",
    "Succesfully deleted selected queue!"
  ];
  msg.text(long[message]);
  // Drop into view for 3.5 seconds, then hide again
  function animate(){
    box.animate({
      "opacity": 1
    }, 350, () => {
      setTimeout(function(){
        box.animate({
          "opacity": 0
        }, 350)
      }, 3500)
    })
  }
  if(happy){box.addClass("happy");animate()}
  else {box.removeClass("happy");animate();}
}

/////////// View management

function insert(q, update){
  function validate(qurl, name, level, status, count, toggle){
    // validate url
    if((qurl != undefined && qurl.match("https://invisionapp.zendesk.com/agent/filters/") != null) && qurl.match(/[0-9]+/) != null){
      // is valid input
      if(name != "" && name != undefined){
        // Filter UUID, custom name, filter relative level, and ticket status
        // Each seperated by a semicolon
        // For an explanation on the URL format, see Funky URL in README
        var qvalue = qurl.split("/")[4] + "/" + qurl.split("/")[5] + ";" + name + ";" + level + ";" + status + ";" + count + ";" + toggle;
        if(!update){
          // therefore store new
          chrome.storage.sync.set({queue_count: count}); // iterated in IF statement below
          chrome.storage.sync.set({["queue_" + count]: qvalue})
          notify(0, true)
        }else{
          // therefore update existing
          chrome.storage.sync.set({["queue_" + count]: qvalue})
          notify(4, true)
        }
      }else{
        // Bad name, but have URL
        notify(2, false)
      }
    }else if(name != "" && name != undefined){
      // Bad URL, but have a name
      notify(1, false)
    }else{
      // Bad URL, Bad name
      notify(3, false)
    }
  }
  if(!update){ // new
    var qurl = $(".url")[0].value;
    var name = $(".shorthand")[0].value;
    var level = $(".new")[0].value;
    var stat_opts = ["new", "open", "pending", "on-hold", "solved"]
    for(item in stat_opts){
      if($("#unfungible").find(".sel__placeholder")[1].innerHTML === stat_opts[item]){ var status = item;}
    }
    var count = parseInt(q + 1);
    var toggle = "true";
    validate(qurl, name, level, status, count, toggle);
  }else if(update){
    qurl = q.split(";")[0];
    name = q.split(";")[1];
    level = q.split(";")[2];
    status = q.split(";")[3];
    count = q.split(";")[4];
    toggle = q.split(";")[5];
    validate(qurl, name, level, status, count, toggle)
  }
}


/////////// Load existing queues

function queue_loop(total){
  $(".view.existing.active").each(function(){ $(this).remove()});
  $(".view.existing.inactive").each(function(){ $(this).remove()});
  function clone_fill(item, data){
    inputs = item.find("input");
    button = item.find(".button");
    select = item.find(".sel__placeholder");
    // qvalue = qurl + ";" + name + ";" + level + ";" + status + ";" + count + ";" + toggle; // easier message passing

    //add queue url and name
    inputs[1].value = "https://invisionapp.zendesk.com/agent/" + data.split(";")[0];
    inputs[2].value = data.split(";")[1];

    // add queue number
    $(button[0]).attr("name", data.split(";")[4])
    $(button[1]).attr("name", data.split(";")[4])

    // set value of dropdowns
    var stored = ["less", "more", "least", "better"];
    var displayed = ["less than <", "at least >=", "at most <=", "greater than >"];
    var stat_opts = ["new", "open", "pending", "on-hold", "solved"]
    for(item in stored){
      if(stored[item] === data.split(";")[2]) select[0].innerHTML = displayed[item]
    }
    for(item in stat_opts){
      if(data.split(";")[3] == item) select[1].innerHTML = stat_opts[item]
    }
  }
  if(total != 0){
    // See note labelled redundant loops in README
    for(i=1;i<=total;i++){
      var queue = "queue_" + i;
      chrome.storage.sync.get([queue], function(result) {
        var data = result[Object.keys(result)[0]]  // See note labelled Object.Keys in README
        if(data != null){
          // See note labelled Queue clone in README
          if(data.split(";")[5] === "true"){ // queue is active
            item = $($(".cloner")[0]).clone().removeClass("cloner").addClass("existing").addClass("active").appendTo("#views");
            clone_fill(item, data)
          }else{ // queue is inactive
            item = $($(".cloner")[0]).clone().removeClass("cloner").addClass("existing").addClass("inactive").appendTo("#views");
            clone_fill(item, data)
          }
        }
      });
    }
  }

}

// See here for why we're triggering the below differently: http://learn.jquery.com/events/event-delegation/
/////////// Update existing queue

$("#views").on("click", ".update", function(event) {
  event.preventDefault();
  $this = $(this);
  $this.addClass("storing")
  master = $($this.parents()[2])
  toggle = "true" // can't click update button unless enabled
  qurl = master.find("input")[1].value;
  name = master.find("input")[2].value;
  level = master.find("select")[0].value;
  var stat_opts = ["new", "open", "pending", "on-hold", "solved"]
  for(item in stat_opts){
    if(master.find(".sel__placeholder")[1].innerHTML === stat_opts[item]){ var status = item};
  }
  count = $this.attr("name");
  qvalue = qurl + ";" + name + ";" + level + ";" + status + ";" + count + ";" + toggle; // easier message passing
  insert(qvalue, true)
  setTimeout(() => {document.location.reload()}, 500)
});


/////////// Delete existing queue

$("#views").on( "click", ".delete", function( event ) {
  event.preventDefault();
  $this = $(this);
  queue = $this.attr("name");
  item = $($this.parents()[2]);
  item.animate({"opacity": 0, "height": 0}, 500, () => {item.remove()});
  chrome.storage.sync.set({["queue_" + queue]: null})
  notify(5, false)
});



/////////// Queue toggle

$("#views").on("click", ".toggle", function(){
  event.preventDefault();
  var $this = $(this);
  var master = $($(this).parents()[2]);
  qurl = master.find("input")[1].value;
  name = master.find("input")[2].value;
  level = master.find("select")[0].value;
  var stat_opts = ["new", "open", "pending", "on-hold", "solved"]
  for(item in stat_opts){
    if(master.find(".sel__placeholder")[1].innerHTML === stat_opts[item]){ var status = item};
  }
  count = $(master.find(".button")).attr("name")
  $this.on("click", function(){
    if(master.hasClass("active")){
      master.addClass("inactive").removeClass("active")
      $this.attr("name", "false")
      qvalue = qurl + ";" + name + ";" + level + ";" + status + ";" + count + ";" + "false"; // easier message passing
      insert(qvalue, true)
      // toggle queue on backend
    }else{
      master.addClass("active").removeClass("inactive")
      $this.attr("name", "true")
      qvalue = qurl + ";" + name + ";" + level + ";" + status + ";" + count + ";" + "true"; // easier message passing
      insert(qvalue, true)
    }
  })
})

/////////// Submit new queue

$(".save").on("click", function(){
  $(this).addClass("storing")
  // Insert animations for the button here if you want
  chrome.storage.sync.get(['queue_count'], function(result) {insert(result.queue_count, false)});
  chrome.storage.sync.set({new: true});
  setTimeout(() => {
    $(".zen_views").click()
    $(this).removeClass("storing")
  }, 350)
})


/////////// Load all queues, if any

$(".zen_views").on("click", () => {
  chrome.storage.sync.get(['new'], function(result) {
    if(result.new) chrome.storage.sync.get(['queue_count'], function(result) { queue_loop(result.queue_count)});
  })
})



})
