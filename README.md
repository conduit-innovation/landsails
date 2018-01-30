# LandSails

Brings plain SailsJS 1.x routes, models and actions into the client-side, and provides automatic model synchronisation. Provides isomorphic models, routes and actions, that persist and synchronise.

**30th Jan 2018** - This is a proof of concept. There are currently no tests. If this approach gains traction, I will put together a proper roadmap and release.

**Due to the lack of docs, I'm happy to help explain and get this PoC set up for you. Just give me a shout; I'm available on GitHub @talss89 or by email: tom.lawton@cndu.it**

## Rough Outline

- Provides an 'Island' object, which contain Sails routes, actions and models for use client-side.
- Client side 'Island' models are backed by `balderdashy/sails-disk` and `jvilk/BrowserFS`, so they persist.
- The ODA module tracks changes to Waterline models on the server, and sends 'ODA' packets to the client.
- [TODO] Client reads ODA packets and applies transformations to the local 'Island'
- [TODO] Uses the CloudSDK from `mikermcneil/parasails` to auto-generate AJAX SDK for the client
- [TODO] Uses OfflineJS to detect loss of connectivity. In this situation, AJAX requests to the server are queued, and also simultaneously run on the 'Island'.
- [TODO] Once connectivity resumes, the queued requests are sent, and any ODA packets are applied to the Island
- Now we're back in sync.

## Wait, what ... why?

We want our Cordova apps to continue working offline, and manage re-sync when online, but we don't want to write duplicate code for our models, actions or routes.

LandSails allows us to create a normal Sails app, generate a simple client-side API interface, which, when offline, fails over to point to a set of locally stored Sails models, actions and routes, backed by BrowserFS.

When any server-side code performs a create / update / delete / collection operation on a Waterline model, LandSails can generate a simple JSON response (which we call 'ODA') containing the Object (O), Data (D) and Action (A), for the model.

In LandSails on the client, these ODA fields are read from any server responses, and any transformations made on the data are also made to the local model store.

If the client is offline, any requests made through the LandSails are queued, but also executed on the LandSails 'Island' (our fancy name for the mini-pseudo-sailsjs module, which loads and processes routes, actions and models). Any business logic associated with the routes are executed, and the local database is updated.

Once connectivity is regained, all queued requests are then dispatched to the server. The resulting ODA fields are then used to re-sync the local database with the actual authoritative response from the server.

**So, we write our Sails code once, and we have a single API for use on the server and on the client.**

## Code Examples

I have my test Sails project set up to load `landSails` as a global. It's not essential, but the following examples work on that basis.

Currently, this only covers the server-side ODA module. The 'Island' also works to some degree (loads models fine), but doesn't yet support routes or actions, so I've left out example code for the time being.

### Automatically track changes to waterline model(s), and send ODA back to the client

*In a Sails 1.x Machine-style action...* (This is the async `fn:` prop)
```JS
var oda = new landSails.ODA();
try {
  // Track our Waterline Goal.create() call...
  var goal = await oda.track(Goal).create({label: inputs.label, owner: this.req.session.userId}).fetch();
} catch(e) {
  throw new Error(e);
  return;
}
// detach() returns the full ODA object, built by previous calls to track().
return exits.success(oda.detach());
```
**Output:**
```JSON
[
    {
        "o": "goal",
        "d": {
            "createdAt": 1517321007036,
            "updatedAt": 1517321007036,
            "id": 8,
            "label": "My Test Goal",
            "owner": 5
        },
        "a": "create"
    }
]
```

### It will also track many operations, including association changes

*In a Sails 1.x Machine-style action...* (This is the async `fn:` prop)
```JS
var oda = new landSails.ODA();
try {

  // Track this create on the 'Milestone' waterline model...
  var milestone = await oda.track(Milestone).create({label: inputs.label, goal: inputs.goalId, owner: this.req.session.userId}).fetch();
  
  // ... and also the addToCollection
  await oda.track(Milestone).addToCollection(milestone.id, 'tasks', inputs.tasks);
  
} catch(e) {
  throw new Error(e);
  return;
}

// Send our ODA packet as before
return exits.success(oda.detach());
```
**Output:**
```JSON
[
    {
        "o": "milestone",
        "d": {
            "createdAt": 1517321077205,
            "updatedAt": 1517321077205,
            "id": 28,
            "label": "My Milestone 2",
            "goal": 8,
            "owner": 5
        },
        "a": "create"
    },
    {
        "o": "milestone",
        "d": [
            28,
            "tasks",
            [
                1
            ]
        ],
        "a": "addToCollection"
    }
]
```
