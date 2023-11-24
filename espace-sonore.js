// Listener class
// TODO : Modify directionality if possible ?
class Ears {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  set_position(x, y) {
    var scaled_x = (100 * x) / bg_width;
    var scaled_y = (100 * y) / bg_height;
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
    console.log(
      "Listener position set to " +
        (100 * x) / bg_width +
        " " +
        (100 * y) / bg_height
    );
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
    if (map_type == "space") {
      this.player.loop = true;
    }
    if (map_type == "triger") {
      this.player.loop = false;
    }
    this.player.autostart = false;
    this.player.loopStart = 1.0;
    this.player.fadeOut = 0.1;

    this.panner = new Tone.Panner3D({
      panningModel: "HRTF",
      positionX: this.x,
      positionY: this.y,
      positionZ: 0,
      distanceModel: "exponential",
      refDistance: 0.5,
      coneOuterAngle: 360,
      // refDistance: 0.25
    });
  }

  load(sound_source) {
    this.player.load(sound_source);
    if (map_type == "space") {
      this.player.connect(this.panner);
      this.panner.connect(Tone.Master);
    }
    if (map_type == "trigger") {
      this.player.connect(Tone.Master);
    }
  }

  init() {
    this.player.start();
  }

  play() {
    if (this.player.state == "stopped") {
      this.player.start();
    }
    else {
      this.player.stop();
    }   
  }

  show(px, py) {
    // if (this.dragging) {
    //   this.x = px + this.offsetX;
    //   this.y = py + this.offsetY;
    //   this.panner.setPosition(this.x, this.y, 0);
    // }
    if (map_type == "trigger" && this.player.state == "started") {
      fill(153, 255, 255, 60)
    }
    else {
      fill(255, 153, 255, 60);
    }

    rect(this.x, this.y, this.width, this.height);
  }

  resetPosition() {
    this.x = (this.x_prop * bg_width) / 100;
    this.y = (this.y_prop * bg_height) / 100;
  }
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

var load_text;

var launch_button;

// STATE TOGGLES
var map_type; // Map type : "space" or "trigger"
var min_distance = 50; // for trigger maps

var sound_loaded = false; // Status of sounds loaded

var img_loaded = false; // Status of images loaded

var launched = false; // Status of map launched

async function preload() {
  load_text = createSpan("...");
  load_text.style("color:white");
  load_text.center();
  const searchParams = new URLSearchParams(window.location.search);
  const map_name = searchParams.get("map");
  if (map_name == null) {
    load_text.html("pas de carte chargée");
    load_text.center();
  } else {
    load_text.html("chargement image");
    load_text.center();
    // Choose which map to load
    console.log(map_name + " opened");

    data_load = "./" + map_name + ".json";

    await fetch(data_load)
      .then((response) => {
        if (response.status >= 400 && response.status < 600) {
          load_text.html("erreur");
          load_text.center();
          throw new Error("Files not found");
        }
        return response;
      })
      .then((response) => response.json())
      .then((data) => (json_data = data))
      .then(() => (map_type = json_data.type))
      .then(() => (sound_urls = json_data.sound_urls))
      .then(() => (sound_names = json_data.sound_names))
      .then(() => (sound_positions = json_data.sound_positions))
      .then(() => (drawing = json_data.drawing))
      .then(() => console.log(json_data.name + " data loaded"));

    loadImage(
      drawing,
      (img) => {
        bg = img;
        console.log("Preloaded image " + bg.width + " x " + bg.height);
        scaleImage();

        canvas = createCanvas(bg_width, bg_height);
        canvas.parent("canvas_container");
        canvas.position(0, 0);
        frameRate(10);

        img_loaded = true;
        loadSounds().then(() => (sound_loaded = true));
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

  if (img_loaded) {
    if (!launched) {
      // // tint(255, 50); // opaque version
      // tint(GRAY);
      // image(bg, 0, 0, bg_width, bg_height);
      // document.getElementById("defaultCanvas0").style.position = "relative";
    }
    else {
      image(bg, 0, 0, bg_width, bg_height);
      document.getElementById("defaultCanvas0").style.position = "relative";

      // Draw Sources
      for (var i = 0; i < sources.length; ++i) {
        sources[i].show(mouseX, mouseY);
      }

      // Draw listener
      fill(255, 255, 255, 60);
      if (map_type == "space") {
        ellipse(listener.x, listener.y, 50, 50);
        if (sound_loaded) {
          listener.set_position(mouseX, mouseY);
        }
      }
      if (map_type == "trigger") {
        triangle(
          mouseX,
          mouseY - 10,
          mouseX - 10,
          mouseY + 10,
          mouseX + 10,
          mouseY + 10
        );
      }
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
  launch_button.mouseReleased(launch);
}

function launch() {
  console.log("Launching map");

  Tone.start();
  if (map_type == "space") {
    for (var i = 0; i < sources.length; ++i) {
      sources[i].init();
    }
  }
  console.log("Launching sounds");

  if (map_type == "space") {
    Tone.Master.volume.value = 20;
    listener = new Ears(random(width), random(height));
    listener.set_position(windowWidth / 2, windowHeight / 2);
  }
  if (map_type == "trigger") {
    Tone.Master.volume.value = 10;
  }
  
  launched = true;
  launch_button.remove();
}

async function loadSounds() {
  console.log("Loading sounds");
  load_text.html("chargement son ...");
  load_text.style("color:white");
  load_text.center();
  for (var i = 0; i < sound_urls.length; ++i) {
    console.log("Loading " + sound_names[i]);
    sources[i] = new SoundSource(sound_positions[i][0], sound_positions[i][1]);
    sources[i].load(sound_urls[i]);
  }
  await Tone.loaded()
    .then(() => console.log(sound_urls.length + " sounds loaded"))
    .then(() => makeLaunchButton());
}

function scaleImage() {
  if (bg.height / bg.width <= windowHeight / windowWidth) {
    console.log("Scaling based on width");
    bg_width = windowWidth * 0.9;
    bg_height = (bg_width * bg.height) / bg.width;
  } else {
    console.log("Scaling based on height");
    bg_height = windowHeight * 0.9;
    bg_width = (bg_height * bg.width) / bg.height;
  }
  console.log("Width " + bg_width + " Height " + bg_height);
}

function windowResized() {
  console.log("resized");
  scaleImage();
  resizeCanvas(bg_width, bg_height);

  launch_button.position(windowWidth / 2, windowHeight / 2);

  for (var i = 0; i < sound_urls.length; ++i) {
    sources[i].resetPosition();
  }
}

function locateSound(x, y) {
  var closest_sound = null;
  var closest_distance = 10000; // too random?
  for (var i = 0; i < sources.length; ++i) {
    if (dist(sources[i].x, sources[i].y, x, y) < min_distance) {
      if (dist(sources[i].x, sources[i].y, x, y) < closest_distance) {
        closest_sound = i; 
        closest_distance = dist(sources[i].x, sources[i].y, x, y);
      }
    }
  }
  return closest_sound;
}

function mousePressed() {
  if (sound_loaded && launched) {
    if (map_type == "space") {
      listener.set_position(mouseX, mouseY);
    }
    if (map_type == "trigger") {      
      console.log(
        "Clicked at " +
          (100 * mouseX) / bg_width +
          " " +
          (100 * mouseY) / bg_height
      );
      var closest_sound = locateSound(mouseX, mouseY);
      if (closest_sound != null) {
        sources[closest_sound].play();
        console.log("playing sound: " + sound_names[closest_sound]);
      }
      else {
        console.log("No sound played - too far.");
      }
    }
  }
}
