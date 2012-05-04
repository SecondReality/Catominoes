// Returns the graphical source coordinates of the pieces in this tetronimo.
// [Vector]
// Results are logical coordinates, 


function getGraphicalTetronimoSourcePieceOffset(type)
{
  switch(type)
  {
    case 0:
    {
      return vector(0, -1);
    }
    case 1:
    {
      return vector(0, 2);
    }
    case 2:
    {
      return vector(0, 5);
    }
  }
}

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

function getTetronimoPositions(type)
{ 
  switch(type)
  {
    case 0:
    {
      return [vector(0, 1), vector(1, 1), vector(2, 1), vector(3, 1)];
    }
    case 1:
    {
      return [vector(0, 0), vector(0, 1), vector(1, 1), vector(2, 1)];
    }
    case 2:
    {
      return [vector(2, 0), vector(0, 1), vector(1, 1), vector(2, 1)];
    }
    case 3:
    {
      return [vector(0, 0), vector(1, 0), vector(1, 0), vector(1, 1)];
      //return [vector(1, 0), vector(2, 0), vector(0, 1), vector(1, 1)];
    }
  }
}


function getTetronimoGridSize(type)
{ 
  var gridSizes = [4, 3, 3, 2, 3, 3, 3];
  /*
  switch(type)
  {
    case 0:
    {
      return 4;
    }
  }
  */
  return gridSizes[type];
}