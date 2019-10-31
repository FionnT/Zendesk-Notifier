const run = () => {
  const opts = ["N", "O", "P", "H", "S"];
  let ncount;
  let n;
  let count;

  console.log("Ready");
  // This is triggered on every page reload matching invisionapp.zendesk.com
  // Therefore we store iterate value in cold storage, not here
  const iterate = (count, n) => {
    console.log("Iterating");
    if (n != count) {
      let next = "queue_" + (n + 1).toString();
      chrome.storage.sync.set({ iteration: n });
      chrome.storage.sync.get([next], result => {
        let data = result[Object.keys(result)[0]];
        document.location.href = data.split(";")[0];
      });
    } else {
      chrome.storage.sync.set({ iteration: 0 });
      for (i = 0; i < 99; i++) {
        let queue = "queue_" + i.toString();
        chrome.storage.sync.get([queue], result => {
          if (Object.keys(result)[0]) {
            let data = result[Object.keys(result)[0]];
            if (data.split[5] != false)
              document.location.href = data.split(";")[0];
          }
        });
      }
    }
  };

  const notify = (count, n, ncount, data) => {
    let url = "https://invisionapp.zendesk.com/agent/" + data.split(";")[0];
    console.log("Notifying of: " + ncount + " tickets.");
    if (ncount == 1) {
      let message =
        "One new ticket in " + data.split(";")[1] + " for you!;" + url;
      chrome.runtime.sendMessage({ notification: message });
    } else if (ncount) {
      let message = (
        ncount +
        " tickets for your attention in " +
        data.split(";")[1] +
        "!;" +
        url
      ).toString();
      chrome.runtime.sendMessage({ notification: message });
    }
    iterate(count, n);
  };

  // Gathers the 'N' 'O' 'P' pending items in the table, and insert them in an array
  const parse = (count, n, data) => {
    console.log("parsing");

    let level = data.split(";")[2];
    let values = [];
    // 0, 1, 2, 3, 4
    let num_array = [];
    let tickets;

    // These two four loops find the table item that Zendesk is using for tickets
    // They then request the array of tickets via their '.pop' selector
    //
    // The table's number changes randomly for some reason
    for (i = 0; i <= 99; i++) {
      let table = "#table" + i + " tbody tr .pop";
      if ($(table).length) {
        tickets = $(table);
        break;
      }
    }
    // This loop/selector is for when there are seperators, e.g. Priority
    for (i = 0; i <= 99; i++) {
      let table = "#table" + i + " tbody tr td .pop";
      if ($(table).length) {
        tickets = $(table);
        break;
      }
    }

    // convert to actual array

    // Checks the array built above, and sends the total amount of qualified items to the notify function
    const validate = (values, data) => {
      console.log("validating");

      let status = Number(data.split(";")[3]);
      ncount = 0;

      // loops through tickets and assigns a number equivalent to each status
      for (t in values)
        for (; i < opts.length; i++)
          if (values[t] === opts[i]) num_array.push(i);

      if (level == "less") {
        num_array.forEach(value => {
          if (value < status || (!num_array[i] && !status)) ncount += 1;
        });
      } else if (level == "more") {
        num_array.forEach(value => {
          if (value > status) ncount += 1;
        });
      } else if (level == "least") {
        num_array.forEach(value => {
          if (value <= status) ncount += 1;
        });
      } else if (level == "better") {
        num_array.forEach(value => {
          if (value >= status) ncount += 1;
        });
      }
      notify(count, n, ncount, data);
    };

    if (tickets) {
      tickets = Array.prototype.slice.call(tickets);
      tickets.forEach((ticket, index) => {
        // Only every second item is a ticket, and we only want that fields text
        if (!(index % 2)) values.push(ticket.textContent);
      });
      validate(values, data);
    } else iterate(count, n);
  };

  chrome.storage.sync.get(["iteration"], result => {
    n = parseInt(result.iteration + 1);
    chrome.storage.sync.get(["queue_count"], result => {
      count = result.queue_count;
      if (count) {
        let queue = "queue_" + n;
        chrome.storage.sync.get([queue], result => {
          let data = result[Object.keys(result)[0]]; // See note labelled Object.Keys in README
          if (data.split(";")[5] === "true") {
            setTimeout(function() {
              let url =
                "https://invisionapp.zendesk.com/agent/" + data.split(";")[0];
              if (document.location.href == url) parse(count, n, data);
              else document.location.href = url;
              // this timeout on further redirects allows us to parse in the meantime
            }, 15200);
          } else {
            iterate(count, n);
          }
        });
      }
    });
  });
};

// Here we send a message to background.js, and in response get the id of the current tab
// We compare this with the ID of the tab we created (and whose value we stored) in background.js
// If the id's match, we activate - this prevents the script from running in any tab except our own tab

chrome.storage.sync.get(["livetab"], result => {
  chrome.runtime.sendMessage({ enable: true }, response => {
    if (response.enable && result.livetab == response.enable.id) {
      console.log(response.enable.id + " : " + result.livetab);
      run();
    }
  });
});
