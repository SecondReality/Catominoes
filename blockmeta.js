// blockmeta.js : Returns meta information about pieces such as:
// * Where the pieces are located in the sprite sheet.
// * The block coordinates that make up a given piece.
// * The grid sizes of the pieces.

// Returns the block coordinate (not pixel coordinate) of where this type is located in the sprite sheet.
// Integer -> Vector
function getGraphicalTetronimoSourcePieceOffset(type)
{
  return sourceOffsetPositions[type].copy();
}

// Returns the block coordinates (not pixel coordinate) of where each block in the type is located in the sprite sheet.
// Integer -> [Vector]
function getGraphicalTetronimoSourcePiecePositions(type)
{
  var offset = getGraphicalTetronimoSourcePieceOffset(type);
  
  var positions = getTetronimoPositions(type);
  for(var i=0; i<positions.length; i++)
  {
    positions[i]=positions[i].add(offset);
  }
  
  return positions;
}

// Returns the piece coordinates in their own coordinate space.
// Integer -> [Vector]
function getTetronimoPositions(type)
{   
  return tetronimoPositions[type].clone();
}

// Returns how large the coordinate space is (width and height) for the given type.
// Integer -> Integer
function getTetronimoGridSize(type)
{ 
  var gridSizes = [4, 3, 3, 2, 3, 3, 3];
  return gridSizes[type];
}

//------ Private variables (do not access from outside this file) ------

// Deep clone function
Object.prototype.clone = function()
{
  var newObj = (this instanceof Array) ? [] : {};
  for (i in this)
  {
    if (i == 'clone') continue;
    if (this[i] && typeof this[i] == "object")
    {
      newObj[i] = this[i].clone();
    }
    else newObj[i] = this[i];
  }
  return newObj;
};

sourceOffsetPositions =
[
  vector(0, -1),
  vector(0, 2),
  vector(0, 5),
  vector(0, 8),
  vector(0, 11),
  vector(0, 14),
  vector(0, 17)
];

tetronimoPositions =
[
  [vector(0, 1), vector(1, 1), vector(2, 1), vector(3, 1)],
  [vector(0, 0), vector(0, 1), vector(1, 1), vector(2, 1)],
  [vector(2, 0), vector(0, 1), vector(1, 1), vector(2, 1)],
  [vector(0, 0), vector(0, 1), vector(1, 0), vector(1, 1)],
  [vector(1, 0), vector(2, 0), vector(0, 1), vector(1, 1)],
  [vector(1, 0), vector(0, 1), vector(1, 1), vector(2, 1)],
  [vector(0, 0), vector(1, 0), vector(1, 1), vector(2, 1)]
];