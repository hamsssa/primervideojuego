
////////////////IMPORTANTE COSAS QUE HACER:
//////poner nuevo FLOOR
//////PONER ALGO AL FINAL PARA GANAR EL JUEGO

const WIDTH = innerWidth;
const HEIGHT = innerHeight;
const WORLD_WIDTH = 5125; 

const config = 
{
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1000 }, 
      debug: false
    }
  },
  scene: {
    preload,
    create,
    update
  }
};

new Phaser.Game(config);

function preload() 
{
  // Escenario
  this.load.image('cloud1', 'assets/scenery/overworld/cloud1.png');
  this.load.image('block', 'assets/blocks/overworld/block.png');
  this.load.image('floorbricks', 'assets/scenery/overworld/floorbricks1.png');
  this.load.image('background', 'assets/scenery/overworld/background.png');
  this.load.image('ground', 'assets/scenery/overworld/tierra.png');
  
  // Objetos interactivos
  this.load.image('tree', 'assets/scenery/overworld/tree.png'); // //
  this.load.image('coin', 'assets/scenery/overworld/coin.png');
  this.load.image('star', 'assets/blocks/overworld/door.png');
  // Personaje
  this.load.spritesheet('mario', 'assets/entities/mario.png', {frameWidth: 16, frameHeight: 16 });
  this.load.spritesheet('marioIdle', 'assets/entities/marioIdle.png', {frameWidth: 16, frameHeight: 16 });
  //this.load.spritesheet('mario-jump', 'assets') PONER AL PERSONAJE SALTANDO
}

function create() 
{
    /// === AVISO DE CONTROLES ===
    alert(
      "🎮 CONTROLES DEL JUEGO:\n\n" +
      "• FLECHA IZQUIERDA ← : Movimiento a la izquierda\n" +
      "• FLECHA DERECHA → : Movimiento a la derecha\n" +
      "• FLECHA ARRIBA ↑ : Saltar\n\n" +
      "Tienes que saltar sobre las monedas para hacer doble salto\n"
      +
      "¡Disfruta del minijuego y buena suerte!\n"
    );
  
  // === CONFIGURACIÓN DEL MUNDO ===
  this.physics.world.setBounds(0, 0, WORLD_WIDTH, HEIGHT);
  
  // Background
  for (let i = 0; i < WORLD_WIDTH / WIDTH; i++)
  {
    this.add.image(i * WIDTH, 0, 'background')
      .setOrigin(0, 0)
      .setDisplaySize(WIDTH, HEIGHT)
      .setScrollFactor(0.3); // Efecto parallax
  }
  
  // Nubes con parallax
  for (let i = 0; i < 20; i++) 
  {
    const x = Phaser.Math.Between(0, WORLD_WIDTH);
    const y = Phaser.Math.Between(50, HEIGHT / 2);
    const scale = Phaser.Math.FloatBetween(0.1, 0.3);
    this.add.image(x, y, 'cloud1')
      .setScale(scale)
      .setScrollFactor(0.5); // Efecto parallax
  }
  
  // === GRUPOS FÍSICOS ===
  this.platforms = this.physics.add.staticGroup();
  this.blocks = this.physics.add.staticGroup();
  this.coins = this.physics.add.group();
  this.trees = this.add.group(); // Grupo para los árboles (no físico)
  this.deathZones = this.physics.add.staticGroup(); 
  this.star = this.physics.add.group();
  this.ground = this.physics.add.staticGroup();
  // === CREACIÓN DEL MAPA ===
  createMap(this);
  
  
  // === CONFIGURACIÓN DEL JUGADOR ===
  this.mario = this.physics.add.sprite(100, HEIGHT - 500, 'mario')
    .setOrigin(1, 1)
    .setScale(2)
    .setCollideWorldBounds(true)
    .setBounce(0.1); // Pequeño rebote
  
  // Ajustar el tamaño del hitbox
  this.mario.body.setSize(14, 16); 
  
  // === ANIMACIONES ===
  createAnimations(this);
  
  // === COLISIONES ===
  this.physics.add.collider(this.mario, this.platforms);
  this.physics.add.collider(this.mario, this.blocks, handleBlockCollision);
  this.physics.add.collider(this.coins, this.platforms); // Las monedas colisionan con plataformas
  this.physics.add.overlap(this.mario, this.coins, collectCoin, null, this);
  this.physics.add.overlap(this.mario, this.star, collectStar, null, this);
    
  // === CÁMARA ===
  this.cameras.main.setBounds(0, 0, WORLD_WIDTH, HEIGHT);
  this.cameras.main.startFollow(this.mario, true, 0.08, 0.08); // Seguimiento 
  
  // === CONTROLES ===
  this.cursors = this.input.keyboard.createCursorKeys();
  
  // === SISTEMA DE PUNTUACIÓN ===
  this.score = 0;
  this.scoreText = this.add.text(16, 16, 'Puntos: ' + this.score, 
    { 
      fontSize: '24px', 
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 4
    })
    .setScrollFactor(0)
    .setDepth(10)
    .setOrigin(0, 0)

    ///MUERTE
    this.physics.add.overlap(
      this.mario, 
      this.deathZones, 
      handleDeath, // Función de manejo de muerte
      null, 
      this
    );
  
}
function handleDeath(mario, zone) 
{
  if (this.isGameOver) return;
  
  // Desactivar controles
  this.isGameOver = true;
  this.physics.pause();
  
  // Animación de muerte
  
  setTimeout(() => {
    window.location.reload();
  }, 50);
}
function update() 
{
  const { left, right, up, space } = this.cursors;
  const onGround = this.mario.body.touching.down;
  
  // Control horizontal
  if (left.isDown) 
  {
    this.mario.setVelocityX(-200);
    this.mario.flipX = true;
    if (onGround) 
    {
      this.mario.anims.play('mario-walk', true);
    }
  } 
  else if (right.isDown) 
  {
    this.mario.setVelocityX(200);
    this.mario.flipX = false;
    if (onGround) 
    {
      this.mario.anims.play('mario-walk', true);
    }
  } 
  else 
  {
    this.mario.setVelocityX(0);
    if (onGround) 
    {
      this.mario.anims.play('mario-idle', true);
    }
  }
  
  // Salto
  if ((up.isDown || space.isDown) && onGround) 
  {
    this.mario.setVelocityY(-550);
    this.mario.anims.play('mario-jump');
  }
  
  // Animación de salto
  if (!onGround) 
  {
    this.mario.anims.play('mario-jump');
  }
  
}

