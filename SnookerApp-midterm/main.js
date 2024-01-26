let tblW = 700;
let tblH = 350;
let menuPgOn = true;
let ballPositions = {};
let lstBall = "";//is stored the name of last ball that fell
let prompt=["Welcome To The Snooker App"];
let mouseIsBeenPressedFor=0;//this varible is used to see for how long mouse is pressed
let lastXoff = 0 ;//this variable is used to hit ball 
function setup() {
  createCanvas(800, 800).parent("canvas-container");//put it into a div so later I can center it on screen
  ballDia = tblW / 36;
  pocketDia = ballDia * 1.5;

  rectMode(CENTER);
  condinates = GatherPos();
  table = new TableClass(
    condinates.pockets,
    condinates.cushions,
    condinates.balls
  );
  //this here is used for collision detection
  addCollision();
  //
  trnsX = (width -tblW)/2;
  trnsY = 50;
}

function draw() {
  if(menuPgOn){
    menuPg();
    return;;//do not draw anything than menu page
  }
  background(50,30,120);
  translate(trnsX,trnsY);
  noFill();
  table.show();
  table.cueStick();
  table.cueBallMove();
  Matter.Engine.update(table.engine);
  Button("MENU",tblW/4,tblH*1.9,ballDia*8,ballDia*2,[20],[100,100,200],1);
  Button("SCREEN SHOT",tblW - tblW/4,tblH*1.9,ballDia*8,ballDia*2,[20],[200,200,100],1);
  PromptBox();
}
function menuPg(){
  if(menuPgOn){
    background(25,95,112);
    push();
    textAlign(CENTER,CENTER);
    textSize(ballDia*3);
    fill(0);
    text("CHOSE BALL MODE",width/2,trnsY+ballDia*5);
    translate(trnsX,trnsY);
    Button("DEFAULT",tblW/4,tblH/2,ballDia*8,ballDia*2,[20],[100,100,200],1);
    Button("RANDOM RED ONLY",tblW/2,tblH/2,ballDia*8,ballDia*2,[20],[200,100,100],1);
    Button("RANDOM",tblW -tblW/4,tblH/2,ballDia*8,ballDia*2,[20],[200,100,200],1);
    pop();
  }
}

function PromptBox(){
  push();
  rectMode(CORNER);
  rect(0,tblH*1.1,tblW,tblH*0.6);
  fill(0);
  textSize(ballDia*.7);
  for(let i=0;i<10;i++){
    let x = ballDia;
    let y = ballDia +map(i,0,11,tblH*1.1,tblH*1.7);
    let tx ="> "
    if(prompt[i]){
      tx= tx+prompt[i];
    }
    text(tx,x,y);
  }
  pop();
  //managing new messages
  if(prompt.length>10){
    prompt.splice(0,1);//if it goes move tha 10 messages remove 1 from top
  }
}

