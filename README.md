# Zendesk Notifier
Notifies you of tickets based on your filters

Copyright 2019 until the Heat Death of the Universe

## DOING

1. ?????

## TODO

1. ?????

## Done


1. Looping throught queues
2. Implement Desktop Notifier
3. Button toggle
4. Debug queue parser
5. Information Tab
6. Initial Settings Tab
7. Existing Views Tab
8. Implement background script to parse filter html
9. Implemented default notification tone
10. Add option regarding preventing computer idling
11. Implement more default notification tones
12. Implement new options page based on Laura's designs
13. Bug Fixes
## Redundant loops

  We can't just deiterate the `queue_count` var when a queue is deleted (we would need to be able to resave all queue names to
  reflect this), so instead when a queue filter is deleted, we set that queue's filter values to null.

  Which means we need to loop through all stored queue_x keys, and make sure they're not empty before proceeding


## Object.Keys

  Normally you need to repeat the name of the key, in the format "Result.key" to get the returned
  JSON's value, however `result[Object.keys(result)[0]]` gets you the value of the first JSON item returned (of any JSON)
  removing the need to repeat the key name.

  This is useful, as we are storing and loading the key relating to each queue dynamically, and eval() is not allowed within
  Chrome Extensions. We would need to do `eval(result.queue_name)` for it to parse as a request for the contents of the JSON
  under normal circumstances. Where 'queue_name' would be a dynamic string relating to the name of the queue we are fetching.

  As the key object accepts strings, we can pass that dynamically and then parse using this instead:

~~~~
chrome.storage.sync.get([string_var], function(result) {
 var queue_value = result[Object.keys(result)[0]];
 do_something(queue_value);
});
~~~~

## Queue clone

  The first queue item is hidden by default (it's easier to write it in html, and then hide it, than it is to write it in JS).

  What we're doing is querying for it, and then specifying that we only want the first item in the returned queries array (so
  as not to clone the whole array). We then clone that item, make the clone visible, and lastly loop through the children of
  this clone to update their values to reflect stored data
