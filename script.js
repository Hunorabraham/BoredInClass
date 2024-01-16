const can = document.getElementById("can");
const draw = can.getContext("2d");
const width = can.width;
const height = can.height;
draw.font = "22px Calibri";

const deltaTime = 16.0;
const speed = 80;

const defaultColor = "black";
const defaultWeight = 1;
draw.strokeStyle = defaultColor;

const sides = {
    "triangle" : 3,
    "square" : 4,
    "pentagon" : 5
}
const shapes = ["triangle","square","pentagon"];

//drawing
function drawNside(position,rotation,radious,sides,color){
    draw.beginPath();
    draw.moveTo(position.x+Math.cos(rotation)*radious,position.y+Math.sin(rotation)*radious);
    for(let i = Math.PI*2/sides; i <= Math.PI*2;i+=Math.PI*2/sides){
        draw.lineTo(position.x+Math.cos(rotation+i)*radious,position.y+Math.sin(rotation+i)*radious);
    }
    draw.fillStyle = color;
    draw.fill();
    draw.stroke();
    draw.closePath();
}

function withLine(lineColor, lineWeight, func, args){
    draw.strokeStyle = lineColor;
    draw.lineWidth = lineWeight;
    func(...args);
    draw.strokeStyle = defaultColor;
    draw.lineWidth = defaultWeight;
}

//tools
class Vector2{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
    subtract(v){
        return new Vector2(this.x-v.x,this.y-v.y);
    }
    magnitudeSquared(){
        return this.x**2+this.y**2;
    }
    addInto(v){
        this.x += v.x;
        this.y += v.y;
    }
    multByConst(c){
        return new Vector2(this.x*c,this.y*c);
    }
    multByConstInto(c){
        this.x *= c;
        this.y *= c;
    }
}
function normalized(v){
    let mag = v.magnitudeSquared();
    return (mag==0)?new Vector2(0,0):v.multByConst(1/Math.sqrt(v.magnitudeSquared()));
}
function clamp(x,min,max){
    return (x<min)?min:(x>max)?max:x;
}
//input
let keys = [];
document.onkeydown=(e)=>{
    if(!keys.includes(e.key.toLowerCase())){
        keys.push(e.key.toLowerCase());
    }
}
document.onkeyup = (e)=>{
    if(keys.includes(e.key.toLowerCase())){
        keys.splice(keys.indexOf(e.key.toLowerCase()),1);
    }
}
let mousePos = new Vector2(0,0);
can.onmousemove = (e)=>{
    let bound = can.getBoundingClientRect();
    mousePos = new Vector2(e.clientX-bound.left,e.clientY-bound.top);
};

//circles


class hsl{
    constructor(h,s,l){
        this.h = h;
        this.s = s;
        this.l = l;
    }
    toString(){
        return "hsl("+this.h+","+this.s+"%,"+this.l+"%)";
    }
}

let gObjects = [];

