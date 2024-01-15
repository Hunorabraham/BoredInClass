const can = document.getElementById("can");
const draw = can.getContext("2d");

const deltaTime = 16;

const sides = {
    "triangle" : 3,
    "square" : 4,
    "pentagon" : 5,
    "shpere" : 0
}

//drawing
function drawNside(position,rotation,radious,sides,color){
    draw.beginPath();
    draw.moveTo(Math.cos(rotation)*radious,Math.sin(rotation)*radious);
    
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
}

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
    col(obj){

    }
    render(){

    }
}

class destructible extends gameObject{
    constructor(args,hp,res){
        super(...args);
        this.hp = hp;
        this.res = res;
        this.type = "dest";
    }
}



function broadcollision(a,b){
    if(a.position.subtract(b.position).magnitudeSquared<=(a.radius+b.radius)**2){
        a.col(b);
        b.col(a);
    }
}