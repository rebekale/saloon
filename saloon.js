var cfg = require("./config/config.js");
var fs = require('fs');
var http = require('http');
var https = require('https');

var blessed = require('blessed');
var screen = blessed.screen();
var box = [];

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

function loadCoins() {
for (var coin in cfg.pools) {
  //console.log(" Loading stats for " + coin);

  var url = cfg.pools[coin].api + "getpoolstatus&api_key=" + cfg.pools[coin].apiKey;
  
  lookupCoinStats(coin,url);
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
	var d = JSON.parse(data) ;
	if (typeof d.getpoolstatus !== 'undefined' ) {
	box[coin].deleteLine(0);
	box[coin].insertLine(0,coin + "\t"+ d.getpoolstatus.data.hashrate + "\t" + d.getpoolstatus.data.nethashrate  + "\t" + d.getpoolstatus.data.hashrate  /  d.getpoolstatus.data.nethashrate);
screen.render();
	
	} else {
		//console.log(d);
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
  loadCoins();
});

// Focus our element.
box["CPTL"].focus();

// Render the screen.
screen.render();
