polygonApp.service('DrawPolygon',
    function ($q, Command) {
        var self = this,
            _polygonMode = false, //true when drawing(unfinished), false when not drawing
            _canvas = {},
            _historyIndex = 0,
            _currentDrawingIndex = 0,
            _commandList = [],
            fileName = '';

        this.display = function () {
            initCanvas();
        };

        this.resetDrawing = function () {
            reset();
        };

        this.cancelDrawing = function () {
            var CONFIRM_EXIT = true;
            return $q(function (resolve) {
                if (_historyIndex !== 0) {
                    swal({
                        title: 'Are you sure?',
                        text: 'You have unsaved changes',
                        type: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#DD6B55',
                        confirmButtonText: 'Exit Canvas',
                        closeOnConfirm: true
                    }, function (isConfirm) {
                        if (isConfirm) {
                            reset();
                            resolve(CONFIRM_EXIT);
                        } else {
                            resolve(!CONFIRM_EXIT);
                        }
                    });
                } else {
                    reset();
                    resolve(CONFIRM_EXIT);
                }
            });
        };

        this.generateImage = function () {
            return $q(function (resolve) {
                var fileName = formattedFilename();
                // Generate image from the _canvas, and upload it to your server
                /**
                 * Since this is a demo only, I'll just leave this part
                 * and there is a bunch of tutorial online
                 */
                resolve(fileName);
            });
        };

        // Helper function to get the final image filename, either user's custom one
        // or randomly generated one.
        function formattedFilename() {
            var fileName;
            if (self.fileName !== undefined && self.fileName.length !== 0) {
                fileName = self.fileName.trim().replace(/\s/g, '_');
            } else {
                fileName = 'prefix_' + Math.random().toString(36).substring(2, 9); //random ar
            }
            fileName = fileName + '.png';
            return fileName;
        }

        // History helper for undo/redo feature
        this.execute = function (command) {
            command.execute();
            _commandList[_historyIndex] = command;
            _historyIndex++;
        };

        this.undo = function () {
            var command = _commandList[_historyIndex - 1];
            if (!command) return;
            command.undo();
            _historyIndex--;
        };

        this.redo = function () {
            var command = _commandList[_historyIndex];
            if (!command) return;
            command.execute();
            _historyIndex++;
        };

        // you can also setup your canvas bg image
        function setUpBackgroundImage(currentImageUrl) {
            _canvas.setBackgroundImage('../' + currentImageUrl, _canvas.renderAll.bind(_canvas), {});
        }

        function initCanvas() {
            _canvas = new fabric.Canvas('canvas-content');
            _canvas.setWidth(960);
            _canvas.setHeight(550);
            _canvas.selection = false;
            _canvas.on('mouse:down', function (options) {
                if (options.target !== null && options.target.isStart && _historyIndex > 2) {
                    generatePolygon();
                } else {
                    addPoint(options);
                }
            });

            _canvas.on('mouse:move', function (options) {
                var activeLine = _currentDrawingIndex > 0 ? _commandList[_historyIndex - 1].line : undefined;
                if (activeLine && activeLine.class == "line") {
                    var pointer = _canvas.getPointer(options.e);
                    activeLine.set({ x2: options.e.layerX, y2: options.e.layerY });
                    var activeShape = _currentDrawingIndex > 0 ? _commandList[_historyIndex - 1].polygon : undefined;
                    var points = activeShape.get("points");
                    points[_currentDrawingIndex] = {
                        x: options.e.layerX,
                        y: options.e.layerY
                    };
                    activeShape.set({
                        points: points
                    });
                }
                _canvas.renderAll();
            });

            // double clicks closing out the current polygon
            // @todo: fabric.js will support native dblclick event soonish.
            document.getElementsByClassName("canvas-container")[0].addEventListener("dblclick", function () {
                if (_polygonMode && _currentDrawingIndex > 3) {
                    generatePolygon();
                }
            });
        }

        function addPoint(options) {
            var point = new fabric.Circle({
                radius: 3,
                fill: '#ffffff',
                stroke: '#333333',
                strokeWidth: 0.5,
                left: options.e.layerX,
                top: options.e.layerY,
                selectable: false,
                hasBorders: false,
                hasControls: false,
                originX: 'center',
                originY: 'center',
            });
            if (_currentDrawingIndex === 0) {
                point.set({
                    fill: 'red',
                    isStart: true
                });
                _polygonMode = true;
            }
            var linePoints = [options.e.layerX, options.e.layerY, options.e.layerX, options.e.layerY];
            var polygonPoints = [];
            if (_currentDrawingIndex > 0) {
                var pos = _canvas.getPointer(options.e);
                polygonPoints = _.clone(_commandList[_historyIndex - 1].polygon.get("points"));
                polygonPoints.push({
                    x: pos.x,
                    y: pos.y
                });

            } else {
                polygonPoints = [{ x: options.e.layerX, y: options.e.layerY }];
            }
            var polygon = new fabric.Polygon(polygonPoints, {
                stroke: 'red',
                strokeWidth: 0,
                fill: 'red',
                opacity: 0.4,
                selectable: false,
                hasBorders: false,
                hasControls: false,
                evented: false
            });
            var line = new fabric.Line(linePoints, {
                strokeWidth: 2,
                fill: '#555555',
                stroke: '#555555',
                class: 'line',
                originX: 'center',
                originY: 'center',
                selectable: false,
                hasBorders: false,
                hasControls: false,
                evented: false
            });
            var preLineList = (_historyIndex - 1 >= 0) && (_currentDrawingIndex !== 0) ? _commandList[_historyIndex - 1].lineList : [];
            var prePointList = (_historyIndex - 1 >= 0) && (_currentDrawingIndex !== 0) ? _commandList[_historyIndex - 1].pointList : [];
            var curLineList = _.clone(preLineList);
            var curPointList = _.clone(prePointList);
            curLineList.push(line);
            curPointList.push(point);
            self.execute(new addPointCommand(point, line, polygon, curLineList, curPointList));
        }

        function generatePolygon() {
            var points = [];
            var preLineList = _commandList[_historyIndex - 1].lineList;
            var prePointList = _commandList[_historyIndex - 1].pointList;
            _.each(prePointList, function (point) {
                points.push({
                    x: point.left,
                    y: point.top
                });
            });
            var finalPolygon = new fabric.Polygon(points, {
                stroke: 'red',
                strokeWidth: 0,
                fill: 'red',
                opacity: 1,
                hasBorders: false,
                hasControls: false,
                selectable: false,
                evented: false,
            });
            self.execute(new generatePolygonCommand(finalPolygon, _currentDrawingIndex, preLineList, prePointList));
        }

        function reset() {
            _canvas.clear();
            _historyIndex = 0;
            _currentDrawingIndex = 0;
            _commandList = [];
        }

        function addPointCommand(point, line, polygon, lineList, pointList) {
            return new Command(commandAddPoint, commandRemoveAddedPoint, point, line, polygon, null, lineList, pointList);
        }

        function generatePolygonCommand(polygon, _currentDrawingIndex, lineList, pointList) {
            return new Command(commandGeneratePolygon, commandRemoveGeneratePolygon, null, null, polygon, _currentDrawingIndex, lineList, pointList);
        }

        function commandAddPoint() {
            if (_currentDrawingIndex > 0) {
                var activeShape = _commandList[_historyIndex - 1].polygon;
                _canvas.remove(activeShape);
            }
            _canvas.add(this.point);
            _canvas.add(this.line);
            _canvas.add(this.polygon);

            _currentDrawingIndex++;
        }

        function commandRemoveAddedPoint() {
            if (_currentDrawingIndex > 1) {
                var activeShape = _commandList[_historyIndex - 2].polygon;
                _canvas.add(activeShape);
            }
            _canvas.remove(_commandList[_historyIndex - 1].line);
            _canvas.remove(_commandList[_historyIndex - 1].point);
            _canvas.remove(_commandList[_historyIndex - 1].polygon);

            _currentDrawingIndex--;
        }

        function commandGeneratePolygon() {
            _.each(this.lineList, function (line) {
                _canvas.remove(line);
            });
            _.each(this.pointList, function (point) {
                _canvas.remove(point);
            });

            _canvas.add(this.polygon);
            _polygonMode = false;
            _currentDrawingIndex = 0;
        }

        function commandRemoveGeneratePolygon() {
            _.each(this.lineList, function (line) {
                _canvas.add(line);
            });
            _.each(this.pointList, function (point) {
                _canvas.add(point);
            });

            var polygon = _commandList[_historyIndex - 1].polygon;
            _canvas.remove(polygon);
            _polygonMode = true;
            _currentDrawingIndex = this.currentDrawingIndex;
        }
    });