class TableClass {
  constructor(pockets, cushions, balls) {
    this.engine = Matter.Engine.create();
    this.engine.gravity.y = 0;
    this.world = this.engine.world;
    this.balls = [];
    this.cushions = [];
    this.pockets = [];

    //table cushions
    // console.log(this.engine);

    for (let i = 0; i < cushions.length; i++) {
      let body = Matter.Bodies.rectangle(
        cushions[i].x,
        cushions[i].y,
        cushions[i].w,
        cushions[i].h,
        { isStatic: true ,name:"cushion",restitution:0.9}
      );

      this.cushions.push({ b: body, w: cushions[i].w, h: cushions[i].h });
      this.addToTable(body);
    }

    for (let i = 0; i < pockets.length; i++) {
      let h = Matter.Bodies.circle(
        pockets[i].x,
        pockets[i].y,
        pockets[i].d / 2,
        {
          isStatic: true,
          name:"pocket",
          restitution:0.8
        }
      );
      this.pockets.push(h);
      this.addToTable(h);
    }
    for (let i = 0; i < balls.length; i++) {
      let body = Matter.Bodies.circle(balls[i].x, balls[i].y, ballDia / 2,{
        restitution:0.8
      });
      body.name  = balls[i].col;
      if (balls[i].col == "white") {
        this.cueBall = body;
        this.cueBall.name = "cue";
        this.cueBall.canMove =true;
      }
      this.balls.push({ body, col: balls[i].col });
      ballPositions[body.name]= {x:body.position.x,y:body.position.y};
      this.addToTable(body);
    }
    //
  }
  addToTable(body) {
    Matter.World.add(this.world, body);
  }
  show() {
    tableBg();
    fill(0);
    for (let hole of this.pockets) {
      circle(hole.position.x, hole.position.y, hole.circleRadius * 2);
    }
    for (let ball of this.balls) {
      // if this ball is inside the world then only draw
      let isIn = false;
      for(let worldBall of this.world.bodies){
        if(worldBall == ball.body){
          isIn = true;
        }
      }
      if(isIn){
        fill(ball.col);
        circle(
          ball.body.position.x,
          ball.body.position.y,
          ball.body.circleRadius * 2
        );
      }
    }
    for (let bound of this.cushions) {
      cushionDraw(bound.b.position.x, bound.b.position.y, bound.w, bound.h);
    }
  }
  cueBallMove(){
    if(this.cueBall.canMove){
      push();
      noStroke();
      if(mouseX-trnsX>ballDia*2 && mouseX-trnsX<tblW-ballDia*2 && mouseY-trnsY>ballDia*2 && mouseY-trnsY<tblH-ballDia*2){
        fill(255,100);
        if(mouseIsPressed){
          mouseIsPressed = false;
          Matter.Body.setPosition(this.cueBall,{
            x:mouseX-trnsX,
            y:mouseY-trnsY
          })
        }
        textSize(ballDia/2);
        textAlign(CENTER);
        text("Double Table To Place",mouseX-trnsX,mouseY-trnsY+ballDia*1.5);
      }else{
        fill(200,100,100,100);
      }
      circle(mouseX-trnsX,mouseY-trnsY,ballDia);
      pop();
    }
  }
  cueStick(){
    //do no draw it if cue ball is moving
    if (abs(this.cueBall.velocity.x)>0.1 || abs(this.cueBall.velocity.y>0.1) || this.cueBall.canMove){
      return;
    }
    let d = dist(mouseX-trnsX,mouseY-trnsY,this.cueBall.position.x,this.cueBall.position.y);
    push();
    translate(this.cueBall.position.x,this.cueBall.position.y);
    //
    let x =  this.cueBall.position.x -(mouseX -trnsX);//for angle caluculation
    let y =  this.cueBall.position.y -(mouseY -trnsY);//between cueBall adn mouse
    let a = atan2(y, x);
    rotate(a);
    //xoff is used to animate cue stick
    let xoff = 0;
    if(mouseIsPressed){
      //I want to include player star storing load in cue stick after a fracting of time
      // so not every random click will be a shot
      if(mouseIsBeenPressedFor>30){
        if(frameCount%300<150){
          xoff = map(frameCount%150,0,150,0,ballDia*4);
        }else{
          xoff = map(frameCount%150,0,150,ballDia*4,0);
        }
      }
      mouseIsBeenPressedFor+=1;
      lastXoff = xoff;
    }else{
      mouseIsBeenPressedFor=0;

      if(lastXoff>0){
        //hit
        let amp=map(lastXoff,0,150,0,40);
        Matter.Body.setVelocity(this.cueBall,{
          x:amp*cos(a),
          y:amp*sin(a)
        })
      }
      lastXoff=0;
    }
    //xoff goes from 0 0 ballDia*4 adn come back to 0;
    rect(-ballDia*6-xoff,0,ballDia*10,ballDia/4);

    noFill();
    stroke(255,100);
    rotate(frameCount/100);
    setLineDash([5,5]);
    circle(0,0,ballDia*4);
    pop();
  }
}
function doubleClicked(){
  table.cueBall.canMove = false;
}
function GatherPos() {
  //Here I draw and check all the cushions and pockets position and alignment
  let pockets = [];
  let cushions = [];
  let balls = [];

  let pocketDia = 1.5 * ballDia;
  let d = pocketDia;
  let x, y;
  x = pocketDia / 1.5;
  y = pocketDia / 1.5;
  pockets.push({ x, y, d });

  x = tblW / 2;
  y = pocketDia / 2;
  pockets.push({ x, y, d });
  x = tblW - pocketDia / 1.5;
  y = pocketDia / 1.5;
  pockets.push({ x, y, d });
  x = pocketDia / 1.5;
  y = tblH - pocketDia / 1.5;
  pockets.push({ x, y, d });
  x = tblW / 2;
  y = tblH - pocketDia / 2;
  pockets.push({ x, y, d });
  x = tblW - pocketDia / 1.5;
  y = tblH - pocketDia / 1.5;
  pockets.push({ x, y, d });

  let boundWidth = tblW / 2 - pocketDia * 1.5;
  let w, h;

  x = pocketDia + boundWidth / 2 + boundWidth * 0.008;
  y = 0;
  w = boundWidth * 0.98;
  h = pocketDia;
  cushions.push({ x, y, w, h });

  x = 2 * pocketDia + boundWidth + boundWidth / 2 - boundWidth * 0.008;
  y = 0;
  w = boundWidth * 0.98;
  h = pocketDia;
  cushions.push({ x, y, w, h });

  x = pocketDia + boundWidth / 2 + boundWidth * 0.008;
  y = tblH;
  w = boundWidth * 0.98;
  h = pocketDia;
  cushions.push({ x, y, w, h });

  x = 2 * pocketDia + boundWidth + boundWidth / 2 - boundWidth * 0.008;
  y = tblH;
  w = boundWidth * 0.98;
  h = pocketDia;
  cushions.push({ x, y, w, h });

  let boundHeight = (tblH - 2 * pocketDia) * 0.965;

  x = 0;
  y = tblH / 2;
  w = pocketDia;
  h = boundHeight;
  cushions.push({ x, y, w, h });

  x = tblW;
  y = tblH / 2;
  w = pocketDia;
  h = boundHeight;
  cushions.push({ x, y, w, h });
  //
  for (let i = 1; i < 6; i++) {
    x = map(i, 1, 6, tblW * 0.75, tblW * 0.75 + ballDia * 5);
    for (let j = 0; j < i; j++) {
      y =
        tblH / 2 +
        map(j, 0, i, (-ballDia * i) / 2, (ballDia * i) / 2) +
        ballDia / 2;
      balls.push({ x, y, col: "red" });
    }
  }
  balls.push({ x: tblW * 0.92, y: tblH / 2, col: "black" });
  balls.push({ x: tblW * 0.75 - ballDia, y: tblH / 2, col: "pink" });
  balls.push({ x: tblW / 2, y: tblH / 2, col: "blue" });
  balls.push({ x: tblW * 0.25, y: tblH * 0.5 - tblW * 0.1, col: "green" });
  balls.push({ x: tblW * 0.25, y: tblH * 0.5 + tblW * 0.1, col: "yellow" });
  balls.push({ x: tblW * 0.25, y: tblH / 2, col: "red" });
  balls.push({ x: tblW * 0.18, y: tblH / 2, col: "white" });
  return { pockets, cushions, balls };
}

