gameWidth=10;
gameHeight = 22;

// Render system:
squareSize = 34;  // The size of the tiles on the playing field
edgeOverlap = 6; // The graphical size of the tiles (tiles slightly overlap)

window.onload = draw;  

// Terminology:
// Piece fragments represent 

// 0: Cyan I
// ****
// 1: Yellow O
// **
// **
// 2: Purple T
//  * 
// ***
// Green S
// Red Z
// Blue J
// Orange L

// Vector class
Vector = function(x, y)
{
  this.x = x;
  this.y = y;
};

function makeSprite(source)
{
  var image = new Image();
  image.src = source;
  return image;
}

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

function vector(x, y)
{
  return new Vector(x, y);
}

// Converts a 2d position to a 1d position, used for accessing a 1D array with 2D coordinates.
function to1D(x, y, gridWidth)
{
  return y*gridWidth+x;
}

function FallingPiece(type, position)
{
  this.position = position;
  this.rotation = 0;
  this.type = type;
  this.set = 0;
  var gridSize =   getTetronimoGridSize(this.type);
  // Returns a 2d buffer containing the index to the type.
  this.getBuffer = function()
  {
    // TODO:
    // We should precompute all the falling pieces beforehand - 
    // all rotations of all pieces will easily fit in memory.

    
    var piecePositions = this.getPiecePositions();
    
    // Now generate the buffer:
    var buffer = nullArray(gridSize*gridSize);
    for(var i=0; i<piecePositions.length; i++)
    {
      var piece=new Piece(this.type, this.set, this.rotation, i); 
      var index = to1D(piecePositions[i].x, piecePositions[i].y, gridSize);
      buffer[index]=piece;
    }
       
    return buffer;
  }
  
  this.getPiecePositions = function()
  {
    var piecePositions = getTetronimoPositions(this.type);
       
    for(var i=0; i<this.rotation; i++)
    {
      for(n=0; n<piecePositions.length; n++)
      {
        var x = (gridSize-1)-piecePositions[n].y; // incorrect
        var y = piecePositions[n].x;
      
        piecePositions[n].x=x;
        piecePositions[n].y=y;
      }
    }
    return piecePositions;
  }
  
  this.getGridSize = function()
  {
    return gridSize;
  }
}

function nullArray(size)
{
  var array = new Array();
  for(var n=0; n<size; n++)
  {
    array.push(null);
  }
  return array;
}

