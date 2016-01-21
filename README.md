Allow to bind data on a promise chain.

[![Build Status](https://travis-ci.org/kigiri/store-chain.svg)](https://travis-ci.org/kigiri/store-chain)

``` javascript
// usage exemple
storeChain(fetch("http://ipinfo.io/json"))
  .set("ipInfo")
  .then(() => fs.openFileAsync("./path/to/data.json"))
  .then(JSON.parse)
  .set("data")
  .get(({ ipInfo, data }) => Object.assign(data, { ipInfo }))
  .then(JSON.stringify)
  .then(result => fs.writeFile("./path/to/new-data.json", result))
  .get(({ ipInfo }) => {
    console.log(ipInfo)
    console.log("save successfull.")
  });

// Promise.all for objects
storeChain.all({
    ipInfo: fetch("http://ipinfo.io/json"),
    data: fs.openFileAsync("./path/to/data.json")
      .then(JSON.parse)
  })
  .then({ ipInfo, data } => Object.assign(data, { ipInfo }))
  .then(JSON.stringify)
  .then(result => fs.writeFile("./path/to/new-data.json", result))
  // No more access to ipInfo here so can't log the results.


// Combine both :
storeChain({
    ipInfo: fetch("http://ipinfo.io/json"),
    data: fs.openFileAsync("./path/to/data.json")
      .then(JSON.parse)
  })
  .then({ ipInfo, data } => Object.assign(data, { ipInfo }))
  .then(JSON.stringify)
  .then(result => fs.writeFile("./path/to/new-data.json", result))
  .get(({ ipInfo }) => {
    console.log(ipInfo)
    console.log("save successfull.")
  })

```