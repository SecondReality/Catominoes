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
  y*gridWidth+x
}

function FallingPiece(type, position)
{
  this.position = position;
  this.rotation = 0;
  this.type = type;
  this.set = 0;
  
  // Returns a 2d buffer containing the index to the type.
  this.getBuffer = function()
  {
    // Get the unrotated collision buffer for this piece:
    var gridSize = getTetronimoGridSize(this.type);
    var piecePositions = getTetronimoPositions(this.type);
       
    for(var i=0; i<this.rotation; i++)
    {
      var x = 2-piecePositions[i].y;
      var y = piecePositions[i].x;
      
      piecePositions[i].x=x;
      piecePositions[i].y=y;
    }
    
    // Now generate the buffer:
    var buffer = nullArray(gridSize*gridSize);
    for(var i=0; i<piecePositions.length; i++)
    {
      var piece=Piece(this.type, this.set, this.rotation, i); 
    }
    
    return buffer;
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
  
  this.update = function()
  {
    if(!fallingPiece)
    {
      console.log("no falling piece");
      fallingPiece = new FallingPiece(nextPiece, vector(5, 0));   
      
      // TODO: Generate random number:
      nextPiece = 0;
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
  
  /*
  for(var n=0; n<gameWidth * gameHeight; n++)
  {
    boardState[n]=null;
  }
  */
  
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
};

var globalGame = null;


// Handles tying input to game state and rendering:
function Game(context)
{
  var tetronimoI = makeSprite("I.png");
  var context = context;
  var gameState = new GameState(gameWidth, gameHeight);
  
  // Test initialisation
  {
  var piece = new Piece(0, 0, 2, 0);
  gameState.setPiece(3, 19, piece);
        
    var v1 = new Piece(0, 0, 1, 0);
    var v2 = new Piece(0, 0, 1, 1);
    var v3 = new Piece(0, 0, 1, 2);
    var v4 = new Piece(0, 0, 1, 3);
        
    gameState.setPiece(2, 15, v1);
    gameState.setPiece(2, 16, v2);
    gameState.setPiece(2, 17, v3);
    gameState.setPiece(2, 18, v4);
    
    {
      var v1 = new Piece(0, 0, 0, 0);
      var v2 = new Piece(0, 0, 0, 1);
      var v3 = new Piece(0, 0, 0, 2);
      var v4 = new Piece(0, 0, 0, 3);
          
      gameState.setPiece(3, 15, v1);
      gameState.setPiece(4, 15, v2);
      gameState.setPiece(5, 15, v3);
      gameState.setPiece(6, 15, v4);
    }
  }
    
  this.run = function()
  {
      globalGame = this;
      var graphicalPieceSize = squareSize + edgeOverlap*2;
      
      // Draw the game board:
      var state = gameState.getGraphicalState();
         
      for(var y = 0; y < gameState.getHeight(); y++)
      {
        for(var x = 0; x < gameState.getWidth(); x++)
        {
          var p = gameState.getPiece(x, y);
          if(p)
          {
            DrawPiece(context, p, x, y);
          }
        }
      }
     gameState.update();
     setTimeout('globalGame.run()', 2000 );
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

    context.drawImage(tetronimoI, sourcePosition.x, sourcePosition.y, graphicalPieceSize, graphicalPieceSize, -(squareSize/2)-edgeOverlap, -(squareSize/2)-edgeOverlap, graphicalPieceSize, graphicalPieceSize);

    context.restore();
  }
}

// The piece is placed relative to its top left.
GameState.prototype.placeTetronimo = function(type, set, position)
{
}

// Piece class
function Piece(type, set, rotation, index)
{
  this.type = type;
  this.set = set;
  this.rotation = rotation;
  this.index = index;
}

function getTetronimoPieceGridSize(type)
{
  switch(type)
  {
    case 0:
    {
      return 4;
    }
  }
}

// Returns the graphical source coordinates of the pieces in this tetronimo.
// [Vector]
// Results are logical coordinates, 

function getGraphicalTetronimoSourcePiecePositions(type)
{
  switch(type)
  {
    case 0:
    {
      return [vector(0, 0), vector(1, 0), vector(2, 0), vector(3, 0)];
    }
  }
}

function getTetronimoPositions(type)
{ 
  switch(type)
  {
    case 0:
    {
      return [vector(0, 1), vector(1, 1), vector(2, 1), vector(3, 1)];
    }
  }
}

function getTetronimoGridSize(type)
{ 
  switch(type)
  {
    case 0:
    {
      return 4;
    }
  }
}

// Converts the source coordinates into pixel positions.
// [[x1, y1] [x2, y2]]
// EDIT: Updated:
// returns Vector
/*
function getGraphicalTetronimoSourcePiecePixelPosition(type, point)
{
 var upperLeft = point.multiply(squareSize);
 return upperLeft;
}
*/

// getGraphicalTetronimoSourcePiecePositions does not return pixels positions nor account for the fact that some pieces slightly overlap their boundary.
// [[x1, y1, x2, y2]]
function getGraphicalTetronimoSourcePiecePixelPositions(type)
{
  result = []
  positions = getGraphicalTetronimoSourcePiecePositions(type);
}

function drawPiece()
{
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

/*
function createRandomTetronimo()
{
  pieceFragment = new Object();
  pieceFragment.type = 0;
  pieceFragment.graphicalSet = 0;
  pieceFragment.rotation = 0;
  pieceFragment.fragments = [1,1,1,1]; // should use getTetronimoPieceCount
  return pieceFragment;
}
*/


// Generate a collision map.
function generateCollisionMap(type)
{

}

function placeRandomTetronimo()
{
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
    
    // TODO:

    
    canvas.width = gameWidth * squareSize;
    canvas.height = gameHeight * squareSize;
    
    drawBackground(context);
    
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
  
  context.fillStyle = '#dfdfff';
  for(var y=0; y<gameHeight; y++)
  {
  for(var x=(y%2) ? 1 : 0; x<gameWidth; x+=2)
    {
      context.fillRect(x*squareSize, y*squareSize, squareSize, squareSize);  
    }   
  }
}