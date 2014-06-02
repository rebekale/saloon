var cfg = require("./config/config.js");
var fs = require('fs');
var http = require('http');
var https = require('https');
var units = require('node-units');

var blessed = require('blessed');
var screen = blessed.screen();
var box = [];

var coinData = {};

var l = '0%';
var r = '';
var b = '';
var t = '0%';
var P = 0;
var tabs = {};
var tcount = 0;
var rcount = 0;
var tpos = 0;


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
  tabs[tcount] = coin;
  tcount++;
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
	box[coin].deleteLine(0);
	box[coin].deleteLine(0);
	box[coin].deleteLine(0);
	box[coin].insertLine(0, "\t" + coin+"/day\t" + day);
	box[coin].insertLine(0, "------------------------");
	box[coin].insertLine(0, coinData[coin].poolHashrate + "/" + coinData[coin].netHashrate  + "mh/s\t" + coinData[coin].poolPercentage ); 
	box[coin].insertLine(0, "Pool / Net \t \t%");

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

    var d;
try {
	d = JSON.parse(data) ;
}
catch (e) {
  //console.log(e);
}
finally {
//	console.log(d.getpoolstatus);
var options = {
  top : 6,
  left : 1,
  width : "48%",
  height : "64%",
  content: " line 0?",
  label : 'Bittrex',
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
};
   var rate = 0;
   var tot = 0;
   var qty = 0 ;

	[0,1,2].forEach( function(idx) {
		//console.log(tot);
		//console.log(qty);
		tot +=  d.result.buy[idx].Rate * d.result.buy[idx].Quantity;
		qty +=  d.result.buy[idx].Quantity;
//b2.insertLine(1, "[B]\t"  + d.result.buy[idx].Rate + "\t" + d.result.buy[idx].Quantity +"\t" + d.result.buy[idx].Rate * d.result.buy[idx].Quantity +"\t" + .01/ d.result.buy[idx].Rate );
        });
        rate = roundNumber( tot/qty, 8); 
	//b2.insertLine(1,"0.01: " + roundNumber(0.01 / rate, 2));
	//b2.insertLine(1,"Inv: " + roundNumber(qty * rate ,1));
	//b2.insertLine(1,"Qty: " + roundNumber(qty,1));
	//b2.insertLine(1,"Rate: " + rate);
 //b2.insertTop(1,"testing");	
  options.content= "Rate: "+ rate + "\n" +    "Qty: " + roundNumber(qty,1) + "\n" + "Inv: " + roundNumber(qty * rate ,4) + "\n" + "0.01: " + roundNumber(0.01 / rate, 2) ;
  var b2 = blessed.box( options);
	box[coin].append(b2);
	screen.render();
	  //console.log("  [B]\t" + coin + "\t" + d.result.buy[idx].Rate + "\t" + d.result.buy[idx].Quantity +"\t" + d.result.buy[idx].Rate * d.result.buy[idx].Quantity +"\t" + .01/ d.result.buy[idx].Rate +"\t[bittrex]");
		
}
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
var options = {
  top : 6,
  right : 1,
  width : "48%",
  height : "64%",
  content: " line 0?",
  label : 'Cryptsy',
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
};
   var rate = 0;
   var tot = 0;
   var qty = 0 ;

	//console.log(d.return[coin].buyorders[0]);
	[0,1,2].forEach( function(idx) {
	
        var price = d.return[coin].buyorders[idx].price;	
        var quantity = d.return[coin].buyorders[idx].quantity;	
        qty += quantity * 1;
	tot += quantity * price;

	//box[coin].insertLine(1, "[C]\t" + price+ "\t" + quantity +"\t" + price * quantity + "\t" + .01 / price  + "\t[cryptsy]");
	
	//console.log("  [C]\t" + coin + "\t" + price+ "\t" + quantity +"\t" + price * quantity + "\t" + .01 / price  + "\t[cryptsy]");
        });
        rate = roundNumber( tot/qty, 8); 

  options.content= "Rate: "+ rate + "\n" +    "Qty: " + roundNumber(qty,1) + "\n" + "Inv: " + roundNumber(qty * rate ,4) + "\n" + "0.01: " + roundNumber(0.01 / rate, 2) ;
  var b2 = blessed.box( options);
	box[coin].append(b2);
screen.render();
		
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
  
}
finally {
  
	if (d && typeof d.getpoolstatus !== 'undefined' ) {
/*	coinData[coin].poolHashrate = roundNumber\(d.getpoolstatus.data.hashrate,3);
	coinData[coin].netHashrate = roundNumber\(d.getpoolstatus.data.nethashrate,3);
	coinData[coin].difficulty = d.getpoolstatus.data.networkdiff;
	coinData[coin].poolPercentage = roundNumber\(d.getpoolstatus.data.hashrate  /  d.getpoolstatus.data.nethashrate,6);
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
  width : "18%",
  height : "25%",
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
options.label = "{bold}"+coin+"{/bold}";
if (b == 1) {
  options.bottom = b;
} else {
  options.top= t;
}
console.log(coin + t + b + l + r );
box[coin] = blessed.box( options);



screen.append(box[coin]);
  
  P++;
  l = P*20 + "%";
  
  if (P == '5' ) {
    r = '';
    rcount++;
    t = rcount * 25 + "%";
    l = '0%';
    P = 0;
  } 
  
 

}


// Append our box to the screen.

// If our box is clicked, change the content.


// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});
screen.key(['tab' ], function(ch, key) {
  if (tpos == tcount) {
    tpos = 0;
  } 
  box[tabs[tpos]].focus();
  screen.render(); 
  
});
screen.key(['space' ], function(ch, key) {
  showHeader();
  loadCoins();
});

// Focus our element.
box["CPTL"].focus();

// Render the screen.
screen.render();
  showHeader();
  loadCoins();
