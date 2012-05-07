// Two dimensional vector class

Vector = function(x, y)
{
  this.x = x;
  this.y = y;
};

Vector.prototype.add = function(v2)
{
  return new Vector(this.x + v2.x, this.y + v2.y);
};

Vector.prototype.subtract = function(v2)
{
  return new Vector(this.x - v2.x, this.y - v2.y);
};

Vector.prototype.multiply = function(n)
{
  return new Vector(this.x * n, this.y * n);
};

Vector.prototype.copy = function(n)
{
  return vector(this.x, this.y);
};

function vector(x, y)
{
  return new Vector(x, y);
}