// === FUNCIONES AUXILIARES ===

// Función para crear árboles
function createTrees(scene)
{
  // Crear varios árboles a lo largo del nivel
  for (let i = 0; i < 4; i++) 
  {
    const x = Phaser.Math.Between(100, WORLD_WIDTH - 100);
    const y = HEIGHT - 32; // Colocarlos sobre el suelo
    const scale = Phaser.Math.FloatBetween(1, 1.5); // Variar tamaño ligeramente
    
    const tree = scene.add.image(x, y, 'tree')
      .setOrigin(0.5, 1) // Origen en la base del árbol
      .setScale(scale)
      .setDepth(Phaser.Math.Between(0, 1) ? 1 : 5); // Algunos árboles delante, otros detrás
      
    scene.trees.add(tree);
  }
}

function createMap(scene) 
{
  // ' ' (espacio) = Nada
  // '0' = Death Zone
  // '#' = Suelo/Plataforma base
  // 'B' = Bloque/Plataforma
  // 'C' = Moneda
  // 'T' = Árbol
  // 'S' = Estrella
  // 'E' = Tierra
  
  const levelText = `





                            0                 
                                 
                                                                                                             
                                                                                                                a                       
                                                                                                              A
                               BBBBBBB                                                                 a            
                                                                                                                                  C                    
                          C                                                                                                                 
                                                                                                                               C                                                 
                  BBB                                                                                                                  C     C       B                       BBBBB
                                      CCCCCCCC                                                                                                                C
              C     
                              CCC                                                                                       BBBBBB                                  
        BBB                                                                                                                                                   S
  T                                                         T  T     T            C     C      T                                                                                         
#### 000000000000000000000000000000000000000000000 ######################## 00000000000000000####0000000a########## 00000000000000000000000000000000000000000########################################################################
EEEE                                               EEEEEEEEEEEEEEEEEEEEEEEE                             aEEEEEEEEEE000000000000000000000000000000000000000000EEEE###################################################################
EEEE                                               EEEEEEEEEEEEEEEEEEEEEEEE                             aEEEEEEEEEE000000000000000000000000000000000000000000EEEE####################################################################
####                                               EEEEEEEEEEEEEEEEEEEEEEEE                            aEEEEEEEEEEE000000000000000000000000000000000000000000EEEE###################################################################
####                                                ##############################################################000000000000000000000000000000000000000000000#####################################################################`;

  // Configuración y constantes
  const TILE_SIZE = 32;
  
  // Procesamos el texto del nivel para obtener sus dimensiones
  const lines = levelText.trim().split('\n');
  const mapHeight = lines.length;
  const mapWidth = Math.max(...lines.map(line => line.length));
  
  // Aseguramos que el mundo tiene suficiente tamaño para el mapa
  const requiredWorldWidth = mapWidth * TILE_SIZE;
  if (requiredWorldWidth > WORLD_WIDTH) 
  {
    console.warn(`El mapa requiere un mundo de al menos ${requiredWorldWidth}px de ancho, pero WORLD_WIDTH = ${WORLD_WIDTH}`);
  }
  
  // Mapeo de caracteres a funciones de creación de elementos
  const charMap = {
    '0': (x, y) => {
      const zone = scene.deathZones.create(x + TILE_SIZE/2, y + TILE_SIZE/2, null).setSize(TILE_SIZE, TILE_SIZE).setVisible(false).setOrigin(0.5);
    }, // No hacer nada para espacios vacíos
    
    '#': (x, y) => 
    {
      // Crear bloque de suelo
      scene.platforms.create(x, y, 'floorbricks')
        .setOrigin(0, 0)
        .setScale(1)
        .refreshBody();
    },
    
    'B': (x, y) =>
    {
      // Crear bloque de plataforma
      scene.blocks.create(x, y, 'block')
        .setOrigin(0, 0)
        .setScale(1.6)
        .refreshBody();
    },
    
    'C': (x, y) => 
    {
      // Crear moneda
      const coin = scene.coins.create(x + TILE_SIZE/2, y + TILE_SIZE/2, 'coin')
        .setScale(0.1)
        .setBounceY(Phaser.Math.FloatBetween(0.2, 0.5));
      
      scene.physics.world.enable(coin);
      coin.body.setAllowGravity(false);
    },
    
    'T': (x, y) => 
    {
      // Crear árbol
      const scale = Phaser.Math.FloatBetween(1, 1.5);
      const tree = scene.add.image(x + TILE_SIZE/2, y + TILE_SIZE, 'tree')
        .setOrigin(0.5, 1)
        .setScale(scale)
        .setDepth(Phaser.Math.Between(0, 1) ? 1 : 5);
        
      scene.trees.add(tree);
    },

    'S': (x, y) =>
    {
      const star = scene.star.create(x + TILE_SIZE/2, y + TILE_SIZE/2, 'star')
      .setScale(3)
      .setBounceY(Phaser.Math.FloatBetween(0.2, 0.5));
      
      scene.physics.world.enable(star);
      star.body.setAllowGravity(false);
    },
    'E': (x, y) =>
    {
      const ground = scene.ground.create(x, y, 'ground')
        .setOrigin(0, 0)
        .setScale(1)
        .refreshBody();
    }
  };
  
  // Recorremos cada caracter del nivel y creamos los elementos correspondientes
  for (let y = 0; y < mapHeight; y++) 
  {
    const line = lines[y].padEnd(mapWidth, ' '); // Rellenar con espacios si es necesario
    
    for (let x = 0; x < line.length; x++) 
    {
      const char = line[x];
      const createFunction = charMap[char];
      
      // Si el caracter tiene una función asociada, la ejecutamos
      if (createFunction) 
      {
        const posX = x * TILE_SIZE;
        const posY = y * TILE_SIZE;
        createFunction(posX, posY);
      }
    }
  }
}

