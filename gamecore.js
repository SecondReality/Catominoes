// Terminology:
// rotation: rotation is specified with values 0-3 (0 being 0 degrees, 1 being 90 degrees and so on)

gameWidth=10;
gameHeight = 22;
offscreen = 2;  // The amount of rows that are not visible at the top of the screen

// Returns true if point is contained in a grid of the given dimensions
function inGrid(width, height, point)
{
  if(point.x >=0 && point.x<width && point.y >=0 && point.y < height)
  {
    return true;
  }
  return false;
}

// Converts a 2d position to a 1d position, used for accessing a 1D array with 2D coordinates.
function to1D(x, y, gridWidth)
{
  return y*gridWidth+x;
}

// Rotates the given [Vector] clockwise by the given amount of rotations (mutates the members, does not return)
function rotateVectorArrayClockwise(array, gridSize, rotations)
{
  for(var i=0; i<rotations; i++)
  {
    for(n=0; n<array.length; n++)
    {
      var x = (gridSize-1)-array[n].y;
      var y = array[n].x;
    
      array[n].x=x;
      array[n].y=y;
    }
  }
}

// Initialises an array with nulls
function nullArray(size)
{
  var array = new Array();
  for(var n=0; n<size; n++)
  {
    array.push(null);
  }
  return array;
}

// Returns the score awarded when the given amount of lines are cleared on the given level.
function lineClearedPoints(level, linesCleared)
{
  switch(linesCleared)
  {
    case 0:
      return 0;
    case 1:
      return 40*(level + 1);
    case 2:
      return 100*(level + 1);
    case 3:
      return 300*(level + 1);
    case 4:
      return 1200*(level + 1);
  }
  return linesCleared;
}

// Returns the time (ms) for a block to fall one space
function gameSpeed(level)
{
  return 300-(12 * level);
}

// Used to generate a pseudo-random piece, which stops players from losing the game simply because they were unlucky.
// The greatest amount of piece drops between two of the same pieces is 12 (and the least is 0).
function RandomPieceBag()
{
  var pieces=[];

  this.takePiece = function()
  {
    if(pieces.length==0)
    {
      for(var i=0; i<7; i++)
      {
        pieces.push(i);
      }
    }
    
    var randomIndex=Math.floor(Math.random()*pieces.length);
    var piece = pieces[randomIndex];
    pieces.splice(randomIndex, 1);
    return piece;
  }
  
}

// This represents a single falling piece.
function FallingPiece(type, position)
{
  this.position = position;
  this.rotation = 0;
  this.type = type;
  this.set = 0;
  var gridSize = getTetronimoGridSize(this.type);
    
  this.getPiecePositions = function()
  {
    var piecePositions = getTetronimoPositions(this.type);
    rotateVectorArrayClockwise(piecePositions, gridSize, this.rotation);    
    return piecePositions;
  };
  
  this.getGridSize = function()
  {
    return gridSize;
  };
}

// Piece class: represents a single piece on the board.
function Piece(type, set, rotation, index)
{
  this.type = type;
  this.set = set;
  this.rotation = rotation;
  this.index = index;
}

