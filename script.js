const can = document.getElementById("can");
const draw = can.getContext("2d");
const width = can.width;
const height = can.height;


const deltaTime = 42.0;
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
}

//input
let keys = [];
document.onkeydown=(e)=>{
    if(!keys.includes(e.key)){
        keys.push(e.key);
    }
}
document.onkeyup = (e)=>{
    keys.splice(keys.indexOf(e.key),1);
}
let mousePos = new Vector2(0,0);
can.onmousemove = (e)=>{
    let bound = can.getBoundingClientRect();
    mousePos = new Vector2(e.clientX-bound.left,e.clientY-bound.top);
};
let isboost = false;
can.onclick = ()=>{
    console.log("clicked")
    if(isboost){
        return;
    }
    isboost = true;
    let normalSpeed = speed;
    bob.speed *= 3;
    console.log("boosted")
    setTimeout(()=>{
        bob.speed = normalSpeed;
        console.log("no more boost")
    },200);
    setTimeout(()=>{
        isboost = false;
        console.log("cooldown over")
    },400)
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
        this.position.addInto(this.velocity.multByConst(deltaTime/1000));
        this.velocity.x *= (this.position.x<0||this.position.x>width)?-1:1;
        this.velocity.y *= (this.position.y<0||this.position.y>height)?-1:1;
        this.position.x += (this.position.x<0)?1:(this.position.x>width)?-1:0;
        this.position.y += (this.position.y<0)?1:(this.position.y>width)?-1:0;
        this.update2();
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
        super([Math.random()*can.width,Math.random()*can.height,shapes[Math.round(Math.random()*2)],Math.random()*10+10,new hsl(Math.random()*360,80,65)],Math.random()*2,0);
        let ang = Math.random()*Math.PI*2;
        this.speed = ((Math.random()+1)/2)*speed
        this.velocity = new Vector2(Math.cos(ang)*this.speed,Math.sin(ang)*this.speed);
    }
    update2(){
        this.rotation += speed/20*deltaTime/1000;
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
        super([width/2,height/2,"pentagon",20,new hsl(Math.random()*360,80,65)],10,0);
        this.type = "player";
        this.damage = 2;
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
        }
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

let bob = new destructible([200,200,"pentagon",20,new hsl(Math.random()*360,80,65)],10,1);
bob.speed = speed;
bob.update2 = ()=>{
    let vec = mousePos.subtract(bob.position);
    bob.rotation = Math.atan2(vec.y,vec.x);
};
gObjects.push(bob);
for(let i = 0; i < 10;i++){
    gObjects.push(new pellet());
}
setInterval(()=>{
    //update loop
    draw.clearRect(0,0,can.width,can.height);

    //input, fuck it
    bob.velocity = new Vector2(Math.cos(bob.rotation)*bob.speed,Math.sin(bob.rotation)*bob.speed);
    keys.forEach(x=>{
        switch(x){
        }
    });

    //collision detection
    for(let i = 0; i < gObjects.length;i++){
        for(let j = i+1; j<gObjects.length;j++ ){
            broadCollision(gObjects[i],gObjects[j]);
        }
    }
    gObjects.forEach(obj=>{
        obj.update();
        obj.render();
    });
},deltaTime);