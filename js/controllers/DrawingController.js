var DrawingController = polygonApp.controller('DrawingController',
    function (
        $scope,
        DrawPolygon) {
        $scope.drawingPolygonMode = false;
        $scope.drawPolygon = DrawPolygon; 
        
        $scope.openDrawingTool = function () {
            DrawPolygon.display();
            $scope.drawingPolygonMode = true;
        };

        $scope.exitDrawingPolygon = function () {
            DrawPolygon.cancelDrawing().then(function (confirmExit) {
                if (confirmExit) {
                    $scope.drawingPolygonMode = false;
                }
            });
        };

        $scope.resetDrawingPolygon = function () {
            DrawPolygon.resetDrawing();
        };

        $scope.savePolygonImage = function () {
            DrawPolygon.generateImage().then(function (filename) {
                $scope.resetDrawingPolygon();
                $scope.drawingPolygonMode = false;
                console.log("Here is your image filename: ", filename);
            });
        };

        $scope.undoDrawingPolygon = function () {
            DrawPolygon.undo();
        };

        $scope.redoDrawingPolygon = function () {
            DrawPolygon.redo();
        };
    });
