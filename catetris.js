// Render system:
squareSize = 34;  // The size of the tiles on the playing field
edgeOverlap = 6; // The graphical size of the tiles (tiles slightly overlap)
window.onload = initializeGame; // Entry point to the game
globalGame = null;

spriteSheet = makeSprite("sprites.png");
depositBlockSound = new Audio("depositBlock.wav");
rowCompletedSound = new Audio("rowCompleted.wav");

function canvasResolution(logicalWidthOrHeight)
{
  return logicalWidthOrHeight * squareSize+2*edgeOverlap
}
    
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

function makeSprite(source)
{
  var image = new Image();
  image.src = source;
  return image;
}

// A small object that will allow me to keep track of the state of a key.
// It works around problems such as missing key up events (which might happen for example
// when the browser tab is changed while the tab is held, or during other rare events.

function keyState()
{
  var lastKeyDown=0;
  
  this.setKeyDown = function()
  {
    lastKeyDown=new Date().getTime();
  }
  
  this.setKeyup = function()
  {
    lastKeyDown=0;
  }
  
  this.isKeyDown = function()
  {
    var now = new Date().getTime();

    if(lastKeyDown==0)
    {
      return false;
    }
    
    if(now-lastKeyDown > 1000)
    {
      lastKeyDown=0;
      return false;
    }
    
    return true;
  }
}

// Handles tying input to gameState, time and rendering:
function Game(context, nextPieceContext, level)
{       
  var gameState = new GameState(gameWidth, gameHeight, level);
  updateTextDisplay(gameState);
  var graphicalPieceSize = squareSize + edgeOverlap*2;
  globalGame = this;
  var paused=false;
  var downState = new keyState();
  var downKeyStartRow=0;
  var fastFall=false;
    
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
       // Reset the key state so the next block doesn't come flying down:
       fastFall=false;
       
       // Award bonus points:
       downKeyStartRow
       
       depositBlockSound.play();
       
       gameState.addDropScore(depositedBlock.position.y-downKeyStartRow);
       var completedRows=gameState.checkRowCompletion(depositedBlock);
       updateTextDisplay(gameState);
       
       if(completedRows.length>0)
       {        
         // Rows have been completed, play a sound and flash the rows:
         rowCompletedSound.play();
         setTimeout(globalGame.flashRowsBind(7, completedRows).bind(globalGame), 150);         
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
     setTimeout(globalGame.run.bind(globalGame), downState.isKeyDown() && fastFall ? gameState.getSpeed()*0.1 : gameState.getSpeed());
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
    if(spriteSheet.complete)
    {
      context.drawImage(spriteSheet, sourcePosition.x, sourcePosition.y, graphicalPieceSize, graphicalPieceSize, -(squareSize/2)-edgeOverlap, -(squareSize/2)-edgeOverlap, graphicalPieceSize, graphicalPieceSize);
    }
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
        if(!paused && gameState.nudgeLeft())
        {
          globalGame.drawBoard();
        }
        break;
      }
      case 68: // d
      {
        if(!paused && gameState.nudgeRight())
        {
          globalGame.drawBoard();
        }
        break;
      }
      case 87: // w
      {
        if(!paused && gameState.rotateClockwise())
        {
          globalGame.drawBoard();
        }
        break;
      }
      case 83: // s
      {
        if(paused)
        {
          break;
        }
        // Record the state, because it's needed in run()    
        var fallingPiece=gameState.getFallingPiece();
        if(!downState.isKeyDown() && fallingPiece)
        {
          fastFall=true;
          downKeyStartRow=fallingPiece.position.y;
          
          if(gameState.nudgeDown())
          {
            globalGame.drawBoard();
          }
        }
        downState.setKeyDown();
        
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
  
  document.addEventListener('keyup', function(event)
  {
    switch(event.keyCode)
    {
      case 83: // s
      {
        downState.setKeyup();
        break;
      }
      default:
      {
        break;
      }
    }
  });
    
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

// Resizes the gameCanvas' and centers the game in the window.
function centerAndResize()
{
  var canvasHeight = canvasResolution(gameHeight-offscreen);
  var canvasWidth = canvasResolution(gameWidth);
  
  // Set the screen-size of the canvas element.
  var windowHeight=$(window).height(); 
  
  var height = windowHeight < (canvasHeight+10) ? windowHeight-10 : canvasHeight;
  var ratio = height/canvasHeight;
  
  var width = canvasWidth;
  var nextPieceCanvasSize = canvasResolution(4);
  
  if(windowHeight < (canvasHeight+10))
  {
    width*=ratio;
    nextPieceCanvasSize*=ratio;
  }

  $('#nextPieceCanvas').width(nextPieceCanvasSize);
  $('#nextPieceCanvas').height(nextPieceCanvasSize);  
  
  $('#gameCanvas').width(width);
  $('#gameCanvas').height(height);

  $('#gamearea').center();
}

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
    var game = new Game(context, nextPieceContext, level);
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
  
  $(window).focus(function()
  {
    // Fixes a bug that made the page go blank (only seemed to affect the Chrome version on my PC)
    if(typeof game !== 'undefined')
    {
      drawBackground(context);
    }
  });
  
  $(window).resize(centerAndResize);
   
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