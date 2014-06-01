var cfg = require("./config/config.js");
var fs = require('fs');
var http = require('http');
var https = require('https');
var units = require('node-units');

var blessed = require('blessed');
var screen = blessed.screen();
var box = [];

var coinData = {};

var l = 'left';
var r = '';
var b = '';
var t = 'top';




console.log("Saloon starting up:  " + new Date());

console.log(" + looking for miners");



var devList = fs.readdirSync('/dev');


for (var miner in cfg.miners) {
  console.log("  -- " + miner + " :: " + cfg.miners[miner].devPattern);
  var re = new RegExp(cfg.miners[miner].devPattern);
  devList.forEach(function(item) { 
		if (re.test(item) ) {
			console.log(miner + " found at " + item); 
		}
  });
};

function roundNumber(number, decimals) {     
	var newnumber = new Number(number+'').toFixed(parseInt(decimals));
	var value = parseFloat(newnumber);
	return value;
}

function loadCoins() {
for (var coin in cfg.pools) {
  //console.log(" Loading stats for " + coin);
  coinData[coin] = {};
  var poolstatusUrl = cfg.pools[coin].api + "getpoolstatus&api_key=" + cfg.pools[coin].apiKey;
  var poolinfoUrl= cfg.pools[coin].api + "getpoolinfo&api_key=" + cfg.pools[coin].apiKey;
  
  lookupCoinStats(coin,poolstatusUrl);
  lookupCoinReward(coin,poolinfoUrl);
  if (typeof box[coin] === 'undefined') {
    addBox(coin);
  }
  cfg.pools[coin].exchanges.forEach(function(exchange) {
    var checkBittrex= new RegExp("bittrex");
    var checkCryptsy= new RegExp("cryptsy");
    if (checkBittrex.test(exchange)) {
      lookupCoinBittrex(coin,exchange);
    }
    if (checkCryptsy.test(exchange)) {
      lookupCoinCryptsy(coin,exchange);
    }
  });

}
}

loadCoins();

function showHeader() {
  for (var coin in box) {
	var day = coinData[coin].reward / (coinData[coin].difficulty * Math.pow(2,32) / ( 6000 * 1000 ) / 3600 / 24 ) ;
	day = roundNumber(day,3);
	box[coin].deleteLine(0);
	box[coin].insertLine(0,coin + "\t"+ coinData[coin].poolHashrate + "/" + coinData[coin].netHashrate  + "mh/s\t" + coinData[coin].poolPercentage + "\t" + day);

}

}

