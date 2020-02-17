var express = require('express');
const bodyParser = require('body-parser')
var request = require('request');

// Create our app
var app = express();

app.listen(3000, function () {
  console.log('Express server is up on port 3000');

  // Setup custom API callbacks.
  // For api calls where the response data needs to 
  // be modified before being sent back to the caller.

  // E.g users/login appends the access token from the header
  // into the response body.
  registerCallback("api/v4/users/login", customCallbacks, usersLoginCallback);
  registerCallback("api/v4/users/me", customCallbacks);
  registerCallback("api/v4/users/id/teams/id/channels", customCallbacks);
});

app.use(
  bodyParser.urlencoded({
    extended: true
  })
)

app.use(bodyParser.json())

app.post('/', (req, res) => {
  const {
    requestType = "",
    hostname = "", 
    pathname = "", 
    token = "", 
    body = {}
  } = req.body;

  var options = {
    strictSSL: false,
    secureProtocol: 'TLSv1_method',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    body: body
  }

  var callback = returnData(customCallbacks, pathname, '/');
  if (callback === undefined) {
    console.error("Unrecognised API call from path '" + pathname + "'!\nMake sure you have registered every API path with 'registerCallback'.");
    res.send("Unrecognised API call from path '" + pathname + "'!");
    return;
  }

  switch (requestType) {
    case "post": {
      request.post(hostname + "/" + pathname, options, 
      function( err, resp, body) {
        hookCallback(res, callback)(err, resp, body);
      });
    } break;

    case "get": {
      request.get(hostname + "/" + pathname, options, 
      function( err, resp, body) {
        hookCallback(res, callback)(err, resp, body);
      });
    } break;
  }
});

// Gives a callback access to the response variable from
// a request.
function hookCallback(res, callback = {}) {
  return function(err, resp, body) {
    callback(res, err, resp, body);
  }
}

// Sends the response body unmodified.
const defaultRequestCallback = function(res, err, resp, body) {
  res.send({
    ...JSON.parse(body),
  });
}

// Append the access token to the response body.
const usersLoginCallback = function(res, err, resp, body) {
  const {token = ""} = resp.headers;
  res.send({
    ...JSON.parse(body),
    token
  });
};

const customCallbacks = {};

function registerCallback(path = "", object = {}, data = defaultRequestCallback) {
  addDataToObject(data, path, object, '/');
  console.log("Callback registered '" + path +"' => " 
          + ((data !== defaultRequestCallback) ? data.name : "default"));
}
// Helpers

//A function that will add any variable to a given object via a path.
//If the path doesn't exist in the object it will create it.
//If something exists in the destination it will be replaced by the new data.
//If no path is specified the returned object will be the data.
//Parameters:
//	data = the variable that you want to add to the object. No limitation on
//		what it is.
//	path = pathname of the desired destination delimted by '.'.
//		eg: "application.system.module"
//	object = the object that the data should be added to and returned.
function addDataToObject(data, path = '', object = {}, delim = '.'){
	let resolve = (data, path, objLevel) =>{

			//Convert the path into an array of levels
			let levels = path.split(delim);

			//While there are levels to traverse
			while(levels.length) {
				//Does the current object have a property of the next level?
				if(!objLevel.hasOwnProperty(levels[0])) {
					//Create the level ready so it always exists ready to be traversed.
					objLevel[levels[0]] = {};
				}

				//Is this the last level?
				if(levels.length === 1){
					//Delete the data stored at this level.
					delete objLevel[levels[0]];

					//Set the data at this level.
					objLevel[levels[0]] = data;
				}

				//Traverse down the object and at the same time remove the next path level
				objLevel = objLevel[levels.shift()];
			}
	}

	//If no path has been specified
	if(path === ''){

		//Return the origional data.
		return data;
	}else{

		//Add the data to the object given a path.
		resolve(data, path, object);
	}
	return object;
}


//A function that will drill down an object given a path and return what is
//stored.
//Parameters:
//	data = the data that you want to query.
//	path = pathname of the desired piece of data delimted by '.'.
//		eg: "list.tasks"
function returnData(data, path, delim = '.'){
	let resolve = (data, path) =>{

		//Convert the path into an array of levels
    let levels = path.split(delim);
    for (l in levels) {
      if (levels[l].length === 26) {
        levels[l] = "id";
      }
    }

		//While there are levels to traverse
		while(levels.length) {
			//If the level does not exist in the data
			if(!data.hasOwnProperty(levels[0])) {

				//Nothing exists so return undefined.
				return undefined;
			}

			//Traverse down the object tree.
			data = data[levels.shift()];
		}
		return data;
	}
	return resolve(data, path);
}
