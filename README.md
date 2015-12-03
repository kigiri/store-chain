Allow to bind data on a promise chain.

[![Build Status](https://travis-ci.org/kigiri/store-chain.svg)](https://travis-ci.org/kigiri/store-chain)

``` javascript
// usage exemple
storeChain().get("ipInfo", fetch("http://ipinfo.io/json"))
  .then(() => fs.openFileAsync("./path/to/data.json"))
  .set("data", JSON.parse)
  .get(({ ipInfo, data }) => Object.assign(data, { ipInfo }))
  .then(JSON.stringify)
  .then(result => fs.writeFile("./path/to/new-data.json", result))
  .get.ipInfo(info => {
    console.log(info);
    console.log("save successfull.");
  });
```