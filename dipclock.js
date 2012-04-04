  var MILLIS_PER_MINUTE = 60 * 1000;
  var INTERVAL = 250;

  var SEASON = {
    SPRING : {value: 0, name: "Spring", code: "S"},
    SUMMER : {value: 1, name: "Summer", code: "Sm"},
    FALL   : {value: 2, name: "Fall", code: "F"},
    WINTER : {value: 3, name: "Winter", code: "W" }
  };

  var DipClock = function(year, season, spring, fall, writing, wait, end_year) {
     this.running = false;
     this.year = year;
     this.season = season;
     this.spring = spring;
     this.fall = fall;
     this.writing = writing;
     this.wait = wait;
     this.end_year = end_year;
     this.resetClock();
     this.init();
     this.pauseCount = 0;
  };

  DipClock.prototype.isOver = function() {
    return this.year >= this.end_year;
  };

  DipClock.prototype.resetClock = function() {
    this.curr_writing = this.writing;
    if (this.season == SEASON.SPRING) {
      this.time = this.spring;
    }
    if (this.season == SEASON.FALL) {
      this.time = this.fall;
    }
    if (this.season == SEASON.SUMMER || this.season == SEASON.WINTER) {
      this.time = 0;
    }
  };

  DipClock.prototype.adjustClock = function(milliseconds) {
    this.time += milliseconds;
  };

  DipClock.prototype.advanceSeason = function() {
    if (this.season == SEASON.SUMMER) {
      this.season = SEASON.FALL;
      return;
    }
    if (this.season == SEASON.WINTER) {
      this.season = SEASON.SPRING;
      this.year += 1;
      return;
    }
    if (this.season == SEASON.SPRING) {
      if (this.wait === true) {
        this.season = SEASON.SUMMER;
        this.pause();
      } else {
        this.season = SEASON.FALL;
      }
      return;
    }
    if (this.season == SEASON.FALL) {
      if (this.wait === true) {
        this.season = SEASON.WINTER;
        this.pause();
      } else {
        this.season = SEASON.SPRING;
        this.year += 1;
      }
    }
    return;
  };

  DipClock.prototype.getMinutes = function() {
    return Math.floor(this.time / MILLIS_PER_MINUTE);
  };
  
  DipClock.prototype.getWritingMinutes = function() {
    return Math.floor(this.curr_writing / MILLIS_PER_MINUTE);
  };
  
  DipClock.prototype.getSeconds = function() {
    return Math.floor(this.getSubSeconds());
  };
  
  DipClock.prototype.getSubSeconds = function() {
    return (Math.floor(this.time % MILLIS_PER_MINUTE) / 1000);
  };

  DipClock.prototype.getWritingSeconds = function() {
    return Math.floor(this.getWritingSubSeconds());
  };

  DipClock.prototype.getWritingSubSeconds = function() {
    return Math.floor(this.curr_writing % MILLIS_PER_MINUTE) / 1000;
  };
  
  DipClock.prototype.isWaiting = function() {
    return this.season == SEASON.WINTER || this.season == SEASON.SUMMER;
  };

  DipClock.prototype.isWriting = function() {
    return this.time === 0 && this.curr_writing > 0;
  };

  DipClock.prototype.formatTime = function() {
    var mins = this.getMinutes();
    var secs = this.getSeconds();

    if (this.isWriting()) {
      mins = this.getWritingMinutes();
      secs = this.getWritingSeconds();
    }
    if (mins < 10) {
      mins = "0" + mins;
    }
    if (secs < 10) {
      secs = "0" + secs;
    }
    return (mins  + ":" + secs);
  };
  DipClock.prototype.sigmoid = function(t) {
    return (1 / (1 + (Math.exp(-t))));
  };

  DipClock.prototype.makeColor = function(r,g,b,t) {
    var s = this.sigmoid(t);
    r *= s;
    g *= s;
    b *= s;
    var col = "#" + this.asHex(r) + this.asHex(g) + this.asHex(b);
    return col;
  };

  DipClock.prototype.asHex = function(x) {
    var val = Math.floor(x * 256);
    if (val < 16) {
      return "0" + val.toString(16);
    } else {
      return val.toString(16);
    }
  };

  DipClock.prototype.getColor = function() {
    var secs = this.getSeconds();
    if (!this.isWriting()) {
      if (this.getMinutes() > 0) {
        return "#000";
      }
      var subsec = this.getSubSeconds();
      return this.makeColor(1,0,0, -(subsec / 10 - 3));
    }
    if (this.getWritingMinutes() > 0) {
      return "#0000FF";
    }
    var wsubsec = this.getWritingSubSeconds();
    return this.makeColor(0,0,1, (wsubsec / 10 - 3));
  };

  DipClock.prototype.init = function() {
     var that = this;
     $('#dip_time').click(function() {
       if (that.isWaiting()) {
          that.advanceSeason();
          that.resetClock();
          that.run();
          that.draw();
        }
    });
  };

  DipClock.prototype.draw = function() {
    if (!this.isWriting()) {
      $('#dip_season').text(this.season.name);
      $('#dip_year').text(this.year);
    } else {
      $('#dip_season').text("Writing");
      $('#dip_year').html(this.season.name + " &#x2014 " + this.year);
    }
    if (!this.isWaiting()) {
      $('#dip_time')
        .text(this.formatTime())
        .css("color", this.getColor());
    } else {
      var that = this;
      $('#dip_time')
        .text("Go!")
        .css("color", "#000");
    }
    document.title = $('#dip_season').text() + " " + $('#dip_year').text() + " " + $('#dip_time').text();
  };

  DipClock.prototype.isRunning = function() {
    if (this.wait && (this.season == SEASON.WINTER || this.season == SEASON.SUMMER)) {
      return false;
    }
    return this.running;
  };

  DipClock.prototype.decrement = function(interval) {
    if (!this.isRunning()) {
      return;
    }
    if (this.time > 0) {
      this.time -= interval;
      if (this.time <= 0) {
        this.curr_writing += this.time;
        this.time = 0;
      }
    } else if (this.curr_writing > 0) {
      this.curr_writing -= interval;
    }

    console.log(this.curr_writing);
    if (this.time <= 0 && this.curr_writing <= 0) {
      var underflow = this.time + this.curr_writing;
      if (this.curr_writing <= 0) {
        this.advanceSeason();
        this.resetClock();
        this.time += underflow;
      }
    }

    this.draw();
    if (this.isOver()) {
      this.pause();
      this.gameOver();
    }
  };

  DipClock.prototype.gameOver = function() {
    $('#dip_time').text("End");
    document.title = "End";
  };

  DipClock.prototype.run = function() {
    var that = this;
    this.running = true;
    this.runner = setInterval(function() { that.decrement(INTERVAL); }, INTERVAL);
  };

  DipClock.prototype.pause = function() {
    clearInterval(this.runner);
    this.running = false;
  };

  DipClock.prototype.toggle = function() {
    if (this.running) {
      this.pauseCount += 1;
      this.pause();
      $('#toggle').attr("value", "Toggle [" + this.pauseCount + "]");
      $('body').css('background','#333');
    } else {
      this.run();
      $('body').css('background','#ccc');
    }
  };

   var DCBuilder = function DCBuilder() {
    this.year = 1901;
    this.min_end = false;
    this.max_end = false;
    this.season = SEASON.SPRING;
    this.spring = 0.05 * MILLIS_PER_MINUTE;
    this.fall = 0.05 * MILLIS_PER_MINUTE;
    this.writing = 0.1 * MILLIS_PER_MINUTE;
    this.wait = false;
    this.broken = false;
  };

  DCBuilder.prototype.die = function() {
    this.broken = true;
  };

  DCBuilder.prototype.setSeason = function(season) {
   season = season.toLowerCase();
   if (season == "winter") {
     this.season = SEASON.WINTER;
   }
   if (season == "spring") {
     this.season = SEASON.SPRING;
   }
   if (season == "fall") {
     this.season = SEASON.FALL;
   }
   if (season == "summer") {
     this.season = SEASON.SUMMER;
   }
   return this;
  };

  DCBuilder.prototype.setYear = function(year) {
   this.year = Number(year);
   return this;
  };

  DCBuilder.prototype.setRandomEnd = function(year_min, year_max) {
    if (year_min === '--' || year_max === '--') {
      this.end_year = 100000;
      return this;
    }
    var min = Number(year_min);
    var max = Number(year_max);
    if (min > max) {
      this.die();
    }
    this.end_year = min + Math.floor(Math.random() * (max-min));
    return this;
  };

  DCBuilder.prototype.setSpring = function(spring) {
    spring = Number(spring);
    if (isNaN(spring)) {
      spring = 12;
    }
    this.spring = spring * MILLIS_PER_MINUTE;
    return this;
  };

  DCBuilder.prototype.setFall = function(fall) {
    fall = Number(fall);
    if (isNaN(fall)) {
      fall = 15;
    }
    this.fall = fall * MILLIS_PER_MINUTE;
    return this;
  };

  DCBuilder.prototype.setWriting = function(writing) {
    writing = Number(writing);
    if (isNaN(writing)) {
      writing = 0;
    }
    this.writing = writing * MILLIS_PER_MINUTE;
    return this;
  };

  DCBuilder.prototype.waitToAdjudicate = function(wait) {
    this.wait = wait;
    return this;
  };

  DCBuilder.prototype.build = function() {
    if (this.broken === true) {
      return false;
    }

    if (this.year >= this.end_year) {
      return false;
    }
    return new DipClock(
      this.year, this.season,
      this.spring, this.fall,
      this.writing, this.wait,
      this.end_year);
  };

  var isScrolling = function() {
    var root = document.body;
    return (root.scrollHeight > root.clientHeight || 
            root.scrollWidth > root.clientWidth);
  };

  var scaleWhile = function() {
    var height = 300;
    while(isScrolling() && height > 0) {
      height--;
      $('body').css('font-size', height + "%");
    }
  };