function lookupCoinBittrex( coin, url) {
  var client;
  var checkURL = new RegExp("^https");
  if (checkURL.test(url)) {
    client = https;
  } else {
    client = http;
  }
  var req = client.get(url, function(res) {
    res.setEncoding('utf8');
  
    var data =""; 
    res.on('data', function (chunk) {
        data +=	 chunk;
    });
    res.on('end', function() {

	var d = JSON.parse(data) ;
//	console.log(d.getpoolstatus);
	[0,1,2].forEach( function(idx) {
	box[coin].insertLine(1, "[B]\t"  + d.result.buy[idx].Rate + "\t" + d.result.buy[idx].Quantity +"\t" + d.result.buy[idx].Rate * d.result.buy[idx].Quantity +"\t" + .01/ d.result.buy[idx].Rate );
	screen.render();
	  //console.log("  [B]\t" + coin + "\t" + d.result.buy[idx].Rate + "\t" + d.result.buy[idx].Quantity +"\t" + d.result.buy[idx].Rate * d.result.buy[idx].Quantity +"\t" + .01/ d.result.buy[idx].Rate +"\t[bittrex]");
        });
		
    });

  });  
}
function lookupCoinCryptsy( coin, url) {
  var client;
  var checkURL = new RegExp("^https");
  if (checkURL.test(url)) {
    client = https;
  } else {
    client = http;
  }
  var req = client.get(url, function(res) {
    res.setEncoding('utf8');
  
    
    var data =""; 
    res.on('data', function (chunk) {
        data +=	 chunk;
    });
    res.on('end', function() {
	var d = JSON.parse(data) ;
	//console.log(d.return[coin].buyorders[0]);
	[0,1,2].forEach( function(idx) {
	
        var price = d.return[coin].buyorders[idx].price;	
        var quantity = d.return[coin].buyorders[idx].quantity;	
	box[coin].insertLine(1, "[C]\t" + price+ "\t" + quantity +"\t" + price * quantity + "\t" + .01 / price  + "\t[cryptsy]");
	
screen.render();
	//console.log("  [C]\t" + coin + "\t" + price+ "\t" + quantity +"\t" + price * quantity + "\t" + .01 / price  + "\t[cryptsy]");
        });
		
    });

  });  
}
function lookupCoinStats( coin, url) {
  var client;
  var checkURL = new RegExp("^https");
  if (checkURL.test(url)) {
    client = https;
  } else {
    client = http;
  }
  var req = client.get(url, function(res) {
    res.setEncoding('utf8');
    var data = ""; 
    res.on('data', function (chunk) {
        data +=	 chunk;
    });
    res.on('end', function() {
    var d;
try {
	d = JSON.parse(data) ;
}
catch (e) {
  //console.log(e);
}
finally {
  
	if (d && typeof d.getpoolstatus !== 'undefined' ) {
/*	coinData[coin].poolHashrate = roundNumber(d.getpoolstatus.data.hashrate,3);
	coinData[coin].netHashrate = roundNumber(d.getpoolstatus.data.nethashrate,3);
	coinData[coin].difficulty = d.getpoolstatus.data.networkdiff;
	coinData[coin].poolPercentage = roundNumber(d.getpoolstatus.data.hashrate  /  d.getpoolstatus.data.nethashrate,6);
*/
	coinData[coin].poolHashrate = roundNumber(units.convert(d.getpoolstatus.data.hashrate + " kb to mb"),1);
	coinData[coin].netHashrate = roundNumber(units.convert(d.getpoolstatus.data.nethashrate + " b to mb"),1);
	coinData[coin].difficulty = d.getpoolstatus.data.networkdiff;
	coinData[coin].poolPercentage = roundNumber(d.getpoolstatus.data.hashrate  /  d.getpoolstatus.data.nethashrate,6);
	//box[coin].deleteLine(0);
	//box[coin].insertLine(0,coin + "\t"+ d.getpoolstatus.data.hashrate + "\t" + d.getpoolstatus.data.nethashrate  + "\t" + d.getpoolstatus.data.hashrate  /  d.getpoolstatus.data.nethashrate);
//screen.render();
	
	} else {
		//console.log(d);
	}
}
		
    });

  });  

}

function lookupCoinReward( coin, url) {
  var client;
  var checkURL = new RegExp("^https");
  if (checkURL.test(url)) {
    client = https;
  } else {
    client = http;
  }
  var req = client.get(url, function(res) {
    res.setEncoding('utf8');
    var data = ""; 
    res.on('data', function (chunk) {
        data +=	 chunk;
    });
    res.on('end', function() {
try {
	var d = JSON.parse(data) ;
}
catch (e) {
  //console.log(e);
}
finally {
  
	if (d && typeof d.getpoolinfo!== 'undefined' ) {
	coinData[coin].reward = d.getpoolinfo.data.reward;
	//box[coin].deleteLine(0);
	//box[coin].insertLine(0,coin + "\t"+ d.getpoolstatus.data.hashrate + "\t" + d.getpoolstatus.data.nethashrate  + "\t" + d.getpoolstatus.data.hashrate  /  d.getpoolstatus.data.nethashrate);
//screen.render();
	
	} else {
		//console.log(d);
	}
}
		
    });

  });  

}

// Create a screen object.



function addBox(coin) {
var options = {
  width : "32%",
  height : "44%",
  content: "Coin  Pool  Net  Ratio",
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  }
}
if (r == 1) {
  options.right = r
}  else {
  options.left = l
}
options.label = coin;
if (b == 1) {
  options.bottom = b;
} else {
  options.top= t;
}
console.log(coin + t + b + l + r );
box[coin] = blessed.box( options);



screen.append(box[coin]);
  if (r == '1' ) {
    l = 'left';
    t = '';
    b = '1';
    r = '';
  } else if (l == 'center' ) {
    l = '';
    r = '1';
  } else if (l == 'left' ) {
    l = 'center';
  }
}


// Append our box to the screen.

// If our box is clicked, change the content.


// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});
screen.key(['space' ], function(ch, key) {
  showHeader();
  loadCoins();
});

// Focus our element.
box["CPTL"].focus();

// Render the screen.
screen.render();
