// Render system:
squareSize = 34;  // The size of the tiles on the playing field
edgeOverlap = 6; // The graphical size of the tiles (tiles slightly overlap)

function canvasResolution(logicalWidthOrHeight)
{
  return logicalWidthOrHeight * squareSize+2*edgeOverlap
}
    
window.onload = initializeGame;  

var globalGame = null;

function log(message)
{
  if(typeof variable !== 'undefined' && console.log)
  {
    console.log(message);
  }
}

function updateTextDisplay(gameState)
{      
  // Update the score and lines completed:
  $('#lines').text(gameState.getLinesCleared());
  $('#score').text(gameState.getScore());
  $('#level').text(gameState.getLevel());
}

// Handles tying input to gameState, time and rendering:
function Game(context, nextPieceContext, level)
{     
  var spriteSheet = makeSprite("sprites.png");
  var depositBlockSound = new Audio("depositBlock.wav");
  var rowCompletedSound = new Audio("rowCompleted.wav");
  
  var gameState = new GameState(gameWidth, gameHeight, level);
  updateTextDisplay(gameState);
  var graphicalPieceSize = squareSize + edgeOverlap*2;
  globalGame = this;
  var paused=false;
    
  this.displayGameOver=function()
  {
    // Check if the game should end (checks if pieces are in the top two rows)
    $('#gameinfo').show();
  }
  
  this.togglePause=function()
  {
    paused=!paused;
    if(!paused)
    {
      this.run();
    }
  }
  
  // Starts the game running.
  // It utilises setTimeout so it does not consume all the cpu in its loop.
  this.run = function()
  {
     if(paused)
     {
       return;
     }
     
     var depositedBlock = gameState.update();
     this.drawBoard();
     
     if(depositedBlock)
     {
       depositBlockSound.play();
       var completedRows=gameState.checkRowCompletion(depositedBlock);
       if(completedRows.length>0)
       {        
         // Rows have been completed, play a sound and flash the rows:
         rowCompletedSound.play();
         setTimeout(globalGame.flashRowsBind(7, completedRows).bind(globalGame), 150);         
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
   
  // Flashes flashingRows remainingFlashes times, and returns to run() after the flashing finishes.
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
    setTimeout(globalGame.flashRowsBind(remainingFlashes, flashingRows).bind(globalGame), 150);
  }
  
  // A wrapper around flashRows so that we don't have to pass additional parameters to setTimeout (which doesn't work in IE)
  // Another solution could be to use: http://der-design.com/javascripts/cross-browser-settimeout
  this.flashRowsBind = function(remainingFlashes, flashingRows)
  {
    return function()
    {
      this.flashRows(remainingFlashes, flashingRows);
    };
  }
  
  // Draws the next piece that will fall in its own context.
  this.drawNextPiece = function()
  {
    // Clear the drawing area:
    nextPieceContext.fillStyle = '#dfdfff';
    nextPieceContext.fillRect(-edgeOverlap, -edgeOverlap, canvasResolution(gameWidth), canvasResolution(gameHeight-offscreen));
  
    var nextPiece=new FallingPiece(gameState.getNextPiece(), vector(0, 0));
    this.drawFallingPiece(nextPieceContext, nextPiece);
  }
  
  // Draws the given fallingPiece in the given context.
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
  
  // Draws the main game area.
  // hiddenRows is a list of the row numbers to omit drawing.
  // hiddenRows is utilised by the flashRows function.
  // hiddenRows is an optional parameter. 
  this.drawBoard = function(hiddenRows)
  {
      drawBackground(context);
      
      // Draw the next piece that will fall:
      this.drawNextPiece();
              
      // Draw the pieces that are on the board:
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
          this.drawSlimeForPiece(p, x, y);
        }
      }  
  };
  
  // Given a piece, calculates which sides have been cut and draws the slime.
  this.drawSlimeForPiece = function(p, x, y)
  {
    if(!p)
    {
      return;
    }
    
    var state = gameState.getGraphicalState();
    
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
  
  // Draws a sprite from the sprite sheet.
  // Draws it to the logical x and y position of the board, with the given rotation.
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
  
  // Draws the 'slime' that comes out when a cat gets cut in half...
  this.drawSlime = function(context, x, y, rotation)
  {
    var sourcePosition = vector(0, 20).multiply(squareSize);
    this.blitSprite(context, sourcePosition, x, y, rotation);
  };
  
  // Listen and respond to keyboard input:
  document.addEventListener('keydown', function(event)
  {
  
    switch(event.keyCode)
    {
      case 65: // a
      {
        if(gameState.nudgeLeft())
        {
          globalGame.drawBoard();
        }
        break;
      }
      case 68: // d
      {
        if(gameState.nudgeRight())
        {
          globalGame.drawBoard();
        }
        break;
      }
      case 87: // w
      {
        if(gameState.rotateClockwise())
        {
          globalGame.drawBoard();
        }
        break;
      }
      case 83: // s
      {
        if(gameState.nudgeDown())
        {
          globalGame.drawBoard();
        }
        break;
      }
      case 80: // p
      {
        globalGame.togglePause();
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
  
}

// Draws a checkered background for the main game area in the given context:
function drawBackground(context)
{
  // Clear the drawing area:
  context.fillStyle = '#dfdfff';
  context.fillRect(-edgeOverlap, -edgeOverlap+(offscreen*squareSize), canvasResolution(gameWidth), canvasResolution(gameHeight-offscreen));
  
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

// jQuery extension to center a div.
// taken from http://stackoverflow.com/questions/210717/using-jquery-to-center-a-div-on-the-screen
jQuery.fn.center = function ()
{
    this.css("position","absolute");
    this.css("top", (($(window).height() - this.outerHeight()) / 2) + $(window).scrollTop() + "px");
    this.css("left", (($(window).width() - this.outerWidth()) / 2) + $(window).scrollLeft() + "px");
    return this;
}

// Resizes the gameCanvas and centers the game in the window.
function centerAndResize()
{
  var canvasHeight = canvasResolution(gameHeight-offscreen);
  
  // Set the screen-size of the canvas element.
  var windowHeight=$(window).height(); 
  var height = windowHeight < (canvasHeight+10) ? windowHeight-10 : canvasHeight;
  
  // Resize the piece preview canvas:
  var ratio = height/canvasHeight;
  var nextPieceCanvasHeight = windowHeight < (canvasHeight+10) ? ratio * canvasResolution(4) : canvasResolution(4);
  
  $('#gameCanvas').height(height);
  $('#nextPieceCanvas').height(nextPieceCanvasHeight);
  $('#gamearea').center();
}

$(window).resize(centerAndResize);

// Game entry point.
function initializeGame()
{
  var canvas = $('#gameCanvas')[0];
  if(!canvas.getContext)
  {
    log("Canvas not found");
    return;
  }
  
  var nextPieceContext;
  {
    // Initialise the next piece canvas:
    var nextPieceCanvas = $('#nextPieceCanvas')[0];
    nextPieceCanvas.width = canvasResolution(4);
    nextPieceCanvas.height = canvasResolution(4);
    nextPieceContext=nextPieceCanvas.getContext('2d');
    nextPieceContext.translate(edgeOverlap, edgeOverlap);
  }
   
  var context = canvas.getContext('2d');
  
  // Set the resolution of the canvas: this isn't neccesarily how large it appears on screen.
  canvas.width = canvasResolution(gameWidth);
  canvas.height = canvasResolution(gameHeight-offscreen);

  centerAndResize();
  
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

function unitTest()
{
  log("vector(10, 20)");
  log(vector(10, 20));
  
  log("");
  log("");
  
  log("getGraphicalTetronimoSourcePiecePositions");
  log(getGraphicalTetronimoSourcePiecePositions(0));
   
  var gameState = new GameState(4, 5);
  gameState.setPiece(1, 1, "Hello");
 
  log("----- Unit tests complete -----");
}