function tableBg(){
  fill(70,30,30);
  rect(tblW/2,tblH/2,tblW+pocketDia,tblH+pocketDia);
  fill(200,200,65);
  rect(tblW/2,tblH/2,tblW,tblH);
  fill(30,70,50);
  rect(tblW/2,tblH/2,tblW-pocketDia,tblH-pocketDia);

  line(tblW * 0.25, 0, tblW * 0.25, tblH);
  arc(tblW * 0.25, tblH / 2, tblW * 0.2, tblW * 0.2, HALF_PI, PI + HALF_PI);
}
function cushionDraw(x,y,w,h){
  fill(40,80,60);
  if(w<h){
    if(x<tblW/2){
      rect(x+w/4,y,w/2,h);
    }else{
      rect(x-w/4,y,w/2,h);
    }
    
  }else{
    if(y<tblH/2){
    rect(x,y+h/4,w,h/2);
    }else{
    rect(x,y-h/4,w,h/2);
    }
  }
  fill(255);
}
function setLineDash(list) {
  drawingContext.setLineDash(list);
}
function Button(txt, x, y, w, h, backCol, fillCol = "blue", sW = 3) {
  push();
  textAlign(CENTER,CENTER);
  fill(fillCol);
  stroke(backCol);
  strokeWeight(sW);
  rect(x, y, w, h, h);
  fill(backCol);
  if (
    mouseX-trnsX > x - w / 2 &&
    mouseX-trnsX < x + w / 2 &&
    mouseY-trnsY > y - h / 2 &&
    mouseY-trnsY < y + h / 2
  ) {
    stroke(backCol, 100);
    fill(backCol, 100);
    if (mouseIsPressed) {
      mouseIsPressed = false;
      clickedOnButton(txt);
    }
  }
  textSize(min(w, h) / 3);
  text(txt, x, y);
  pop();
}
function clickedOnButton(txt) {
  switch (txt) {
    case "DEFAULT":
      menuPgOn=false;
      break;
    case "RANDOM RED ONLY":
      for(let ball of table.balls){
 
        if(ball.body.name =="red" && ball.body.name!="cue"){
          //heres my why to randomised positons of ball
          Matter.Body.setPosition(ball.body,{
            x: random(ballDia*2,tblW-(ballDia*2)),
            y: random(ballDia*2,tblH-(ballDia*2))
          })
        }
      }
      menuPgOn = false
      break;
    case "RANDOM":
        //heres my why to randomised positons of ball
        for(let ball of table.balls){
          if(ball.body.name!="cue"){
            //heres my why to randomised positons of ball
            Matter.Body.setPosition(ball.body,{
              x: random(ballDia*2,tblW-(ballDia*2)),
              y: random(ballDia*2,tblH-(ballDia*2))
            })
          }
        }
      menuPgOn = false;
      break;
    case "MENU":
      //reset and menu
      Matter.World.clear(table.world);
      Matter.Engine.clear(table.engine);
      condinates = GatherPos();
      table = new TableClass(condinates.pockets,condinates.cushions,condinates.balls);
      menuPgOn =true;
      addCollision();
      break;  
    case "SCREEN SHOT":
      get(trnsX,trnsY,tblW,tblH).save();
      break;  
    default:
      break;
  }
}
function addCollision(){
  Matter.Events.on(table.engine, "collisionStart", function (event) {
    var pairs = event.pairs;
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i];
      if (pair.bodyB.name == "cue" || pair.bodyA.name == "cue") {
        prompt.push(pair.bodyB.name + "-" + pair.bodyA.name + " (collision)");
      }
      if (pair.bodyB.name == "pocket" || pair.bodyA.name == "pocket") {
        let body;
        if(pair.bodyB.name == "pocket"){
          body = pair.bodyA;
        }else{
          body = pair.bodyB;
        }
        if(body.name =="red"){
          lstBall="red";
          Matter.World.remove(table.world,body);
        }else{
          if(lstBall=="colored"){
            prompt.push("You cannot score Colored or cue Ball");
            lstBall ="";
          }else{
          lstBall="colored";//a colored ball fell
          }
          if(body.name=="cue"){
            body.canMove=true;
          }
          //move back to their posiiton
          body.speed =0;
          Matter.Body.setPosition(body,{x:ballPositions[body.name].x,y:ballPositions[body.name].y});
          Matter.Body.setVelocity(body,{x:0,y:0});
        }
      }
    }
  });
}

