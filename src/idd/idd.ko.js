
(function (InteractiveDataDisplay) {
    if (!ko) {
        console.log("Knockout was no found, please load Knockout first");
    } else {
        var registerBindings = (function () {
            function knockoutBindings() {
                var bindings = {};
                var plotBinding = function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    var plotAttr = element.getAttribute("data-idd-plot") || element.parentElement.getAttribute("data-idd-plot");//parent is checking for dom plot
                    if (bindings.hasOwnProperty(plotAttr)) {
                        bindings[plotAttr](element, valueAccessor, allBindings, viewModel, bindingContext);
                    } else {
                        throw new Error("There is no bindings registered for " + plotAttr + " plot");
                    }
                }
                this.registerPlotBinding = function (plotName, binding, array) {
                    bindings[plotName] = binding;
                    array.forEach(function (val) {
                        ko.bindingHandlers[val] = { update: plotBinding };
                    });
                }
            }
            return knockoutBindings;
        })();

        InteractiveDataDisplay.KnockoutBindings = new registerBindings();

        ko.bindingHandlers.iddPlotName = {
            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var value = valueAccessor();
                var unwrappedName = ko.unwrap(value);

                var plotAttr = element.getAttribute("data-idd-plot");
                if (plotAttr != null) {
                    if (typeof element.plot != 'undefined') {
                        element.plot.name = unwrappedName;
                    }
                    else { //the case when the element was not yet initialized and not yet bound to the logical entity (plot)
                        //storing the data in the DOM. it will be used by IDD during IDD-initializing of the dom element

                        //saving plot name in  attribute: will be picked up by initialization
                        element.setAttribute("data-idd-name", unwrappedName);

                    }
                }
            }
        };

        ko.bindingHandlers.iddIgnoredByFitToView = {
            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var value = valueAccessor();
                var unwrappedName = ko.unwrap(value);

                var plotAttr = element.getAttribute("data-idd-plot");
                if (plotAttr != null) {
                    if (typeof element.plot != 'undefined') {
                        element.plot.isIgnoredByFitToView = unwrappedName;
                    }
                    else { //the case when the element was not yet initialized and not yet bound to the logical entity (plot)
                        //storing the data in the DOM. it will be used by IDD during IDD-initializing of the dom element                        
                        element.setAttribute("data-idd-ignored-by-fit-to-view", unwrappedName);

                    }
                }
            }
        };

        ko.bindingHandlers.iddXlog = {
            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var value = valueAccessor();
                var unwrappedName = ko.unwrap(value);

                var plotAttr = element.getAttribute("data-idd-plot");
                if (plotAttr != null) {
                    if (typeof element.plot != 'undefined') {
                        
                        //we change the axis to log axis
                        var master = element.plot.master;
                        var oldBottomAxis = master.getAxes("bottom")[0];           
                        
                        var bottomAxis;                        
                        if(unwrappedName)
                        {                            
                            // first. The plot transform is switch to log scale
                            element.plot.xDataTransform = InteractiveDataDisplay.logTransform;
                            // adding new axis
                            bottomAxis = master.addAxis("bottom", "log", true, oldBottomAxis.host[0]);                                                  
                        }
                        else
                        {   
                            // first. The plot transform is switch to identity scale
                            element.plot.xDataTransform = InteractiveDataDisplay.identity;
                            // adding new axis    
                            bottomAxis = master.addAxis("bottom", "numeric", true, oldBottomAxis.host[0]);                            
                        }
                        // removing the previous axis
                        master.removeDiv(oldBottomAxis.host[0]);
                        oldBottomAxis.destroy();
                        // looking for grid plot to set proper transform
                        var plots = master.getPlotsSequence();
                        var grids = plots.filter(function(p) { return ('xAxis' in p)});
                        grids.forEach(function(grid) {
                            grid.xAxis = master.get(bottomAxis[0]);
                        });
                        // plot transform to axis transform
                        bottomAxis.dataTransform = element.plot.xDataTransform;      

                        //reassembling gesture source with respect to the new added axis
                        //constructing entirely new combination of gestures from central. left and bottom part results in buggy zoom, so merging into existing gestures
                        var bottomAxisGestures = InteractiveDataDisplay.Gestures.applyHorizontalBehavior(InteractiveDataDisplay.Gestures.getGesturesStream(bottomAxis));                        
                        element.plot.master.navigation.gestureSource = element.plot.master.navigation.gestureSource.merge(bottomAxisGestures);
                    }
                    else { //the case when the element was not yet initialized and not yet bound to the logical entity (plot)
                        //storing the data in the DOM. it will be used by IDD during IDD-initializing of the dom element                        
                        element.setAttribute("data-idd-X-log", unwrappedName);
                    }
                }
            }
        };

        ko.bindingHandlers.iddYlog = {
            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var value = valueAccessor();
                var unwrappedName = ko.unwrap(value);

                var plotAttr = element.getAttribute("data-idd-plot");
                if (plotAttr != null) {
                    if (typeof element.plot != 'undefined') {
                        // we change the axis to log axis
                        var master = element.plot.master;
                        var oldAxis = master.getAxes("left")[0];

                        var leftAxis;
                        if(unwrappedName)
                        {
                            // first. The plot transform is switch to log scale
                            element.plot.yDataTransform = InteractiveDataDisplay.logTransform;
                            // adding new one
                            leftAxis = master.addAxis("left", "log", true, oldAxis.host[0]);                            
                        }
                        else
                        {
                            // first. The plot transform is switch to log scale
                            element.plot.yDataTransform = InteractiveDataDisplay.identityTransform;
                            // adding new one
                            leftAxis = master.addAxis("left", "numeric", true, oldAxis.host[0]);                            
                        }
                        // removing the previous axis
                        master.removeDiv(oldAxis.host[0]);
                        oldAxis.destroy();
                        // looking for grid plot to set proper transform
                        var plots = master.getPlotsSequence();
                        var grids = plots.filter(function(p) { return ('yAxis' in p)});
                        grids.forEach(function(grid) {
                            grid.yAxis = master.get(leftAxis[0]);
                        });
                        // plot transform to axis transform
                        leftAxis.dataTransform = element.plot.yDataTransform;

                        //reassembling gesture source with respect to the new aded axis
                        //constructing entirely new combination of gestures from central. left and bottom part results in buggy zoom, so merging into existing gestures
                        var leftAxisGestures = InteractiveDataDisplay.Gestures.applyVerticalBehavior(InteractiveDataDisplay.Gestures.getGesturesStream(leftAxis));                        
                        element.plot.master.navigation.gestureSource = element.plot.master.navigation.gestureSource.merge(leftAxisGestures);
                    }
                    else { //the case when the element was not yet initialized and not yet bound to the logical entity (plot)
                        //storing the data in the DOM. it will be used by IDD during IDD-initializing of the dom element                        
                        element.setAttribute("data-idd-Y-log", unwrappedName);

                    }
                }
            }
        };

        ko.bindingHandlers.iddPlotTitles = {
            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var value = valueAccessor();
                var unwrappedData = ko.unwrap(value);

                var plotAttr = element.getAttribute("data-idd-plot");
                if (plotAttr != null) {
                    if (typeof element.plot != 'undefined') {
                        element.plot.setTitles(unwrappedData);
                    }
                }
            }
        };
        ko.bindingHandlers.iddEditorColorPalette = {
            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var value = valueAccessor();
                var palette = ko.unwrap(value);

                if ($(element).hasClass("idd-colorPaletteEditor")) {
                    if (typeof element.editor != 'undefined') {
                        element.editor.palette = palette;
                    }
                }
            }
        };
        ko.bindingHandlers.iddAxisSettings = {
            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var value = valueAccessor();
                var v = ko.unwrap(value);

                var plotAttr = element.getAttribute("data-idd-axis");
                if (plotAttr != null && v.type) {
                    var placement = element.getAttribute("data-idd-placement");
                    if (typeof element.axis != 'undefined') {
                        var div = $(element).closest('div[data-idd-plot]');
                        if (plotAttr != v.type) {
                            var axisElement = div[0].plot.addAxis(placement, v.type, { labels: v.labels ? v.labels : [], ticks: v.ticks ? v.ticks : [], rotate: v.rotate, rotateAngle: v.rotateAngle }, element);
                            var bindData = $(element).attr("data-bind");
                            axisElement.attr("data-bind", bindData);
                            element.axis.remove();
                            element = axisElement;
                        }
                        else if (plotAttr == "labels") {
                            element.axis.updateLabels({ labels: v.labels, ticks: v.ticks, rotate: v.rotate, rotateAngle: v.rotateAngle });
                        }
                        if (v.fontSize) element.axis.FontSize = v.fontSize;
                        if (typeof v.attachGrid != 'undefined' && v.attachGrid && typeof div[0].plot != 'undefined') {
                            var plots = div[0].plot.getPlotsSequence();
                            for (var i = 0; i < plots.length; i++) {
                                var p = plots[i];
                                if (p instanceof InteractiveDataDisplay.GridlinesPlot) {
                                    if (placement == "bottom") {
                                        p.xAxis = element.axis;
                                        p.requestUpdateLayout();
                                    }
                                    else if (placement == "left") {
                                        p.yAxis = element.axis;
                                        p.requestUpdateLayout();
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        };
        ko.bindingHandlers.iddPlotOrder = {
            update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var value = valueAccessor();
                var unwrappedOrder = ko.unwrap(value);
                
                if (typeof element.plot != 'undefined') {
                    element.plot.order = Number(unwrappedOrder);
                }
                else { //the case when the element was not yet initialized and not yet bound to the logical entity (plot)
                    //storing the data in the DOM. it will be used by IDD during IDD-initializing of the dom element

                    //saving plot order in  attribute: will be picked up by initialization
                    element.setAttribute("data-idd-plot-order", unwrappedOrder);

                }
            }
        };
    }
})(InteractiveDataDisplay || (InteractiveDataDisplay = {}))