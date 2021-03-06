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
  var copy=[];
  for(var i=0; i<tetronimoPositions[type].length; i++)
  {
    copy.push(tetronimoPositions[type][i].copy());
  }
  return copy;
}

// Returns how large the coordinate space is (width and height) for the given type.
// Integer -> Integer
function getTetronimoGridSize(type)
{ 
  var gridSizes = [4, 3, 3, 4, 3, 3, 3];
  return gridSizes[type];
}

// Returns adjacent squares, relative to the position of the piece with the given index.
// -> [Vector (with additional .index member)]
function getAdjacent(type, index)
{
  var piecePositions = getTetronimoPositions(type);
  var piecePosition = getTetronimoPositions(type)[index];
  
  var adjacentPieces = [];
  
  for(var i=0; i<piecePositions.length; i++)
  {
    var relative = piecePositions[i].subtract(piecePosition);
    if(Math.abs(relative.x)+Math.abs(relative.y)==1)
    {
      relative.index = i;
      adjacentPieces.push(relative);
    }
    
  }
  return adjacentPieces;
}

//------ Private variables (do not access from outside this file) ------

sourceOffsetPositions =
[
  vector(0, -1),
  vector(0, 2),
  vector(0, 5),
  vector(-1, 7),
  vector(0, 11),
  vector(0, 14),
  vector(0, 17)
];

tetronimoPositions =
[
  [vector(0, 1), vector(1, 1), vector(2, 1), vector(3, 1)],
  [vector(0, 0), vector(0, 1), vector(1, 1), vector(2, 1)],
  [vector(2, 0), vector(0, 1), vector(1, 1), vector(2, 1)],
  [vector(1, 1), vector(2, 1), vector(1, 2), vector(2, 2)], //[vector(0, 0), vector(0, 1), vector(1, 0), vector(1, 1)],
  [vector(1, 0), vector(2, 0), vector(0, 1), vector(1, 1)],
  [vector(1, 0), vector(0, 1), vector(1, 1), vector(2, 1)],
  [vector(0, 0), vector(1, 0), vector(1, 1), vector(2, 1)]
];