class gameObject{
    constructor(x,y,shape,radius,color){
        this.position = new Vector2(x,y);
        this.velocity = new Vector2(0,0);
        this.rotation = 0.0;
        this.shape = shape;
        this.sides = sides[shape];
        this.radius = radius;
        this.color = color;
        this.type = "none";
    }
    update(){
        this.update2();
        this.position.addInto(this.velocity.multByConst(deltaTime/1000));
        this.velocity.x *= (this.position.x<0||this.position.x>width)?-1:1;
        this.velocity.y *= (this.position.y<0||this.position.y>height)?-1:1;
        this.position.x = (this.position.x<0)?1:(this.position.x>width)?width-1:this.position.x;
        this.position.y = (this.position.y<0)?1:(this.position.y>height)?height-1:this.position.y;
    }
    update2(){}
    col(obj){}
    die(){
        if(gObjects.includes(this)){
            gObjects.splice(gObjects.indexOf(this),1);
        }
    }
    render(){
        withLine(new hsl(this.color.h,this.color.s,this.color.l*0.75).toString(),2,drawNside,[this.position,this.rotation,this.radius,this.sides,this.color.toString()]);
    }
}
class destructible extends gameObject{
    constructor(args,hp,res){
        super(...args);
        this.hp = hp;
        this.res = res;
        this.type = "dest";
    }
    col(obj){
        switch(obj.type){
            case "none":
                return;
            case "dest":
                this.hp -= obj.hp-this.res;
                if(this.hp <= 0){
                    this.die();
                }
                return;
            case "player":
                this.hp -= obj.hp-this.res;
                if(this.hp <= 0){
                    this.die();
                }
                return;
        }
    }
}
class pellet extends destructible{
    constructor(){
        let sizenum = Math.random()*10+10;
        super([Math.random()*can.width,Math.random()*can.height,shapes[Math.round(Math.random()*2)],sizenum,new hsl(Math.random()*360,80,65)],sizenum/10-0.5,0);
        let ang = Math.random()*Math.PI*2;
        this.speed = ((Math.random()+1)/2)*speed;
        this.direction = Math.round(Math.random())*2-1
        this.velocity = new Vector2(Math.cos(ang)*this.speed,Math.sin(ang)*this.speed);
    }
    update2(){
        this.rotation += this.speed/20*deltaTime/1000*this.direction;
    }
    die(){
        if(gObjects.includes(this)){
            gObjects.splice(gObjects.indexOf(this),1);
            gObjects.push(new pellet());
        }
    }
}
class player extends destructible{
    constructor(){
        super([width/2,height/2,"pentagon",20,new hsl(Math.random()*360,80,65)],10,1);
        this.type = "player";
        this.damage = 2;
        this.speed = speed;
        this.isboost = false;
        this.boostStr = 10;
        this.points = 0;
    }
    update2(){
        this.velocity = normalized(this.velocity);
        this.velocity.multByConstInto(this.speed);
        this.rotation = (this.velocity.magnitudeSquared()==0)?this.rotation:Math.atan2(this.velocity.y,this.velocity.x);
    }
    col(obj){
        switch(obj.type){
            case "none":
                return;
            case "dest":
                this.hp -= clamp(obj.hp-this.res,0,100);
                this.points += obj.hp;
                if(this.hp <= 0){
                    this.die();
                }
                return;
        }
    }
    boost(){
        if(this.isboost){
            return;
        }

        this.isboost = true;
        this.speed *= this.boostStr;
        let reference = this;
        setTimeout(()=>{
            reference.speed /= reference.boostStr;
        },200);
        setTimeout(()=>{
            reference.isboost = false;
        },400)
    }
}
class particle extends gameObject{
    constructor(x,y,velocity,shape,radius,color,lifetime){
        super(x,y,shape,radius,color)
        this.lifetime = lifetime;
        this.life = 0;
    }
    update2(){
        this.rotation
    }
}


function broadCollision(a,b){
    if((a.position.x-b.position.x)**2+(a.position.y-b.position.y)**2<=(a.radius+b.radius)**2){
        closeCollision(a,b);
    }
}
function closeCollision(a,b){
    a.col(b);
    b.col(a);
}

let bob = new player();
let bob2 = new player();
bob2.shape = "triangle";
bob2.sides = 3;
gObjects.push(bob);
gObjects.push(bob2);
for(let i = 0; i < 10;i++){
    gObjects.push(new pellet());
}
setInterval(()=>{
    //update loop
    draw.clearRect(0,0,can.width,can.height);
    //input, fuck it
    bob.velocity = new Vector2(0,0);
    bob2.velocity = new Vector2(0,0);
    keys.forEach(x=>{
        switch(x){
            //bob
            case " ":
                bob.boost();
                break;
            case "w":
                bob.velocity.y -= bob.speed;
                break;
            case "s":
                bob.velocity.y += bob.speed;
                break;
            case "a":
                bob.velocity.x -= bob.speed;
                break;
            case "d":
                bob.velocity.x += bob.speed;
                break;
            //bob 2
            case "shift":
                bob2.boost();
                break;
            case "arrowup":
                bob2.velocity.y -= bob2.speed;
                break;
            case "arrowdown":
                bob2.velocity.y += bob2.speed;
                break;
            case "arrowleft":
                bob2.velocity.x -= bob2.speed;
                break;
            case "arrowright":
                bob2.velocity.x += bob2.speed;
                break;

        }
    });
    //collision detection
    for(let i = 0; i < gObjects.length;i++){
        for(let j = i+1; j<gObjects.length;j++){
            broadCollision(gObjects[i],gObjects[j]);
        }
    }
    //update and render everything
    gObjects.forEach(obj=>{
        obj.update();
        obj.render();
    });
    //scores and hps
    draw.fillStyle = bob.color.toString();
    draw.fillText("Player 1 hp:"+Math.ceil(bob.hp)+"; score: "+Math.round(bob.points),0,20);
    draw.fillStyle = bob2.color.toString();
    draw.fillText("Player 2 hp:"+Math.ceil(bob2.hp)+"; score: "+Math.round(bob2.points),0,40);
},deltaTime);