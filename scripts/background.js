chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason == "install") {
    console.log("This is a first install!");
    chrome.storage.sync.set({ new: false });
    chrome.storage.sync.set({ sound: "sounds/confirmed.mp3" });
    chrome.storage.sync.set({ volume: 1 });
    chrome.storage.sync.set({ enable: false });
    chrome.storage.sync.set({ iteration: 0 });
    chrome.storage.sync.set({ preventsleep: false });
    chrome.tabs.create({ url: "../options.html" });
    chrome.storage.sync.set({ queue_count: 0 });
  } else if (details.reason == "update") {
    var thisVersion = chrome.runtime.getManifest().version;
    console.log(
      "Updated from " + details.previousVersion + " to " + thisVersion + "!"
    );
    chrome.storage.sync.set({ livetab: null });
  }
});

// clear all in case of zombie alarms
chrome.alarms.clearAll();
let taburl;

///////////  Main logic path
const run = () => {
  // enable if disabled, vice versa
  powercheck(true);
  chrome.storage.sync.set({ enable: true });
  chrome.storage.sync.get(["queue_count"], result => {
    count = result.queue_count;
    if (count) {
      // Reset and reload every x minutes - see .onAlarm at bottom
      chrome.alarms.create("reset", { delayInMinutes: 3.8 });
      chrome.browserAction.setIcon({
        path: {
          16: "icons/icon16.png",
          48: "icons/icon48.png",
          128: "icons/icon128.png"
        }
      });
      var taburl = "https://invisionapp.zendesk.com/agent/filters/";
      chrome.tabs.create(
        {
          url: taburl,
          active: false,
          pinned: true,
          selected: false,
          index: 1
        },
        tab => {
          chrome.storage.sync.set({ livetab: tab.id });
          chrome.tabs.update(tab.id, { autoDiscardable: false });
        }
      );
    } else {
      chrome.notifications.clear("notifier");
      chrome.notifications.create("notifier", {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Zendesk Notifier",
        message: "You need to add queues prior to enabling!",
        requireInteraction: false,
        priority: 2
      });
    }
  });
};

///////////  Power settings
const powercheck = power => {
  if (power) {
    chrome.storage.sync.get(["preventsleep"], function(result) {
      if (result.preventsleep) {
        chrome.power.requestKeepAwake("display");
      } else {
        chrome.power.releaseKeepAwake();
      }
    });
  } else {
    chrome.power.releaseKeepAwake();
  }
};

///////////  Enabled by clicking the icon,
chrome.browserAction.onClicked.addListener(function() {
  chrome.storage.sync.get(["enable"], function(result) {
    if (!result.enable) {
      var today = new Date();
      var time =
        today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      console.log("First run started at: " + time);
      powercheck(true);
      run();
    } else {
      chrome.storage.sync.set({ enable: false });
      chrome.storage.sync.get(["livetab"], result => {
        if (result.livetab) chrome.tabs.remove(result.livetab);
      });
    }
  });
});

// reinitialize when chrome tab is removed
chrome.tabs.onRemoved.addListener(tabid => {
  chrome.storage.sync.get(["enable"], result => {
    if (result.enable) {
      chrome.storage.sync.get(["livetab"], result => {
        if (result.livetab == tabid) {
          chrome.alarms.clearAll();
          chrome.storage.sync.set({ livetab: null });
          chrome.storage.sync.set({ enable: false });
          var today = new Date();
          var time =
            today.getHours() +
            ":" +
            today.getMinutes() +
            ":" +
            today.getSeconds();
          console.log("Resetting and re-running, started at: " + time);
          chrome.browserAction.setIcon({
            path: {
              16: "icons/icon16d.png",
              48: "icons/icon48d.png",
              128: "icons/icon128d.png"
            }
          });
          run();
        }
      });
    } else {
      chrome.browserAction.setIcon({
        path: {
          16: "icons/icon16d.png",
          48: "icons/icon48d.png",
          128: "icons/icon128d.png"
        }
      });
      powercheck(false);
    }
  });
});

///////////  Message listener, reacts based on message content
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  chrome.notifications.clear("notifier");
  if (request.enable) {
    sendResponse({ enable: sender.tab });
    console.log("<-- We've run that many times so far");
  }

  ///////// Notification message handling
  if (request.notification) {
    taburl = request.notification.split(";")[1];
    chrome.notifications.create(
      "notifier",
      {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Zendesk Notifier",
        message: request.notification.split(";")[0],
        requireInteraction: true,
        priority: 1
      },
      function() {
        null;
      }
    );

    ///////// Sound player
    chrome.storage.sync.get(["sound"], function(result) {
      var file = result.sound;
      chrome.storage.sync.get(["volume"], function(vol) {
        var audio = new Audio(chrome.runtime.getURL(file));
        audio.volume = vol.volume;
        audio.play();
      });
    });
  }
});
/////////// Notification click -> Open tab with the URL of the Queue that we just notified about
chrome.notifications.onClicked.addListener(function() {
  if (taburl) {
    // open a new tab
    chrome.tabs.create({
      url: taburl,
      active: true,
      pinned: false,
      selected: true,
      index: 1
    });
  }
  chrome.notifications.clear("notifier");
});

/////////// Reset and reload every x minutes
// chrome gradually lowers priority for tabs that aren't viewed
chrome.alarms.onAlarm.addListener(function(alarm) {
  chrome.storage.sync.get(["livetab"], function(result) {
    if (result.livetab != null && result.livetab != undefined) {
      chrome.tabs.remove(result.livetab);
    }
  });
});
