﻿
InteractiveDataDisplay.readTable = function (jqPlotDiv) {
    var data = {};
    InteractiveDataDisplay.Utils.readStyle(jqPlotDiv, data);

    var table = jqPlotDiv.children("table:first-child");
    if (table && table.length > 0) {
        // Hiding table
        table.toggle();

        // Reading content
        var rows = table.children("tbody").children("tr");
        if (rows && rows.length > 0) {
            var header = rows.first();
            var map = [];
            header.children("th").each(function (index) {
                var name = $(this).text();
                map[index] = name;
                data[name] = [];
            });

            // data
            var dataRows = rows.toArray(); // each element is <tr>
            if (dataRows) {
                var n = dataRows.length;
                var m = map.length;
                for (var i = 1; i < n; i++) { // by rows
                    var columns = $(dataRows[i]).children("td").toArray();
                    for (var j = 0; j < m; j++) { // by columns
                        data[map[j]][i - 1] = parseFloat($(columns[j]).text()); 
                    }
                }
            }
        }
    }

    return data;
};

InteractiveDataDisplay.Utils.getAndClearTextContent = function(jqElement)
{
    jqElement[0].normalize(); // In a normalized sub-tree, no text nodes in the sub-tree are empty and there are no adjacent text nodes
    // we take here first text node
    var content = jqElement.contents().filter(
        function () {
            if (this.nodeType != 3) return false;
            if (!this.data || this.data.trim() == '') return false;
            return true;
        })[0];
    if (content && content.data) {
        var contentData = content.wholeText;
        if (typeof content.replaceWholeText != 'undefined')
            content.replaceWholeText('');
        else
            content.data = '';
        return contentData;
    }
}

InteractiveDataDisplay.readCsv = function (jqPlotDiv) {
    var data = {};
    InteractiveDataDisplay.Utils.readStyle(jqPlotDiv, data);

    var contentData = InteractiveDataDisplay.Utils.getAndClearTextContent(jqPlotDiv);
    if (contentData) {
        contentData = contentData.trim(); // trim data

        var splitWords = function (line) { return line.split(/\s+/g); };
        var lines = contentData.split(/\n/g);
        var n = lines.length - 1;
        if (n > 0) {
            var header = splitWords(lines[0]);
            var j0 = header[0] ? 0 : 1;
            for (var j = j0; j < header.length; j++) {
                data[header[j - j0]] = [];
            }
            for (var i = 0; i < n; i++) {
                var elems = splitWords(lines[i + 1]);
                j0 = elems[0] ? 0 : 1;
                for (var j = j0; j < elems.length; j++) {
                    var parsed = parseFloat(elems[j]);
                    if(isNaN(parsed))
                        data[header[j - j0]][i] = elems[j];
                    else
                        data[header[j - j0]][i] = parsed;
                }
            }

            for (var j = 0; j < header.length; j++)
            {
                var complexHeader = header[j].split('.');
                if (complexHeader.length > 1) {
                    if (!data[complexHeader[0]]) data[complexHeader[0]] = {};
                    data[complexHeader[0]][complexHeader[1]] = data[header[j]];
                    delete data[header[j]];
                }
            }
        }
    }
    return data;
};

InteractiveDataDisplay.readCsv2d = function (jqDiv) {
    var data = {};
    InteractiveDataDisplay.Utils.readStyle(jqDiv, data);

    var contentData = InteractiveDataDisplay.Utils.getAndClearTextContent(jqDiv);
    if (contentData) {
        contentData = contentData.trim(); // trim data
        var splitWords = function (line) { return line.trim().split(/\s+/g); };
        var lines = contentData.split(/\n/g);
        var m = lines.length - 1;
        if (m > 0) {
            var valx = splitWords(lines[0]);
            var n = valx.length - 1;
            if (n > 0) {
                var x = new Array(n);
                var y = new Array(m);
                var f = new Array(n);

                for (var i = 1; i <= n; i++) {
                    f[i - 1] = new Array(m);
                    x[i - 1] = parseFloat(valx[i]);
                }

                for (var j = 1; j <= m; j++) {
                    var valy = splitWords(lines[j]);
                    y[j - 1] = parseFloat(valy[0]);
                    for (var i = 1; i <= n; i++) {
                        f[i - 1][j - 1] = parseFloat(valy[i]);
                    }
                }
                data.x = x;
                data.y = y;
                data.values = f;
            }
        }
    }
    return data;
};

InteractiveDataDisplay.readBase64 = function (jqDiv) {
    function decodeBase64Array(data) {
        // e.g. data is "var_name float64.1D base64str"
        var a = data[0].split('.')
        var typeStr = a[0]
        var dimensionality = a[1]
        switch(dimensionality) {
            case '1D':                
                if (typeStr == 'string') {
                    var encoded = data[1]
                    var encodedArray = encoded.split(',')                    
                    var result= encodedArray.map(atob)
                    return result
                }
                else {
                    var byteArray = InteractiveDataDisplay.Utils.base64toByteArray(data[1])
                    var result = InteractiveDataDisplay.Utils.byteArrayToTypedArray(byteArray,typeStr)
                    return result            
                }
            case '2D':
                // e.g. data is "var_name float64.2D inner_dim_len base64str"
                var innerDimLen = parseInt(data[1])
                var byteArray = InteractiveDataDisplay.Utils.base64toByteArray(data[2])
                var flattened = InteractiveDataDisplay.Utils.byteArrayToTypedArray(byteArray,typeStr)
                // constructing jagged array with inner (second) dim len "innerDimLen
                if(flattened.length % innerDimLen != 0)
                    throw "InnerDimLen is not divisor of decoded flattened array len"
                var outerDimLen = flattened.length / innerDimLen
                var result = new Array(outerDimLen)
                for(var i=0; i<outerDimLen; i++) {
                    result[i] = flattened.slice(i*innerDimLen,((i+1)*innerDimLen))                    
                }
                return result
            default:
                throw('Unexpected dimensionality specified ('+(data[0])+')')
                
        }
    }

    var data = {};
    InteractiveDataDisplay.Utils.readStyle(jqDiv, data);

    var contentData = InteractiveDataDisplay.Utils.getAndClearTextContent(jqDiv);
    if (contentData) {
        contentData = contentData.trim(); // trim data
        var splitWords = function (line) { return line.split(/\s+/g); };
        var lines = contentData.split(/\n/g);
        var N = lines.length;        
        for(var i=0; i<N; i++) {
            var words = splitWords(lines[i].trim());
            var name = words[0]
            words.splice(0,1)
            var value = decodeBase64Array(words)
            data[name] = value
        }        
    }
    return data
}
