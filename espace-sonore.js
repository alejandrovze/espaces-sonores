// Listener class
// TODO : Modify directionality if possible ?
class Ears {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  set_position(x, y) {
    var scaled_x = 100 * x / bg_width;
    var scaled_y = 100 * y / bg_height;
    if (scaled_x < 0) {
      x = 0;
    }
    if (scaled_y < 0) {
      y = 0;
    }
    if (scaled_x > 100) {
      x = bg_width;
    }
    if (scaled_y > 100) {
      y = bg_height;
    }
    this.x = x;
    this.y = y;
    Tone.Listener.positionX.value = this.x;
    Tone.Listener.positionY.value = this.y;
    Tone.Listener.positionZ.value = 0;
    console.log("Listener position set to " + 100 * x / bg_width + " " + 100 * y / bg_height);
  }
}

class SoundSource {
  constructor(x, y) {
    this.x_prop = x;
    this.y_prop = y;
    this.resetPosition();
    this.width = 20;
    this.height = 20;
    this.offsetX = 0;
    this.offsetY = 0;
    this.dragging = false;
    this.rollover = false;
    this.player = new Tone.Player();
    this.player.loop = true;
    this.player.autostart = false;
    this.player.loopStart = 1.0;

    this.panner = new Tone.Panner3D({
      panningModel: "HRTF",
      positionX: this.x,
      positionY: this.y,
      positionZ: 0,
      distanceModel: "exponential",
      refDistance: 0.5,
      coneOuterAngle: 360
      // refDistance: 0.25
    });
  }

  load(sound_source) {
    this.player.load(sound_source);
    this.player.connect(this.panner);
    this.panner.connect(Tone.Master);
  }
  
  init() {
    this.player.start();
  }

  show(px, py) {
    if (this.dragging) {
      this.x = px + this.offsetX;
      this.y = py + this.offsetY;
      this.panner.setPosition(this.x, this.y, 0);
    }

    rect(this.x, this.y, this.width, this.height);
  }
  
  resetPosition() {
    this.x = this.x_prop * bg_width / 100.;
    this.y = this.y_prop * bg_height / 100.;
  }

//   pressed(px, py) {
//     if (
//       px > this.x &&
//       px < this.x + this.width &&
//       py > this.y &&
//       py < this.y + this.height
//     ) {
//       this.dragging = true;
//       this.offsetX = this.x - px;
//       // print(this.offsetX);
//       this.offsetY = this.y - py;
//       // print(this.offsetY);
//     }
//   }

//   notPressed(px, py) {
//     this.dragging = false;
//   }

  start() {
    this.player.start();
  }

  isPlaying() {
    if (this.player.state == "started") {
      return true;
    } else {
      return false;
    }
  }
}

var canvas, bg, bg_width, bg_height;

var sources = [];
var player, panner;

var listener;

// SOUNDS TO LOAD FROM THE ASSETS
var sound_urls;

var sound_names;

var sound_positions;

var drawing;

var data_load;

var json_data;

var sound_loaded = false;

var img_loaded = false;

var launched = false;
var load_text;
var launch_button;

async function preload() {
    load_text = createSpan('...');
    load_text.style('color:white');
    load_text.center();
  const searchParams = new URLSearchParams(window.location.search);
  const map_name = searchParams.get('map');
  if (map_name == null) {
    load_text.html("pas de carte chargée")
    load_text.center();
  }
  else {
    load_text.html("chargement image")
    load_text.center();
    // Choose which map to load
    console.log(map_name + " opened");;

    if(map_name=="guisma") {
      data_load = "./guisma.json";
    }

    if(map_name=="yourtes") {
      data_load = "./yourtes.json";
    }

    await fetch(data_load)
      .then((response) => response.json())
      .then(data => json_data = data)
      .then(() => sound_urls = json_data.sound_urls)
      .then(() => sound_names = json_data.sound_names)
      .then(() => sound_positions = json_data.sound_positions)
      .then(() => drawing = json_data.drawing)
      .then(() => console.log(json_data.name + " data loaded"))

    loadImage(drawing, img => { 
      bg = img;
      console.log(bg);
      console.log("Preloaded image " + bg.width + " x " + bg.height);
      scaleImage();

      canvas = createCanvas(bg_width, bg_height);
      canvas.parent("canvas_container");
      canvas.position(0, 0);
      frameRate(10);

      img_loaded = true;
      loadSounds()
        .then(() => sound_loaded = true)
    }, 
      (event) => { 
        // error if neeeded
      } 
    );
  }
}

function setup() {
  

  fill(255, 255, 255, 60);
  stroke(255, 255, 255, 200);
}

function draw() {
  // background(bg); // Clear background
  background("black");
  
  if(img_loaded && launched) {
    image(bg, 0, 0, bg_width, bg_height);
    document.getElementById("defaultCanvas0").style.position = "relative";

    // Draw Sources
    fill(255, 153, 255, 60);
    for (var i = 0; i < sources.length; ++i) {
      sources[i].show(mouseX, mouseY);
    }

    // Draw listener
    fill(255, 255, 255, 60);
    ellipse(
      listener.x,
      listener.y,
      50,
      50
    );
    
    if (sound_loaded) {
      listener.set_position(mouseX, mouseY);
    }
  }
  
}

function makeLaunchButton() {
  load_text.remove();
  launch_button = createButton("*lancer l'espace sonore*"); 
      
  // Position the button 
  
  launch_button.center(); 
      
  // When the button is clicked change_background() 
  // function is called 
  launch_button.mousePressed(launch);
}

function launch() {
  console.log("Launching map");
  
  Tone.start();
  for (var i = 0; i < sources.length; ++i) {
    sources[i].init();
  }
  console.log("Launching sounds");

  Tone.Master.volume.value = 20;
  listener = new Ears(random(width), random(height));
  listener.set_position(windowWidth / 2., windowHeight / 2.);
  launched = true;
  launch_button.remove();
}

async function loadSounds() {
  console.log("Loading sounds");
  load_text.html('chargement son ...');
  load_text.style('color:white');
  load_text.center();
  for (var i = 0; i < sound_urls.length; ++i) {
    console.log("Loading " + sound_names[i]);
    sources[i] = new SoundSource(sound_positions[i][0], sound_positions[i][1]);
    sources[i].load(sound_urls[i]);
  }
  await Tone.loaded()
    .then(() => console.log(sound_urls.length + " sounds loaded"))
    .then(() => makeLaunchButton())
}

function scaleImage() {
  if (bg.height / bg.width <= windowHeight / windowWidth) {
    console.log("Scaling based on width"); 
    bg_width = windowWidth * 0.9;
    bg_height = bg_width * bg.height / bg.width;
  } else {
    console.log("Scaling based on height");
    bg_height = windowHeight * 0.9;
    bg_width = bg_height * bg.width / bg.height;
  }
  console.log("Width " + bg_width + " Height " + bg_height);
}

function windowResized() {
  console.log('resized');
  scaleImage();
  resizeCanvas(bg_width, bg_height);;
  
  launch_button.position(windowWidth / 2., windowHeight / 2.); 
  
  for (var i = 0; i < sound_urls.length; ++i) {
    sources[i].resetPosition();
  }
}

function mousePressed() {
  if (sound_loaded) {
    listener.set_position(mouseX, mouseY);
  }
}