// Game State class
function GameState(widthIn, heightIn)
{
  var width = widthIn;
  var height = heightIn;
  var nextPiece = 0;
  
  var fallingPiece = null;
  
  this.update = function(soundListener)
  {
    if(!fallingPiece)
    {
      console.log("no falling piece");
      fallingPiece = new FallingPiece(nextPiece, vector(5, 0));   
      
      // Generate random number between 0 and 2:
      nextPiece = Math.floor(Math.random()*7);
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
        
        soundListener.play();
        
        // Get the minimum and maximum y values of the newly added blocks.
        // TODO: this could also be precalculated:
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
        // Check if these rows should be removed (or start flashing):
        for(var y=minY+fallingPiece.position.y; y<=maxY+fallingPiece.position.y; y++)
        {
          console.log("Checking row: "+y);
          var rowComplete = true;
          for(x=0; x<width; x++)
          {
            var index=to1D(x, y, width);
            if(boardState[index]==null)
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
        
        // Remove the completed rows:
        for(var row=0; row<completedRows.length; row++)
        {
          for(y=completedRows[row]; y>=0; y--)
          {
            for(x=0; x<width; x++)
            {
              var readIndex=to1D(x, y-1, width);
              var writeIndex=to1D(x, y, width);
              boardState[writeIndex]=boardState[readIndex];
            }
          }
        }
        
        fallingPiece = null;       
      }
      
      
    }
  }
  
  this.getFallingPiece = function()
  {
    return fallingPiece;
  }
  
  this.getWidth = function()
  {
    return width;
  }
  
  this.getHeight = function()
  {
    return height;
  }
  
  var boardState = nullArray(width * height);//new Array(width * height);
  var fallingPiece = null;
   
  this.getPiece = function(x, y)
  {
    return boardState[y*gameWidth+x];
  }

  this.setPiece = function(x, y, piece)
  {
    boardState[y*gameWidth+x] = piece;
  }
  
  this.getGraphicalState = function()
  {
    return boardState;
  }
  
  /*
  this.checkFallingPieceCollisions = function()
  {
    var fallingPiecePositions = fallingPiece.getPiecePositions();
    return (this.checkCollision(boardState, fallingPiecePositions, fallingPiece.position.x, fallingPiece.position.y));
  }
  */
  
  // Checks if the given positionList collides with another block in boardGrid,
  // or if a position in positionList is off-grid.
  this.checkCollision = function(boardGrid, positionList, offsetX, offsetY)
  {
    for(var i=0; i<positionList.length; i++)
    {
      if(positionList[i].x + offsetX < 0 || positionList[i].x + offsetX >= width)
      {
        return true;
      }
      if(positionList[i].y + offsetY < 0 || positionList[i].y + offsetY >= height)
      {
        return true;
      }
      
      var index = to1D(positionList[i].x+offsetX, positionList[i].y+offsetY, width);
      if(boardGrid[index]!=null)
      {
        console.log("collision detected");
        return true;
      }
    }
    return false;
  }
  
  this.nudgeLeft = function()
  {
    this.nudge(-1, 0);
  }
  
  this.nudgeRight = function()
  {
    this.nudge(1, 0);
  }
  
  this.nudgeDown = function()
  {
    this.nudge(0, 1);
  }
  
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
    }
  }
  
  this.nudge=function(x, y)
  {
    if(x!=0 && y!=0)
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
    }
  }
};

var globalGame = null;

// Handles tying input to game state and rendering:
function Game(context)
{     
  var spriteSheet = makeSprite("sprites.png");
  var depositBlockSound = new Audio("depositBlock.wav");
  
  var context = context;
  var gameState = new GameState(gameWidth, gameHeight);
  var graphicalPieceSize = squareSize + edgeOverlap*2;
  globalGame = this;
  // Start listening for keyboard input:
  document.addEventListener('keydown', function(event)
  {
  
    switch(event.keyCode)
    {
      case 65:
      {
        gameState.nudgeLeft();
        globalGame.drawBoard();
        break;
      }
      case 68:
      {
        gameState.nudgeRight();
        globalGame.drawBoard();
        break;
      }
      case 87:
      {
        gameState.rotateClockwise();
        globalGame.drawBoard();
        break;
      }
      case 83:
      {
        // Should nudging downwards reset the time till the next update?
        gameState.nudgeDown();
        globalGame.drawBoard();
        break;
      }
    }   
  });
  
  // Touch controls:
  var obj = document.getElementById('gameCanvas');
  obj.addEventListener('touchstart', function(event)
  {
    // If there's exactly one finger inside this element
    if (event.targetTouches.length == 1) {
      var touch = event.targetTouches[0];
      
      
      if(touch.pageY < (gameState.getFallingPiece().position.y *squareSize) - 100)
      {
        gameState.rotateClockwise();
        globalGame.drawBoard();
      }
      
      if(touch.pageY > (gameState.getFallingPiece().position.y *squareSize)+100)
      {
        gameState.nudgeDown();
        globalGame.drawBoard();
      }
      
      if(touch.pageX < (gameState.getFallingPiece().position.x *squareSize))
      {
        gameState.nudgeLeft();
        globalGame.drawBoard();
      }
      else
      {
        gameState.nudgeRight();
        globalGame.drawBoard();
      }
    }
  }, false);
   
  this.run = function()
  {

     this.drawBoard();
     gameState.update(depositBlockSound);
     setTimeout('globalGame.run()', 500 );
  }
  
  this.drawBoard = function()
  {
      drawBackground(context);
              
      // Draw the game board:
      var state = gameState.getGraphicalState();
         
      for(var y = 0; y < gameState.getHeight(); y++)
      {
        for(var x = 0; x < gameState.getWidth(); x++)
        {
          var p = gameState.getPiece(x, y);
          if(p)
          {
            this.drawPiece(context, p, x, y);
          }
        }
      }
      
      var fallingPiece = gameState.getFallingPiece();
        
      if(fallingPiece)
      {
        // Why a 2D buffer? Why not a list of the coordinates instead?
        var fallingBuffer=fallingPiece.getBuffer();
        var gridSize=fallingPiece.getGridSize();
        for(var y=0; y<gridSize; y++)
        {
          for(var x=0; x<gridSize; x++)
          {
            var piece=fallingBuffer[to1D(x, y, gridSize)];
            if(piece)
            {
              this.drawPiece(context, piece, fallingPiece.position.x+x, fallingPiece.position.y+y);
            }
          }
        }
      }
  }
  
  this.drawPiece = function(context, piece, x, y)
  {
    context.save();
                
    // Get the piece positions for this type:
    var piecePositions = getGraphicalTetronimoSourcePiecePositions(piece.type);

    // Translate the piece position into a source image coordinate:

    var sourcePosition = piecePositions[piece.index].multiply(squareSize);                          

    context.translate(x*squareSize+(squareSize/2), y*squareSize+(squareSize/2));
    context.rotate( piece.rotation * (Math.PI/2.0));

    context.drawImage(spriteSheet, sourcePosition.x, sourcePosition.y, graphicalPieceSize, graphicalPieceSize, -(squareSize/2)-edgeOverlap, -(squareSize/2)-edgeOverlap, graphicalPieceSize, graphicalPieceSize);

    context.restore();
  }
}

