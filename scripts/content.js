function script(){
  console.log("Ready")
  // This is triggered on every page reload matching invisionapp.zendesk.com
  // Therefore we need to store iterate value in cold storage, not here
  function iterate(count, n){
    console.log("Iterating")
    if(n != count){
      var next = "queue_" + (n + 1).toString();
      chrome.storage.sync.set({iteration: n});
      chrome.storage.sync.get([next], function(result){
        var data = result[Object.keys(result)[0]]   // See note labelled Object.Keys in README
        document.location.href = data.split(";")[0];
      })
    }else{
      chrome.storage.sync.set({iteration: 0});
      for(i=0;i<99;i++){
        var queue = "queue_" + (i).toString()
        chrome.storage.sync.get([queue], function(result){
          var data = result[Object.keys(result)[0]]   // See note labelled Object.Keys in README
          if((data != null && data != undefined) && data.split[5] != false){
            document.location.href = data.split(";")[0];
          }
        })
      }
    }
  }

  function notify(count, n, ncount, data) {
    var url = "https://invisionapp.zendesk.com/agent/" + data.split(";")[0];
    console.log("Notifying of: "+ncount+" tickets.")
    if(ncount === 0){
      null // de nada
    }else if(ncount === 1){
      var message = ("One new ticket in "+data.split(";")[1]+" for you!;"+url).toString();
      chrome.runtime.sendMessage({notification: message});
    }else if(ncount != 0){
      var message = (ncount+" tickets for your attention in "+data.split(";")[1]+"!;"+url).toString();
      chrome.runtime.sendMessage({notification: message});
    }
    iterate(count, n)
  }

  function parse(count, n, data){
    console.log("parsing")
    // parse everything at this queue, create a summary of that data, and send it to the notify function
    var url = "https://invisionapp.zendesk.com/agent/" + data.split(";")[0];
    var level = data.split(";")[2];
    var values = [];
    // 0, 1, 2, 3, 4
    var num_array = [];
    var tickets = "";

    // Table number changes for some reason, randomly
    for(i=0;i<=99;i++){
      var table = "#table"+i+" tbody tr .pop";
      if($(table).length != 0){
        tickets = $(table);
      }
    }
      "#table1 tbody tr .pop";

    for(i=0;i<=99;i++){
      // this selector is for when there are seperators, e.g. Priority
      var table = "#table"+i+" tbody tr td .pop";
      if($(table).length != 0){
        tickets = $(table);
      }
    }

    var tcount = tickets.length;

    function validate(values, status, data){
      console.log("validating")
      var opts = ["N", "O", "P", "H", "S"];
      var status = Number(data.split(";")[3]);
      var ncount = 0;

      for(t in values){
        for(i=0;i<opts.length;i++){
          if(values[t] === opts[i]){
            num_array.push(i);
          }
        }
      }

      if(level === "less"){
        for(i in num_array){
          if(num_array[i]<status || (num_array[i] === 0 && status === 0)) ncount+=1;
        }
      }else if(level === "more"){
        for(i in num_array){
          if(num_array[i]>status) ncount+=1;
        }
      }else if(level === "least"){
        for(i in num_array){
          if(num_array[i]<=status) ncount+=1;
        }
      }else if(level === "better"){
        for(i in num_array){
          if(num_array[i]>=status) ncount+=1;
        }
      }
      notify(count, n, ncount, data)
    }

    for(i=0;i<=tcount;i+=2){
     if(tickets[i] != undefined){
       var status = tickets[i].textContent;
       values.push(status)
     }
    }
    validate(values, status, data)
  }
  function enabled(){
    chrome.storage.sync.get(['iteration'], function(result) {
      var n = parseInt(result.iteration + 1);
      chrome.storage.sync.get(['queue_count'], function(result) {
        count = result.queue_count;
        if(count>=1) {
          var queue = "queue_" + n;
          chrome.storage.sync.get([queue], function(result) {
            var data = result[Object.keys(result)[0]]  // See note labelled Object.Keys in README
            if(data.split(";")[5] === "true"){
              setTimeout(function(){
                var url = "https://invisionapp.zendesk.com/agent/" + data.split(";")[0];
                if( document.location.href === url){
                  parse(count, n, data)
                }else {
                  try {
                    document.location.href = url;
                  }catch{
                    document.location.href = data.split(";")[0];
                  }
                }
              // this timeout on further redirects allows us to parse in the meantime
            }, 45200)
            }else{
              iterate(count, n)
            }
          })
        }
      })
    })
  }
  enabled();
}



// Here we send a message to background.js, and in response get the id of the current tab
// We compare this with the ID of the tab we created (and whose value we stored) in background.js
// If the id's match, we activate - this prevents the script from running in any tab except our own tab

chrome.storage.sync.get(["livetab"], function(result){
  var livetab = result.livetab;
  chrome.runtime.sendMessage({enable: true}, function(response){
    if(response.enable != null && livetab === response.enable.id){
      console.log(response.enable.id + " : " + livetab)
      script()
    }
  });
})