function createAnimations(scene) 
{
  // Caminar
  scene.anims.create({
    key: 'mario-walk',
    frames: scene.anims.generateFrameNumbers('mario', { start: 0, end: 5}),
    frameRate: 10,
    repeat: -1
  });
  
  // Reposo
  scene.anims.create({
    key: 'mario-idle',
    frames: [{ key: 'marioIdle', frame: 2 }],
    frameRate: 10
  });
  
  // Salto
  scene.anims.create({
    key: 'mario-jump',
    frames: [{ key: 'mario', frame: 5 }],
    frameRate: 10
  });
  
  
}

// Colectar moneda
function collectCoin(mario, coin) 
{
  coin.disableBody(true, true);
  
  // Aumentar puntuación
  this.score += 10;
  this.scoreText.setText('Puntos: ' + this.score);

  if(this.score === 200)
  {
    alert("Has logrado todos los puntos!");
  }
}
function collectStar(mario, star)
{
  star.disableBody(true, true);
  alert("You won");
  setTimeout(() => {
  window.location.reload();
}, 300);
}
function handleBlockCollision(mario, block) 
{
  if (mario.body.touching.up && !mario.body.touching.down) 
  {
    block.scene.tweens.add({
      targets: block,
      y: block.y,
      duration: 100,
      yoyo: true
    });
  }
}