// Game State class: Handles the logical state of the tetris game.
// This class does not have anything to do with graphics, rending or input.
function GameState(width, height, level)
{
  var boardState = nullArray(width * height);
  var fallingPiece = null;
  var linesCleared = 0;
  var score = 0;
  linesClearedThisLevel=0;
  var speed = gameSpeed(level);
  var randomPieceBag = new RandomPieceBag();
  var nextPiece = randomPieceBag.takePiece();
  
  // advances the falling block and returns the falling piece if it has been deposited.
  this.update = function()
  {
    if(!fallingPiece)
    {
      fallingPiece = new FallingPiece(nextPiece, vector(5, 0));   
      
      nextPiece = randomPieceBag.takePiece();
    }
    else
    {
      fallingPiece.position.y++;
      
      var fallingPiecePositions = fallingPiece.getPiecePositions();
      if(this.checkCollision(boardState, fallingPiecePositions, fallingPiece.position.x, fallingPiece.position.y))
      {
        fallingPiece.position.y--;
                
        // Add the falling piece to the board at its previous height:
        for(var i=0; i<fallingPiecePositions.length; i++)
        {
          var index = to1D(fallingPiecePositions[i].x+fallingPiece.position.x, fallingPiecePositions[i].y+fallingPiece.position.y, width);
          var piece=new Piece(fallingPiece.type, fallingPiece.set, fallingPiece.rotation, i); 
          boardState[index]=piece;
        }
        
        var depositedPiece=fallingPiece;
        fallingPiece = null;
        return depositedPiece;  
      }
    }
  };
  
  // Returns a list of lines that were completed by this piece and updates the score, level and lines completed variables.
  // The rows are returned in order of their Y-value.
  // FallingPiece -> [ Integer ]
  this.checkRowCompletion = function(fallingPiece)
  {
    var fallingPiecePositions = fallingPiece.getPiecePositions();
    
   // Get the minimum and maximum y values of the newly added blocks.
    var minY=fallingPiecePositions[0].y;
    var maxY=fallingPiecePositions[0].y;
    for(var i=1; i<fallingPiecePositions.length; i++)
    {
      if(fallingPiecePositions[i].y < minY)
      {
        minY = fallingPiecePositions[i].y;
      }
      if(fallingPiecePositions[i].y > maxY)
      {
        maxY = fallingPiecePositions[i].y;
      }
    }
    
    var completedRows = [];
    
    for(var y=minY+fallingPiece.position.y; y<=maxY+fallingPiece.position.y; y++)
    {
      console.log("Checking row: "+y);
      var rowComplete = true;
      for(x=0; x<width; x++)
      {
        var index=to1D(x, y, width);
        if(boardState[index]===null)
        {
          rowComplete=false;
          break;
        }
      }
      
      if(rowComplete)
      {
        completedRows.push(y);
      }
    }
    
    linesCleared+=completedRows.length;
    score+=lineClearedPoints(level, completedRows.length);
    linesClearedThisLevel+=completedRows.length;
    if(linesClearedThisLevel>=10)
    {
      level++;
      speed = gameSpeed(level);
      linesClearedThisLevel=0;
    }
    if(level>20)
    {
      level=20;
    }
    
    return completedRows;
  }

  // Removes the given rows, and drops the pieces above down.
  this.removeRowsAndDropDown = function(rows)
  {
    for(var row=0; row<rows.length; row++)
    {
      for(y=rows[row]; y>=0; y--)
      {
        for(x=0; x<width; x++)
        {
          var readIndex=to1D(x, y-1, width);
          var readValue = readIndex >= 0 ? boardState[readIndex] : null;
          var writeIndex=to1D(x, y, width);
          boardState[writeIndex]=readValue;
        }
      }
    }
  }
  
  // Returns true if the game is over (if there are blocks in the top two rows of the playing area)
  this.isGameOver = function()
  {
    for(var y=0; y<offscreen; y++)
    {
      for(var x=0; x<width; x++)
      {
        var index=to1D(x, y, width);
        if(boardState[index]!=null)
        {
          return true;
        }
      }
    }
    return false;
  };
  
  // Checks if the given positionList collides with another block in boardGrid,
  // or if a position in positionList is off-grid.
  this.checkCollision = function(boardGrid, positionList, offsetX, offsetY)
  {
    for(var i=0; i<positionList.length; i++)
    {
      var checkPoint=vector(positionList[i].x+offsetX, positionList[i].y+offsetY);
      /*
      if(positionList[i].x + offsetX < 0 || positionList[i].x + offsetX >= width)
      {
        return true;
      }
      if(positionList[i].y + offsetY < 0 || positionList[i].y + offsetY >= height)
      {
        return true;
      }
      */
      if(!inGrid(width, height, checkPoint))
      {
        return true;
      }
      
      
      var index = to1D(checkPoint.x, checkPoint.y, width);
      if(boardGrid[index]!==null)
      {
        return true;
      }
    }
    return false;
  };
  
  this.getFallingPiece = function()
  {
    return fallingPiece;
  };
  
  this.getNextPiece = function()
  {
    return nextPiece;
  };
  
  this.getWidth = function()
  {
    return width;
  };
  
  this.getLinesCleared = function()
  {
    return linesCleared;
  };
  
  this.getScore = function()
  {
    return score;
  };
  
  this.getLevel = function()
  {
    return level;
  };
  
  this.getSpeed = function()
  {
    return speed;
  };
  
  this.getHeight = function()
  {
    return height;
  };
    
  this.getPiece = function(x, y)
  {
    return boardState[y*gameWidth+x];
  };

  this.setPiece = function(x, y, piece)
  {
    boardState[y*gameWidth+x] = piece;
  };
  
  this.getGraphicalState = function()
  {
    return boardState;
  };
      
  this.nudgeLeft = function()
  {
    return this.nudge(-1, 0);
  };
  
  this.nudgeRight = function()
  {
    return this.nudge(1, 0);
  };
  
  this.nudgeDown = function()
  {
    return this.nudge(0, 1);
  };
  
  this.rotateClockwise = function()
  {
    if(!fallingPiece)
    {
      return;
    }
    fallingPiece.rotation++;
    var fallingPiecePositions = fallingPiece.getPiecePositions();
    if(this.checkCollision(boardState, fallingPiecePositions, fallingPiece.position.x, fallingPiece.position.y))
    {
      fallingPiece.rotation--;
      return;
    }
    return true;
  };
  
  this.nudge=function(x, y)
  {
    // This should really be a debug assert
    if(x!==0 && y!==0)
    {
      console.log("illegal nudge");
    }
    
    if(!fallingPiece)
    {
      return;
    }
    fallingPiece.position.x+=x;
    fallingPiece.position.y+=y;
    var fallingPiecePositions = fallingPiece.getPiecePositions();
    if(this.checkCollision(boardState, fallingPiecePositions, fallingPiece.position.x, fallingPiece.position.y))
    {
      fallingPiece.position.x-=x;
      fallingPiece.position.y-=y;
      return;
    }
    return true;
  };
}