/*
Commentary: -

For reusability, I designed the table into a class structure with balls, cushions, and other matter.js physics instances as its elements.

In the TableClass object named table, the constructor accepts 3 arrays, pockets, cushions and balls, in which I pass positions and sizes of those bodies to be added to the table. For balls, there's colour included alongside positions. The constructor makes the physical bodies as per the location and shape that can be added to the table’s engine.

I identify between bodies. I gave every one of them a name attribute while making their bodies and adding them to the table. I store balls’ positions in a global dictionary with their names as keys, as we need coloured balls and cue balls’ positions to later place them back to their positions. 

In the show method of table constructor, for cushions, I drew a small green cushion on the inner side of the table and a brown table edge of the same size as the cushion's body for a realistic look to the table and keeping the physical body of the cushion thick makes it better for containing high balls at high speed in simulations. For drawing balls, I first confirm if the body of that ball is still in the world and then draw.

I then added the option to move cue ball with mouse and place it by double clicking. until this happens user cannot use cueStick and hit ball. To know if a cue ball can be moved or not I added an attribute “canMove” to its physical body while making it in the constructor of the table. The drawing of cueStick, is a long white rectangle with cue ball's position as its origin and is rotated by the angle between mouse and cue ball. When mouse is pressed a variable xoff gets in a loop of decreasing and increasing by which the cue Stick drawing goes back and forth and when mouse Is not pressed and xoff from before isn’t zero, We apply some velocity based on that to cue ball in the direction of cuestick’s rotation.

For collision detection I used Matter.js’s Events module, its declared in an addCollision function and used in setup, in that, we check for two types of collision cure-body and pocket-body, It's a requirement to prompt every cue collision and in pocket body collisions we check if its a red(remove) or coloured (reset position).

The menu page displays three mode options for the ball’s position. I implemented a random ball’s position by finding a random spot between table width and height, and then seeing its body’s position by Matter.Body.setPosition function.

The menu button resets the game as everything gets clear the global variable gets assigned a fresh new table and the game goes to the menu page. For my extension, I added a button to save and download a current screenshot of the table at any instance which helps the user share any part of the game.*/
