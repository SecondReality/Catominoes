gameWidth=10;
gameHeight = 22;
offscreen = 2;  // The amount of rows that are not visible at the top of the screen

// Render system:
squareSize = 34;  // The size of the tiles on the playing field
edgeOverlap = 6; // The graphical size of the tiles (tiles slightly overlap)

canvasWidth = gameWidth * squareSize+2*edgeOverlap;
canvasHeight = (gameHeight-offscreen) * squareSize+2*edgeOverlap;
    
window.onload = draw;  

// Terminology:
// rotation: rotation is specified with values 0-3 (0 being 0 degrees, 1 being 90 degrees and so on)

function log(message)
{
  console.log(message);
}

// Converts a 2d position to a 1d position, used for accessing a 1D array with 2D coordinates.
function to1D(x, y, gridWidth)
{
  return y*gridWidth+x;
}

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

// Used to generate a pseudo-random piece, which stops players from losing the game simply because they were unlucky.
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

// Game State class
function GameState(widthIn, heightIn, level)
{
  var width = widthIn;
  var height = heightIn;
  var boardState = nullArray(width * height);
  var fallingPiece = null;
  var linesCleared = 0;
  var score = 0;
  linesClearedThisLevel=0;
  var speed = gameSpeed(level);
  var randomPieceBag = new RandomPieceBag();
  var nextPiece = randomPieceBag.takePiece();
  
  // Returns the piece if one has been deposited
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
  
  // Returns a list of lines that were completed
  // The rows are returned in order of their Y-value
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

  // Removes the given rows, and drops down the pieces above  
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
      if(boardGrid[index]!==null)
      {
        console.log("collision detected");
        return true;
      }
    }
    return false;
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

var globalGame = null;

// Returns true if point is contained in a grid of the given dimensions
function inGrid(width, height, point)
{
  if(point.x >=0 && point.x<width && point.y >=0 && point.y < height)
  {
    return true;
  }
  return false;
}

function updateTextDisplay(gameState)
{      
  // Update the score and lines completed:
  $('#lines').text(gameState.getLinesCleared());
  $('#score').text(gameState.getScore());
  $('#level').text(gameState.getLevel());
}

