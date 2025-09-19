const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const gridSize = 20; // size of one block
const columns = 12;
const rows = 20;

context.scale(gridSize, gridSize);

const colors = [
  null,
  'cyan',
  'blue',
  'orange',
  'yellow',
  'green',
  'purple',
  'red',
];

const shapes = [
  [],
  // I
  [
    [[0,0,0,0],
     [1,1,1,1],
     [0,0,0,0],
     [0,0,0,0]],
    [[0,0,1,0],
     [0,0,1,0],
     [0,0,1,0],
     [0,0,1,0]],
  ],
  // J
  [
    [[2,0,0],
     [2,2,2],
     [0,0,0]],
    [[0,2,2],
     [0,2,0],
     [0,2,0]],
    [[0,0,0],
     [2,2,2],
     [0,0,2]],
    [[0,2,0],
     [0,2,0],
     [2,2,0]],
  ],
  // L
  [
    [[0,0,3],
     [3,3,3],
     [0,0,0]],
    [[0,3,0],
     [0,3,0],
     [0,3,3]],
    [[0,0,0],
     [3,3,3],
     [3,0,0]],
    [[3,3,0],
     [0,3,0],
     [0,3,0]],
  ],
  // O
  [
    [[4,4],
     [4,4]],
  ],
  // S
  [
    [[0,5,5],
     [5,5,0],
     [0,0,0]],
    [[0,5,0],
     [0,5,5],
     [0,0,5]],
  ],
  // T
  [
    [[0,6,0],
     [6,6,6],
     [0,0,0]],
    [[0,6,0],
     [0,6,6],
     [0,6,0]],
    [[0,0,0],
     [6,6,6],
     [0,6,0]],
    [[0,6,0],
     [6,6,0],
     [0,6,0]],
  ],
  // Z
  [
    [[7,7,0],
     [0,7,7],
     [0,0,0]],
    [[0,0,7],
     [0,7,7],
     [0,7,0]],
  ],
];

let arena = createMatrix(columns, rows);
let dropCounter = 0;
let dropInterval = 200; // 1 second
let lastTime = 0;

let player = {
  pos: {x: 0, y: 0},
  matrix: null,
  shapeIndex: 0,
  rotation: 0,
};

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function createPiece(type) {
  const index = Object.keys(shapes).map(Number).find(key => key === type);
  return {
    shape: shapes[type],
    rotation: 0,
    matrix: shapes[type][0],
  };
}

function playerReset() {
  const shapeTypes = Object.keys(shapes).map(Number).filter(n => n > 0);
  const randType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
  player.shapeIndex = randType;
  player.matrix = shapes[randType][0];
  player.pos.x = Math.floor(columns / 2) - Math.ceil(player.matrix[0].length / 2);
  player.pos.y = 0;

  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
  }
}

function collide(arena, player) {
  const m = player.matrix;
  const o = player.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 &&
        (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  const m = player.matrix;
  const o = player.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0) {
        arena[y + o.y][x + o.x] = m[y][x];
      }
    }
  }
}

function sweep() {
  for (let y = arena.length -1; y >=0; --y) {
    if (arena[y].every(cell => cell !== 0)) {
      arena.splice(y, 1);
      arena.unshift(new Array(columns).fill(0));
    }
  }
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    sweep();
    playerReset();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function playerRotate(dir) {
  const prevMatrix = player.matrix;
  rotate(player.matrix, dir);
  if (collide(arena, player)) {
    // revert rotation if collides
    rotate(player.matrix, -dir);
  }
}

function drawMatrix(matrix, offset) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < matrix[y].length; ++x) {
      if (matrix[y][x] !== 0) {
        context.fillStyle = colors[matrix[y][x]];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    }
  }
}

function draw() {
  context.fillStyle = '#111';
  context.fillRect(0, 0, canvas.width / gridSize, canvas.height / gridSize);
  
  drawMatrix(arena, {x:0, y:0});
  drawMatrix(player.matrix, player.pos);
}

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
  draw();
  requestAnimationFrame(update);
}

// Keyboard controls (optional for desktop)
document.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') {
    playerMove(-1);
  } else if (event.key === 'ArrowRight') {
    playerMove(1);
  } else if (event.key === 'ArrowDown') {
    playerDrop();
  } else if (event.key === 'q') {
    playerRotate(-1);
  } else if (event.key === 'w') {
    playerRotate(1);
  }
});

// Mobile controls
document.getElementById('left').addEventListener('touchstart', () => playerMove(-1));
document.getElementById('right').addEventListener('touchstart', () => playerMove(1));
document.getElementById('down').addEventListener('touchstart', () => playerDrop());
document.getElementById('rotate').addEventListener('touchstart', () => playerRotate(1));

// Prevent default scrolling on touch buttons
document.querySelectorAll('.controls button').forEach(btn => {
  btn.addEventListener('touchstart', e => e.preventDefault());
});

// Start game
playerReset();
update();