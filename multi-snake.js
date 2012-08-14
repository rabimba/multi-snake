<script>

WebSocket.__swfLocation = "/web-socket-js/WebSocketMain.swf";
CanvasRenderingContext2D.prototype.crisp = false;

CanvasRenderingContext2D.prototype.moveToOriginal = CanvasRenderingContext2D.prototype.moveTo;
CanvasRenderingContext2D.prototype.lineToOriginal = CanvasRenderingContext2D.prototype.lineTo;
CanvasRenderingContext2D.prototype.moveTo = function (x, y) {
  if (this.crisp) {
    x+=.5;
    y+=.5;
  } 
  this.moveToOriginal(x, y);
};

CanvasRenderingContext2D.prototype.lineTo = function (x, y) {
  if (this.crisp) {
    x+=.5;
    y+=.5;
  } 
  this.lineToOriginal(x, y);
}

var keys = { 38: 'n', 37: 'w', 40: 's', 39: 'e' },
    headings = { n: 360, s: 180, e: 90, w: 270 },
    canvas = document.querySelector('#game'),
    ctx = canvas.getContext('2d'),
    count = document.querySelector('#count'),
    timer = document.querySelector('#timer'),
    players = [],
    idToPlayer = {},
    conn = null;

ctx.crisp = true;

var gameState = (function () {
  var players = 0;
  
  ctx.strokeStyle = '#FF00C0';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  return {
    connected: function (ok) {
      // update display
      
    }
  };
})();

Array.prototype.remove = function(e) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (e === this[i]) {
      return this.splice(i, 1);
    }
  }
  return this;
};

function newPlayer(id, x, y) {
  var p = new Player(false, id, x, y);
  return p;
}

function connect() {
  if (!window.WebSocket || conn !== null) {
    return;
  }
  
  conn = new WebSocket('ws://node.remysharp.com:8000');
  
  conn.onopen = function () {
    // console.log('open');
    gameState.connected(true);
    conn.send(JSON.stringify({ type: 'join', id: player.id, x: player.x, y: player.y }))
  };
  
  conn.onclose = function () {
    // console.log('closed');
    // gameState.connected(false);
    // connect();
  };
  
  conn.onmessage = function (event) {
    // console.log('message: ' + event.data);
    var data = JSON.parse(event.data);

    if (data.type == 'join') {
      newPlayer(data.id, data.x, data.y);
      count.innerHTML = players.length;
    } else if (data.type == 'direction') {
      if (!idToPlayer[data.id]) {
        newPlayer(data.id, data.x, data.y);
      }
      idToPlayer[data.id].direction(data.direction);
    } else if (data.type == 'leave') {
      players.remove(idToPlayer[data.id]);
      // console.log('leave');
      count.innerHTML = players.length;
    }
  };
}

function Player(color, id, x, y) {
  this.id = id || (+new Date) * Math.random();
  idToPlayer[this.id] = this;
  this.name = name;
  // this.color = color || '#' + (~~(Math.random() * 16777215)).toString(16);
  this.color = color || 'rgb(' + [~~(Math.random() * 200),~~(Math.random() * 200),~~(Math.random() * 200)].join(',')  + ')';
  this.x = x || ~~(Math.random() * canvas.width);
  this.y = y || ~~(Math.random() * canvas.height);
  this.dx = 1;
  this.dy = 0;
  this.speed = 1;
  this.angle = 0;
  this.heading = 0;
  players.push(this);
}

Player.prototype = {
  draw: function () {
    var pixels, i, l;
    
    ctx.save();
    ctx.lineCap = 'square';
    ctx.lineWidth = 1;
    
    ctx.strokeStyle = this.color;
    ctx.beginPath();    
    ctx.moveTo(this.x, this.y);
    
    this.x += this.speed * this.dx;
    this.y += this.speed * this.dy;
    
    pixels = ctx.getImageData(this.x + this.dx, this.y + this.dy, 1, 1);
    ctx.lineTo(this.x, this.y);
    // console.log(this.x, this.y);
    ctx.stroke();
    ctx.closePath();

    ctx.restore();      

    if (this === player && pixels.data[3] !== 0) {
      clearInterval(gameTimer);
      gameover();
    }         
  },
  direction: function (heading) {
    this.heading += 360 - this.heading + headings[heading];
    this.heading = this.heading % 360;
    
    switch (this.heading) {
      case 0: 
        this.dx = 0;
        this.dy = -1;
        break;
      case 90:
        this.dx = 1;
        this.dy = 0;
        break;
      case 180:
        this.dx = 0;
        this.dy = 1;
        break;
      default: // 270
        this.dx = -1;
        this.dy = 0;
        break;
    }
  }
};

function gameover() {
  ctx.save();
  ctx.font = 'bold 88px courier, monospace';
  ctx.textAlign = 'center'; 
  // var size = ctx.measureText('game over.');
  ctx.translate(0, 0);
  ctx.fillStyle = 'rgba(255,0,192,.1)';
  ctx.fillRect(1, 1, ctx.canvas.width-2, ctx.canvas.height-2);
  ctx.fillStyle = '#FF00C0';
  ctx.shadowBlur = 5;
  ctx.shadowColor = 'rgba(255,0,192,0.7)';
  ctx.fillText('game over', ctx.canvas.width / 2, ctx.canvas.height / 2);
  // console.log('ok');
  ctx.restore();
  conn.send(JSON.stringify({ type: 'leave', id: player.id }));
  conn.close();
}

function draw() {
  timer.innerHTML = ((+new Date - alive) / 1000).toFixed(2);
  players.forEach(function (player) {
    player.draw();
  });
}

var player = new Player('#EF00B4');

window.onkeydown = document.body.onkeydown = function (event) {
  var key = keys[event.which];
  if (key) {
    event.preventDefault();
    player.direction(key);
    try { conn.send(JSON.stringify({ type: 'direction', x: player.x, y: player.y, id: player.id, direction: key })); }
    catch (e) {}
  }
};

connect();

var alive = +new Date;
var gameTimer = setInterval(draw, 10);
draw();

</script>