// Piece class
function Piece(type, set, rotation, index)
{
  this.type = type;
  this.set = set;
  this.rotation = rotation;
  this.index = index;
}

function unitTest()
{
  console.log("vector(10, 20)");
  console.log(vector(10, 20));
  
  console.log("");
  console.log("");
  
  console.log("getGraphicalTetronimoSourcePiecePositions");
  console.log(getGraphicalTetronimoSourcePiecePositions(0));
  
  //console.log("getGraphicalTetronimoSourcePiecePixelPosition(0, vector(0, 0))");
  //console.log(getGraphicalTetronimoSourcePiecePixelPosition(0, vector(0, 0)));
  
  var gameState = new GameState(4, 5);
  gameState.setPiece(1, 1, "Hello");
 
  console.log("----- Unit tests complete -----");
}

// Returns how many sqares are in the archtypal Tetrominos.
// The input corresponds to pieceFragment.type
function getTetronimoPieceCount(type)
{
  return 4;
}

function draw()
{
  unitTest();
  gameLoop();
} 

function gameLoop()
{
  var canvas = document.getElementById('gameCanvas');
  if (canvas.getContext)
  {
    console.log("Canvas discovered");
    var context = canvas.getContext('2d');
       
    canvas.width = gameWidth * squareSize;
    canvas.height = gameHeight * squareSize;
       
    game = new Game(context);
    game.run();
    //var gameState = createInitialState();
    //gameState.pieceFragments.push(createRandomTetronimo());
    
    // Create an I piece and add it to the board:
    // var gameState = new GameState(gameWidth, gameHeight);
    }
    else
    {
      console.log("Canvas not found");
    }
}

function drawBackground(context)
{
  
  for(var y=0; y<gameHeight; y++)
  {
    //for(var x=(y%2) ? 1 : 0; x<gameWidth; x+=2)
    for(var x=0; x<gameWidth; x++)
    {
      if((x+y)%2)
      {
        context.fillStyle = '#dfdfff';
      }
      else
      {
        context.fillStyle = '#ffffff';
      }
      context.fillRect(x*squareSize, y*squareSize, squareSize, squareSize);  
    }   
  }
}