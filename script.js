const can = document.getElementById("can");
const draw = can.getContext("2d");

const deltaTime = 16;

const defaultColor = "black";
const defaultWeight = 1;
draw.strokeStyle = defaultColor;

const sides = {
    "triangle" : 3,
    "square" : 4,
    "pentagon" : 5
}

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

//circles
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
        this.position.addInto(this.vel.multByConst(deltaTime/1000));
    }
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
                this.hp -= obj.hp;
                if(this.hp <= 0){
                    this.die();
                }
                return;
        }
    }
}



function broadCollision(a,b){
    if(a.position.subtract(b.position).magnitudeSquared<=(a.radius+b.radius)**2){
        closeCollision(a,b);
    }
}
function closeCollision(a,b){
    a.col(b);
    b.col(a);
}

let bob = new gameObject(200,200,"pentagon",20,new hsl(Math.random()*360,80,65));
bob.render();
setInterval(()=>{
    //update loop
},deltaTime);