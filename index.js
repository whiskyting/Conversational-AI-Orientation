'use strict';
const
    config = require('config'),
    express = require('express'),
    request = require('request');

var app = express();
var port = process.env.PORT || process.env.port || 5001;
app.set('port',port);

app.use(express.json());

app.listen(app.get('port'),function(){
    console.log('[app.listen] Node app is running on port',app.get('port'));
});

module.exports = app;

const MOVIE_API_KEY = config.get('MovieDB_API_KEY');

app.post('/webhook', function(req, res){
    console.log("[Webhook] in");
    console.log("Line ID :",req.body.originalDetectIntentRequest.payload.data.source.userId);
    console.log("User Say :",req.body.queryResult.queryText);
    let data = req.body;
    let queryMovieName = data.queryResult.parameters.MovieName;
    console.log("[queryMovieName] ", queryMovieName);
    let propertiesObject = {
        query:queryMovieName,
        api_key:MOVIE_API_KEY,
        language:"zh-TW"
    };
    request({
        uri:"https://api.themoviedb.org/3/search/multi?",
        json:true,
        qs:propertiesObject
    },function(error, response, body){
        if(!error && response.statusCode == 200){
            //Success!
            if(body.results.length!=0){
                //Has data
                let thisFulfillmentMessages = [];
                //Movie Title
                let movieTitleObject = {};
                if(body.results[0].title == queryMovieName){
                    movieTitleObject.text = {text:[body.results[0].name]};
                }else{
                    movieTitleObject.text = {text:["系統內最相關的電影是"+body.results[0].name] };
                }
                thisFulfillmentMessages.push(movieTitleObject);
                //Movie Overview
                if(body.results[0].overview){
                    let movieOverViewObject = {};
                    movieOverViewObject.text = {text:[body.results[0].overview]};
                    thisFulfillmentMessages.push(movieOverViewObject);
                }
                //Movie Poster
                if(body.results[0].poster_path){
                    let movieImageObject = {};
                    movieImageObject.image = { imageUri: "https://image.tmdb.org/t/p/original" + body.results[0].poster_path };
                    thisFulfillmentMessages.push(movieImageObject);
                }
                 //Movie Backdrop
                 if (body.results[0].backdrop_path) {
                    let movieImageObject = {};
                    movieImageObject.image = { imageUri: "https://image.tmdb.org/t/p/original" + body.results[0].backdrop_path };
                    thisFulfillmentMessages.push(movieImageObject);
                }

            

                console.log("[thisFulfillmentMessages] ", thisFulfillmentMessages);
                res.json({fulfillmentMessages:thisFulfillmentMessages});

            }else{
                res.json({fulfillmentText:"很抱歉，系統裡面沒有這部電影"});
            }
        }else{
            console.log("[The MovieDB] Failed");
            console.log("[error] ", error);
            console.log("[response.statusCode] ",response.statusCode);
        }
    });
});