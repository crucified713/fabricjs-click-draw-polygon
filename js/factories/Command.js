polygonApp.factory('Command', function() {
    var Command = function(action, undoAction, point, line, polygon, currentDrawingIndex, lineList, pointList) {
        this.execute = action;
        this.undo = undoAction;
        this.point = point;
        this.line = line;
        this.polygon = polygon;
        this.currentDrawingIndex = currentDrawingIndex;
        this.lineList = lineList;
        this.pointList = pointList;
    }
    return Command;
});