// Handles tying input to game state, time and rendering:
function Game(context, nextPieceContext, level)
{     
  var spriteSheet = makeSprite("sprites.png");
  var depositBlockSound = new Audio("depositBlock.wav");
  
  var gameState = new GameState(gameWidth, gameHeight, level);
  updateTextDisplay(gameState);
  var graphicalPieceSize = squareSize + edgeOverlap*2;
  globalGame = this;
  
  // Listen for keyboard input:
  document.addEventListener('keydown', function(event)
  {
  
    switch(event.keyCode)
    {
      case 65:
      {
        if(gameState.nudgeLeft())
        {
          globalGame.drawBoard();
        }
        break;
      }
      case 68:
      {
        if(gameState.nudgeRight())
        {
          globalGame.drawBoard();
        }
        break;
      }
      case 87:
      {
        if(gameState.rotateClockwise())
        {
          globalGame.drawBoard();
        }
        break;
      }
      case 83:
      {
        if(gameState.nudgeDown())
        {
          globalGame.drawBoard();
        }
        break;
      }
      default:
      {
        break;
      }
    }   
  });
  
  // Touch controls:
  $("canvas")[0].addEventListener('touchstart', function(event)
  {
    // If there's exactly one finger inside this element
    if (event.targetTouches.length == 1) {
      var touch = event.targetTouches[0];
      
      touchX = touch.pageX - $("canvas").position().left;
      touchY = touch.pageY - $("canvas").position().top;
      
      if(touchY < (gameState.getFallingPiece().position.y *squareSize) - 100)
      {
        gameState.rotateClockwise();
        globalGame.drawBoard();
      }
      
      if(touchY > (gameState.getFallingPiece().position.y *squareSize)+100)
      {
        gameState.nudgeDown();
        globalGame.drawBoard();
      }
      
      if(touchX < (gameState.getFallingPiece().position.x *squareSize))
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
   
  this.displayGameOver=function()
  {
    // Check if the game should end (checks if pieces are in the top two rows)
    $('#gameinfo').show();
  }
  
  this.run = function()
  {
     var depositedBlock = gameState.update();
     this.drawBoard();
     
     if(depositedBlock)
     {
       depositBlockSound.play();
       var completedRows=gameState.checkRowCompletion(depositedBlock);
       if(completedRows.length>0)
       {        
         // Rows have been completed, flash the rows:
         setTimeout(globalGame.flashRows.bind(globalGame), 200, 7, completedRows);        
         updateTextDisplay(gameState);

         return;
       }
       else
       {
         if(gameState.isGameOver())
         {
           this.displayGameOver();
           return;
         }
       }
     }
     setTimeout(globalGame.run.bind(globalGame), gameState.getSpeed());
  };
  
  this.flashRows = function(remainingFlashes, flashingRows)
  {   
    if(remainingFlashes===0)
    {
      gameState.removeRowsAndDropDown(flashingRows);
      if(gameState.isGameOver())
      {
        this.displayGameOver();
        return;
      }
      this.run();
      return;
    }

    var parameter = remainingFlashes % 2 ==0 ? null : flashingRows;
    this.drawBoard(parameter);
    
    remainingFlashes--;
    setTimeout(globalGame.flashRows.bind(globalGame), 150, remainingFlashes, flashingRows);
  }
  
  this.drawNextPiece = function()
  {
    // Clear the drawing area:
    nextPieceContext.fillStyle = '#dfdfff';
    nextPieceContext.fillRect(-edgeOverlap, -edgeOverlap, canvasWidth, canvasHeight);
  
    var nextPiece=new FallingPiece(gameState.getNextPiece(), vector(0, 0));
    this.drawFallingPiece(nextPieceContext, nextPiece);
  }
  
  this.drawFallingPiece = function(context, fallingPiece)
  {
    if(fallingPiece)
    {
      var piecePositions=fallingPiece.getPiecePositions();
      var gridSize=fallingPiece.getGridSize();
      
      for(var i=0; i<piecePositions.length; i++)
      {
        var piecePosition=piecePositions[i];
        var piece=new Piece(fallingPiece.type, fallingPiece.set, fallingPiece.rotation, i); 
        this.drawPiece(context, piece, fallingPiece.position.x+piecePosition.x, fallingPiece.position.y+piecePosition.y);
      }
    }
  }
  
  
  // hiddenRows is an optional parameter
  this.drawBoard = function(hiddenRows)
  {
      drawBackground(context);
      
      // Draw the next piece that will fall:
      this.drawNextPiece();
              
      var fallingPiece = gameState.getFallingPiece();
      this.drawFallingPiece(context, fallingPiece);
      
      var state = gameState.getGraphicalState();
      
      var rowIndex = 0;
         
      for(var y = offscreen; y < gameState.getHeight(); y++)
      {
        if(hiddenRows && rowIndex<hiddenRows.length && y===hiddenRows[rowIndex])
        {
          rowIndex++;
          continue;
        }
        
        for(var x = 0; x < gameState.getWidth(); x++)
        {
          var p = gameState.getPiece(x, y);
          if(p)
          {
            this.drawPiece(context, p, x, y);              
          }
        }
      }
      
      // Draw 'slime' where the pieces have been cut.
      for(var y = offscreen; y < gameState.getHeight(); y++)
      {
        if(hiddenRows && rowIndex<hiddenRows.length && y===hiddenRows[rowIndex])
        {
          rowIndex++;
          continue;
        }
        
        for(var x = 0; x < gameState.getWidth(); x++)
        {
          var p = gameState.getPiece(x, y);
          if(p)
          {
            // Get a list of the connected pieces and rotate them to match the rotation of this piece:
            var relativeAdjacent = getAdjacent(p.type, p.index);
            rotateVectorArrayClockwise(relativeAdjacent, 1, p.rotation);
            
            for(var i=0; i<relativeAdjacent.length; i++)
            {
             // Check if the piece is still connected, if not - then draw slime:
             var checkPosition=vector(x+relativeAdjacent[i].x, y+relativeAdjacent[i].y);
                          
             if(inGrid(gameState.getWidth(), gameState.getHeight(), checkPosition))
             {
               var checkPiece=state[to1D(checkPosition.x, checkPosition.y, gameState.getWidth())];
               
               if(checkPiece!=null)
               {
                 if(checkPiece.type == p.type && checkPiece.index == relativeAdjacent[i].index)
                 {
                   continue;
                 }
               }
             }
                          
              var rotation = relativeAdjacent[i].y==-1 ? 0: 2;
              
              this.drawSlime(context, checkPosition.x, checkPosition.y, rotation);
            }
          }
        }
      }
};
  
  this.blitSprite = function(context, sourcePosition, x, y, rotation)
  {
    context.save();
        
    context.translate(x*squareSize+(squareSize/2), y*squareSize+(squareSize/2));
    context.rotate( rotation * (Math.PI/2.0));

    context.drawImage(spriteSheet, sourcePosition.x, sourcePosition.y, graphicalPieceSize, graphicalPieceSize, -(squareSize/2)-edgeOverlap, -(squareSize/2)-edgeOverlap, graphicalPieceSize, graphicalPieceSize);

    context.restore();
  }
  
  this.drawPiece = function(context, piece, x, y)
  {               
    // Get the piece positions for this type:
    var piecePositions = getGraphicalTetronimoSourcePiecePositions(piece.type);

    // Translate the piece position into a source image coordinate:
    var sourcePosition = piecePositions[piece.index].multiply(squareSize);                          

    this.blitSprite(context, sourcePosition, x, y, piece.rotation);
  };
  
  // this should call drawPiece.
  this.drawSlime = function(context, x, y, rotation)
  {
    var sourcePosition = vector(0, 20).multiply(squareSize);
    this.blitSprite(context, sourcePosition, x, y, rotation);
  };
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
   
  var gameState = new GameState(4, 5);
  gameState.setPiece(1, 1, "Hello");
 
  console.log("----- Unit tests complete -----");
}

function draw()
{
  unitTest();
  gameLoop();
} 

function gameLoop()
{
  var canvas = $('#gameCanvas')[0];
  if(!canvas.getContext)
  {
    console.log("Canvas not found");
    return;
  }
  
  var nextPieceContext;
  {
    // Initialise the next piece canvas:
    var nextPieceCanvas = $('#nextPieceCanvas')[0];
    nextPieceCanvas.width = 4 * squareSize+2*edgeOverlap;
    nextPieceCanvas.height = 4 * squareSize+2*edgeOverlap;
    nextPieceContext=nextPieceCanvas.getContext('2d');
    nextPieceContext.translate(edgeOverlap, edgeOverlap);
  }
   
  console.log("Canvas discovered");
  var context = canvas.getContext('2d');
     
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  context.translate(edgeOverlap, edgeOverlap);
  context.translate(0, -(offscreen*squareSize));
  drawBackground(context);
  
  // Display the 'game start' text, and attach events to the start button:
  $('#start').click(function()
  {
    $('#gameinfo').hide();
    $('#gameinfo h3').text("Game Over!");
    var level=$('#levelSelect').text();
    game = new Game(context, nextPieceContext, level);
    game.run();
  });
  
  $('#rightarrow').click(function()
  {
    var level=$('#levelSelect').text();
    if(level<20)
    {
      level++;
    }
    else
    {
      level=0;
    }
    
    $('#levelSelect').text(level);
  });

  $('#leftarrow').click(function()
  {
    var level=$('#levelSelect').text();
    if(level>0)
    {
      level--;
    }
    else
    {
      level=20;
    }
    
    $('#levelSelect').text(level);
  });
  
}

function drawBackground(context)
{
  // Clear the drawing area:
  context.fillStyle = '#dfdfff';
  context.fillRect(-edgeOverlap, -edgeOverlap+(offscreen*squareSize), canvasWidth, canvasHeight);
  
  for(var y=offscreen; y<gameHeight; y++)
  {
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

// for compatibility, from: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP
                                 ? this
                                 : oThis || window,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}